(() => {
  const { circleCollision, createAsteroid, createBullet, createShip, wrapPosition } = window.Asteroids;

  class CombatSystem {
    constructor(game) {
      this.game = game;
    }

    fireBullet() {
      const g = this.game;
      if (!g.model.ship) return false;
      if (!g.canFirePrimary()) return false;
      if (g.model.bullets.length >= g.getCurrentMaxBullets()) return false;
      g.model.bullets.push(createBullet(g.model.ship, g.config));
      g.consumePrimaryShotResources();
      g.recordPrimaryShot();
      return true;
    }

    tryDash() {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship || g.model.dashCooldown > 0) return false;

      const dashCfg = g.config.ship.dash;
      if (!g.canSpendShipResources(dashCfg.energyCost, dashCfg.heatGain)) return false;

      const impulseX = Math.cos(ship.angle) * dashCfg.impulse;
      const impulseY = Math.sin(ship.angle) * dashCfg.impulse;
      ship.vx += impulseX;
      ship.vy += impulseY;
      g.spendShipResources(dashCfg.energyCost, dashCfg.heatGain);
      ship.invulnMs = Math.max(ship.invulnMs, dashCfg.invulnerabilityMs);
      g.model.dashCooldown = dashCfg.cooldownSeconds;
      g.emitImpactParticles(ship.x, ship.y, 10, "160,242,255");
      return true;
    }

    tryUseSecondary() {
      const g = this.game;
      if (g.model.secondaryCooldown > 0 || !g.model.ship) return;

      const ship = g.model.ship;
      const spec = g.getSecondarySpec();
      if (!g.canSpendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0)) return;
      if (spec.kind === "rail") {
        const dirX = Math.cos(ship.angle);
        const dirY = Math.sin(ship.angle);
        g.model.bullets.push({
          x: ship.x + dirX * (ship.radius + 12),
          y: ship.y + dirY * (ship.radius + 12),
          vx: dirX * spec.projectileSpeed + ship.vx * 0.15,
          vy: dirY * spec.projectileSpeed + ship.vy * 0.15,
          radius: spec.radius,
          ttl: spec.ttlSeconds,
          kind: "secondary_rail",
          pierce: spec.pierce,
          bossDamage: spec.bossDamage
        });
      } else {
        for (let i = 0; i < spec.count; i += 1) {
          const t = spec.count === 1 ? 0 : i / (spec.count - 1) - 0.5;
          const angle = ship.angle + t * spec.spread;
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);
          g.model.bullets.push({
            x: ship.x + dirX * (ship.radius + 10),
            y: ship.y + dirY * (ship.radius + 10),
            vx: dirX * spec.projectileSpeed + ship.vx * 0.2,
            vy: dirY * spec.projectileSpeed + ship.vy * 0.2,
            radius: spec.radius,
            ttl: spec.ttlSeconds,
            kind: spec.kind === "cluster" ? "secondary_cluster" : "secondary",
            pierce: 0,
            bossDamage: spec.bossDamage
          });
        }
      }

      g.model.secondaryCooldown = spec.cooldownSeconds;
      g.spendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0);
      g.emitImpactParticles(ship.x, ship.y, 6, "255,198,132");
      g.recordSecondaryUse();
    }

    tryUseUtility() {
      const g = this.game;
      if (g.model.utilityCooldown > 0 || !g.model.ship) return;

      const ship = g.model.ship;
      const spec = g.getUtilitySpec();
      if (!g.canSpendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0)) return;
      g.model.utilityCooldown = spec.cooldownSeconds;
      g.spendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0);
      g.model.flashMs = Math.max(g.model.flashMs, spec.flashMs);

      if (spec.kind === "pulse") {
        const pulseRadius = spec.pulseRadius;
        g.model.utilityEffects.push({
          type: "pulse",
          x: ship.x,
          y: ship.y,
          radius: 0,
          maxRadius: pulseRadius,
          life: 0.45,
          ttl: 0.45
        });

        for (let i = g.model.enemyBullets.length - 1; i >= 0; i -= 1) {
          const bullet = g.model.enemyBullets[i];
          if (Math.hypot(bullet.x - ship.x, bullet.y - ship.y) <= pulseRadius) {
            g.model.enemyBullets.splice(i, 1);
          }
        }

        for (let i = g.model.ufos.length - 1; i >= 0; i -= 1) {
          const ufo = g.model.ufos[i];
          if (Math.hypot(ufo.x - ship.x, ufo.y - ship.y) <= pulseRadius + ufo.radius) {
            g.destroyUfoByIndex(i);
          }
        }

        for (let i = g.model.asteroids.length - 1; i >= 0; i -= 1) {
          const asteroid = g.model.asteroids[i];
          if (Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y) <= pulseRadius + asteroid.radius) {
            g.destroyAsteroidByIndex(i, true);
          }
        }

        if (g.model.miniBoss) {
          const bossDist = Math.hypot(g.model.miniBoss.x - ship.x, g.model.miniBoss.y - ship.y);
          if (bossDist <= pulseRadius + g.model.miniBoss.radius) {
            g.applyDamageToMiniBoss(spec.bossDamage, "explosive", 0.06);
          }
        }
      }

      if (spec.kind === "emp") {
        for (const ufo of g.model.ufos) {
          ufo.disabledTimer = Math.max(ufo.disabledTimer, spec.disableSeconds);
        }
        if (g.model.miniBoss) {
          g.model.miniBoss.shootTimer = Math.max(g.model.miniBoss.shootTimer, spec.disableSeconds);
        }
        g.model.enemyBullets = [];
        g.model.utilityEffects.push({
          type: "emp",
          x: ship.x,
          y: ship.y,
          radius: 0,
          maxRadius: 280,
          life: 0.55,
          ttl: 0.55
        });
      }

      if (spec.kind === "shield") {
        ship.invulnMs = Math.max(ship.invulnMs, spec.shieldSeconds * 1000);
        g.model.utilityEffects.push({
          type: "shield",
          x: ship.x,
          y: ship.y,
          radius: 34,
          maxRadius: 42,
          life: spec.shieldSeconds,
          ttl: spec.shieldSeconds,
          followShip: true
        });
      }

      g.emitImpactParticles(ship.x, ship.y, spec.particleCount, "125,232,255");
      g.recordUtilityUse();
    }

    updateShip(dt) {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship) return;

      const c = g.config;
      const profile = g.getCurrentFlightProfile();
      let turnInput = 0;
      if (g.input.isDown("ArrowLeft")) turnInput -= 1;
      if (g.input.isDown("ArrowRight")) turnInput += 1;

      if (turnInput !== 0) {
        ship.angularVelocity += turnInput * profile.rotationAcceleration * dt;
      }
      ship.angularVelocity *= profile.rotationDamping;
      ship.angularVelocity = g.clamp(ship.angularVelocity, -profile.rotationSpeed, profile.rotationSpeed);
      ship.angle += ship.angularVelocity * dt;

      if (g.input.isDown("ArrowUp")) {
        let thrust = profile.thrust;
        const boosting = g.input.isDown("ShiftLeft") || g.input.isDown("ShiftRight");
        if (boosting && ship.energy > 0) {
          const boostCfg = c.ship.boost;
          const energySpend = Math.min(ship.energy, boostCfg.energyCostPerSecond * dt);
          ship.energy -= energySpend;
          ship.heat = Math.min(ship.heatMax, ship.heat + boostCfg.heatPerSecond * dt);
          thrust *= boostCfg.thrustMultiplier;
        }
        ship.vx += Math.cos(ship.angle) * thrust * dt;
        ship.vy += Math.sin(ship.angle) * thrust * dt;
        g.emitThrusterParticle(ship);
      }

      ship.vx *= profile.friction;
      ship.vy *= profile.friction;

      const speed = Math.hypot(ship.vx, ship.vy);
      if (speed > profile.maxSpeed) {
        const factor = profile.maxSpeed / speed;
        ship.vx *= factor;
        ship.vy *= factor;
      }

      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      wrapPosition(ship, c.canvas.width, c.canvas.height);

      if (ship.invulnMs > 0) {
        ship.invulnMs = Math.max(0, ship.invulnMs - dt * 1000);
      }
    }

    updateBullets(dt) {
      const g = this.game;
      for (let i = g.model.bullets.length - 1; i >= 0; i -= 1) {
        const bullet = g.model.bullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.ttl -= dt;
        wrapPosition(bullet, g.config.canvas.width, g.config.canvas.height);
        if (bullet.ttl <= 0) g.model.bullets.splice(i, 1);
      }
    }

    updateEnemyBullets(dt) {
      const g = this.game;
      for (let i = g.model.enemyBullets.length - 1; i >= 0; i -= 1) {
        const bullet = g.model.enemyBullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.ttl -= dt;
        wrapPosition(bullet, g.config.canvas.width, g.config.canvas.height);
        if (bullet.ttl <= 0) g.model.enemyBullets.splice(i, 1);
      }
    }

    updateAsteroids(dt) {
      const g = this.game;
      const ship = g.model.ship;

      for (const asteroid of g.model.asteroids) {
        asteroid.x += asteroid.vx * dt;
        asteroid.y += asteroid.vy * dt;
        asteroid.rotation += asteroid.spin * dt;
        wrapPosition(asteroid, g.config.canvas.width, g.config.canvas.height);

        asteroid.nearMissCooldown = Math.max(0, asteroid.nearMissCooldown - dt);

        if (ship && asteroid.asteroidType === "magnetic") {
          const dx = asteroid.x - ship.x;
          const dy = asteroid.y - ship.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < g.config.asteroid.magneticRange) {
            const pull = (1 - dist / g.config.asteroid.magneticRange) * g.config.asteroid.magneticForce * dt;
            ship.vx += (dx / dist) * pull;
            ship.vy += (dy / dist) * pull;
          }
        }

        if (ship && asteroid.nearMissCooldown <= 0) {
          const dist = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);
          const collisionDist = asteroid.radius + ship.radius;
          const nearDist = collisionDist + g.config.combo.nearMissDistance;
          if (dist > collisionDist && dist < nearDist) {
            asteroid.nearMissCooldown = g.config.combo.nearMissCooldownSeconds;
            g.awardNearMiss();
          }
        }
      }
    }

    updateParticles(dt) {
      const g = this.game;
      for (let i = g.model.particles.length - 1; i >= 0; i -= 1) {
        const p = g.model.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ttl -= dt;
        p.life -= dt;
        if (p.life <= 0) g.model.particles.splice(i, 1);
      }
    }

    updateUtilityEffects(dt) {
      const g = this.game;
      for (let i = g.model.utilityEffects.length - 1; i >= 0; i -= 1) {
        const effect = g.model.utilityEffects[i];
        if (effect.followShip && g.model.ship) {
          effect.x = g.model.ship.x;
          effect.y = g.model.ship.y;
        }
        effect.life -= dt;
        const t = 1 - Math.max(0, effect.life / effect.ttl);
        effect.radius =
          effect.type === "shield" ? effect.maxRadius - Math.sin(t * Math.PI) * 6 : effect.maxRadius * t;
        if (effect.life <= 0) g.model.utilityEffects.splice(i, 1);
      }
    }

    handleBulletAsteroidCollisions() {
      const g = this.game;
      for (let b = g.model.bullets.length - 1; b >= 0; b -= 1) {
        let hitIndex = -1;
        for (let a = g.model.asteroids.length - 1; a >= 0; a -= 1) {
          if (circleCollision(g.model.bullets[b], g.model.asteroids[a])) {
            hitIndex = a;
            break;
          }
        }
        if (hitIndex === -1) continue;
        g.destroyAsteroidByIndex(hitIndex, true);
        g.consumePlayerProjectileHit(b);
      }
    }

    splitAsteroid(asteroid) {
      const g = this.game;
      const nextSize = g.asteroidDefs[asteroid.size].next;
      if (!nextSize) return;

      const speedScale = 1 + g.model.sector * g.config.sector.splitScalePerSector;
      const childType = asteroid.asteroidType === "volatile" ? "normal" : asteroid.asteroidType;

      for (let i = 0; i < g.config.asteroid.splitCount; i += 1) {
        const child = createAsteroid(
          nextSize,
          asteroid.x,
          asteroid.y,
          speedScale,
          g.rng,
          g.config,
          g.asteroidDefs,
          childType
        );
        child.vx += asteroid.vx * g.config.asteroid.splitVelocityInheritFactor;
        child.vy += asteroid.vy * g.config.asteroid.splitVelocityInheritFactor;
        g.model.asteroids.push(child);
      }
    }

    handleBulletUfoCollisions() {
      const g = this.game;
      for (let b = g.model.bullets.length - 1; b >= 0; b -= 1) {
        let hitIndex = -1;
        for (let u = g.model.ufos.length - 1; u >= 0; u -= 1) {
          if (circleCollision(g.model.bullets[b], g.model.ufos[u])) {
            hitIndex = u;
            break;
          }
        }
        if (hitIndex === -1) continue;
        g.destroyUfoByIndex(hitIndex);
        g.consumePlayerProjectileHit(b);
      }
    }

    handleBulletMiniBossCollisions() {
      const g = this.game;
      const boss = g.model.miniBoss;
      if (!boss) return;

      for (let b = g.model.bullets.length - 1; b >= 0; b -= 1) {
        if (!circleCollision(g.model.bullets[b], boss)) continue;
        const bullet = g.model.bullets[b];
        const baseDamage = bullet.bossDamage ?? 28;
        const damageType = bullet.kind === "secondary_rail" ? "plasma" : "kinetic";
        g.consumePlayerProjectileHit(b);
        const destroyed = g.applyDamageToMiniBoss(baseDamage, damageType, bullet.kind ? 0.11 : 0.08);
        if (destroyed) return;
      }
    }

    handleShipThreatCollisions() {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship || ship.invulnMs > 0) return;

      for (const asteroid of g.model.asteroids) {
        if (circleCollision(ship, asteroid)) {
          const gotHit = g.applyDamageToShip("asteroid_collision");
          if (gotHit && asteroid.asteroidType === "volatile") {
            g.applyDamageToShip("volatile_burn", {
              baseDamage: 0,
              dotDuration: 2.2,
              dotDps: 7.5,
              bypassInvulnerability: true,
              applyHitInvulnerability: false,
              countAsHit: false
            });
          }
          return;
        }
      }
      for (const ufo of g.model.ufos) {
        if (circleCollision(ship, ufo)) {
          g.applyDamageToShip("ufo_collision");
          return;
        }
      }
      if (g.model.miniBoss && circleCollision(ship, g.model.miniBoss)) {
        g.applyDamageToShip("mini_boss_collision");
        return;
      }
      for (let i = g.model.enemyBullets.length - 1; i >= 0; i -= 1) {
        if (circleCollision(ship, g.model.enemyBullets[i])) {
          const profileId = g.model.enemyBullets[i].damageProfile || "enemy_bullet_hunter";
          g.model.enemyBullets.splice(i, 1);
          g.applyDamageToShip(profileId);
          return;
        }
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.CombatSystem = CombatSystem;
})();
