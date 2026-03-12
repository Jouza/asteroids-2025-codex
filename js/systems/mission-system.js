(() => {
  const EN_FALLBACK = {
    "mission.outer_void": "Outer Void",
    "mission.clear_skies": "Clear Skies",
    "mission.clear_skies_desc": "No global mission hazard.",
    "mission.label.survive": "SURVIVE",
    "mission.label.ufo_hunt": "UFO HUNT",
    "mission.label.asteroid_storm": "ASTEROID STORM",
    "mission.label.mini_boss": "MINI BOSS",
    "mission.label.final_boss": "FINAL BOSS",
    "mission.hold_for": "Hold for {seconds}s",
    "mission.destroy_ufos": "Destroy UFOs: {kills}/{target}",
    "mission.ufo_hunt_staged": "Hunt {preludeKills}/{preludeTarget} | Final wave {finaleKills}/{finaleTarget}",
    "mission.break_asteroids": "Break asteroids: {kills}/{target}",
    "mission.target_reached_clear": "Target reached. Clear remaining threats: {count}",
    "mission.clear_remaining": "Clear remaining threats: {count}",
    "mission.destroy_boss": "Destroy boss ({hp} HP)",
    "mission.destroy_final_boss": "Destroy final boss ({hp} HP)",
    "mission.destroy_boss_plain": "Destroy boss",
    "mission.weakpoint_open": "Weakpoint OPEN {seconds}s",
    "mission.weakpoint_in": "Weakpoint in {seconds}s",
    "mission.phase_status": "Phase {phase} | HP {hp}/{maxHp} | {weakpoint}",
    "mission.context": "{biome} | {modifier}",
    "mission.context_with_directive": "{biome} | {modifier} | {directive}",
    "mission.context_with_depth": "{biome} | {modifier} | {depth}",
    "mission.boss_rush.depth.default": "BR Template",
    "mission.directive.none": "No directive"
  };

  const tr = (key, params = {}) => {
    if (typeof window.Asteroids?.t === "function") return window.Asteroids.t(key, params);
    const dict = window.Asteroids?.i18n?.dictionaries?.en || {};
    const template = dict[key] ?? EN_FALLBACK[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, p) => (params[p] != null ? String(params[p]) : `{${p}}`));
  };

  class MissionSystem {
    constructor(game) {
      this.game = game;
    }

    getBiomeVisualProfile(biomeId) {
      const g = this.game;
      const profiles = g.config.missionDirector?.biomeVisuals || {};
      const profile = profiles[biomeId] || profiles.default || {};
      const clamp = (value, min, max, fallback) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.min(max, Math.max(min, num));
      };
      const cadence = Math.max(0.35, Number(profile.ambientCadence) || 1);
      const debrisDensity = Math.max(0.2, Number(profile.debrisDensity) || 1);
      const fogPulse = Math.max(0, Number(profile.fogPulse) || 0);
      const beatColor = typeof profile.beatColor === "string" && profile.beatColor.length > 0 ? profile.beatColor : "176,222,255";
      const layersRaw = Array.isArray(profile.parallaxLayers) ? profile.parallaxLayers : [];
      const parallaxLayers = layersRaw
        .map((layer) => ({
          speed: Math.max(0.05, Number(layer.speed) || 0.18),
          alpha: Math.max(0.04, Number(layer.alpha) || 0.1),
          size: Math.max(0.6, Number(layer.size) || 1.6),
          driftX: Number(layer.driftX) || 1,
          driftY: Number(layer.driftY) || 0.35
        }))
        .slice(0, 3);
      const deepSpaceRaw = profile.deepSpace || {};
      const warScarsRaw = profile.warScars || {};
      const foregroundDustRaw = profile.foregroundDust || {};
      const cinematicFlashesRaw = profile.cinematicFlashes || {};
      return {
        ambientCadence: cadence,
        debrisDensity,
        fogPulse,
        beatColor,
        parallaxLayers: parallaxLayers.length
          ? parallaxLayers
          : [
              { speed: 0.15, alpha: 0.08, size: 1.6, driftX: 1, driftY: 0.3 },
              { speed: 0.28, alpha: 0.11, size: 2.2, driftX: 1.1, driftY: 0.45 }
            ],
        deepSpace: {
          nebulaBands: Math.floor(clamp(deepSpaceRaw.nebulaBands, 1, 6, 2)),
          nebulaAlpha: clamp(deepSpaceRaw.nebulaAlpha, 0.02, 0.3, 0.09),
          dustBands: Math.floor(clamp(deepSpaceRaw.dustBands, 1, 4, 2)),
          vignetteTint:
            typeof deepSpaceRaw.vignetteTint === "string" && deepSpaceRaw.vignetteTint.length > 0
              ? deepSpaceRaw.vignetteTint
              : "10,18,34"
        },
        warScars: {
          density: clamp(warScarsRaw.density, 0.2, 2.2, 1),
          streakLenMin: clamp(warScarsRaw.streakLenMin, 8, 80, 18),
          streakLenMax: clamp(warScarsRaw.streakLenMax, 12, 120, 44),
          silhouetteChance: clamp(warScarsRaw.silhouetteChance, 0, 0.95, 0.16),
          flickerCadence: clamp(warScarsRaw.flickerCadence, 0.2, 3.5, 1)
        },
        foregroundDust: {
          density: clamp(foregroundDustRaw.density, 0.2, 2.5, 1),
          speedMul: clamp(foregroundDustRaw.speedMul, 0.2, 2.8, 1),
          alpha: clamp(foregroundDustRaw.alpha, 0.04, 0.5, 0.22),
          sizeMin: clamp(foregroundDustRaw.sizeMin, 0.2, 4, 0.8),
          sizeMax: clamp(foregroundDustRaw.sizeMax, 0.4, 6, 2.2)
        },
        cinematicFlashes: {
          enabled: cinematicFlashesRaw.enabled !== false,
          chancePerMinute: clamp(cinematicFlashesRaw.chancePerMinute, 0, 24, 2.4),
          minIntensity: clamp(cinematicFlashesRaw.minIntensity, 0.05, 1, 0.2),
          maxIntensity: clamp(cinematicFlashesRaw.maxIntensity, 0.08, 1.2, 0.46),
          ttlMin: clamp(cinematicFlashesRaw.ttlMin, 0.12, 3, 0.34),
          ttlMax: clamp(cinematicFlashesRaw.ttlMax, 0.16, 4, 0.72)
        }
      };
    }

    getHazardTelegraphProfile(hazardType) {
      const g = this.game;
      const profiles = g.config.missionDirector?.hazardTelegraphs || {};
      const base = profiles.default || {};
      const specific = profiles[hazardType] || {};
      const preTickWindowSec = Math.max(0.05, Number(specific.preTickWindowSec ?? base.preTickWindowSec) || 0.22);
      const pulseAlpha = g.clamp(Number(specific.pulseAlpha ?? base.pulseAlpha) || 0.22, 0.05, 0.7);
      const ringBoost = g.clamp(Number(specific.ringBoost ?? base.ringBoost) || 0.22, 0, 0.8);
      const lineBoost = g.clamp(Number(specific.lineBoost ?? base.lineBoost) || 0.18, 0, 0.8);
      const warningPriority = Math.max(1, Math.floor(Number(specific.warningPriority ?? base.warningPriority) || 2));
      const pulseColor =
        typeof specific.pulseColor === "string" && specific.pulseColor.length > 0
          ? specific.pulseColor
          : typeof base.pulseColor === "string" && base.pulseColor.length > 0
            ? base.pulseColor
            : "255,204,148";
      return {
        preTickWindowSec,
        pulseColor,
        pulseAlpha,
        ringBoost,
        lineBoost,
        warningPriority
      };
    }

    getHazardTelegraphVisualMultiplier() {
      const g = this.game;
      const scaling = g.config.missionDirector?.hazardTelegraphScaling || {};
      const difficultyMap = scaling.difficulty && typeof scaling.difficulty === "object" ? scaling.difficulty : {};
      const mutatorClassMap = scaling.mutatorClass && typeof scaling.mutatorClass === "object" ? scaling.mutatorClass : {};
      const runDiff =
        typeof g.getRunDifficultyMultipliers === "function"
          ? g.getRunDifficultyMultipliers()
          : { difficultyId: g.model?.runDifficultyId || "normal" };
      const difficultyId = typeof runDiff.difficultyId === "string" && runDiff.difficultyId.length > 0 ? runDiff.difficultyId : "normal";
      const mutatorProfile = typeof g.getRunMutatorProfile === "function" ? g.getRunMutatorProfile() : null;
      const mutatorClass =
        typeof mutatorProfile?.telegraphClass === "string" && mutatorProfile.telegraphClass.length > 0
          ? mutatorProfile.telegraphClass
          : "standard";
      const difficultyMul = Math.max(0.35, Number(difficultyMap[difficultyId]) || 1);
      const mutatorMul = Math.max(0.35, Number(mutatorClassMap[mutatorClass]) || 1);
      const clampMin = g.clamp(Number(scaling.clampMin) || 0.72, 0.35, 1.5);
      const clampMax = g.clamp(Number(scaling.clampMax) || 1.45, clampMin, 2.2);
      return g.clamp(difficultyMul * mutatorMul, clampMin, clampMax);
    }

    createMissionVisualFxState(biomeId) {
      const profile = this.getBiomeVisualProfile(biomeId);
      return {
        time: 0,
        cadence: profile.ambientCadence,
        beatTtl: 0,
        beatMaxTtl: 0,
        beatKind: "",
        beatIntensity: 0,
        flashTtl: 0,
        flashMaxTtl: 0,
        flashIntensity: 0,
        flashColor: profile.beatColor || "176,222,255",
        seed: Math.floor(this.game.rng() * 1e9) >>> 0,
        layerSeedA: Math.floor(this.game.rng() * 1e9) >>> 0,
        layerSeedB: Math.floor(this.game.rng() * 1e9) >>> 0
      };
    }

    updateMissionVisualFx(dt) {
      const g = this.game;
      const mission = g.model.currentMission;
      if (!mission) return;
      if (!mission.visualFx || typeof mission.visualFx !== "object") {
        mission.visualFx = this.createMissionVisualFxState(mission.biomeId);
      }
      const visualFx = mission.visualFx;
      const cadence = Math.max(0.35, Number(visualFx.cadence) || 1);
      visualFx.time = Math.max(0, Number(visualFx.time) || 0) + dt * cadence;
      if ((visualFx.beatTtl ?? 0) > 0) {
        visualFx.beatTtl = Math.max(0, visualFx.beatTtl - dt);
        if (visualFx.beatTtl <= 0) {
          visualFx.beatKind = "";
          visualFx.beatIntensity = 0;
          visualFx.beatMaxTtl = 0;
        }
      }
      if ((visualFx.flashTtl ?? 0) > 0) {
        visualFx.flashTtl = Math.max(0, visualFx.flashTtl - dt);
        if (visualFx.flashTtl <= 0) {
          visualFx.flashIntensity = 0;
          visualFx.flashMaxTtl = 0;
        }
      }
      const profile = mission.biomeVisualProfile || this.getBiomeVisualProfile(mission.biomeId);
      const flashCfg = profile.cinematicFlashes || {};
      const chancePerMinute = Math.max(0, Number(flashCfg.chancePerMinute) || 0);
      if (flashCfg.enabled !== false && chancePerMinute > 0) {
        const chanceRoll = Math.min(1, (chancePerMinute / 60) * dt);
        if (g.rng() < chanceRoll) {
          const minIntensity = Math.max(0.05, Number(flashCfg.minIntensity) || 0.2);
          const maxIntensity = Math.max(minIntensity, Number(flashCfg.maxIntensity) || 0.46);
          const minTtl = Math.max(0.12, Number(flashCfg.ttlMin) || 0.34);
          const maxTtl = Math.max(minTtl, Number(flashCfg.ttlMax) || 0.72);
          const intensity = minIntensity + g.rng() * (maxIntensity - minIntensity);
          const ttl = minTtl + g.rng() * (maxTtl - minTtl);
          this.triggerMissionFlash(intensity, ttl, profile.beatColor);
        }
      }
    }

    triggerMissionBeat(kind, intensity = 0.7, durationSeconds = 0.7) {
      const g = this.game;
      const mission = g.model.currentMission;
      if (!mission) return;
      if (!mission.visualFx || typeof mission.visualFx !== "object") {
        mission.visualFx = this.createMissionVisualFxState(mission.biomeId);
      }
      const visualFx = mission.visualFx;
      const nextIntensity = g.clamp(Number(intensity) || 0.7, 0.1, 1.4);
      const nextDuration = g.clamp(Number(durationSeconds) || 0.7, 0.2, 1.8);
      const hasActiveBeat = (visualFx.beatTtl ?? 0) > 0;
      if (!hasActiveBeat || nextIntensity >= (visualFx.beatIntensity ?? 0)) {
        visualFx.beatKind = kind || "mission";
      }
      visualFx.beatIntensity = Math.max(nextIntensity, Number(visualFx.beatIntensity) || 0);
      visualFx.beatTtl = Math.max(nextDuration, Number(visualFx.beatTtl) || 0);
      visualFx.beatMaxTtl = Math.max(nextDuration, Number(visualFx.beatMaxTtl) || 0);
      if (kind === "mission_start") {
        this.triggerMissionFlash(0.24, 0.42, mission.biomeVisualProfile?.beatColor || "176,222,255");
      } else if (kind === "boss_phase") {
        this.triggerMissionFlash(nextIntensity * 0.62, Math.max(0.44, nextDuration * 0.62), "255,148,216");
      }
    }

    triggerMissionFlash(intensity = 0.3, durationSeconds = 0.5, colorRgb = null) {
      const g = this.game;
      const mission = g.model.currentMission;
      if (!mission) return;
      if (!mission.visualFx || typeof mission.visualFx !== "object") {
        mission.visualFx = this.createMissionVisualFxState(mission.biomeId);
      }
      const visualFx = mission.visualFx;
      const nextIntensity = g.clamp(Number(intensity) || 0.3, 0.08, 1.2);
      const nextDuration = g.clamp(Number(durationSeconds) || 0.5, 0.12, 2.4);
      const hasActiveFlash = (visualFx.flashTtl ?? 0) > 0;
      const fallbackColor = mission.biomeVisualProfile?.beatColor || "176,222,255";
      const nextColor = typeof colorRgb === "string" && colorRgb.length > 0 ? colorRgb : fallbackColor;
      if (!hasActiveFlash || nextIntensity >= (visualFx.flashIntensity ?? 0)) {
        visualFx.flashColor = nextColor;
      }
      visualFx.flashIntensity = Math.max(nextIntensity, Number(visualFx.flashIntensity) || 0);
      visualFx.flashTtl = Math.max(nextDuration, Number(visualFx.flashTtl) || 0);
      visualFx.flashMaxTtl = Math.max(nextDuration, Number(visualFx.flashMaxTtl) || 0);
    }

    getMissionDifficulty(level) {
      const g = this.game;
      const ramps = g.config.missionDirector.pacingBySector || [];
      for (const entry of ramps) {
        if (level <= entry.maxSector) return entry.difficulty;
      }
      return 1;
    }

    getEndlessTuning(level) {
      const g = this.game;
      const endlessCfg = g.config.mission?.endless || {};
      if (g.model.runMode !== "endless") {
        return {
          difficultyMul: 1,
          spawnIntervalMul: 1,
          objectiveMul: 1,
          surviveTimerMul: 1,
          extraConcurrent: 0
        };
      }
      const startSector = Math.max(1, Math.floor(endlessCfg.startSector ?? 5));
      const sectorDepth = Math.max(0, level - startSector);
      const difficultyBonus = Math.min(
        Math.max(0, endlessCfg.maxDifficultyBonus ?? 0.5),
        sectorDepth * Math.max(0, endlessCfg.difficultyBonusPerSector ?? 0.04)
      );
      const spawnReduction = Math.min(
        Math.max(0, endlessCfg.maxSpawnIntervalReduction ?? 0.28),
        sectorDepth * Math.max(0, endlessCfg.spawnIntervalReductionPerSector ?? 0.02)
      );
      const objectiveBonus = Math.min(
        Math.max(0, endlessCfg.maxObjectiveBudgetBonus ?? 0.24),
        sectorDepth * Math.max(0, endlessCfg.objectiveBudgetBonusPerSector ?? 0.02)
      );
      const timerReduction = Math.min(
        Math.max(0, endlessCfg.maxSurviveTimerReduction ?? 0.22),
        sectorDepth * Math.max(0, endlessCfg.surviveTimerReductionPerSector ?? 0.02)
      );
      const extraEvery = Math.max(1, Math.floor(endlessCfg.extraConcurrentEverySectors ?? 3));
      const extraConcurrent = Math.min(
        Math.max(0, Math.floor(endlessCfg.extraConcurrentCap ?? 2)),
        Math.floor(sectorDepth / extraEvery)
      );
      return {
        difficultyMul: 1 + difficultyBonus,
        spawnIntervalMul: 1 - spawnReduction,
        objectiveMul: 1 + objectiveBonus,
        surviveTimerMul: 1 - timerReduction,
        extraConcurrent
      };
    }

    pickWeighted(entries, fallback) {
      const g = this.game;
      const valid = entries.filter((entry) => (entry.weight ?? 0) > 0);
      const total = valid.reduce((sum, entry) => sum + entry.weight, 0);
      if (total <= 0) return fallback;
      let roll = g.rng() * total;
      for (const entry of valid) {
        roll -= entry.weight;
        if (roll <= 0) return entry;
      }
      return valid[valid.length - 1] || fallback;
    }

    rollMissionBiome(level) {
      const g = this.game;
      const biomes = g.config.missionDirector.biomes || [];
      if (!biomes.length) return { id: "void", label: tr("mission.outer_void") };
      if (g.model.runMode === "campaign") {
        const order = this.ensureCampaignBiomeOrder();
        const index = Math.max(0, Math.floor(level) - 1);
        const campaignBiomeId = order[index];
        if (campaignBiomeId) {
          const campaignBiome = biomes.find((entry) => entry.id === campaignBiomeId);
          if (campaignBiome) return campaignBiome;
        }
      }
      return this.pickWeighted(biomes, biomes[0]);
    }

    getCampaignFinalSector() {
      const runCfg = this.game.config.run || {};
      return Math.max(1, Math.floor(runCfg.finalSector ?? 8));
    }

    ensureCampaignBiomeOrder() {
      const g = this.game;
      const finalSector = this.getCampaignFinalSector();
      const biomes = Array.isArray(g.config.missionDirector?.biomes) ? g.config.missionDirector.biomes : [];
      const biomeIds = biomes
        .map((biome) => (typeof biome?.id === "string" && biome.id.length > 0 ? biome.id : ""))
        .filter((id, idx, arr) => id && arr.indexOf(id) === idx);
      if (!biomeIds.length) {
        g.model.campaignBiomeOrder = [];
        return g.model.campaignBiomeOrder;
      }
      const existing = Array.isArray(g.model.campaignBiomeOrder) ? g.model.campaignBiomeOrder : [];
      if (existing.length >= finalSector) return existing;
      const shuffled = biomeIds.slice();
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(g.rng() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
      }
      const order = shuffled.slice(0, finalSector);
      while (order.length < finalSector) {
        order.push(shuffled[order.length % shuffled.length]);
      }
      g.model.campaignBiomeOrder = order;
      return order;
    }

    createBiomeHazardsForMission(biome) {
      const g = this.game;
      const hazardDef = biome?.hazards;
      if (!hazardDef) return [];
      const minCount = Math.max(0, Math.floor(hazardDef.minCount ?? 0));
      const maxCount = Math.max(minCount, Math.floor(hazardDef.maxCount ?? minCount));
      const count = minCount + Math.floor(g.rng() * (maxCount - minCount + 1));
      const hazards = [];
      for (let i = 0; i < count; i += 1) {
        const radiusMin = hazardDef.radiusMin ?? 70;
        const radiusMax = hazardDef.radiusMax ?? radiusMin;
        const hazardRadius = radiusMin + g.rng() * (radiusMax - radiusMin);
        const ship = g.model.ship;
        const minShipClearance = (g.config.ship.radius ?? 16) + hazardRadius + 80;
        let hx = g.config.canvas.width * (0.15 + g.rng() * 0.7);
        let hy = g.config.canvas.height * (0.15 + g.rng() * 0.7);
        let tries = 0;
        while (
          ship &&
          Math.hypot(hx - ship.x, hy - ship.y) < minShipClearance &&
          tries < 40
        ) {
          hx = g.config.canvas.width * (0.15 + g.rng() * 0.7);
          hy = g.config.canvas.height * (0.15 + g.rng() * 0.7);
          tries += 1;
        }
        hazards.push({
          id: `${biome.id}-${i}-${Math.floor(g.rng() * 1e6)}`,
          type: hazardDef.type,
          x: hx,
          y: hy,
          radius: hazardRadius,
          tickSeconds: hazardDef.tickSeconds ?? 0.8,
          tickDamage: hazardDef.tickDamage ?? 8,
          slowMul: hazardDef.slowMul ?? 0.9,
          heatPerSecond: hazardDef.heatPerSecond ?? 0,
          pulseCycleSeconds: hazardDef.pulseCycleSeconds ?? 0,
          pulseWindowSeconds: hazardDef.pulseWindowSeconds ?? 0,
          jamCooldownPerSecond: hazardDef.jamCooldownPerSecond ?? 0,
          jamDragMul: hazardDef.jamDragMul ?? 1,
          angularDragMul: hazardDef.angularDragMul ?? 1,
          angularDampingMul: hazardDef.angularDampingMul ?? 1,
          coolingPerSecond: hazardDef.coolingPerSecond ?? 0,
          dashCooldownPerSecond: hazardDef.dashCooldownPerSecond ?? 0,
          energyDrainPerSecond: hazardDef.energyDrainPerSecond ?? 0,
          cooldownPressurePerSecond: hazardDef.cooldownPressurePerSecond ?? 0,
          accuracyDragMul: hazardDef.accuracyDragMul ?? 1,
          tickTimer: 0,
          phase: g.rng() * Math.PI * 2,
          pulseActive: false,
          active: false,
          telegraphProfile: this.getHazardTelegraphProfile(hazardDef.type),
          telegraphActive: false,
          telegraphRatio: 0,
          telegraphKind: "",
          lastTickAt: -999,
          telegraphVisualMul: 1,
          jamCueTimer: 0
        });
      }
      return hazards;
    }

    rollMissionModifier(level) {
      const g = this.game;
      const modifierMap = g.config.missionDirector.modifiers || {};
      const entries = Object.keys(modifierMap).map((id) => ({
        id,
        ...modifierMap[id]
      }));
      const unlocked = entries.filter((entry) => level >= (entry.unlockSector ?? 1));
      const picked = this.pickWeighted(unlocked, unlocked[0] || entries[0]);
      return (
        picked || {
          id: "clear_skies",
          label: tr("mission.clear_skies"),
          description: tr("mission.clear_skies_desc")
        }
      );
    }

    createGravityAnomaly(modifier) {
      const g = this.game;
      return {
        x: g.config.canvas.width * (0.22 + g.rng() * 0.56),
        y: g.config.canvas.height * (0.22 + g.rng() * 0.56),
        radius: modifier.radius ?? 300,
        pullStrength: modifier.pullStrength ?? 18000,
        coreRadius: modifier.coreRadius ?? 60,
        maxShipPullAccel: modifier.maxShipPullAccel ?? 210,
        maxAsteroidPullAccel: modifier.maxAsteroidPullAccel ?? 130,
        escapeThrustPullMultiplier: modifier.escapeThrustPullMultiplier ?? 0.6
      };
    }

    buildMissionContext(level) {
      const biome = this.rollMissionBiome(level);
      const modifier = this.rollMissionModifier(level);
      const biomeVisualProfile = this.getBiomeVisualProfile(biome.id);
      return {
        biomeId: biome.id,
        biomeLabel: biome.label,
        biomeFactionId: biome.factionId || null,
        biomeAudio: biome.audio || null,
        biomeMiniEvent: biome.miniEvent || null,
        biomeMiniEventApplied: false,
        biomeEventText: "",
        biomeHazards: this.createBiomeHazardsForMission(biome),
        modifierId: modifier.id,
        modifierLabel: modifier.label,
        modifierDescription: modifier.description,
        modifierEffects: {
          shieldRegenMul: modifier.shieldRegenMul ?? 1,
          shieldDrainPerSecond: modifier.shieldDrainPerSecond ?? 0,
          fogAlpha: modifier.fogAlpha ?? 0,
          pullStrength: modifier.pullStrength ?? 0,
          radius: modifier.radius ?? 0
        },
        biomeVisualProfile,
        visualFx: this.createMissionVisualFxState(biome.id),
        gravityAnomaly:
          modifier.id === "gravity_anomaly" ? this.createGravityAnomaly(modifier) : null
      };
    }

    getSpawnInterval(baseInterval, perSectorRamp, minInterval, level) {
      const sectorIndex = Math.max(0, level - 1);
      const scale = 1 + sectorIndex * perSectorRamp;
      return Math.max(minInterval, baseInterval / scale);
    }

    getViewportPressureMultiplier() {
      const g = this.game;
      if (typeof g.getBalanceNormalizedDistance !== "function") return 1;
      const normalized = Math.max(0.65, Number(g.getBalanceNormalizedDistance(1)) || 1);
      return g.clamp(1 / normalized, 0.82, 1.28);
    }

    applyMissionVariance(value, variance = 0.14) {
      const g = this.game;
      const factor = 1 + (g.rng() * 2 - 1) * variance;
      return value * factor;
    }

    chooseAsteroidTypeForSector(level) {
      const g = this.game;
      const roll = g.rng();
      const specials = g.config.missionDirector?.asteroidSpecials || {};
      const drainCfg = specials.drain_core || {};
      const echoCfg = specials.echo_shell || {};
      if (
        level >= Math.max(1, Math.floor(Number(drainCfg.unlockSector) || 4)) &&
        roll < Math.max(0, Number(drainCfg.chance) || 0.08)
      ) {
        return "drain_core";
      }
      if (
        level >= Math.max(1, Math.floor(Number(echoCfg.unlockSector) || 3)) &&
        roll < Math.max(0, Number(echoCfg.chance) || 0.1)
      ) {
        return "echo_shell";
      }
      if (level >= 3 && roll < 0.18) return "volatile";
      if (level >= 2 && roll < 0.38) return "magnetic";
      return "normal";
    }

    getMissionEntityProfile(entityId) {
      const profiles = this.game.config.missionDirector?.entityProfiles || {};
      const profile = profiles[entityId];
      return profile && typeof profile === "object" ? profile : {};
    }

    rollMissionEntityChance(entityId, level, missionType, biomeId) {
      const g = this.game;
      const profile = this.getMissionEntityProfile(entityId);
      const unlockSector = Math.max(1, Math.floor(Number(profile.unlockSector) || 1));
      if (level < unlockSector) return false;
      const missionChance = Math.max(0, Number(profile.chanceByMission?.[missionType]) || 0);
      const biomeMul = Math.max(0.4, Number(profile.biomeChanceMul?.[biomeId]) || 1);
      return g.rng() < missionChance * biomeMul;
    }

    spawnMissionEntities(level, missionType, biomeId) {
      const g = this.game;
      g.model.sentryRelays = [];
      g.model.salvageDrifters = [];
      const sentryProfile = this.getMissionEntityProfile("sentry_relay");
      const drifterProfile = this.getMissionEntityProfile("salvage_drifter");

      if (this.rollMissionEntityChance("sentry_relay", level, missionType, biomeId)) {
        const maxCount = Math.max(0, Math.floor(Number(sentryProfile.maxPerMission) || 1));
        for (let i = 0; i < maxCount; i += 1) {
          g.model.sentryRelays.push({
            id: `sentry_${Math.floor(g.rng() * 1e6)}`,
            x: g.config.canvas.width * (0.16 + g.rng() * 0.68),
            y: g.config.canvas.height * (0.16 + g.rng() * 0.68),
            radius: Math.max(8, Number(sentryProfile.radius) || 13),
            hp: Math.max(24, Number(sentryProfile.hp) || 74),
            telegraphSeconds: Math.max(0.2, Number(sentryProfile.telegraphSeconds) || 0.82),
            telegraphTimer: 0,
            telegraphActive: false,
            aimAngle: 0,
            cooldownSeconds: Math.max(0.8, Number(sentryProfile.cooldownSeconds) || 2.8),
            cooldownTimer: 0.8 + g.rng() * 1.2,
            beamWidth: Math.max(3, Number(sentryProfile.beamWidth) || 7),
            beamRange: Math.max(g.config.canvas.width, Number(sentryProfile.beamRange) || 1320)
          });
        }
      }

      if (this.rollMissionEntityChance("salvage_drifter", level, missionType, biomeId)) {
        const maxCount = Math.max(0, Math.floor(Number(drifterProfile.maxPerMission) || 1));
        for (let i = 0; i < maxCount; i += 1) {
          const angle = g.rng() * Math.PI * 2;
          const speedMin = Math.max(6, Number(drifterProfile.driftSpeedMin) || 16);
          const speedMax = Math.max(speedMin, Number(drifterProfile.driftSpeedMax) || 32);
          const speed = speedMin + g.rng() * (speedMax - speedMin);
          g.model.salvageDrifters.push({
            id: `drifter_${Math.floor(g.rng() * 1e6)}`,
            x: g.config.canvas.width * (0.18 + g.rng() * 0.64),
            y: g.config.canvas.height * (0.18 + g.rng() * 0.64),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.max(6, Number(drifterProfile.radius) || 11),
            hp: Math.max(10, Number(drifterProfile.hp) || 42),
            state: "active",
            captureTimer: 0,
            captureRatio: 0,
            captureRadius: Math.max(24, Number(drifterProfile.captureRadius) || 56),
            captureSeconds: Math.max(0.5, Number(drifterProfile.captureSeconds) || 2.2),
            rewardCredits: Math.max(
              0,
              Math.floor(Number(drifterProfile.rewardCreditsBase) || 15) +
                Math.max(0, level - 1) * Math.max(0, Math.floor(Number(drifterProfile.rewardCreditsStep) || 4))
            ),
            rewardSalvage: Math.max(
              0,
              Math.floor(Number(drifterProfile.rewardSalvageBase) || 1) +
                Math.max(0, level - 1) * Math.max(0, Math.floor(Number(drifterProfile.rewardSalvageStep) || 1))
            )
          });
        }
      }
    }

    spawnAsteroidPack(level, largeCount, mediumCount = 0) {
      const g = this.game;
      const speedScale = 1 + (level - 1) * g.config.sector.speedScaleStep;

      for (let i = 0; i < largeCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForSector(level);
        g.model.asteroids.push(
          window.Asteroids.spawnAsteroidAwayFromShip(
            "large",
            speedScale,
            asteroidType,
            g.model,
            g.rng,
            g.config,
            g.asteroidDefs
          )
        );
      }

      for (let i = 0; i < mediumCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForSector(level);
        g.model.asteroids.push(
          window.Asteroids.spawnAsteroidAwayFromShip(
            "medium",
            speedScale * 1.12,
            asteroidType,
            g.model,
            g.rng,
            g.config,
            g.asteroidDefs
          )
        );
      }
    }

    getMissionTypeByIndex(missionIndex) {
      const g = this.game;
      if (g.model.runMode === "boss_rush") return "mini_boss";
      if (g.model.runMode === "campaign") {
        const finalSector = this.getCampaignFinalSector();
        if (missionIndex >= finalSector) return "mini_boss";
        const campaignOrder = ["survive", "ufo_hunt", "asteroid_storm"];
        return campaignOrder[(Math.max(1, missionIndex) - 1) % campaignOrder.length];
      }
      const order = g.config.mission.order;
      return order[(missionIndex - 1) % order.length];
    }

    getBossRushDepthTemplate(sector = this.game.model.sector) {
      const g = this.game;
      const templates = g.config.run?.bossRush?.depthTemplates || {};
      const sectorKey = String(Math.max(1, Math.floor(Number(sector) || 1)));
      const raw = templates[sectorKey] || templates[Math.max(1, Math.floor(Number(sector) || 1))] || null;
      const bossTuning = raw?.bossTuning || {};
      const arenaPressure = raw?.arenaPressure || {};
      return {
        labelKey:
          typeof raw?.labelKey === "string" && raw.labelKey.length > 0 ? raw.labelKey : "mission.boss_rush.depth.default",
        bossTuning: {
          shootCooldownMul: g.clamp(Number(bossTuning.shootCooldownMul) || 1, 0.72, 1.35),
          movementMul: g.clamp(Number(bossTuning.movementMul) || 1, 0.75, 1.4),
          weakpointCycleMul: g.clamp(Number(bossTuning.weakpointCycleMul) || 1, 0.72, 1.35),
          weakpointWindowMul: g.clamp(Number(bossTuning.weakpointWindowMul) || 1, 0.72, 1.4)
        },
        arenaPressure: {
          enabled: Boolean(arenaPressure.enabled),
          maxConcurrentAdds: Math.max(0, Math.min(2, Math.floor(Number(arenaPressure.maxConcurrentAdds) || 0))),
          spawnIntervalSeconds: g.clamp(Number(arenaPressure.spawnIntervalSeconds) || 8.8, 4.2, 16),
          waveUfos: Math.max(0, Math.min(2, Math.floor(Number(arenaPressure.waveUfos) || 0))),
          maxEnemyBulletsForWindow: Math.max(8, Math.floor(Number(arenaPressure.maxEnemyBulletsForWindow) || 28)),
          hazardPulse: Boolean(arenaPressure.hazardPulse)
        },
        phaseBeatIntensityMul: g.clamp(Number(raw?.phaseBeatIntensityMul) || 1, 0.8, 1.5)
      };
    }

    createBossRushPressureState(template = null) {
      const pressure = template?.arenaPressure || {};
      return {
        enabled: Boolean(pressure.enabled) && (pressure.maxConcurrentAdds ?? 0) > 0 && (pressure.waveUfos ?? 0) > 0,
        maxConcurrentAdds: Math.max(0, Math.floor(Number(pressure.maxConcurrentAdds) || 0)),
        waveUfos: Math.max(0, Math.floor(Number(pressure.waveUfos) || 0)),
        timer: Math.max(0.5, Number(pressure.spawnIntervalSeconds) || 8.8),
        intervalSeconds: Math.max(0.5, Number(pressure.spawnIntervalSeconds) || 8.8),
        maxEnemyBulletsForWindow: Math.max(8, Math.floor(Number(pressure.maxEnemyBulletsForWindow) || 28)),
        hazardPulse: Boolean(pressure.hazardPulse),
        active: false,
        pulseTtl: 0
      };
    }

    updateBossRushPressure(dt, mission, boss) {
      const g = this.game;
      const state = mission?.bossRushPressure;
      if (!state || !state.enabled) return;
      state.pulseTtl = Math.max(0, (state.pulseTtl ?? 0) - dt);
      if (!boss) {
        state.active = false;
        return;
      }
      const hpRatio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 1;
      const inFinalKillWindow = hpRatio <= 0.2 && boss.weakpointOpen;
      if (inFinalKillWindow) {
        state.active = false;
        state.timer = Math.max(0.4, state.timer - dt * 0.25);
        return;
      }
      if (g.model.ufos.length >= state.maxConcurrentAdds) {
        state.active = false;
        return;
      }
      if (g.model.enemyBullets.length > state.maxEnemyBulletsForWindow) {
        state.active = false;
        return;
      }
      state.timer -= dt;
      if (state.timer > 0) {
        state.active = false;
        return;
      }
      const available = Math.max(0, state.maxConcurrentAdds - g.model.ufos.length);
      const toSpawn = Math.min(available, state.waveUfos);
      if (toSpawn <= 0) {
        state.timer = Math.max(1.2, state.intervalSeconds * 0.5);
        state.active = false;
        return;
      }
      for (let i = 0; i < toSpawn; i += 1) {
        g.enemySystem.spawnMissionUfo({ huntPhase: "boss_rush_pressure" });
      }
      state.timer = state.intervalSeconds;
      state.active = true;
      if (state.hazardPulse) {
        state.pulseTtl = 1.1;
        this.triggerMissionBeat("boss_phase", 0.58, 0.56);
      }
    }

    startMission(missionIndex) {
      const g = this.game;
      const type = this.getMissionTypeByIndex(missionIndex);
      const level = g.model.sector;
      const endless = this.getEndlessTuning(level);
      const runDiff = typeof g.getRunDifficultyMultipliers === "function" ? g.getRunDifficultyMultipliers() : { pressureMul: 1 };
      const intelProfile =
        typeof g.getSelectedFactionIntelProfile === "function"
          ? g.getSelectedFactionIntelProfile()
          : { id: "balanced", pressureMul: 1, creditsMul: 1, salvageMul: 1, reputationDelta: {} };
      const intelPressureMul = Number(intelProfile.pressureMul) || 1;
      const contrabandPressureMul =
        typeof g.getContrabandPressureMultiplier === "function" ? g.getContrabandPressureMultiplier() : 1;
      const difficulty =
        this.getMissionDifficulty(level) * endless.difficultyMul * (runDiff.pressureMul ?? 1) * intelPressureMul * contrabandPressureMul;
      const viewportPressureMul = this.getViewportPressureMultiplier();
      const context = this.buildMissionContext(level);
      const factionDirective =
        typeof g.getFactionMissionDirective === "function"
          ? g.getFactionMissionDirective(context.biomeFactionId, type)
          : null;
      g.model.currentMission = {
        type,
        label: type.toUpperCase(),
        objectiveText: "",
        completed: false,
        isFinalEncounter: false,
        biomeIntroTimer: 1.9,
        difficulty,
        intelProfile,
        intelRepApplied: false,
        factionDirective,
        bossRushDepth: null,
        bossRushDepthLabel: "",
        bossRushPressure: null,
        ...context
      };
      if (g.model.runMode === "boss_rush" && type === "mini_boss") {
        const bossRushDepth = this.getBossRushDepthTemplate(level);
        g.model.currentMission.bossRushDepth = bossRushDepth;
        g.model.currentMission.bossRushDepthLabel = tr(bossRushDepth.labelKey);
        g.model.currentMission.bossRushPressure = this.createBossRushPressureState(bossRushDepth);
      }
      g.model.missionTimer = 0;
      g.model.missionSpawnTimer = 0;
      g.model.missionSpawnBudget = 0;
      g.model.missionUfoKills = 0;
      g.model.missionAsteroidKills = 0;
      g.model.sectorCompletionHandled = false;
      g.model.bullets = [];
      g.model.enemyBullets = [];
      g.model.ufos = [];
      g.model.asteroids = [];
      g.model.sentryRelays = [];
      g.model.salvageDrifters = [];
      g.model.miniBoss = null;
      g.model.utilityEffects = [];
      this.spawnMissionEntities(level, type, context.biomeId);
      g.model.currentMission.relayStatus = g.model.sentryRelays.length > 0 ? "active" : "none";
      g.model.currentMission.drifterStatus = g.model.salvageDrifters.length > 0 ? "active" : "none";

      const missionCfg = g.config.mission;

      if (type === "survive") {
        const baseDuration =
          missionCfg.survive.baseDurationSeconds + (level - 1) * missionCfg.survive.durationStepSeconds;
        g.model.missionTimer = Math.max(9, this.applyMissionVariance((baseDuration / difficulty) * endless.surviveTimerMul, 0.08));
        g.model.missionSpawnTimer = 0.1;
        g.enemySystem.scheduleNextUfoSpawn();
        const spawnLargeBase = level >= missionCfg.survive.extraLargeEverySectors ? 2 : 1 + (difficulty >= 1.2 ? 1 : 0);
        g.model.currentMission.spawnLargeCount = spawnLargeBase;
        g.model.currentMission.spawnMediumCount =
          level >= missionCfg.survive.extraLargeEverySectors + 2 ? 1 + (difficulty >= 1.25 ? 1 : 0) : 0;
        g.model.currentMission.spawnIntervalSeconds = this.getSpawnInterval(
          missionCfg.survive.asteroidSpawnIntervalSeconds,
          missionCfg.survive.spawnRateRampPerSector,
          missionCfg.survive.minSpawnIntervalSeconds,
          level
        );
        g.model.currentMission.spawnIntervalSeconds /= Math.max(0.72, difficulty);
        g.model.currentMission.spawnIntervalSeconds *= endless.spawnIntervalMul;
        g.model.currentMission.spawnIntervalSeconds /= viewportPressureMul;
        g.model.currentMission.spawnLargeCount = Math.max(
          1,
          Math.round((g.model.currentMission.spawnLargeCount || 1) * viewportPressureMul)
        );
        g.model.currentMission.spawnMediumCount = Math.max(
          0,
          Math.round((g.model.currentMission.spawnMediumCount || 0) * viewportPressureMul)
        );
        g.model.currentMission.label = tr("mission.label.survive");
        g.model.currentMission.objectiveText = tr("mission.hold_for", { seconds: g.model.missionTimer.toFixed(0) });
        g.model.currentMission.surviveCleanupBeatTriggered = false;
      }

      if (type === "ufo_hunt") {
        const baseKills =
          missionCfg.ufoHunt.baseKills + Math.floor((level - 1) / 2) * missionCfg.ufoHunt.killStep;
        const preludeMin = Math.max(1, Math.floor(missionCfg.ufoHunt.preludeMinUfos ?? 1));
        const preludeMax = Math.max(preludeMin, Math.floor(missionCfg.ufoHunt.preludeMaxUfos ?? 3));
        const preludeScale = Math.max(0.1, Number(missionCfg.ufoHunt.preludeTargetScale ?? 0.55));
        const preludeTarget = this.game.clamp(
          Math.round(
            this.applyMissionVariance(
              baseKills *
                difficulty *
                endless.objectiveMul *
                (g.model.currentMission.factionDirective?.objectiveMul ?? 1) *
                preludeScale,
              0.1
            )
          ),
          preludeMin,
          preludeMax
        );
        const finaleTarget = Math.max(1, Math.floor(missionCfg.ufoHunt.finaleConcurrentUfos ?? 2));
        g.model.currentMission.ufoHuntPhase = "prelude";
        g.model.currentMission.preludeTargetUfos = Math.max(1, Math.round(preludeTarget * viewportPressureMul));
        g.model.currentMission.preludeSpawnedUfos = 0;
        g.model.currentMission.finaleTargetUfos = finaleTarget;
        g.model.currentMission.finaleSpawnedUfos = 0;
        g.model.currentMission.maxConcurrentUfos = 1;
        g.model.currentMission.totalTargetUfos = g.model.currentMission.preludeTargetUfos + finaleTarget;
        g.model.missionSpawnBudget = g.model.currentMission.totalTargetUfos;
        g.model.missionSpawnTimer = 0.2;
        g.model.currentMission.spawnIntervalSeconds = this.getSpawnInterval(
          missionCfg.ufoHunt.spawnIntervalSeconds,
          missionCfg.ufoHunt.spawnRateRampPerSector,
          missionCfg.ufoHunt.minSpawnIntervalSeconds,
          level
        );
        g.model.currentMission.spawnIntervalSeconds /= Math.max(0.74, difficulty);
        g.model.currentMission.spawnIntervalSeconds *= endless.spawnIntervalMul;
        g.model.currentMission.spawnIntervalSeconds *= g.model.currentMission.factionDirective?.spawnIntervalMul ?? 1;
        g.model.currentMission.spawnIntervalSeconds /= viewportPressureMul;
        g.model.currentMission.label = tr("mission.label.ufo_hunt");
        g.model.currentMission.objectiveText = tr("mission.ufo_hunt_staged", {
          preludeKills: 0,
          preludeTarget: g.model.currentMission.preludeTargetUfos,
          finaleKills: 0,
          finaleTarget
        });
      }

      if (type === "asteroid_storm") {
        const baseTarget =
          missionCfg.asteroidStorm.baseTarget + (level - 1) * missionCfg.asteroidStorm.targetStep;
        g.model.missionSpawnBudget = Math.max(
          6,
          Math.round(
            this.applyMissionVariance(
              baseTarget *
                difficulty *
                endless.objectiveMul *
                (g.model.currentMission.factionDirective?.objectiveMul ?? 1),
              0.1
            )
          )
        );
        g.model.missionSpawnBudget = Math.max(6, Math.round(g.model.missionSpawnBudget * viewportPressureMul));
        const initialLarge =
          missionCfg.asteroidStorm.initialLargeCount + Math.floor((level - 1) / 4) + (difficulty >= 1.2 ? 1 : 0);
        const initialMedium =
          missionCfg.asteroidStorm.initialMediumCount + Math.floor((level - 1) / 3) + (difficulty >= 1.3 ? 1 : 0);
        g.model.currentMission.extraMediumChance = Math.min(
          0.88,
          missionCfg.asteroidStorm.extraMediumChance +
            (level - 1) * missionCfg.asteroidStorm.mediumChanceRampPerSector
        );
        g.model.currentMission.spawnIntervalSeconds = this.getSpawnInterval(
          missionCfg.asteroidStorm.extraSpawnIntervalSeconds,
          missionCfg.asteroidStorm.spawnRateRampPerSector,
          missionCfg.asteroidStorm.minExtraSpawnIntervalSeconds,
          level
        );
        g.model.currentMission.spawnIntervalSeconds /= Math.max(0.74, difficulty);
        g.model.currentMission.spawnIntervalSeconds *= endless.spawnIntervalMul;
        g.model.currentMission.spawnIntervalSeconds *= g.model.currentMission.factionDirective?.spawnIntervalMul ?? 1;
        g.model.currentMission.spawnIntervalSeconds /= viewportPressureMul;
        g.model.currentMission.label = tr("mission.label.asteroid_storm");
        g.model.currentMission.objectiveText = tr("mission.break_asteroids", {
          kills: 0,
          target: g.model.missionSpawnBudget
        });
        g.model.currentMission.asteroidCleanupBeatTriggered = false;
        this.spawnAsteroidPack(level, initialLarge, initialMedium);
        g.model.missionSpawnTimer = g.model.currentMission.spawnIntervalSeconds;
      }

      if (type === "mini_boss") {
        const isCampaignFinal = typeof g.isFinalEncounter === "function" ? g.isFinalEncounter(type, level) : false;
        const isBossRushFinal = typeof g.isBossRushFinalEncounter === "function" ? g.isBossRushFinalEncounter(type, level) : false;
        const isFinalEncounter = isCampaignFinal || isBossRushFinal;
        const hpBase = Math.round(
          (missionCfg.miniBoss.hpBase + (level - 1) * missionCfg.miniBoss.hpStep) * (0.95 + difficulty * 0.2)
        );
        const hp = Math.round(
          hpBase * (isFinalEncounter ? g.config.run.finalBossHpMultiplier ?? 1 : 1)
        );
        g.model.currentMission.isFinalEncounter = isFinalEncounter;
        g.model.currentMission.label = isFinalEncounter ? tr("mission.label.final_boss") : tr("mission.label.mini_boss");
        g.model.currentMission.objectiveText = isFinalEncounter
          ? tr("mission.destroy_final_boss", { hp })
          : tr("mission.destroy_boss", { hp });
        g.enemySystem.spawnMiniBoss(hp, {
          isFinalBoss: isFinalEncounter,
          depthTuning: g.model.currentMission?.bossRushDepth?.bossTuning || null
        });
        this.spawnAsteroidPack(
          level,
          Math.max(1, Math.round((1 + Math.floor((level - 1) / 5) + (difficulty >= 1.25 ? 1 : 0)) * viewportPressureMul)),
          Math.max(1, Math.round((1 + Math.floor((level - 1) / 4)) * viewportPressureMul))
        );
      }

      g.onMissionStarted();
      this.triggerMissionBeat("mission_start", 0.55, 0.62);
    }

    applyMissionEnvironmentalEffects(dt) {
      const g = this.game;
      if (g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING) return;
      const mission = g.model.currentMission;
      const ship = g.model.ship;
      if (!mission || !ship) return;
      const effects = mission.modifierEffects || {};
      const runDiff =
        typeof g.getRunDifficultyMultipliers === "function" ? g.getRunDifficultyMultipliers() : { hazardIntensityMul: 1 };
      const hazardMul = runDiff.hazardIntensityMul ?? 1;

      if ((effects.shieldDrainPerSecond ?? 0) > 0) {
        ship.shield = Math.max(0, ship.shield - effects.shieldDrainPerSecond * hazardMul * dt);
      }

      const anomaly = mission.gravityAnomaly;
      if (anomaly) {
        const applyPull = (entity, scalar = 1, maxAccelOverride = null) => {
          const dx = anomaly.x - entity.x;
          const dy = anomaly.y - entity.y;
          const rawDist = Math.hypot(dx, dy);
          const dist = Math.max(1, rawDist);
          if (dist > anomaly.radius) return;
          const falloff = 1 - dist / anomaly.radius;
          const coreRadius = Math.max(1, anomaly.coreRadius ?? 60);
          const inCore = dist < coreRadius;
          const coreFactor = inCore ? 0.18 + 0.82 * (dist / coreRadius) : 1;
          const thrusting =
            entity === ship &&
            (g.input.isDown("ArrowUp") || g.input.isDown("ShiftLeft") || g.input.isDown("ShiftRight"));
          const escapeFactor = thrusting ? anomaly.escapeThrustPullMultiplier ?? 0.6 : 1;
          const maxAccel =
            maxAccelOverride ??
            (entity === ship ? anomaly.maxShipPullAccel ?? 210 : anomaly.maxAsteroidPullAccel ?? 130);
          const accelUncapped =
            ((anomaly.pullStrength * falloff) / Math.max(24, dist)) * scalar * coreFactor * escapeFactor * hazardMul;
          const accel = Math.min(maxAccel, Math.max(0, accelUncapped));
          const dirX = dx / dist;
          const dirY = dy / dist;
          entity.vx += dirX * accel * dt;
          entity.vy += dirY * accel * dt;
        };

        applyPull(ship, 1);
        for (const asteroid of g.model.asteroids) applyPull(asteroid, 0.42);
        const ufoPullScalar = anomaly.ufoPullScalar ?? 0.32;
        const ufoMaxPullAccel = anomaly.maxUfoPullAccel ?? 92;
        const coreRadius = Math.max(16, anomaly.coreRadius ?? 60);
        const ufoCoreEscapeRadius = Math.max(16, anomaly.ufoCoreEscapeRadius ?? coreRadius * 0.62);
        const ufoCoreEscapeSeconds = Math.max(0.1, anomaly.ufoCoreEscapeSeconds ?? 0.7);
        const ufoEscapeCooldownSeconds = Math.max(0.12, anomaly.ufoEscapeCooldownSeconds ?? 1.05);
        const ufoEscapeImpulse = Math.max(10, anomaly.ufoEscapeImpulse ?? 126);
        const ufoTangentialImpulse = Math.max(0, anomaly.ufoTangentialImpulse ?? 88);
        for (const ufo of g.model.ufos) {
          applyPull(ufo, ufoPullScalar, ufoMaxPullAccel);
          ufo.anomalyEscapeCooldown = Math.max(0, (ufo.anomalyEscapeCooldown ?? 0) - dt);
          const offsetX = ufo.x - anomaly.x;
          const offsetY = ufo.y - anomaly.y;
          const distToCenter = Math.hypot(offsetX, offsetY);
          const insideCore = distToCenter <= ufoCoreEscapeRadius + (ufo.radius ?? 0);
          ufo.anomalyCoreTimer = insideCore ? (ufo.anomalyCoreTimer ?? 0) + dt : 0;
          if (ufo.anomalyCoreTimer < ufoCoreEscapeSeconds || ufo.anomalyEscapeCooldown > 0) continue;
          const angleOut = Math.atan2(offsetY || 0.0001, offsetX || 0.0001);
          const tangentSign = (ufo.mode === "swarm" || ufo.mode === "kamikaze" ? 1 : -1) * (g.rng() < 0.5 ? -1 : 1);
          const tangentAngle = angleOut + tangentSign * (Math.PI * 0.5);
          const impulseScale = 0.9 + g.rng() * 0.2;
          ufo.vx += Math.cos(angleOut) * ufoEscapeImpulse * impulseScale;
          ufo.vy += Math.sin(angleOut) * ufoEscapeImpulse * impulseScale;
          ufo.vx += Math.cos(tangentAngle) * ufoTangentialImpulse * impulseScale;
          ufo.vy += Math.sin(tangentAngle) * ufoTangentialImpulse * impulseScale;
          ufo.anomalyCoreTimer = 0;
          ufo.anomalyEscapeCooldown = ufoEscapeCooldownSeconds;
        }
      }

      const hazards = mission.biomeHazards || [];
      const telegraphVisualMul = this.getHazardTelegraphVisualMultiplier();
      for (const hazard of hazards) {
        hazard.phase += dt;
        hazard.jamCueTimer = Math.max(0, (hazard.jamCueTimer ?? 0) - dt);
        if (hazard.type === "relay_jammer_burst") hazard.pulseActive = false;
        hazard.telegraphActive = false;
        hazard.telegraphRatio = 0;
        hazard.telegraphKind = "";
        hazard.telegraphVisualMul = telegraphVisualMul;
        if (!hazard.telegraphProfile || typeof hazard.telegraphProfile !== "object") {
          hazard.telegraphProfile = this.getHazardTelegraphProfile(hazard.type);
        }
        const telegraphProfile = hazard.telegraphProfile;
        const pulseRadius =
          hazard.type === "plasma_vent"
            ? hazard.radius * (0.84 + Math.sin(hazard.phase * 2.8) * 0.16)
            : hazard.radius;
        const dist = Math.hypot(ship.x - hazard.x, ship.y - hazard.y);
        const inside = dist <= pulseRadius + ship.radius;
        if (inside && !hazard.active) g.emitImpactParticles(ship.x, ship.y, 6, "255,198,140");
        hazard.active = inside;
        hazard.tickTimer = Math.max(0, (hazard.tickTimer ?? 0) - dt);
        const tickWindow = Math.max(0.05, Number(telegraphProfile.preTickWindowSec) || 0.22);
        if (hazard.active && (hazard.tickSeconds ?? 0) > 0 && hazard.tickTimer <= tickWindow) {
          hazard.telegraphActive = true;
          hazard.telegraphRatio = g.clamp(1 - hazard.tickTimer / tickWindow, 0, 1);
          hazard.telegraphKind = "pre_tick";
        }
        if (!inside) continue;

        if (hazard.type === "debris_field") {
          const slowFactor = Math.pow(hazard.slowMul, dt * 60);
          ship.vx *= slowFactor;
          ship.vy *= slowFactor;
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("asteroid_collision", {
              baseDamage: hazard.tickDamage * hazardMul,
              critChance: 0,
              critMultiplier: 1.0
            });
            hazard.tickTimer = hazard.tickSeconds;
            hazard.lastTickAt = g.model.runtimeSeconds;
          }
        } else if (hazard.type === "plasma_vent") {
          ship.heat = Math.min(ship.heatMax, ship.heat + hazard.heatPerSecond * dt);
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("enemy_mine", {
              baseDamage: hazard.tickDamage * hazardMul,
              damageType: "dot_thermal",
              critChance: 0,
              bypassInvulnerability: true,
              applyHitInvulnerability: false,
              countAsHit: false
            });
            hazard.tickTimer = hazard.tickSeconds;
            hazard.lastTickAt = g.model.runtimeSeconds;
          }
        } else if (hazard.type === "relay_jammer_burst") {
          const cycle = Math.max(0.2, hazard.pulseCycleSeconds || 2.6);
          const windowSeconds = Math.max(0.08, Math.min(cycle, hazard.pulseWindowSeconds || 0.7));
          const pulsePhase = hazard.phase % cycle;
          const pulseActive = pulsePhase <= windowSeconds;
          hazard.pulseActive = pulseActive;
          const preWindow = Math.min(cycle, windowSeconds + Math.max(0.1, tickWindow));
          const telegraphPhase = pulsePhase <= preWindow || cycle - pulsePhase <= tickWindow;
          if (telegraphPhase) {
            hazard.telegraphActive = true;
            hazard.telegraphKind = "pulse_window";
            if (pulsePhase <= preWindow) {
              hazard.telegraphRatio = g.clamp((preWindow - pulsePhase) / preWindow, 0, 1);
            } else {
              hazard.telegraphRatio = g.clamp((tickWindow - (cycle - pulsePhase)) / tickWindow, 0, 1);
            }
          }
          const drag = Math.pow(hazard.jamDragMul ?? 1, dt * 60);
          ship.vx *= drag;
          ship.vy *= drag;
          if (!pulseActive) continue;
          const angularDrag = Math.pow(hazard.angularDragMul ?? 1, dt * 60);
          ship.angularVelocity *= angularDrag;
          const cooldownPressure = Math.max(0, hazard.jamCooldownPerSecond || 0) * hazardMul * dt;
          g.model.shootTimer += cooldownPressure;
          g.model.secondaryCooldown += cooldownPressure * 0.6;
          g.model.utilityCooldown += cooldownPressure * 0.45;
          g.model.dashCooldown += cooldownPressure * 0.55;
          if (hazard.jamCueTimer <= 0) {
            g.pushIncomingHitCue({
              kind: "emp_jam_pressure",
              damageType: "plasma",
              isCrit: false,
              shieldAbsorb: 0.8,
              hullDamage: 0
            });
            hazard.jamCueTimer = 0.46;
          }
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("enemy_bullet_support", {
              baseDamage: hazard.tickDamage * hazardMul,
              hitCueKind: "emp_jam_pressure",
              critChance: 0,
              critMultiplier: 1
            });
            hazard.tickTimer = hazard.tickSeconds;
            hazard.lastTickAt = g.model.runtimeSeconds;
          }
        } else if (hazard.type === "cryo_shear_zone") {
          const slowFactor = Math.pow(hazard.slowMul ?? 1, dt * 60);
          ship.vx *= slowFactor;
          ship.vy *= slowFactor;
          ship.angularVelocity *= Math.pow(hazard.angularDampingMul ?? 1, dt * 60);
          ship.heat = Math.max(0, ship.heat - Math.max(0, hazard.coolingPerSecond || 0) * dt);
          g.model.dashCooldown += Math.max(0, hazard.dashCooldownPerSecond || 0) * dt;
        } else if (hazard.type === "neon_arc_field") {
          ship.energy = Math.max(0, ship.energy - Math.max(0, hazard.energyDrainPerSecond || 0) * hazardMul * dt);
          const cooldownPressure = Math.max(0, hazard.cooldownPressurePerSecond || 0) * hazardMul * dt;
          g.model.shootTimer += cooldownPressure;
          g.model.secondaryCooldown += cooldownPressure * 0.7;
          g.model.utilityCooldown += cooldownPressure * 0.55;
          g.model.dashCooldown += cooldownPressure * 0.4;
          if (hazard.jamCueTimer <= 0) {
            g.pushIncomingHitCue({
              kind: "emp_jam_pressure",
              damageType: "plasma",
              isCrit: false,
              shieldAbsorb: 0.7,
              hullDamage: 0
            });
            hazard.jamCueTimer = 0.52;
          }
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("enemy_bullet_support", {
              baseDamage: hazard.tickDamage * hazardMul,
              damageType: "plasma",
              hitCueKind: "emp_jam_pressure",
              critChance: 0,
              critMultiplier: 1
            });
            hazard.tickTimer = hazard.tickSeconds;
            hazard.lastTickAt = g.model.runtimeSeconds;
          }
        } else if (hazard.type === "dust_squall") {
          const slowFactor = Math.pow(hazard.slowMul ?? 1, dt * 60);
          ship.vx *= slowFactor;
          ship.vy *= slowFactor;
          ship.angularVelocity *= Math.pow(hazard.accuracyDragMul ?? 1, dt * 60);
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("asteroid_collision", {
              baseDamage: hazard.tickDamage * hazardMul,
              damageType: "collision",
              critChance: 0,
              critMultiplier: 1
            });
            hazard.tickTimer = hazard.tickSeconds;
            hazard.lastTickAt = g.model.runtimeSeconds;
          }
        }
      }
    }

    updateMission(dt) {
      const g = this.game;
      if (g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING || !g.model.currentMission) return;

      const mission = g.model.currentMission;
      this.updateMissionVisualFx(dt);
      const type = mission.type;
      mission.biomeIntroTimer = Math.max(0, (mission.biomeIntroTimer ?? 0) - dt);
      const threatsRemaining =
        g.model.asteroids.length +
        g.model.ufos.length +
        g.model.sentryRelays.length +
        g.model.enemyBullets.length +
        (g.model.miniBoss ? 1 : 0);

      if (mission.completed) {
        if (g.model.sectorCompletionHandled) {
          g.model.sectorTimerMs += dt * 1000;
          if (g.model.sectorTimerMs >= g.config.sector.graceMs) {
            g.hangarSystem.enterHangarPhase();
          }
        }
        return;
      }

      if (type === "survive") {
        g.model.missionTimer = Math.max(0, g.model.missionTimer - dt);
        g.model.missionSpawnTimer -= dt;
        if (g.model.missionSpawnTimer <= 0 && g.model.missionTimer > 0) {
          this.spawnAsteroidPack(
            g.model.sector,
            mission.spawnLargeCount ?? 1,
            mission.spawnMediumCount ?? 0
          );
          g.model.missionSpawnTimer = mission.spawnIntervalSeconds ?? g.config.mission.survive.asteroidSpawnIntervalSeconds;
        }
        g.enemySystem.maybeSpawnAmbientUfo(dt);
        if (g.model.missionTimer > 0) {
          mission.objectiveText = tr("mission.hold_for", { seconds: g.model.missionTimer.toFixed(1) });
        } else {
          if (!mission.surviveCleanupBeatTriggered) {
            this.triggerMissionBeat("survive_cleanup", 0.7, 0.74);
            mission.surviveCleanupBeatTriggered = true;
          }
          mission.objectiveText = tr("mission.clear_remaining", { count: threatsRemaining });
        }
        if (g.model.missionTimer <= 0 && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "ufo_hunt") {
        g.model.missionSpawnTimer -= dt;
        const preludeTarget = Math.max(1, Math.floor(mission.preludeTargetUfos ?? 1));
        const finaleTarget = Math.max(1, Math.floor(mission.finaleTargetUfos ?? 2));
        const phase = mission.ufoHuntPhase || "prelude";

        if (phase === "prelude") {
          const spawnedPrelude = Math.max(0, Math.floor(mission.preludeSpawnedUfos || 0));
          if (spawnedPrelude < preludeTarget && g.model.ufos.length === 0 && g.model.missionSpawnTimer <= 0) {
            g.enemySystem.spawnMissionUfo({ huntPhase: "prelude" });
            mission.preludeSpawnedUfos = spawnedPrelude + 1;
            g.model.missionSpawnTimer = mission.spawnIntervalSeconds ?? g.config.mission.ufoHunt.spawnIntervalSeconds;
          }
          const preludeKillsNow = Math.min(preludeTarget, g.model.missionUfoKills);
          if (preludeKillsNow >= preludeTarget && g.model.ufos.length === 0) {
            mission.ufoHuntPhase = "finale";
            g.model.missionSpawnTimer = 0;
            this.triggerMissionBeat("hunt_finale", 0.84, 0.86);
          }
        }

        if (mission.ufoHuntPhase === "finale") {
          const spawnedFinale = Math.max(0, Math.floor(mission.finaleSpawnedUfos || 0));
          if (spawnedFinale < finaleTarget && g.model.ufos.length === 0) {
            for (let i = spawnedFinale; i < finaleTarget; i += 1) {
              g.enemySystem.spawnMissionUfo({ huntPhase: "finale" });
            }
            mission.finaleSpawnedUfos = finaleTarget;
          }
        }

        const preludeKills = Math.min(preludeTarget, g.model.missionUfoKills);
        const finaleKills = g.clamp(g.model.missionUfoKills - preludeTarget, 0, finaleTarget);
        mission.objectiveText = tr("mission.ufo_hunt_staged", {
          preludeKills,
          preludeTarget,
          finaleKills,
          finaleTarget
        });
        if (finaleKills >= finaleTarget && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "asteroid_storm") {
        g.model.missionSpawnTimer -= dt;
        const target = g.model.missionSpawnBudget;
        if (g.model.missionAsteroidKills < target && g.model.missionSpawnTimer <= 0) {
          this.spawnAsteroidPack(g.model.sector, 1, g.rng() < (mission.extraMediumChance ?? 0.5) ? 1 : 0);
          g.model.missionSpawnTimer = mission.spawnIntervalSeconds ?? g.config.mission.asteroidStorm.extraSpawnIntervalSeconds;
        }
        const shownKills = Math.min(target, g.model.missionAsteroidKills);
        if (g.model.missionAsteroidKills < target) {
          mission.objectiveText = tr("mission.break_asteroids", { kills: shownKills, target });
        } else {
          if (!mission.asteroidCleanupBeatTriggered) {
            this.triggerMissionBeat("storm_cleanup", 0.74, 0.74);
            mission.asteroidCleanupBeatTriggered = true;
          }
          mission.objectiveText = tr("mission.target_reached_clear", { count: threatsRemaining });
        }
        if (g.model.missionAsteroidKills >= target && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "mini_boss") {
        const boss = g.model.miniBoss;
        if (g.model.runMode === "boss_rush") this.updateBossRushPressure(dt, mission, boss);
        if (boss) {
          const weakpointText = boss.weakpointOpen
            ? tr("mission.weakpoint_open", { seconds: Math.max(0, boss.weakpointOpenFor).toFixed(1) })
            : tr("mission.weakpoint_in", { seconds: Math.max(0, boss.weakpointTimer).toFixed(1) });
          mission.objectiveText = tr("mission.phase_status", {
            phase: boss.phaseIndex + 1,
            hp: Math.max(0, Math.ceil(boss.hp)),
            maxHp: boss.maxHp,
            weakpoint: weakpointText
          });
        } else {
          mission.objectiveText = tr("mission.destroy_boss_plain");
        }
        if (!boss && threatsRemaining === 0) mission.completed = true;
      }

      const contextParams = {
        biome: mission.biomeLabel || tr("mission.outer_void"),
        modifier: mission.modifierLabel || tr("mission.clear_skies"),
        directive: mission.factionDirective?.label || tr("mission.directive.none")
      };
      mission.contextText =
        g.model.runMode === "boss_rush" && mission.bossRushDepthLabel
          ? tr("mission.context_with_depth", { biome: contextParams.biome, modifier: contextParams.modifier, depth: mission.bossRushDepthLabel })
          : mission.factionDirective
            ? tr("mission.context_with_directive", contextParams)
            : tr("mission.context", contextParams);
      if (g.model.salvageDrifters.length > 0 && mission.drifterStatus !== "captured" && mission.drifterStatus !== "lost") {
        mission.drifterStatus = "active";
      } else if (g.model.salvageDrifters.length === 0 && mission.drifterStatus === "active") {
        mission.drifterStatus = "lost";
      }
      if (g.model.sentryRelays.length > 0 && mission.relayStatus !== "down") {
        mission.relayStatus = "active";
      } else if (g.model.sentryRelays.length === 0 && mission.relayStatus === "active") {
        mission.relayStatus = "down";
      }

      if (mission.completed && !g.model.sectorCompletionHandled) {
        g.onMissionCompleted();
        if (typeof g.onMissionCompletionResolved === "function") {
          const stoppedByEndState = g.onMissionCompletionResolved();
          if (stoppedByEndState) return;
        } else {
          g.model.sectorCompletionHandled = true;
          g.model.sectorTimerMs = 0;
        }
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.MissionSystem = MissionSystem;
})();
