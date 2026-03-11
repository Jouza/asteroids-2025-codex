(() => {
  const { circleCollision, createAsteroid, createShip, wrapPosition } = window.Asteroids;

  class CombatSystem {
    constructor(game) {
      this.game = game;
    }

    fireBullet() {
      const g = this.game;
      if (!g.model.ship) return false;
      const spec = g.getPrimarySpec();
      if (g.model.bullets.length >= g.getCurrentMaxBullets()) {
        g.registerActionBlock("magazine", "game.action.block.magazine", { shots: g.getCurrentMaxBullets() });
        return false;
      }
      if (!g.canFirePrimary()) {
        const shieldCost = g.getSharedPoolShieldCost("primary", spec.energyCost);
        g.showResourceBlockHint(spec.energyCost, spec.heatGain, { shieldCost });
        return false;
      }
      const ship = g.model.ship;
      const count = spec.count ?? 1;
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const angle = ship.angle + t * (spec.spread ?? 0);
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        g.pushPlayerBullet({
          x: ship.x + dirX * (ship.radius + 8),
          y: ship.y + dirY * (ship.radius + 8),
          vx: ship.vx * g.config.bullet.inheritVelocityFactor + dirX * (spec.projectileSpeed ?? g.config.bullet.speed),
          vy: ship.vy * g.config.bullet.inheritVelocityFactor + dirY * (spec.projectileSpeed ?? g.config.bullet.speed),
          radius: spec.radius ?? g.config.bullet.radius,
          ttl: spec.ttlSeconds ?? g.config.bullet.ttlSeconds,
          kind: `primary_${spec.kind || "auto"}`,
          pierce: spec.pierce ?? 0,
          bossDamage: spec.bossDamage ?? 28,
          chainTargets: spec.chainTargets ?? 0,
          chainRadius: spec.chainRadius ?? 0,
          chainBossDamage: spec.chainBossDamage ?? 12
        });
      }
      g.consumePrimaryShotResources();
      g.recordPrimaryShot();
      g.audio.play("primary_fire");
      return true;
    }

    tryDash() {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship) return false;
      if (g.model.dashCooldown > 0) {
        g.registerActionBlock("cooldown", "game.action.block.cooldown", { seconds: g.model.dashCooldown.toFixed(1) });
        return false;
      }

      const dashCfg = g.config.ship.dash;
      const shieldCost = g.getSharedPoolShieldCost("dash", dashCfg.energyCost);
      if (!g.canSpendShipResources(dashCfg.energyCost, dashCfg.heatGain, { shieldCost })) {
        g.showResourceBlockHint(dashCfg.energyCost, dashCfg.heatGain, { shieldCost });
        return false;
      }

      const impulseX = Math.cos(ship.angle) * dashCfg.impulse;
      const impulseY = Math.sin(ship.angle) * dashCfg.impulse;
      ship.vx += impulseX;
      ship.vy += impulseY;
      g.spendShipResources(dashCfg.energyCost, dashCfg.heatGain, { shieldCost });
      ship.invulnMs = Math.max(ship.invulnMs, dashCfg.invulnerabilityMs);
      g.model.dashCooldown = dashCfg.cooldownSeconds;
      g.emitImpactParticles(ship.x, ship.y, 10, "160,242,255");
      g.audio.play("dash");
      return true;
    }

    tryUseSecondary() {
      const g = this.game;
      if (!g.model.ship) return;
      if (g.model.secondaryCooldown > 0) {
        g.registerActionBlock("cooldown", "game.action.block.cooldown", { seconds: g.model.secondaryCooldown.toFixed(1) });
        return;
      }

      const ship = g.model.ship;
      const spec = g.getSecondarySpec();
      const shieldCost = g.getSharedPoolShieldCost("secondary", spec.energyCost ?? 0);
      if (!g.canSpendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost })) {
        g.showResourceBlockHint(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost });
        return;
      }
      if (spec.kind === "rail") {
        const dirX = Math.cos(ship.angle);
        const dirY = Math.sin(ship.angle);
        g.pushPlayerBullet({
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
          g.pushPlayerBullet({
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

      g.model.secondaryCooldown = spec.cooldownSeconds * g.getCooldownMultiplier("secondary");
      g.spendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost });
      g.emitImpactParticles(ship.x, ship.y, 6, "255,198,132");
      g.recordSecondaryUse();
      g.audio.play("secondary_fire");
    }

    tryUseUtility() {
      const g = this.game;
      if (!g.model.ship) return;
      if (g.model.utilityCooldown > 0) {
        g.registerActionBlock("cooldown", "game.action.block.cooldown", { seconds: g.model.utilityCooldown.toFixed(1) });
        return;
      }

      const ship = g.model.ship;
      const spec = g.getUtilitySpec();
      const shieldCost = g.getSharedPoolShieldCost("utility", spec.energyCost ?? 0);
      if (!g.canSpendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost })) {
        g.showResourceBlockHint(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost });
        return;
      }
      g.model.utilityCooldown = spec.cooldownSeconds * g.getCooldownMultiplier("utility");
      g.spendShipResources(spec.energyCost ?? 0, spec.heatGain ?? 0, { shieldCost });
      g.model.flashMs = Math.max(g.model.flashMs, spec.flashMs);

      if (spec.kind === "pulse") {
        const pulseRadius = spec.pulseRadius;
        g.pushUtilityEffect({
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
        g.pushUtilityEffect({
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
        g.pushUtilityEffect({
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
      g.audio.play("utility_use");
    }

    updateShip(dt) {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship) return;

      const c = g.config;
      const profile = g.getCurrentFlightProfile();
      const touchMove = typeof g.getTouchMoveIntent === "function" ? g.getTouchMoveIntent() : null;
      const touchAim = typeof g.getTouchAimIntent === "function" ? g.getTouchAimIntent() : null;
      const touchActions = typeof g.getTouchCombatActions === "function" ? g.getTouchCombatActions() : null;
      let turnInput = 0;
      if (g.input.isDown("ArrowLeft")) turnInput -= 1;
      if (g.input.isDown("ArrowRight")) turnInput += 1;
      if (touchMove?.turn && !touchAim?.active) {
        turnInput = g.clamp(turnInput + touchMove.turn, -1, 1);
      }

      if (turnInput !== 0) {
        ship.angularVelocity += turnInput * profile.rotationAcceleration * dt;
      }
      ship.angularVelocity *= profile.rotationDamping;
      ship.angularVelocity = g.clamp(ship.angularVelocity, -profile.rotationSpeed, profile.rotationSpeed);
      ship.angle += ship.angularVelocity * dt;
      if (touchAim?.active) {
        ship.angle = touchAim.angle;
        ship.angularVelocity = 0;
      }

      const thrustActive = g.input.isDown("ArrowUp") || Boolean(touchMove?.thrust);
      if (thrustActive) {
        const thrustScale = touchMove?.thrustScale ? g.clamp(touchMove.thrustScale, 0.45, 1) : 1;
        let thrust = profile.thrust * thrustScale;
        const boosting =
          g.input.isDown("ShiftLeft") || g.input.isDown("ShiftRight") || Boolean(touchActions?.boostActive);
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

        if (ship && asteroid.asteroidType === "drain_core") {
          const profile = g.getAsteroidSpecialProfile("drain_core");
          const drainRadius = Math.max(24, Number(profile.drainRadius) || 148);
          const dist = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);
          if (dist < drainRadius + ship.radius) {
            const falloff = g.clamp(1 - dist / Math.max(1, drainRadius), 0.15, 1);
            ship.energy = Math.max(0, ship.energy - Math.max(0, Number(profile.energyDrainPerSec) || 12) * falloff * dt);
            ship.heat = Math.min(ship.heatMax, ship.heat + Math.max(0, Number(profile.heatPerSec) || 8) * falloff * dt);
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
        if ((p.drag ?? 0) > 0) {
          const dragFactor = Math.max(0, 1 - p.drag * dt);
          p.vx *= dragFactor;
          p.vy *= dragFactor;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if ((p.growth ?? 0) !== 0) p.radius += p.growth * dt;
        p.ttl -= dt;
        p.life -= dt;
        if (p.life <= 0) g.model.particles.splice(i, 1);
      }
    }

    updateMissionEntities(dt) {
      const g = this.game;
      const ship = g.model.ship;
      if (!ship || g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING) return;
      const relays = Array.isArray(g.model.sentryRelays) ? g.model.sentryRelays : [];
      const drifters = Array.isArray(g.model.salvageDrifters) ? g.model.salvageDrifters : [];
      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

      for (let i = relays.length - 1; i >= 0; i -= 1) {
        const relay = relays[i];
        if (!relay || relay.hp <= 0) {
          relays.splice(i, 1);
          continue;
        }
        relay.cooldownTimer = Math.max(0, (relay.cooldownTimer ?? 0) - dt);
        relay.telegraphTimer = Math.max(0, (relay.telegraphTimer ?? 0) - dt);
        if (!relay.telegraphActive && relay.cooldownTimer <= 0) {
          relay.telegraphActive = true;
          relay.telegraphTimer = relay.telegraphSeconds;
          relay.aimAngle = Math.atan2(ship.y - relay.y, ship.x - relay.x);
        }
        if (!relay.telegraphActive || relay.telegraphTimer > 0) continue;
        relay.telegraphActive = false;
        relay.cooldownTimer = relay.cooldownSeconds;
        const rayRange = relay.beamRange ?? 1320;
        const dirX = Math.cos(relay.aimAngle);
        const dirY = Math.sin(relay.aimAngle);
        const rayEndX = relay.x + dirX * rayRange;
        const rayEndY = relay.y + dirY * rayRange;
        const toShipX = ship.x - relay.x;
        const toShipY = ship.y - relay.y;
        const proj = clamp((toShipX * dirX + toShipY * dirY) / Math.max(1, rayRange), 0, 1);
        const closestX = relay.x + dirX * proj * rayRange;
        const closestY = relay.y + dirY * proj * rayRange;
        const distToRay = Math.hypot(ship.x - closestX, ship.y - closestY);
        if (distToRay <= ship.radius + (relay.beamWidth ?? 7) * 0.9) {
          g.applyDamageToShip("sentry_relay_bolt");
        }
        g.emitImpactParticles(relay.x, relay.y, 7, "176,232,255");
      }

      for (let i = drifters.length - 1; i >= 0; i -= 1) {
        const drifter = drifters[i];
        if (!drifter || drifter.state !== "active") {
          drifters.splice(i, 1);
          continue;
        }
        drifter.x += drifter.vx * dt;
        drifter.y += drifter.vy * dt;
        wrapPosition(drifter, g.config.canvas.width, g.config.canvas.height);
        const dist = Math.hypot(ship.x - drifter.x, ship.y - drifter.y);
        if (dist <= drifter.captureRadius + ship.radius) {
          drifter.captureTimer += dt;
          drifter.captureRatio = g.clamp(drifter.captureTimer / Math.max(0.1, drifter.captureSeconds), 0, 1);
          if (drifter.captureTimer >= drifter.captureSeconds) {
            drifter.state = "captured";
            drifter.statusTtl = 1.8;
            g.model.credits += Math.max(0, Math.floor(drifter.rewardCredits || 0));
            g.model.salvageParts += Math.max(0, Math.floor(drifter.rewardSalvage || 0));
            g.model.telemetry.creditsEarned += Math.max(0, Math.floor(drifter.rewardCredits || 0));
            g.emitImpactParticles(drifter.x, drifter.y, 14, "168,255,194");
            if (g.model.currentMission) g.model.currentMission.drifterStatus = "captured";
          }
        } else {
          drifter.captureTimer = Math.max(0, drifter.captureTimer - dt * 0.35);
          drifter.captureRatio = g.clamp(drifter.captureTimer / Math.max(0.1, drifter.captureSeconds), 0, 1);
        }
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
        const bullet = g.model.bullets[b];
        const hitAsteroid = g.model.asteroids[hitIndex];
        const impactX = hitAsteroid.x;
        const impactY = hitAsteroid.y;
        const isEchoShell = hitAsteroid.asteroidType === "echo_shell";
        const echoProfile = isEchoShell ? g.getAsteroidSpecialProfile("echo_shell") : null;
        g.destroyAsteroidByIndex(hitIndex, true);
        if (isEchoShell) g.triggerEchoShellPulse(impactX, impactY, echoProfile);
        if (bullet?.chainTargets > 0) {
          g.triggerPrimaryChain(impactX, impactY, bullet.chainTargets, bullet.chainRadius, bullet.chainBossDamage);
        }
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
        const bullet = g.model.bullets[b];
        const impactX = g.model.ufos[hitIndex].x;
        const impactY = g.model.ufos[hitIndex].y;
        const baseDamage = bullet.bossDamage ?? 26;
        const damageType = bullet.kind === "secondary_rail" || bullet.kind === "primary_rail" ? "plasma" : "kinetic";
        g.applyDamageToUfoByIndex(hitIndex, baseDamage, damageType, bullet.kind ? 0.11 : 0.08);
        if (bullet?.chainTargets > 0) {
          g.triggerPrimaryChain(impactX, impactY, bullet.chainTargets, bullet.chainRadius, bullet.chainBossDamage);
        }
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
        const damageType = bullet.kind === "secondary_rail" || bullet.kind === "primary_rail" ? "plasma" : "kinetic";
        g.consumePlayerProjectileHit(b);
        const destroyed = g.applyDamageToMiniBoss(baseDamage, damageType, bullet.kind ? 0.11 : 0.08);
        if (!destroyed && bullet?.chainTargets > 0) {
          g.triggerPrimaryChain(
            boss.x,
            boss.y,
            bullet.chainTargets,
            bullet.chainRadius,
            bullet.chainBossDamage
          );
        }
        if (destroyed) return;
      }
    }

    handleBulletMissionEntityCollisions() {
      const g = this.game;
      const relays = Array.isArray(g.model.sentryRelays) ? g.model.sentryRelays : [];
      if (!relays.length) return;
      for (let b = g.model.bullets.length - 1; b >= 0; b -= 1) {
        const bullet = g.model.bullets[b];
        if (!bullet) continue;
        let hitIndex = -1;
        for (let r = relays.length - 1; r >= 0; r -= 1) {
          if (circleCollision(bullet, relays[r])) {
            hitIndex = r;
            break;
          }
        }
        if (hitIndex === -1) continue;
        const relay = relays[hitIndex];
        const hitDamage = Math.max(10, Number(bullet.bossDamage) || 20);
        relay.hp = Math.max(0, relay.hp - hitDamage);
        g.consumePlayerProjectileHit(b);
        g.emitImpactParticles(relay.x, relay.y, 7, "162,236,255");
        if (relay.hp <= 0) {
          relays.splice(hitIndex, 1);
          g.emitExplosionFx(relay.x, relay.y, 36, "146,231,255", "214,244,255");
          if (g.model.currentMission) g.model.currentMission.relayStatus = "down";
        }
      }
    }

    handleEnemyBulletAsteroidCollisions() {
      const g = this.game;
      for (let b = g.model.enemyBullets.length - 1; b >= 0; b -= 1) {
        const bullet = g.model.enemyBullets[b];
        if (!bullet) continue;
        const drifters = Array.isArray(g.model.salvageDrifters) ? g.model.salvageDrifters : [];
        let drifterHitIndex = -1;
        for (let d = drifters.length - 1; d >= 0; d -= 1) {
          if (circleCollision(bullet, drifters[d])) {
            drifterHitIndex = d;
            break;
          }
        }
        if (drifterHitIndex >= 0) {
          const drifter = drifters[drifterHitIndex];
          g.model.enemyBullets.splice(b, 1);
          const profileId = bullet.damageProfile || "enemy_bullet_hunter";
          const hitProfile = g.config.damage?.enemyHitProfiles?.[profileId] || {};
          drifter.hp = Math.max(0, (drifter.hp ?? 0) - Math.max(1, Math.floor(Number(hitProfile.baseDamage) || 10)));
          g.emitImpactParticles(drifter.x, drifter.y, 4, "255,188,132");
          if (drifter.hp <= 0) {
            drifters.splice(drifterHitIndex, 1);
            if (g.model.currentMission) g.model.currentMission.drifterStatus = "lost";
          }
          continue;
        }
        let hitIndex = -1;
        for (let a = g.model.asteroids.length - 1; a >= 0; a -= 1) {
          if (circleCollision(bullet, g.model.asteroids[a])) {
            hitIndex = a;
            break;
          }
        }
        if (hitIndex === -1) continue;
        const asteroid = g.model.asteroids[hitIndex];
        g.model.enemyBullets.splice(b, 1);
        const isEchoShell = asteroid?.asteroidType === "echo_shell";
        const echoProfile = isEchoShell ? g.getAsteroidSpecialProfile("echo_shell") : null;
        if ((bullet.asteroidCollisionMode || "break") === "break") {
          g.destroyAsteroidByIndex(hitIndex, true, { awardRewards: false, source: "enemy_projectile" });
          if (isEchoShell && asteroid) g.triggerEchoShellPulse(asteroid.x, asteroid.y, echoProfile);
        } else if (asteroid) {
          g.emitImpactParticles(asteroid.x, asteroid.y, 4, "255,176,132");
        }
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
          const profileId = ufo.mode === "kamikaze" ? "kamikaze_collision" : "ufo_collision";
          g.applyDamageToShip(profileId);
          return;
        }
      }
      for (const relay of g.model.sentryRelays || []) {
        if (circleCollision(ship, relay)) {
          g.applyDamageToShip("ufo_collision", { baseDamage: 26, damageType: "collision", critChance: 0 });
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
