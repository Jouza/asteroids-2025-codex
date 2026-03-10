(() => {
  const { createEnemyBullet, createUfo, randomRange, wrapPosition } = window.Asteroids;

  class EnemySystem {
    constructor(game) {
      this.game = game;
    }

    getSectorScale(perSector, maxBonus) {
      const g = this.game;
      const sectorIndex = Math.max(0, g.model.sector - 1);
      return 1 + Math.min(maxBonus, sectorIndex * perSector);
    }

    scheduleNextUfoSpawn() {
      const g = this.game;
      g.model.nextUfoSpawnSeconds = randomRange(
        g.rng,
        g.config.ufo.spawnDelayMinSeconds,
        g.config.ufo.spawnDelayMaxSeconds
      );
    }

    rollUfoModeForSector() {
      const g = this.game;
      const cfg = g.config.ufo;
      const entries = Object.keys(cfg.modeWeights)
        .filter((mode) => g.model.sector >= (cfg.unlockSectorByMode?.[mode] ?? 1))
        .map((mode) => ({ mode, weight: Math.max(0, cfg.modeWeights[mode] ?? 0) }));
      const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
      if (total <= 0) return "hunter";
      let roll = g.rng() * total;
      for (const entry of entries) {
        roll -= entry.weight;
        if (roll <= 0) return entry.mode;
      }
      return entries[entries.length - 1].mode;
    }

    maybeAssignElitePrefix(ufo) {
      const g = this.game;
      const cfg = g.config.ufo;
      const chance = Math.min(
        cfg.elitePrefixChanceMax,
        cfg.elitePrefixChanceBase + Math.max(0, g.model.sector - 1) * cfg.elitePrefixChancePerSector
      );
      if (g.rng() > chance) return;
      const prefixes = Object.keys(cfg.elitePrefixStats || {});
      if (!prefixes.length) return;
      const prefix = prefixes[Math.floor(g.rng() * prefixes.length)];
      const stats = cfg.elitePrefixStats[prefix];
      ufo.elitePrefix = prefix;
      ufo.eliteStats = stats;
      ufo.hp = Math.max(1, Math.round(ufo.hp * (stats.hpMul ?? 1)));
      ufo.maxHp = ufo.hp;
    }

    spawnMissionUfo(options = {}) {
      const g = this.game;
      const mode = this.rollUfoModeForSector();
      const x = g.rng() < 0.5 ? -28 : g.config.canvas.width + 28;
      const y = randomRange(g.rng, 90, g.config.canvas.height - 90);
      const ufo = createUfo(mode, x, y, g.config);
      if (options.huntPhase === "finale") ufo.huntFinale = true;
      this.maybeAssignElitePrefix(ufo);
      g.model.ufos.push(ufo);
    }

    maybeSpawnAmbientUfo(dt) {
      const g = this.game;
      if (g.model.ufos.length > 0) return;
      g.model.nextUfoSpawnSeconds -= dt;
      if (g.model.nextUfoSpawnSeconds > 0) return;
      this.spawnMissionUfo();
      this.scheduleNextUfoSpawn();
    }

    updateUfos(dt) {
      const g = this.game;
      const ship = g.model.ship;
      const c = g.config;
      if (!ship) return;
      const speedScale = this.getSectorScale(c.ufo.speedScalePerSector, c.ufo.speedScaleMaxBonus);
      const fireRateScale = this.getSectorScale(c.ufo.fireRateScalePerSector, c.ufo.fireRateScaleMaxBonus);

      for (const ufo of g.model.ufos) {
        const dx = ship.x - ufo.x;
        const dy = ship.y - ufo.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const eliteSpeedMul = ufo.eliteStats?.speedMul ?? 1;
        const eliteFireRateMul = ufo.eliteStats?.fireRateMul ?? 1;

        if (ufo.mode === "hunter") {
          const speed = c.ufo.speedHunter * speedScale * eliteSpeedMul;
          ufo.vx = (dx / dist) * speed;
          ufo.vy = (dy / dist) * speed;
        } else if (ufo.mode === "sniper") {
          const desired = c.ufo.desiredSniperDistance;
          const distanceError = dist - desired;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const sniperSpeed = c.ufo.speedSniper * speedScale * eliteSpeedMul;
          const radial = g.clamp(distanceError * 0.65, -sniperSpeed, sniperSpeed);
          const tangential = sniperSpeed * 0.72;
          ufo.vx = normalX * radial + tangentX * tangential;
          ufo.vy = normalY * radial + tangentY * tangential;
        } else if (ufo.mode === "swarm") {
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const swarmSpeed = c.ufo.speedSwarm * speedScale * eliteSpeedMul;
          const radial = swarmSpeed * 0.72;
          const tangential = swarmSpeed * (0.9 + Math.sin((ufo.phase ?? 0) * 2.5) * 0.15);
          ufo.vx = normalX * radial + tangentX * tangential;
          ufo.vy = normalY * radial + tangentY * tangential;
        } else if (ufo.mode === "kamikaze") {
          const speed = c.ufo.speedKamikaze * speedScale * eliteSpeedMul;
          ufo.vx = (dx / dist) * speed;
          ufo.vy = (dy / dist) * speed;
          if (dist < ship.radius + ufo.radius + 8) {
            this.detonateKamikaze(ufo);
            ufo.hp = 0;
          }
        } else if (ufo.mode === "support") {
          const desired = c.ufo.desiredSupportDistance;
          const error = dist - desired;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const speed = c.ufo.speedSupport * speedScale * eliteSpeedMul;
          ufo.vx = normalX * g.clamp(error * 0.55, -speed, speed) + tangentX * speed * 0.48;
          ufo.vy = normalY * g.clamp(error * 0.55, -speed, speed) + tangentY * speed * 0.48;
          ufo.supportHealTimer = Math.max(0, (ufo.supportHealTimer ?? c.ufo.supportHealIntervalSeconds) - dt);
          if (ufo.supportHealTimer <= 0) {
            this.healNearbyUfo(ufo, c.ufo.supportHealPerTick);
            ufo.supportHealTimer = c.ufo.supportHealIntervalSeconds;
          }
        } else if (ufo.mode === "mine_layer") {
          const desired = c.ufo.desiredSniperDistance + 40;
          const error = dist - desired;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const speed = c.ufo.speedMineLayer * speedScale * eliteSpeedMul;
          ufo.vx = normalX * g.clamp(error * 0.45, -speed, speed) + tangentX * speed * 0.62;
          ufo.vy = normalY * g.clamp(error * 0.45, -speed, speed) + tangentY * speed * 0.62;
          ufo.mineDeployTimer = Math.max(0, (ufo.mineDeployTimer ?? c.ufo.mineDeployIntervalSeconds) - dt);
          if (ufo.mineDeployTimer <= 0) {
            this.deployMine(ufo);
            ufo.mineDeployTimer = c.ufo.mineDeployIntervalSeconds;
          }
        }

        ufo.phase = (ufo.phase ?? 0) + dt;
        ufo.x += ufo.vx * dt;
        ufo.y += ufo.vy * dt;
        wrapPosition(ufo, c.canvas.width, c.canvas.height);

        ufo.disabledTimer = Math.max(0, ufo.disabledTimer - dt);
        ufo.shootTimer = Math.max(0, ufo.shootTimer - dt);
        if (ufo.disabledTimer <= 0 && ufo.shootTimer <= 0) {
          if (ufo.mode !== "mine_layer" && ufo.mode !== "kamikaze") this.fireEnemyBullet(ufo, ship);
          ufo.shootTimer =
            ufo.mode === "hunter" || ufo.mode === "swarm"
              ? c.enemyBullet.cooldownHunterSeconds / (fireRateScale * eliteFireRateMul)
              : ufo.mode === "support"
                ? c.enemyBullet.cooldownHunterSeconds * 1.2 / (fireRateScale * eliteFireRateMul)
                : c.enemyBullet.cooldownSniperSeconds / (fireRateScale * eliteFireRateMul);
        }
      }
      g.model.ufos = g.model.ufos.filter((ufo) => ufo.hp > 0);
    }

    healNearbyUfo(sourceUfo, healAmount) {
      const g = this.game;
      let target = null;
      let bestMissing = 0;
      for (const ufo of g.model.ufos) {
        if (ufo === sourceUfo) continue;
        const missing = (ufo.maxHp ?? 0) - (ufo.hp ?? 0);
        if (missing > bestMissing) {
          bestMissing = missing;
          target = ufo;
        }
      }
      if (!target || bestMissing <= 0) return;
      target.hp = Math.min(target.maxHp, target.hp + healAmount);
      g.emitImpactParticles(target.x, target.y, 4, "140,255,190");
    }

    deployMine(ufo) {
      const g = this.game;
      const mine = createEnemyBullet(ufo.x, ufo.y, 0, g.config);
      mine.vx = ufo.vx * 0.1;
      mine.vy = ufo.vy * 0.1;
      mine.ttl = g.config.ufo.mineTtlSeconds;
      mine.radius = g.config.ufo.mineRadius;
      mine.isMine = true;
      mine.damageProfile = "enemy_mine";
      g.pushEnemyBullet(mine);
      g.recordEnemyShot();
      g.emitImpactParticles(ufo.x, ufo.y, 3, "255,178,120");
    }

    detonateKamikaze(ufo) {
      const g = this.game;
      const shotCount = 7;
      for (let i = 0; i < shotCount; i += 1) {
        const angle = (i / shotCount) * Math.PI * 2;
        const bullet = createEnemyBullet(ufo.x, ufo.y, angle, g.config);
        bullet.vx *= 0.8;
        bullet.vy *= 0.8;
        bullet.ttl = 1.4;
        bullet.damageProfile = "enemy_mine";
        g.pushEnemyBullet(bullet);
      }
      g.emitImpactParticles(ufo.x, ufo.y, 14, "255,124,120");
    }

    fireEnemyBullet(ufo, ship) {
      const g = this.game;
      const dx = ship.x - ufo.x;
      const dy = ship.y - ufo.y;
      const baseAngle = Math.atan2(dy, dx);
      const spread =
        ufo.mode === "hunter" || ufo.mode === "swarm"
          ? g.config.enemyBullet.spreadHunter
          : ufo.mode === "support"
            ? g.config.enemyBullet.spreadHunter * 0.66
            : g.config.enemyBullet.spreadSniper;
      const shotAngle = baseAngle + (g.rng() - 0.5) * spread;
      const muzzleX = ufo.x + Math.cos(shotAngle) * (ufo.radius + 4);
      const muzzleY = ufo.y + Math.sin(shotAngle) * (ufo.radius + 4);
      const speedScale = this.getSectorScale(
        g.config.ufo.bulletSpeedScalePerSector,
        g.config.ufo.bulletSpeedScaleMaxBonus
      );
      const bullet = createEnemyBullet(muzzleX, muzzleY, shotAngle, g.config);
      bullet.vx *= speedScale;
      bullet.vy *= speedScale;
      bullet.damageProfile =
        ufo.mode === "sniper"
          ? "enemy_bullet_sniper"
          : ufo.mode === "swarm"
            ? "enemy_bullet_swarm"
            : ufo.mode === "support"
              ? "enemy_bullet_support"
              : "enemy_bullet_hunter";
      g.pushEnemyBullet(bullet);
      g.recordEnemyShot();
      g.emitImpactParticles(muzzleX, muzzleY, 2, "255,123,196");
      g.audio.play("enemy_fire");
    }

    spawnMiniBoss(hp, options = {}) {
      const g = this.game;
      const isFinalBoss = Boolean(options.isFinalBoss);
      const miniCfg = g.config.mission.miniBoss;
      const finalCfg = g.config.run?.finalBoss || {};
      const cfg = isFinalBoss ? finalCfg : miniCfg;
      g.model.miniBoss = {
        x: g.config.canvas.width * 0.5,
        y: 120,
        radius: cfg.radius ?? miniCfg.radius,
        hp,
        maxHp: hp,
        phase: 0,
        phaseIndex: 0,
        phaseAnnounceTimer: 0.9,
        shootTimer: 0,
        weakpointTimer: (cfg.weakpointCycleSeconds || miniCfg.weakpointCycleSeconds)[0],
        weakpointOpenFor: 0,
        weakpointOpen: false,
        isFinalBoss,
        shotCounter: 0
      };
    }

    triggerMiniBossPhaseEvent(boss) {
      const g = this.game;
      const cfg = g.config.mission.miniBoss.phaseEvent;
      if (!cfg) return;

      for (let i = 0; i < cfg.mineRingCount; i += 1) {
        const angle = (i / cfg.mineRingCount) * Math.PI * 2;
        const bullet = createEnemyBullet(boss.x, boss.y, angle, g.config);
        bullet.vx *= cfg.mineSpeedFactor;
        bullet.vy *= cfg.mineSpeedFactor;
        bullet.ttl = cfg.mineTtlSeconds;
        bullet.radius = g.config.ufo.mineRadius;
        bullet.isMine = true;
        bullet.damageProfile = "enemy_mine";
        g.pushEnemyBullet(bullet);
      }

      for (const asteroid of g.model.asteroids) {
        const dx = asteroid.x - boss.x;
        const dy = asteroid.y - boss.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        asteroid.vx += (dx / dist) * cfg.asteroidPushImpulse;
        asteroid.vy += (dy / dist) * cfg.asteroidPushImpulse;
      }

      g.missionSystem.spawnAsteroidPack(g.model.sector, cfg.asteroidSpawnLarge, cfg.asteroidSpawnMedium);
      g.emitImpactParticles(boss.x, boss.y, 24, "255,132,211");
      g.model.flashMs = Math.max(g.model.flashMs, 190);
    }

    triggerFinalBossPhaseEvent(boss) {
      const g = this.game;
      const cfg = g.config.run?.finalBoss || {};
      const phase = boss.phaseIndex;
      const mineCount = cfg.mineRingCountByPhase?.[phase] ?? 8;
      const mineSpeedFactor = cfg.mineSpeedFactor ?? 0.66;
      const mineTtlSeconds = cfg.mineTtlSeconds ?? 6.1;
      for (let i = 0; i < mineCount; i += 1) {
        const angle = (i / mineCount) * Math.PI * 2 + (boss.phase % (Math.PI * 2));
        const bullet = createEnemyBullet(boss.x, boss.y, angle, g.config);
        bullet.vx *= mineSpeedFactor;
        bullet.vy *= mineSpeedFactor;
        bullet.ttl = mineTtlSeconds;
        bullet.radius = g.config.ufo.mineRadius;
        bullet.isMine = true;
        bullet.damageProfile = "enemy_mine";
        g.pushEnemyBullet(bullet);
      }
      const large = cfg.asteroidSpawnLargeByPhase?.[phase] ?? 1;
      const medium = cfg.asteroidSpawnMediumByPhase?.[phase] ?? 1;
      g.missionSystem.spawnAsteroidPack(g.model.sector, large, medium);
      g.emitImpactParticles(boss.x, boss.y, 30, "130,220,255");
      g.model.flashMs = Math.max(g.model.flashMs, 210);
    }

    updateMiniBossWeakpoint(boss, dt, cfg) {
      const g = this.game;
      const phase = boss.phaseIndex;
      if (boss.weakpointOpenFor > 0) {
        boss.weakpointOpenFor = Math.max(0, boss.weakpointOpenFor - dt);
        boss.weakpointOpen = boss.weakpointOpenFor > 0;
        return;
      }
      boss.weakpointOpen = false;
      boss.weakpointTimer = Math.max(0, boss.weakpointTimer - dt);
      if (boss.weakpointTimer > 0) return;
      boss.weakpointOpen = true;
      boss.weakpointOpenFor = cfg.weakpointWindowSeconds[phase];
      boss.weakpointTimer = cfg.weakpointCycleSeconds[phase];
      g.emitImpactParticles(boss.x, boss.y, 9, "126,237,255");
    }

    updateMiniBossPhaseState(boss) {
      const g = this.game;
      const cfg = boss.isFinalBoss ? g.config.run?.finalBoss || g.config.mission.miniBoss : g.config.mission.miniBoss;
      const ratio = boss.hp / boss.maxHp;
      const thresholds = cfg.phaseThresholds;
      const nextPhase =
        ratio <= thresholds[1] ? 2 : ratio <= thresholds[0] ? 1 : 0;
      if (nextPhase <= boss.phaseIndex) return;
      boss.phaseIndex = nextPhase;
      boss.phaseAnnounceTimer = 1.4;
      boss.weakpointTimer = Math.min(boss.weakpointTimer, cfg.weakpointCycleSeconds[nextPhase] * 0.55);
      if (boss.isFinalBoss) this.triggerFinalBossPhaseEvent(boss);
      else this.triggerMiniBossPhaseEvent(boss);
      if (typeof g.missionSystem?.triggerMissionBeat === "function") {
        g.missionSystem.triggerMissionBeat("boss_phase", boss.isFinalBoss ? 1.0 : 0.84, boss.isFinalBoss ? 1.05 : 0.88);
      }
      if (typeof g.missionSystem?.triggerMissionFlash === "function") {
        g.missionSystem.triggerMissionFlash(boss.isFinalBoss ? 0.72 : 0.52, boss.isFinalBoss ? 0.84 : 0.62, "255,148,216");
      }
    }

    updateMiniBoss(dt) {
      const g = this.game;
      const boss = g.model.miniBoss;
      const ship = g.model.ship;
      if (!boss || !ship) return;

      const cfg = boss.isFinalBoss ? g.config.run?.finalBoss || g.config.mission.miniBoss : g.config.mission.miniBoss;
      boss.phase += dt;
      boss.phaseAnnounceTimer = Math.max(0, (boss.phaseAnnounceTimer ?? 0) - dt);
      this.updateMiniBossPhaseState(boss);
      this.updateMiniBossWeakpoint(boss, dt, cfg);

      const phase = boss.phaseIndex;
      if (boss.isFinalBoss) {
        const centerX = g.config.canvas.width * 0.5;
        const centerY = g.config.canvas.height * 0.34;
        const orbitX = cfg.orbitRadiusX?.[phase] ?? 280;
        const orbitY = cfg.orbitRadiusY?.[phase] ?? 140;
        const orbitFreq = cfg.orbitFreq?.[phase] ?? 0.72;
        const driftFreq = cfg.driftFreq?.[phase] ?? 1.35;
        boss.x = centerX + Math.cos(boss.phase * orbitFreq) * orbitX + Math.sin(boss.phase * driftFreq) * 24;
        boss.y = centerY + Math.sin(boss.phase * orbitFreq * 1.25) * orbitY;
      } else {
        boss.x =
          g.config.canvas.width * 0.5 +
          Math.sin(boss.phase * cfg.movementFreqX[phase]) * cfg.movementAmplitudeX[phase];
        boss.y = 120 + Math.sin(boss.phase * cfg.movementFreqY[phase]) * cfg.movementAmplitudeY[phase];
      }

      boss.shootTimer = Math.max(0, boss.shootTimer - dt);
      if (boss.shootTimer <= 0) {
        const dx = ship.x - boss.x;
        const dy = ship.y - boss.y;
        const aim = Math.atan2(dy, dx);
        const speedScale = this.getSectorScale(
          g.config.ufo.bulletSpeedScalePerSector,
          g.config.ufo.bulletSpeedScaleMaxBonus
        );
        if (boss.isFinalBoss) {
          const spiralShots = cfg.spiralShotsByPhase?.[phase] ?? 8;
          const spiralSpread = cfg.spiralSpreadRadians?.[phase] ?? 0.8;
          for (let i = 0; i < spiralShots; i += 1) {
            const t = spiralShots === 1 ? 0 : i / (spiralShots - 1) - 0.5;
            const spinOffset = boss.phase * (1.4 + phase * 0.35);
            const bullet = createEnemyBullet(
              boss.x,
              boss.y,
              aim + t * spiralSpread + spinOffset,
              g.config
            );
            bullet.vx *= speedScale * 1.05;
            bullet.vy *= speedScale * 1.05;
            bullet.damageProfile = "mini_boss_bullet";
            g.pushEnemyBullet(bullet);
            g.recordEnemyShot();
          }
          const radialEvery = Math.max(1, cfg.radialRingEveryShots ?? 3);
          const mineEvery = Math.max(1, cfg.mineRingEveryShots ?? 4);
          boss.shotCounter = (boss.shotCounter ?? 0) + 1;
          if (boss.shotCounter % radialEvery === 0) {
            const radialShots = cfg.radialRingShotsByPhase?.[phase] ?? 10;
            const speedFactor = cfg.radialRingSpeedFactor?.[phase] ?? 0.9;
            for (let i = 0; i < radialShots; i += 1) {
              const angle = (i / radialShots) * Math.PI * 2 + boss.phase * 0.8;
              const bullet = createEnemyBullet(boss.x, boss.y, angle, g.config);
              bullet.vx *= speedScale * speedFactor;
              bullet.vy *= speedScale * speedFactor;
              bullet.damageProfile = "mini_boss_bullet";
              g.pushEnemyBullet(bullet);
              g.recordEnemyShot();
            }
          }
          if (boss.shotCounter % mineEvery === 0) {
            const mineCount = cfg.mineRingCountByPhase?.[phase] ?? 8;
            const mineSpeedFactor = cfg.mineSpeedFactor ?? 0.66;
            const mineTtlSeconds = cfg.mineTtlSeconds ?? 6.1;
            for (let i = 0; i < mineCount; i += 1) {
              const angle = (i / mineCount) * Math.PI * 2 + (g.rng() - 0.5) * 0.18;
              const bullet = createEnemyBullet(boss.x, boss.y, angle, g.config);
              bullet.vx *= mineSpeedFactor;
              bullet.vy *= mineSpeedFactor;
              bullet.ttl = mineTtlSeconds;
              bullet.radius = g.config.ufo.mineRadius;
              bullet.isMine = true;
              bullet.damageProfile = "enemy_mine";
              g.pushEnemyBullet(bullet);
            }
          }
        } else {
          const volleyCount = cfg.volleyCount[phase];
          const spread = cfg.spreadRadians[phase];
          for (let i = 0; i < volleyCount; i += 1) {
            const t = volleyCount === 1 ? 0 : i / (volleyCount - 1) - 0.5;
            const bullet = createEnemyBullet(boss.x, boss.y, aim + t * spread + (g.rng() - 0.5) * 0.06, g.config);
            bullet.vx *= speedScale;
            bullet.vy *= speedScale;
            bullet.damageProfile = "mini_boss_bullet";
            g.pushEnemyBullet(bullet);
            g.recordEnemyShot();
          }
        }
        const fireRateScale = this.getSectorScale(
          g.config.ufo.fireRateScalePerSector,
          g.config.ufo.fireRateScaleMaxBonus
        );
        boss.shootTimer = (cfg.shootCooldownSeconds?.[phase] ?? 1) / fireRateScale;
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.EnemySystem = EnemySystem;
})();

