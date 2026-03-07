(() => {
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
      if (!biomes.length) return { id: "void", label: "Outer Void" };
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
          tickTimer: 0,
          phase: g.rng() * Math.PI * 2,
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
      return picked || { id: "clear_skies", label: "Clear Skies", description: "No global mission hazard." };
    }

    createGravityAnomaly(modifier) {
      const g = this.game;
      return {
        x: g.config.canvas.width * (0.22 + g.rng() * 0.56),
        y: g.config.canvas.height * (0.22 + g.rng() * 0.56),
        radius: modifier.radius ?? 300,
        pullStrength: modifier.pullStrength ?? 18000
      };
    }

    buildMissionContext(level) {
      const biome = this.rollMissionBiome(level);
      const modifier = this.rollMissionModifier(level);
      return {
        biomeId: biome.id,
        biomeLabel: biome.label,
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
      const order = g.config.mission.order;
      return order[(missionIndex - 1) % order.length];
    }

    startMission(missionIndex) {
      const g = this.game;
      const type = this.getMissionTypeByIndex(missionIndex);
      const level = g.model.sector;
      const difficulty = this.getMissionDifficulty(level);
      const context = this.buildMissionContext(level);
      g.model.currentMission = {
        type,
        label: type.toUpperCase(),
        objectiveText: "",
        completed: false,
        difficulty,
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
        g.model.missionTimer = Math.max(9, this.applyMissionVariance(baseDuration / difficulty, 0.08));
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
        g.model.currentMission.label = "SURVIVE";
        g.model.currentMission.objectiveText = `Hold for ${g.model.missionTimer.toFixed(0)}s`;
      }

      if (type === "ufo_hunt") {
        const baseKills =
          missionCfg.ufoHunt.baseKills + Math.floor((level - 1) / 2) * missionCfg.ufoHunt.killStep;
        g.model.missionSpawnBudget = Math.max(1, Math.round(this.applyMissionVariance(baseKills * difficulty, 0.1)));
        g.model.missionSpawnTimer = 0.2;
        g.model.currentMission.maxConcurrentUfos = Math.min(
          missionCfg.ufoHunt.maxConcurrentCap,
          missionCfg.ufoHunt.maxConcurrentUfos +
            Math.floor((level - 1) / missionCfg.ufoHunt.maxConcurrentRampEverySectors) +
            (difficulty >= 1.25 ? 1 : 0)
        );
        g.model.currentMission.spawnIntervalSeconds = this.getSpawnInterval(
          missionCfg.ufoHunt.spawnIntervalSeconds,
          missionCfg.ufoHunt.spawnRateRampPerSector,
          missionCfg.ufoHunt.minSpawnIntervalSeconds,
          level
        );
        g.model.currentMission.spawnIntervalSeconds /= Math.max(0.74, difficulty);
        g.model.currentMission.label = "UFO HUNT";
        g.model.currentMission.objectiveText = `Destroy UFOs: 0/${g.model.missionSpawnBudget}`;
      }

      if (type === "asteroid_storm") {
        const baseTarget =
          missionCfg.asteroidStorm.baseTarget + (level - 1) * missionCfg.asteroidStorm.targetStep;
        g.model.missionSpawnBudget = Math.max(6, Math.round(this.applyMissionVariance(baseTarget * difficulty, 0.1)));
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
        g.model.currentMission.label = "ASTEROID STORM";
        g.model.currentMission.objectiveText = `Break asteroids: 0/${g.model.missionSpawnBudget}`;
        this.spawnAsteroidPack(level, initialLarge, initialMedium);
        g.model.missionSpawnTimer = g.model.currentMission.spawnIntervalSeconds;
      }

      if (type === "mini_boss") {
        const hp = Math.round(
          (missionCfg.miniBoss.hpBase + (level - 1) * missionCfg.miniBoss.hpStep) * (0.95 + difficulty * 0.2)
        );
        g.model.currentMission.label = "MINI BOSS";
        g.model.currentMission.objectiveText = `Destroy boss (${hp} HP)`;
        g.enemySystem.spawnMiniBoss(hp);
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

      if ((effects.shieldDrainPerSecond ?? 0) > 0) {
        ship.shield = Math.max(0, ship.shield - effects.shieldDrainPerSecond * dt);
      }

      const anomaly = mission.gravityAnomaly;
      if (anomaly) {
        const applyPull = (entity, scalar = 1) => {
          const dx = anomaly.x - entity.x;
          const dy = anomaly.y - entity.y;
          const dist = Math.max(12, Math.hypot(dx, dy));
          if (dist > anomaly.radius) return;
          const falloff = 1 - dist / anomaly.radius;
          const force = ((anomaly.pullStrength * falloff) / dist) * dt * scalar;
          entity.vx += dx * force;
          entity.vy += dy * force;
        };

        applyPull(ship, 1);
        for (const asteroid of g.model.asteroids) applyPull(asteroid, 0.42);
      }

      const hazards = mission.biomeHazards || [];
      for (const hazard of hazards) {
        hazard.phase += dt;
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
              baseDamage: hazard.tickDamage,
              critChance: 0,
              critMultiplier: 1.0
            });
            hazard.tickTimer = hazard.tickSeconds;
          }
        } else if (hazard.type === "plasma_vent") {
          ship.heat = Math.min(ship.heatMax, ship.heat + hazard.heatPerSecond * dt);
          if (hazard.tickTimer <= 0) {
            g.applyDamageToShip("enemy_mine", {
              baseDamage: hazard.tickDamage,
              damageType: "dot_thermal",
              critChance: 0,
              bypassInvulnerability: true,
              applyHitInvulnerability: false,
              countAsHit: false
            });
            hazard.tickTimer = hazard.tickSeconds;
          }
        }
      }
    }

    updateMission(dt) {
      const g = this.game;
      if (g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING || !g.model.currentMission) return;

      const mission = g.model.currentMission;
      const type = mission.type;
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
          mission.objectiveText = `Hold for ${g.model.missionTimer.toFixed(1)}s`;
        } else {
          mission.objectiveText = `Clear remaining threats: ${threatsRemaining}`;
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
        mission.objectiveText = `Destroy UFOs: ${g.model.missionUfoKills}/${target}`;
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
          mission.objectiveText = `Break asteroids: ${shownKills}/${target}`;
        } else {
          mission.objectiveText = `Target reached. Clear remaining threats: ${threatsRemaining}`;
        }
        if (g.model.missionAsteroidKills >= target && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "mini_boss") {
        const boss = g.model.miniBoss;
        if (boss) {
          const weakpointText = boss.weakpointOpen
            ? `Weakpoint OPEN ${Math.max(0, boss.weakpointOpenFor).toFixed(1)}s`
            : `Weakpoint in ${Math.max(0, boss.weakpointTimer).toFixed(1)}s`;
          mission.objectiveText = `Phase ${boss.phaseIndex + 1} | HP ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp} | ${weakpointText}`;
        } else {
          mission.objectiveText = "Destroy boss";
        }
        if (!boss && threatsRemaining === 0) mission.completed = true;
      }

      mission.contextText = `${mission.biomeLabel || "Outer Void"} | ${mission.modifierLabel || "Clear Skies"}`;

      if (mission.completed && !g.model.sectorCompletionHandled) {
        g.onMissionCompleted();
        g.model.sectorCompletionHandled = true;
        g.model.sectorTimerMs = 0;
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.MissionSystem = MissionSystem;
})();
