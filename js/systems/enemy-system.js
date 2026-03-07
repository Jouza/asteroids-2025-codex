(() => {
  const { createEnemyBullet, createUfo, randomRange, wrapPosition } = window.Asteroids;

  class EnemySystem {
    constructor(game) {
      this.game = game;
    }

    getWaveScale(perWave, maxBonus) {
      const g = this.game;
      const waveIndex = Math.max(0, g.model.wave - 1);
      return 1 + Math.min(maxBonus, waveIndex * perWave);
    }

    scheduleNextUfoSpawn() {
      const g = this.game;
      g.model.nextUfoSpawnSeconds = randomRange(
        g.rng,
        g.config.ufo.spawnDelayMinSeconds,
        g.config.ufo.spawnDelayMaxSeconds
      );
    }

    spawnMissionUfo() {
      const g = this.game;
      const mode = g.rng() < 0.58 ? "hunter" : "sniper";
      const x = g.rng() < 0.5 ? -28 : g.config.canvas.width + 28;
      const y = randomRange(g.rng, 90, g.config.canvas.height - 90);
      g.model.ufos.push(createUfo(mode, x, y, g.config));
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
      const speedScale = this.getWaveScale(c.ufo.speedScalePerWave, c.ufo.speedScaleMaxBonus);
      const fireRateScale = this.getWaveScale(c.ufo.fireRateScalePerWave, c.ufo.fireRateScaleMaxBonus);

      for (const ufo of g.model.ufos) {
        const dx = ship.x - ufo.x;
        const dy = ship.y - ufo.y;
        const dist = Math.max(1, Math.hypot(dx, dy));

        if (ufo.mode === "hunter") {
          const speed = c.ufo.speedHunter * speedScale;
          ufo.vx = (dx / dist) * speed;
          ufo.vy = (dy / dist) * speed;
        } else {
          const desired = c.ufo.desiredSniperDistance;
          const distanceError = dist - desired;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const sniperSpeed = c.ufo.speedSniper * speedScale;
          const radial = g.clamp(distanceError * 0.65, -sniperSpeed, sniperSpeed);
          const tangential = sniperSpeed * 0.72;
          ufo.vx = normalX * radial + tangentX * tangential;
          ufo.vy = normalY * radial + tangentY * tangential;
        }

        ufo.x += ufo.vx * dt;
        ufo.y += ufo.vy * dt;
        wrapPosition(ufo, c.canvas.width, c.canvas.height);

        ufo.disabledTimer = Math.max(0, ufo.disabledTimer - dt);
        ufo.shootTimer = Math.max(0, ufo.shootTimer - dt);
        if (ufo.disabledTimer <= 0 && ufo.shootTimer <= 0) {
          this.fireEnemyBullet(ufo, ship);
          ufo.shootTimer =
            ufo.mode === "hunter"
              ? c.enemyBullet.cooldownHunterSeconds / fireRateScale
              : c.enemyBullet.cooldownSniperSeconds / fireRateScale;
        }
      }
    }

    fireEnemyBullet(ufo, ship) {
      const g = this.game;
      const dx = ship.x - ufo.x;
      const dy = ship.y - ufo.y;
      const baseAngle = Math.atan2(dy, dx);
      const spread =
        ufo.mode === "hunter"
          ? g.config.enemyBullet.spreadHunter
          : g.config.enemyBullet.spreadSniper;
      const shotAngle = baseAngle + (g.rng() - 0.5) * spread;
      const muzzleX = ufo.x + Math.cos(shotAngle) * (ufo.radius + 4);
      const muzzleY = ufo.y + Math.sin(shotAngle) * (ufo.radius + 4);
      const speedScale = this.getWaveScale(
        g.config.ufo.bulletSpeedScalePerWave,
        g.config.ufo.bulletSpeedScaleMaxBonus
      );
      const bullet = createEnemyBullet(muzzleX, muzzleY, shotAngle, g.config);
      bullet.vx *= speedScale;
      bullet.vy *= speedScale;
      g.model.enemyBullets.push(bullet);
      g.recordEnemyShot();
      g.emitImpactParticles(muzzleX, muzzleY, 2, "255,123,196");
    }

    spawnMiniBoss(hp) {
      const g = this.game;
      g.model.miniBoss = {
        x: g.config.canvas.width * 0.5,
        y: 120,
        radius: g.config.mission.miniBoss.radius,
        hp,
        maxHp: hp,
        phase: 0,
        shootTimer: 0
      };
    }

    updateMiniBoss(dt) {
      const g = this.game;
      const boss = g.model.miniBoss;
      const ship = g.model.ship;
      if (!boss || !ship) return;

      const cfg = g.config.mission.miniBoss;
      boss.phase += dt;
      boss.x = g.config.canvas.width * 0.5 + Math.sin(boss.phase * 0.8) * 260;
      boss.y = 120 + Math.sin(boss.phase * 1.4) * 36;

      boss.shootTimer = Math.max(0, boss.shootTimer - dt);
      if (boss.shootTimer <= 0) {
        const dx = ship.x - boss.x;
        const dy = ship.y - boss.y;
        const aim = Math.atan2(dy, dx);
        const speedScale = this.getWaveScale(
          g.config.ufo.bulletSpeedScalePerWave,
          g.config.ufo.bulletSpeedScaleMaxBonus
        );
        const bullet = createEnemyBullet(boss.x, boss.y, aim + (g.rng() - 0.5) * 0.14, g.config);
        bullet.vx *= speedScale;
        bullet.vy *= speedScale;
        g.model.enemyBullets.push(bullet);
        g.recordEnemyShot();
        const fireRateScale = this.getWaveScale(
          g.config.ufo.fireRateScalePerWave,
          g.config.ufo.fireRateScaleMaxBonus
        );
        boss.shootTimer = cfg.shootCooldownSeconds / fireRateScale;
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.EnemySystem = EnemySystem;
})();
