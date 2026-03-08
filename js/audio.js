(() => {
  class AudioSystem {
    constructor() {
      this.context = null;
      this.masterGain = null;
      this.muted = false;
      this.volume = 0.6;
      this.ambientVolume = 0.4;
      this.maxVoices = 18;
      this.activeVoices = [];
      this.lastPlayedAt = {};
      this.biomeAudioProfiles = {
        belt: { warningSoundId: "warning_belt", stinger: { a: 260, b: 390, c: 520 } },
        graveyard: { warningSoundId: "warning_graveyard", stinger: { a: 190, b: 250, c: 330 } },
        refinery: { warningSoundId: "warning_refinery", stinger: { a: 240, b: 310, c: 460 } },
        ion_field: { warningSoundId: "warning_ion_field", stinger: { a: 320, b: 420, c: 620 } }
      };
      this.soundDefs = {
        ui_start: { priority: 4, cooldownMs: 120 },
        ui_game_over: { priority: 5, cooldownMs: 400 },
        mission_start: { priority: 4, cooldownMs: 120 },
        mission_complete: { priority: 5, cooldownMs: 160 },
        biome_stinger: { priority: 3, cooldownMs: 900, cooldownAlias: "biome_stinger" },
        primary_fire: { priority: 1, cooldownMs: 28 },
        secondary_fire: { priority: 2, cooldownMs: 80 },
        utility_use: { priority: 3, cooldownMs: 120 },
        dash: { priority: 3, cooldownMs: 90 },
        enemy_fire: { priority: 0, cooldownMs: 90 },
        player_hit: { priority: 4, cooldownMs: 90 },
        warning: { priority: 5, cooldownMs: 280 },
        warning_belt: { priority: 5, cooldownMs: 280, cooldownAlias: "warning" },
        warning_graveyard: { priority: 5, cooldownMs: 280, cooldownAlias: "warning" },
        warning_refinery: { priority: 5, cooldownMs: 280, cooldownAlias: "warning" },
        warning_ion_field: { priority: 5, cooldownMs: 280, cooldownAlias: "warning" },
        asteroid_pop: { priority: 1, cooldownMs: 35 },
        ufo_pop: { priority: 2, cooldownMs: 55 },
        boss_pop: { priority: 5, cooldownMs: 250 }
      };
    }

    nowMs() {
      return typeof performance !== "undefined" ? performance.now() : Date.now();
    }

    ensureContext() {
      if (typeof window === "undefined") return false;
      if (!window.AudioContext && !window.webkitAudioContext) return false;
      if (!this.context) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        this.context = new Ctor();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.getEffectiveGain();
        this.masterGain.connect(this.context.destination);
      }
      return true;
    }

    getEffectiveGain() {
      return this.muted ? 0 : this.volume * 0.22;
    }

    unlock() {
      if (!this.ensureContext()) return;
      if (this.context.state === "suspended") {
        this.context.resume().catch(() => {});
      }
    }

    isMuted() {
      return this.muted;
    }

    setMuted(value) {
      this.muted = Boolean(value);
      if (this.masterGain) this.masterGain.gain.value = this.getEffectiveGain();
    }

    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (this.masterGain) this.masterGain.gain.value = this.getEffectiveGain();
    }

    getVolume() {
      return this.volume;
    }

    setAmbientVolume(value) {
      this.ambientVolume = Math.max(0, Math.min(1, Number(value) || 0));
    }

    getAmbientVolume() {
      return this.ambientVolume;
    }

    updateBiomeAmbience() {
      // Hybrid mode: no continuous ambient bed to avoid background hiss.
    }

    cleanupVoices(now = this.nowMs()) {
      this.activeVoices = this.activeVoices.filter((voice) => now < voice.endsAt);
    }

    canPlay(soundId, now) {
      const def = this.soundDefs[soundId] || { priority: 1, cooldownMs: 0 };
      const cooldownKey = def.cooldownAlias || soundId;
      const last = this.lastPlayedAt[cooldownKey] || -Infinity;
      if (now - last < def.cooldownMs) return false;
      this.cleanupVoices(now);
      if (this.activeVoices.length < this.maxVoices) return true;
      const weakest = this.activeVoices.reduce(
        (min, voice) => (voice.priority < min.priority ? voice : min),
        this.activeVoices[0]
      );
      if (def.priority < weakest.priority) return false;
      weakest.stopFn();
      this.activeVoices = this.activeVoices.filter((voice) => voice !== weakest);
      return true;
    }

    resolveWarningSoundId(biomeId, missionAudioProfile = null) {
      const fallback = biomeId ? this.biomeAudioProfiles[biomeId] : null;
      return missionAudioProfile?.warningSoundId || fallback?.warningSoundId || "warning";
    }

    resolveStingerProfile(biomeId, missionAudioProfile = null) {
      const fallback = biomeId ? this.biomeAudioProfiles[biomeId] : null;
      return missionAudioProfile?.stinger || fallback?.stinger || { a: 240, b: 360, c: 480 };
    }

    play(soundId, options = {}) {
      const now = this.nowMs();
      const resolvedSoundId =
        soundId === "warning"
          ? this.resolveWarningSoundId(options.biomeId, options.missionAudioProfile)
          : soundId;
      const def = this.soundDefs[resolvedSoundId] || { priority: 1, cooldownMs: 0 };
      if (!this.ensureContext() || this.muted) return;
      if (this.context.state === "suspended") return;
      if (!this.canPlay(resolvedSoundId, now)) return;
      this.lastPlayedAt[def.cooldownAlias || resolvedSoundId] = now;

      const startAt = this.context.currentTime;
      if (resolvedSoundId === "primary_fire") this.playTone(startAt, 0.05, 420, 210, "square", 0.032, def.priority);
      else if (resolvedSoundId === "secondary_fire") this.playTone(startAt, 0.08, 230, 90, "sawtooth", 0.05, def.priority);
      else if (resolvedSoundId === "utility_use") this.playTone(startAt, 0.12, 180, 420, "triangle", 0.07, def.priority);
      else if (resolvedSoundId === "dash") this.playTone(startAt, 0.07, 620, 160, "sawtooth", 0.045, def.priority);
      else if (resolvedSoundId === "enemy_fire") this.playTone(startAt, 0.045, 300, 180, "square", 0.026, def.priority);
      else if (resolvedSoundId === "player_hit") this.playNoise(startAt, 0.11, 900, 0.08, def.priority);
      else if (resolvedSoundId === "warning") this.playTone(startAt, 0.16, 520, 430, "triangle", 0.055, def.priority);
      else if (resolvedSoundId === "warning_belt") this.playTone(startAt, 0.16, 490, 410, "triangle", 0.055, def.priority);
      else if (resolvedSoundId === "warning_graveyard") this.playTone(startAt, 0.2, 360, 290, "sawtooth", 0.06, def.priority);
      else if (resolvedSoundId === "warning_refinery") this.playTone(startAt, 0.14, 620, 470, "square", 0.052, def.priority);
      else if (resolvedSoundId === "warning_ion_field") this.playTone(startAt, 0.18, 700, 540, "triangle", 0.053, def.priority);
      else if (resolvedSoundId === "asteroid_pop") this.playNoise(startAt, 0.08, 720, 0.055, def.priority);
      else if (resolvedSoundId === "ufo_pop") this.playTone(startAt, 0.13, 260, 80, "sawtooth", 0.07, def.priority);
      else if (resolvedSoundId === "boss_pop") {
        this.playNoise(startAt, 0.24, 520, 0.13, def.priority);
        this.playTone(startAt, 0.3, 160, 46, "sawtooth", 0.095, def.priority);
      } else if (resolvedSoundId === "mission_complete") this.playTone(startAt, 0.2, 330, 660, "triangle", 0.07, def.priority);
      else if (resolvedSoundId === "mission_start") this.playTone(startAt, 0.12, 240, 430, "triangle", 0.045, def.priority);
      else if (resolvedSoundId === "ui_game_over") this.playTone(startAt, 0.28, 240, 72, "sawtooth", 0.085, def.priority);
      else if (resolvedSoundId === "ui_start") this.playTone(startAt, 0.1, 320, 520, "triangle", 0.05, def.priority);
      else if (resolvedSoundId === "biome_stinger") {
        if (this.ambientVolume <= 0.001) return;
        const s = this.resolveStingerProfile(options.biomeId, options.missionAudioProfile);
        const amp = 0.03 * this.ambientVolume;
        this.playTone(startAt, 0.09, s.a, s.b, "sine", amp, def.priority);
        this.playTone(startAt + 0.08, 0.12, s.b, s.c, "triangle", amp * 0.9, def.priority);
      }
    }

    registerVoice(node, gainNode, duration, priority) {
      const endsAt = this.nowMs() + duration * 1000 + 35;
      const stopFn = () => {
        try {
          node.stop();
        } catch (error) {
          // Voice may already be stopped.
        }
      };
      this.activeVoices.push({ priority, endsAt, stopFn });
      node.onended = () => {
        try {
          node.disconnect();
          gainNode.disconnect();
        } catch (error) {
          // Already disconnected.
        }
        this.activeVoices = this.activeVoices.filter((voice) => voice.stopFn !== stopFn);
      };
    }

    playTone(startAt, duration, freqStart, freqEnd, type, amp, priority) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, startAt);
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd), startAt + duration);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp), startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
      this.registerVoice(osc, gain, duration, priority);
    }

    playNoise(startAt, duration, cutoffHz, amp, priority) {
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;

      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoffHz, startAt);
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amp), startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start(startAt);
      source.stop(startAt + duration + 0.01);
      this.registerVoice(source, gain, duration, priority);
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.AudioSystem = AudioSystem;
})();
