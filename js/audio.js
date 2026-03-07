(() => {
  class AudioSystem {
    constructor() {
      this.context = null;
      this.masterGain = null;
      this.muted = false;
      this.maxVoices = 18;
      this.activeVoices = [];
      this.lastPlayedAt = {};
      this.soundDefs = {
        ui_start: { priority: 4, cooldownMs: 120 },
        ui_game_over: { priority: 5, cooldownMs: 400 },
        mission_start: { priority: 4, cooldownMs: 120 },
        mission_complete: { priority: 5, cooldownMs: 160 },
        primary_fire: { priority: 1, cooldownMs: 28 },
        secondary_fire: { priority: 2, cooldownMs: 80 },
        utility_use: { priority: 3, cooldownMs: 120 },
        dash: { priority: 3, cooldownMs: 90 },
        enemy_fire: { priority: 0, cooldownMs: 90 },
        player_hit: { priority: 4, cooldownMs: 90 },
        warning: { priority: 5, cooldownMs: 280 },
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
        this.masterGain.gain.value = 0.11;
        this.masterGain.connect(this.context.destination);
      }
      return true;
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
      if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 0.11;
    }

    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    cleanupVoices(now = this.nowMs()) {
      this.activeVoices = this.activeVoices.filter((voice) => now < voice.endsAt);
    }

    canPlay(soundId, now) {
      const def = this.soundDefs[soundId] || { priority: 1, cooldownMs: 0 };
      const last = this.lastPlayedAt[soundId] || -Infinity;
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

    play(soundId) {
      const now = this.nowMs();
      const def = this.soundDefs[soundId] || { priority: 1, cooldownMs: 0 };
      if (!this.ensureContext() || this.muted) return;
      if (this.context.state === "suspended") return;
      if (!this.canPlay(soundId, now)) return;
      this.lastPlayedAt[soundId] = now;

      const startAt = this.context.currentTime;
      if (soundId === "primary_fire") this.playTone(startAt, 0.05, 420, 210, "square", 0.032, def.priority);
      else if (soundId === "secondary_fire") this.playTone(startAt, 0.08, 230, 90, "sawtooth", 0.05, def.priority);
      else if (soundId === "utility_use") this.playTone(startAt, 0.12, 180, 420, "triangle", 0.07, def.priority);
      else if (soundId === "dash") this.playTone(startAt, 0.07, 620, 160, "sawtooth", 0.045, def.priority);
      else if (soundId === "enemy_fire") this.playTone(startAt, 0.045, 300, 180, "square", 0.026, def.priority);
      else if (soundId === "player_hit") this.playNoise(startAt, 0.11, 900, 0.08, def.priority);
      else if (soundId === "warning") this.playTone(startAt, 0.16, 520, 430, "triangle", 0.055, def.priority);
      else if (soundId === "asteroid_pop") this.playNoise(startAt, 0.08, 720, 0.055, def.priority);
      else if (soundId === "ufo_pop") this.playTone(startAt, 0.13, 260, 80, "sawtooth", 0.07, def.priority);
      else if (soundId === "boss_pop") {
        this.playNoise(startAt, 0.24, 520, 0.13, def.priority);
        this.playTone(startAt, 0.3, 160, 46, "sawtooth", 0.095, def.priority);
      } else if (soundId === "mission_complete") this.playTone(startAt, 0.2, 330, 660, "triangle", 0.07, def.priority);
      else if (soundId === "mission_start") this.playTone(startAt, 0.12, 240, 430, "triangle", 0.045, def.priority);
      else if (soundId === "ui_game_over") this.playTone(startAt, 0.28, 240, 72, "sawtooth", 0.085, def.priority);
      else if (soundId === "ui_start") this.playTone(startAt, 0.1, 320, 520, "triangle", 0.05, def.priority);
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
