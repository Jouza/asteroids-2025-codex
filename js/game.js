(() => {
  const {
    ASTEROID_DEFS,
    ASTEROID_TYPES,
    GAME_CONFIG,
    GAME_STATE,
    createSeededRng,
    createShip,
    generateRunSeed,
    MissionSystem,
    ShopSystem,
    CombatSystem,
    EnemySystem,
    randomRange
  } = window.Asteroids;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createTelemetryState(enabled = false) {
    return {
      enabled,
      runTimeSeconds: 0,
      completedMissions: 0,
      kills: {
        asteroids: 0,
        ufos: 0,
        miniBosses: 0
      },
      shots: {
        primary: 0,
        secondary: 0,
        utility: 0,
        enemy: 0
      },
      scoreEarned: 0,
      creditsEarned: 0,
      playerHitsTaken: 0,
      activeMission: null,
      lastMission: null
    };
  }

  class Game {
    constructor(canvas, renderer, hud, input, config = GAME_CONFIG) {
      this.canvas = canvas;
      this.renderer = renderer;
      this.hud = hud;
      this.input = input;
      this.config = config;
      this.asteroidDefs = ASTEROID_DEFS;
      this.asteroidTypes = ASTEROID_TYPES;
      this.rng = () => Math.random();

      this.model = {
        gameState: GAME_STATE.START,
        score: 0,
        credits: 0,
        wave: 1,
        ship: null,
        bullets: [],
        enemyBullets: [],
        asteroids: [],
        ufos: [],
        miniBoss: null,
        particles: [],
        utilityEffects: [],
        flashMs: 0,
        shootTimer: 0,
        secondaryCooldown: 0,
        utilityCooldown: 0,
        dashCooldown: 0,
        waveTimerMs: 0,
        runSeed: null,
        runtimeSeconds: 0,
        nextUfoSpawnSeconds: 0,
        comboCount: 0,
        comboMultiplier: 1,
        comboTimer: 0,
        waveCompletionHandled: false,
        missionTimer: 0,
        missionSpawnTimer: 0,
        missionSpawnBudget: 0,
        missionUfoKills: 0,
        missionAsteroidKills: 0,
        currentMission: null,
        flightModel: "arcade",
        dotEffects: [],
        shop: {
          message: "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start."
        },
        loadout: {
          primaryId: "auto_cannon",
          secondaryId: "missile_burst",
          utilityId: "pulse_bomb",
          primaryLabel: "Auto",
          secondaryLabel: "Missiles",
          utilityLabel: "Pulse"
        },
        unlocks: {
          secondary: {
            missile_burst: true,
            rail_shot: false,
            cluster_rockets: false
          },
          utility: {
            pulse_bomb: true,
            emp_pulse: false,
            shield_dome: false
          }
        },
        upgrades: {
          fireRateLevel: 0,
          magazineLevel: 0
        },
        telemetry: createTelemetryState(false)
      };

      this.missionSystem = new MissionSystem(this);
      this.shopSystem = new ShopSystem(this);
      this.combatSystem = new CombatSystem(this);
      this.enemySystem = new EnemySystem(this);
    }

    clamp(value, min, max) {
      return clamp(value, min, max);
    }

    initGame() {
      this.canvas.width = this.config.canvas.width;
      this.canvas.height = this.config.canvas.height;
      this.model.ship = createShip(this.config);
      this.initializeShipResources(this.model.ship);
      this.model.runSeed = generateRunSeed();
      this.syncLoadoutLabels();
      this.enemySystem.scheduleNextUfoSpawn();
      this.hud.sync(this.model);
    }

    handleMetaInput() {
      if (this.input.wasPressed("F3")) {
        this.model.telemetry.enabled = !this.model.telemetry.enabled;
      }
      if (this.input.wasPressed("KeyF")) {
        this.toggleFlightModel();
      }

      if (this.model.gameState === GAME_STATE.SHOP) {
        this.shopSystem.handleShopInput();
        this.hud.sync(this.model);
        return;
      }

      if (this.input.wasPressed("KeyP")) {
        if (this.model.gameState === GAME_STATE.PLAYING) this.model.gameState = GAME_STATE.PAUSED;
        else if (this.model.gameState === GAME_STATE.PAUSED) this.model.gameState = GAME_STATE.PLAYING;
        this.hud.sync(this.model);
      }

      if (this.input.wasPressed("Enter")) {
        if (this.model.gameState === GAME_STATE.START) {
          this.startGame(this.model.runSeed ?? generateRunSeed());
        } else if (this.model.gameState === GAME_STATE.GAME_OVER) {
          this.startGame(generateRunSeed());
        }
      }

      if (this.model.gameState === GAME_STATE.PLAYING) {
        if (this.input.wasPressed("KeyX")) this.combatSystem.tryUseSecondary();
        if (this.input.wasPressed("KeyC")) this.combatSystem.tryUseUtility();
        if (this.input.wasPressed("KeyV")) this.combatSystem.tryDash();
      }
    }

    startGame(seed = this.model.runSeed ?? generateRunSeed()) {
      this.resetGame(seed);
      this.input.reset();
      this.model.gameState = GAME_STATE.PLAYING;
      this.hud.sync(this.model);
    }

    endGame() {
      this.input.reset();
      this.model.gameState = GAME_STATE.GAME_OVER;
      this.hud.sync(this.model);
    }

    resetGame(seed) {
      const telemetryEnabled = this.model.telemetry.enabled;
      this.model.score = 0;
      this.model.credits = 0;
      this.model.wave = 1;
      this.model.ship = createShip(this.config);
      this.model.bullets = [];
      this.model.enemyBullets = [];
      this.model.asteroids = [];
      this.model.ufos = [];
      this.model.miniBoss = null;
      this.model.particles = [];
      this.model.utilityEffects = [];
      this.model.flashMs = 0;
      this.model.shootTimer = 0;
      this.model.secondaryCooldown = 0;
      this.model.utilityCooldown = 0;
      this.model.dashCooldown = 0;
      this.model.waveTimerMs = 0;
      this.model.runtimeSeconds = 0;
      this.model.comboCount = 0;
      this.model.comboMultiplier = 1;
      this.model.comboTimer = 0;
      this.model.waveCompletionHandled = false;
      this.model.missionTimer = 0;
      this.model.missionSpawnTimer = 0;
      this.model.missionSpawnBudget = 0;
      this.model.missionUfoKills = 0;
      this.model.missionAsteroidKills = 0;
      this.model.currentMission = null;
      this.model.flightModel = "arcade";
      this.model.dotEffects = [];
      this.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
      this.model.upgrades.fireRateLevel = 0;
      this.model.upgrades.magazineLevel = 0;
      this.model.loadout.secondaryId = "missile_burst";
      this.model.loadout.utilityId = "pulse_bomb";
      this.model.unlocks.secondary = { missile_burst: true, rail_shot: false, cluster_rockets: false };
      this.model.unlocks.utility = { pulse_bomb: true, emp_pulse: false, shield_dome: false };
      this.model.runSeed = seed >>> 0;
      this.model.telemetry = createTelemetryState(telemetryEnabled);
      this.rng = createSeededRng(this.model.runSeed);
      this.initializeShipResources(this.model.ship);
      this.syncLoadoutLabels();
      this.enemySystem.scheduleNextUfoSpawn();
      this.missionSystem.startMission(this.model.wave);
      this.hud.sync(this.model);
    }

    syncLoadoutLabels() {
      const primary = this.config.loadout.primary[this.model.loadout.primaryId];
      const secondary = this.config.loadout.secondary[this.model.loadout.secondaryId];
      const utility = this.config.loadout.utility[this.model.loadout.utilityId];
      this.model.loadout.primaryLabel = primary.label;
      this.model.loadout.secondaryLabel = secondary.label;
      this.model.loadout.utilityLabel = utility.label;
    }

    update(dt) {
      if (this.model.gameState !== GAME_STATE.PLAYING) return;

      this.model.runtimeSeconds += dt;
      this.model.telemetry.runTimeSeconds += dt;

      this.model.shootTimer = Math.max(0, this.model.shootTimer - dt);
      this.model.secondaryCooldown = Math.max(0, this.model.secondaryCooldown - dt);
      this.model.utilityCooldown = Math.max(0, this.model.utilityCooldown - dt);
      this.model.dashCooldown = Math.max(0, this.model.dashCooldown - dt);

      if (this.input.isDown("Space") && this.model.shootTimer <= 0) {
        const didFire = this.combatSystem.fireBullet();
        if (didFire) this.model.shootTimer = this.getCurrentBulletCooldown();
      }

      this.updateComboTimer(dt);
      this.combatSystem.updateShip(dt);
      this.updateShipResources(dt);
      this.combatSystem.updateBullets(dt);
      this.combatSystem.updateEnemyBullets(dt);
      this.combatSystem.updateAsteroids(dt);
      this.enemySystem.updateUfos(dt);
      this.enemySystem.updateMiniBoss(dt);
      this.updateDotEffects(dt);
      if (this.model.gameState !== GAME_STATE.PLAYING) {
        this.hud.sync(this.model);
        return;
      }
      this.combatSystem.handleBulletAsteroidCollisions();
      this.combatSystem.handleBulletUfoCollisions();
      this.combatSystem.handleBulletMiniBossCollisions();
      this.combatSystem.handleShipThreatCollisions();
      this.combatSystem.updateParticles(dt);
      this.combatSystem.updateUtilityEffects(dt);
      this.missionSystem.updateMission(dt);
      this.model.flashMs = Math.max(0, this.model.flashMs - dt * 1000);

      this.hud.sync(this.model);
    }

    getCurrentFlightProfile() {
      return this.config.ship.flightModel[this.model.flightModel] ?? this.config.ship.flightModel.arcade;
    }

    toggleFlightModel() {
      this.model.flightModel = this.model.flightModel === "arcade" ? "sim_lite" : "arcade";
    }

    initializeShipResources(ship) {
      if (!ship) return;
      ship.hullMax = this.config.ship.baseHull;
      ship.hull = ship.hullMax;
      ship.shieldMax = this.config.ship.baseShield;
      ship.shield = ship.shieldMax;
      ship.energyMax = this.config.ship.baseEnergy;
      ship.energy = ship.energyMax;
      ship.heatMax = this.config.ship.baseHeat;
      ship.heat = 0;
      ship.lastDamageAt = -999;
    }

    updateShipResources(dt) {
      const ship = this.model.ship;
      if (!ship) return;

      const cfg = this.config.ship;
      ship.energy = Math.min(ship.energyMax, ship.energy + cfg.energyRegenPerSecond * dt);
      ship.heat = Math.max(0, ship.heat - cfg.heatDissipationPerSecond * dt);

      const sinceDamage = this.model.runtimeSeconds - ship.lastDamageAt;
      if (sinceDamage >= cfg.shieldRegenDelaySeconds) {
        ship.shield = Math.min(ship.shieldMax, ship.shield + cfg.shieldRegenPerSecond * dt);
      }
    }

    createDamageEvent(profileId, overrides = {}) {
      const baseProfile = this.config.damage.enemyHitProfiles[profileId];
      if (!baseProfile) return null;
      return { ...baseProfile, ...overrides };
    }

    resolveDamage(event, resistProfile = {}) {
      if (!event) return null;

      const resist = this.clamp(resistProfile[event.damageType] ?? 0, 0, 0.9);
      const raw = Math.max(0, event.baseDamage ?? 0);
      const reduced = raw * (1 - resist);
      const critChance = this.clamp(event.critChance ?? 0, 0, 1);
      const isCrit = this.rng() < critChance;
      const critMultiplier = event.critMultiplier ?? this.config.damage.critMultiplier;
      const finalDamage = Math.max(0, reduced * (isCrit ? critMultiplier : 1));

      return {
        damageType: event.damageType,
        damage: finalDamage,
        isCrit
      };
    }

    resolvePlayerDamage(baseDamage, damageType = "kinetic", critChance = this.config.damage.player.critChance) {
      const isCrit = this.rng() < this.clamp(critChance, 0, 1);
      const critMultiplier = this.config.damage.player.critMultiplier ?? this.config.damage.critMultiplier;
      return {
        damageType,
        damage: Math.max(0, baseDamage * (isCrit ? critMultiplier : 1)),
        isCrit
      };
    }

    applyDamageToShip(profileId, overrides = {}) {
      const ship = this.model.ship;
      if (!ship) return false;
      if (!overrides.bypassInvulnerability && ship.invulnMs > 0) return false;

      const event = this.createDamageEvent(profileId, overrides);
      const resolved = this.resolveDamage(event, this.config.damage.shipResist);
      if (!resolved) return false;
      const hasDot = Boolean(event.dotDuration && event.dotDps);
      if (resolved.damage <= 0 && !hasDot) return false;

      if (resolved.damage > 0) {
        ship.lastDamageAt = this.model.runtimeSeconds;
        if (overrides.applyHitInvulnerability !== false) {
          ship.invulnMs = Math.max(ship.invulnMs, this.config.ship.hitInvulnerabilityMs);
        }
        let remaining = resolved.damage;
        const shieldAbsorb = Math.min(ship.shield, remaining);
        ship.shield -= shieldAbsorb;
        remaining -= shieldAbsorb;
        if (remaining > 0) {
          ship.hull = Math.max(0, ship.hull - remaining);
        }

        if (overrides.countAsHit !== false) this.recordPlayerHit();
        this.model.flashMs = Math.max(this.model.flashMs, resolved.isCrit ? 210 : 160);
      }

      if (event.dotDuration && event.dotDps) {
        this.applyDotEffect({
          profileId,
          duration: event.dotDuration,
          dps: event.dotDps
        });
      }

      if (resolved.damage > 0 && ship.hull <= 0) {
        this.handleShipDestroyed();
      }

      return true;
    }

    applyDotEffect(effect) {
      this.model.dotEffects.push({
        profileId: effect.profileId,
        ttl: effect.duration,
        tickTimer: 0,
        dps: effect.dps
      });
    }

    updateDotEffects(dt) {
      const ship = this.model.ship;
      if (!ship) return;

      const tick = this.config.damage.dot.tickSeconds;
      for (let i = this.model.dotEffects.length - 1; i >= 0; i -= 1) {
        const effect = this.model.dotEffects[i];
        if (!effect) continue;
        effect.ttl -= dt;
        effect.tickTimer -= dt;
        if (effect.tickTimer <= 0) {
          effect.tickTimer += tick;
          const damage = effect.dps * tick;
          this.applyDamageToShip(effect.profileId, {
            baseDamage: damage,
            critChance: 0,
            bypassInvulnerability: true,
            applyHitInvulnerability: false,
            countAsHit: false
          });
        }
        if (effect.ttl <= 0) {
          this.model.dotEffects.splice(i, 1);
        }
      }
    }

    handleShipDestroyed() {
      const ship = this.model.ship;
      if (!ship) return;

      this.model.flashMs = Math.max(this.model.flashMs, 220);
      this.emitImpactParticles(ship.x, ship.y, 30, "255,98,121");
      this.model.dotEffects = [];
      this.endGame();
    }

    applyDamageToMiniBoss(baseDamage, damageType = "kinetic", critChance = this.config.damage.player.critChance) {
      const boss = this.model.miniBoss;
      if (!boss) return false;
      const resolved = this.resolvePlayerDamage(baseDamage, damageType, critChance);
      boss.hp -= resolved.damage;
      this.model.flashMs = Math.max(this.model.flashMs, resolved.isCrit ? 95 : 70);
      this.emitImpactParticles(boss.x, boss.y, resolved.isCrit ? 14 : 10, "255,118,188");
      if (boss.hp <= 0) {
        this.destroyMiniBoss();
        return true;
      }
      return false;
    }

    updateComboTimer(dt) {
      if (this.model.comboTimer <= 0) return;
      this.model.comboTimer = Math.max(0, this.model.comboTimer - dt);
      if (this.model.comboTimer <= 0) {
        this.model.comboCount = 0;
        this.model.comboMultiplier = 1;
      }
    }

    bumpCombo() {
      this.model.comboCount += 1;
      this.model.comboTimer = this.config.combo.resetSeconds;
      const rawMultiplier = 1 + (this.model.comboCount - 1) * this.config.combo.multiplierStep;
      this.model.comboMultiplier = Math.min(this.config.combo.maxMultiplier, rawMultiplier);
    }

    registerScore(basePoints, incrementCombo) {
      if (incrementCombo) this.bumpCombo();
      else if (this.model.comboCount > 0) this.model.comboTimer = this.config.combo.resetSeconds;

      const missionType = this.model.currentMission?.type;
      const scoreMissionMult = this.config.mission.rewards.scoreByType[missionType] ?? 1;
      const creditsMissionMult = this.config.mission.rewards.creditsByType[missionType] ?? 1;
      const scored = Math.round(basePoints * this.model.comboMultiplier * scoreMissionMult);
      this.model.score += scored;
      this.model.telemetry.scoreEarned += scored;
      const creditsGain = Math.max(
        this.config.economy.minCreditsPerKill,
        Math.floor(basePoints * this.config.economy.creditsPerScore * creditsMissionMult)
      );
      this.model.credits += creditsGain;
      this.model.telemetry.creditsEarned += creditsGain;
    }

    recordPrimaryShot() {
      this.model.telemetry.shots.primary += 1;
    }

    recordSecondaryUse() {
      this.model.telemetry.shots.secondary += 1;
    }

    recordUtilityUse() {
      this.model.telemetry.shots.utility += 1;
    }

    recordEnemyShot() {
      this.model.telemetry.shots.enemy += 1;
    }

    recordPlayerHit() {
      this.model.telemetry.playerHitsTaken += 1;
    }

    onMissionStarted() {
      const mission = this.model.currentMission;
      if (!mission) return;

      this.model.telemetry.activeMission = {
        wave: this.model.wave,
        type: mission.type,
        label: mission.label,
        startScore: this.model.score,
        startCredits: this.model.credits,
        startRunTimeSeconds: this.model.telemetry.runTimeSeconds,
        asteroidKillsStart: this.model.telemetry.kills.asteroids,
        ufoKillsStart: this.model.telemetry.kills.ufos,
        miniBossKillsStart: this.model.telemetry.kills.miniBosses,
        secondaryUsesStart: this.model.telemetry.shots.secondary,
        utilityUsesStart: this.model.telemetry.shots.utility,
        playerHitsStart: this.model.telemetry.playerHitsTaken
      };
    }

    onMissionCompleted() {
      const active = this.model.telemetry.activeMission;
      if (!active) return;

      this.model.telemetry.completedMissions += 1;
      this.model.telemetry.lastMission = {
        wave: active.wave,
        type: active.type,
        label: active.label,
        durationSeconds: Math.max(0, this.model.telemetry.runTimeSeconds - active.startRunTimeSeconds),
        scoreGained: this.model.score - active.startScore,
        creditsGained: this.model.credits - active.startCredits,
        asteroidKills: this.model.telemetry.kills.asteroids - active.asteroidKillsStart,
        ufoKills: this.model.telemetry.kills.ufos - active.ufoKillsStart,
        miniBossKills: this.model.telemetry.kills.miniBosses - active.miniBossKillsStart,
        secondaryUses: this.model.telemetry.shots.secondary - active.secondaryUsesStart,
        utilityUses: this.model.telemetry.shots.utility - active.utilityUsesStart,
        playerHitsTaken: this.model.telemetry.playerHitsTaken - active.playerHitsStart
      };
      this.model.telemetry.activeMission = null;
    }

    getCurrentBulletCooldown() {
      const primary = this.config.loadout.primary[this.model.loadout.primaryId];
      const factor = Math.pow(this.config.shop.fireRateFactorPerLevel, this.model.upgrades.fireRateLevel);
      const ship = this.model.ship;
      const softThreshold = this.config.ship.overheatSoftThreshold;
      const overheatRatio =
        ship && ship.heat > softThreshold ? (ship.heat - softThreshold) / (ship.heatMax - softThreshold) : 0;
      const heatPenalty = 1 + overheatRatio * (1 / this.config.ship.overheatPenaltyFactor - 1);
      return primary.cooldownSeconds * factor * heatPenalty;
    }

    canFirePrimary() {
      const ship = this.model.ship;
      if (!ship) return false;
      const primary = this.config.loadout.primary[this.model.loadout.primaryId];
      return this.canSpendShipResources(primary.energyCost, primary.heatGain);
    }

    consumePrimaryShotResources() {
      const primary = this.config.loadout.primary[this.model.loadout.primaryId];
      this.spendShipResources(primary.energyCost, primary.heatGain);
    }

    canSpendShipResources(energyCost, heatGain = 0) {
      const ship = this.model.ship;
      if (!ship) return false;
      const hardThreshold = this.config.ship.overheatHardThreshold;
      return ship.energy >= energyCost && ship.heat + heatGain < hardThreshold;
    }

    spendShipResources(energyCost, heatGain = 0) {
      const ship = this.model.ship;
      if (!ship) return;
      ship.energy = Math.max(0, ship.energy - energyCost);
      ship.heat = Math.min(ship.heatMax, ship.heat + heatGain);
    }

    getCurrentMaxBullets() {
      const waveBonus = Math.min(
        this.config.bullet.waveBonusMax,
        Math.floor((this.model.wave - 1) / this.config.bullet.waveBonusEveryWaves)
      );
      return this.config.bullet.maxActive + this.model.upgrades.magazineLevel + waveBonus;
    }

    getSecondarySpec() {
      return this.config.loadout.secondary[this.model.loadout.secondaryId];
    }

    getUtilitySpec() {
      return this.config.loadout.utility[this.model.loadout.utilityId];
    }

    awardNearMiss() {
      this.registerScore(this.config.combo.nearMissBonus, false);
      this.emitImpactParticles(this.model.ship.x, this.model.ship.y, 4, "255,220,140");
    }

    addParticle(x, y, vx, vy, life, radius, color) {
      this.model.particles.push({ x, y, vx, vy, ttl: life, life, radius, color });
    }

    emitThrusterParticle(ship) {
      const baseAngle = ship.angle + Math.PI;
      const spread = (this.rng() - 0.5) * 0.55;
      const angle = baseAngle + spread;
      const speed = 65 + this.rng() * 90;
      const x = ship.x + Math.cos(baseAngle) * ship.radius * 0.9;
      const y = ship.y + Math.sin(baseAngle) * ship.radius * 0.9;
      this.addParticle(
        x,
        y,
        Math.cos(angle) * speed + ship.vx * 0.2,
        Math.sin(angle) * speed + ship.vy * 0.2,
        0.25 + this.rng() * 0.2,
        1.4 + this.rng() * 1.8,
        "255,172,89"
      );
    }

    emitImpactParticles(x, y, count, baseColor) {
      for (let i = 0; i < count; i += 1) {
        const angle = this.rng() * Math.PI * 2;
        const speed = 40 + this.rng() * 220;
        this.addParticle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.25 + this.rng() * 0.55,
          1.2 + this.rng() * 3.2,
          baseColor
        );
      }
    }

    getAsteroidScore(asteroid) {
      const sizeScore = this.asteroidDefs[asteroid.size].score;
      const typeScore = this.asteroidTypes[asteroid.asteroidType]?.scoreBonus ?? 0;
      return sizeScore + typeScore;
    }

    destroyAsteroidByIndex(index, allowBlast) {
      const asteroid = this.model.asteroids[index];
      if (!asteroid) return;

      this.registerScore(this.getAsteroidScore(asteroid), true);
      this.model.telemetry.kills.asteroids += 1;
      this.model.flashMs = Math.max(this.model.flashMs, 80);
      this.emitImpactParticles(asteroid.x, asteroid.y, 16, "89,245,255");
      this.combatSystem.splitAsteroid(asteroid);
      this.model.asteroids.splice(index, 1);
      this.model.missionAsteroidKills += 1;

      if (allowBlast && asteroid.asteroidType === "volatile") {
        this.triggerVolatileBlast(asteroid.x, asteroid.y, asteroid.radius);
      }
    }

    triggerVolatileBlast(x, y, radius) {
      const blastRadius = radius * this.config.asteroid.volatileBlastRadiusFactor;
      this.model.flashMs = Math.max(this.model.flashMs, 120);
      this.emitImpactParticles(x, y, 22, "255,133,100");

      for (let i = this.model.asteroids.length - 1; i >= 0; i -= 1) {
        const target = this.model.asteroids[i];
        const dist = Math.hypot(target.x - x, target.y - y);
        if (dist <= blastRadius + target.radius) {
          this.destroyAsteroidByIndex(i, false);
        }
      }
    }

    destroyUfoByIndex(index) {
      const ufo = this.model.ufos[index];
      if (!ufo) return;
      const ufoScore = ufo.mode === "hunter" ? this.config.ufo.scoreHunter : this.config.ufo.scoreSniper;
      this.registerScore(ufoScore, true);
      this.model.telemetry.kills.ufos += 1;
      this.model.flashMs = Math.max(this.model.flashMs, 130);
      this.emitImpactParticles(ufo.x, ufo.y, 28, "255,91,186");
      this.model.ufos.splice(index, 1);
      this.model.missionUfoKills += 1;
    }

    destroyMiniBoss() {
      if (!this.model.miniBoss) return;
      this.registerScore(this.config.mission.miniBoss.scoreReward, true);
      this.model.telemetry.kills.miniBosses += 1;
      this.emitImpactParticles(this.model.miniBoss.x, this.model.miniBoss.y, 42, "255,114,210");
      this.model.flashMs = Math.max(this.model.flashMs, 230);
      this.model.miniBoss = null;
    }

    consumePlayerProjectileHit(projectileIndex) {
      const projectile = this.model.bullets[projectileIndex];
      if (!projectile) return;
      if (projectile.pierce && projectile.pierce > 0) {
        projectile.pierce -= 1;
        if (projectile.pierce > 0) return;
      }
      this.model.bullets.splice(projectileIndex, 1);
    }

    getSpawnClearance(x, y) {
      const shipRadius = this.config.ship.radius;
      let minClearance = Number.POSITIVE_INFINITY;

      const checkThreat = (tx, ty, threatRadius) => {
        const dist = Math.hypot(x - tx, y - ty);
        const clearance = dist - (shipRadius + threatRadius);
        if (clearance < minClearance) minClearance = clearance;
      };

      for (const asteroid of this.model.asteroids) checkThreat(asteroid.x, asteroid.y, asteroid.radius);
      for (const ufo of this.model.ufos) checkThreat(ufo.x, ufo.y, ufo.radius);
      if (this.model.miniBoss) checkThreat(this.model.miniBoss.x, this.model.miniBoss.y, this.model.miniBoss.radius);
      for (const enemyBullet of this.model.enemyBullets) checkThreat(enemyBullet.x, enemyBullet.y, enemyBullet.radius + 10);
      return minClearance;
    }

    findBestRespawnPoint() {
      const width = this.config.canvas.width;
      const height = this.config.canvas.height;
      const padding = this.config.ship.respawnSafetyPadding;
      const attempts = this.config.ship.respawnMaxAttempts;

      const centerCandidate = { x: width * 0.5, y: height * 0.5 };
      let bestPoint = centerCandidate;
      let bestClearance = this.getSpawnClearance(centerCandidate.x, centerCandidate.y);
      if (bestClearance >= padding) return centerCandidate;

      for (let i = 0; i < attempts; i += 1) {
        const candidate = {
          x: randomRange(this.rng, 56, width - 56),
          y: randomRange(this.rng, 56, height - 56)
        };
        const clearance = this.getSpawnClearance(candidate.x, candidate.y);
        if (clearance >= padding) return candidate;
        if (clearance > bestClearance) {
          bestClearance = clearance;
          bestPoint = candidate;
        }
      }

      return bestPoint;
    }

    respawnShipSafely() {
      const respawn = this.findBestRespawnPoint();
      const ship = createShip(this.config);
      ship.x = respawn.x;
      ship.y = respawn.y;
      this.initializeShipResources(ship);
      this.model.ship = ship;
    }

    render() {
      this.renderer.render(this.model, this.input);
    }

    applyFrameDelta(dt) {
      return clamp(dt, 0, this.config.simulation.maxFrameDeltaSeconds);
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Game = Game;
})();
