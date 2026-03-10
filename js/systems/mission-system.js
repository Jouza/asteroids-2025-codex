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
      return this.pickWeighted(biomes, biomes[0]);
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
          tickTimer: 0,
          phase: g.rng() * Math.PI * 2,
          pulseActive: false,
          active: false
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
        gravityAnomaly:
          modifier.id === "gravity_anomaly" ? this.createGravityAnomaly(modifier) : null
      };
    }

    getSpawnInterval(baseInterval, perSectorRamp, minInterval, level) {
      const sectorIndex = Math.max(0, level - 1);
      const scale = 1 + sectorIndex * perSectorRamp;
      return Math.max(minInterval, baseInterval / scale);
    }

    applyMissionVariance(value, variance = 0.14) {
      const g = this.game;
      const factor = 1 + (g.rng() * 2 - 1) * variance;
      return value * factor;
    }

    chooseAsteroidTypeForSector(level) {
      const g = this.game;
      const roll = g.rng();
      if (level >= 3 && roll < 0.18) return "volatile";
      if (level >= 2 && roll < 0.38) return "magnetic";
      return "normal";
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
      const order = g.config.mission.order;
      return order[(missionIndex - 1) % order.length];
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
        ...context
      };
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
      g.model.miniBoss = null;
      g.model.utilityEffects = [];

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
        g.model.currentMission.label = tr("mission.label.survive");
        g.model.currentMission.objectiveText = tr("mission.hold_for", { seconds: g.model.missionTimer.toFixed(0) });
      }

      if (type === "ufo_hunt") {
        const baseKills =
          missionCfg.ufoHunt.baseKills + Math.floor((level - 1) / 2) * missionCfg.ufoHunt.killStep;
        g.model.missionSpawnBudget = Math.max(
          1,
          Math.round(
            this.applyMissionVariance(
              baseKills *
                difficulty *
                endless.objectiveMul *
                (g.model.currentMission.factionDirective?.objectiveMul ?? 1),
              0.1
            )
          )
        );
        g.model.missionSpawnTimer = 0.2;
        g.model.currentMission.maxConcurrentUfos = Math.min(
          missionCfg.ufoHunt.maxConcurrentCap + endless.extraConcurrent,
          missionCfg.ufoHunt.maxConcurrentUfos +
            Math.floor((level - 1) / missionCfg.ufoHunt.maxConcurrentRampEverySectors) +
            (difficulty >= 1.25 ? 1 : 0) +
            endless.extraConcurrent
        );
        g.model.currentMission.spawnIntervalSeconds = this.getSpawnInterval(
          missionCfg.ufoHunt.spawnIntervalSeconds,
          missionCfg.ufoHunt.spawnRateRampPerSector,
          missionCfg.ufoHunt.minSpawnIntervalSeconds,
          level
        );
        g.model.currentMission.spawnIntervalSeconds /= Math.max(0.74, difficulty);
        g.model.currentMission.spawnIntervalSeconds *= endless.spawnIntervalMul;
        g.model.currentMission.spawnIntervalSeconds *= g.model.currentMission.factionDirective?.spawnIntervalMul ?? 1;
        g.model.currentMission.label = tr("mission.label.ufo_hunt");
        g.model.currentMission.objectiveText = tr("mission.destroy_ufos", { kills: 0, target: g.model.missionSpawnBudget });
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
        g.model.currentMission.label = tr("mission.label.asteroid_storm");
        g.model.currentMission.objectiveText = tr("mission.break_asteroids", {
          kills: 0,
          target: g.model.missionSpawnBudget
        });
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
        g.enemySystem.spawnMiniBoss(hp, { isFinalBoss: isFinalEncounter });
        this.spawnAsteroidPack(
          level,
          1 + Math.floor((level - 1) / 5) + (difficulty >= 1.25 ? 1 : 0),
          1 + Math.floor((level - 1) / 4)
        );
      }

      g.onMissionStarted();
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
      for (const hazard of hazards) {
        hazard.phase += dt;
        if (hazard.type === "relay_jammer_burst") hazard.pulseActive = false;
        const pulseRadius =
          hazard.type === "plasma_vent"
            ? hazard.radius * (0.84 + Math.sin(hazard.phase * 2.8) * 0.16)
            : hazard.radius;
        const dist = Math.hypot(ship.x - hazard.x, ship.y - hazard.y);
        const inside = dist <= pulseRadius + ship.radius;
        if (inside && !hazard.active) g.emitImpactParticles(ship.x, ship.y, 6, "255,198,140");
        hazard.active = inside;
        hazard.tickTimer = Math.max(0, (hazard.tickTimer ?? 0) - dt);
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
          }
        } else if (hazard.type === "relay_jammer_burst") {
          const cycle = Math.max(0.2, hazard.pulseCycleSeconds || 2.6);
          const windowSeconds = Math.max(0.08, Math.min(cycle, hazard.pulseWindowSeconds || 0.7));
          const pulsePhase = hazard.phase % cycle;
          const pulseActive = pulsePhase <= windowSeconds;
          hazard.pulseActive = pulseActive;
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
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("enemy_bullet_support", {
              baseDamage: hazard.tickDamage * hazardMul,
              critChance: 0,
              critMultiplier: 1
            });
            hazard.tickTimer = hazard.tickSeconds;
          }
        } else if (hazard.type === "cryo_shear_zone") {
          const slowFactor = Math.pow(hazard.slowMul ?? 1, dt * 60);
          ship.vx *= slowFactor;
          ship.vy *= slowFactor;
          ship.angularVelocity *= Math.pow(hazard.angularDampingMul ?? 1, dt * 60);
          ship.heat = Math.max(0, ship.heat - Math.max(0, hazard.coolingPerSecond || 0) * dt);
          g.model.dashCooldown += Math.max(0, hazard.dashCooldownPerSecond || 0) * dt;
        }
      }
    }

    updateMission(dt) {
      const g = this.game;
      if (g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING || !g.model.currentMission) return;

      const mission = g.model.currentMission;
      const type = mission.type;
      mission.biomeIntroTimer = Math.max(0, (mission.biomeIntroTimer ?? 0) - dt);
      const threatsRemaining =
        g.model.asteroids.length +
        g.model.ufos.length +
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
          mission.objectiveText = tr("mission.clear_remaining", { count: threatsRemaining });
        }
        if (g.model.missionTimer <= 0 && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "ufo_hunt") {
        g.model.missionSpawnTimer -= dt;
        const target = g.model.missionSpawnBudget;
        const remainingKills = target - g.model.missionUfoKills;
        const desiredConcurrent = Math.min(mission.maxConcurrentUfos ?? g.config.mission.ufoHunt.maxConcurrentUfos, remainingKills);
        if (remainingKills > 0 && g.model.ufos.length < desiredConcurrent && g.model.missionSpawnTimer <= 0) {
          g.enemySystem.spawnMissionUfo();
          g.model.missionSpawnTimer = mission.spawnIntervalSeconds ?? g.config.mission.ufoHunt.spawnIntervalSeconds;
        }
        mission.objectiveText = tr("mission.destroy_ufos", { kills: g.model.missionUfoKills, target });
        if (g.model.missionUfoKills >= target && threatsRemaining === 0) mission.completed = true;
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
          mission.objectiveText = tr("mission.target_reached_clear", { count: threatsRemaining });
        }
        if (g.model.missionAsteroidKills >= target && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "mini_boss") {
        const boss = g.model.miniBoss;
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
      mission.contextText = mission.factionDirective
        ? tr("mission.context_with_directive", contextParams)
        : tr("mission.context", contextParams);

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
