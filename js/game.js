(() => {
  const {
    ASTEROID_DEFS,
    ASTEROID_TYPES,
    GAME_CONFIG,
    GAME_STATE,
    circleCollision,
    createAsteroid,
    createBullet,
    createEnemyBullet,
    createShip,
    createUfo,
    spawnAsteroidAwayFromShip,
    wrapPosition,
    createSeededRng,
    generateRunSeed,
    randomRange
  } = window.Asteroids;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
        lives: 3,
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
        waveTimerMs: 0,
        runSeed: null,
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
        }
      };
    }

    initGame() {
      this.canvas.width = this.config.canvas.width;
      this.canvas.height = this.config.canvas.height;
      this.model.ship = createShip(this.config);
      this.model.runSeed = generateRunSeed();
      this.syncLoadoutLabels();
      this.scheduleNextUfoSpawn();
      this.hud.sync(this.model);
    }

    handleMetaInput() {
      if (this.model.gameState === GAME_STATE.SHOP) {
        if (this.input.wasPressed("Digit1")) this.purchaseShopItem(0);
        if (this.input.wasPressed("Digit2")) this.purchaseShopItem(1);
        if (this.input.wasPressed("Digit3")) this.purchaseShopItem(2);
        if (this.input.wasPressed("Digit4")) this.cycleLoadoutSlot("secondary");
        if (this.input.wasPressed("Digit5")) this.cycleLoadoutSlot("utility");
        if (this.input.wasPressed("Digit6")) this.unlockLoadout("secondary", "rail_shot");
        if (this.input.wasPressed("Digit7")) this.unlockLoadout("secondary", "cluster_rockets");
        if (this.input.wasPressed("Digit8")) this.unlockLoadout("utility", "emp_pulse");
        if (this.input.wasPressed("Digit9")) this.unlockLoadout("utility", "shield_dome");

        if (this.input.wasPressed("Enter")) {
          this.beginNextWaveFromShop();
        }
        this.hud.sync(this.model);
        return;
      }

      if (this.input.wasPressed("KeyP")) {
        if (this.model.gameState === GAME_STATE.PLAYING) {
          this.model.gameState = GAME_STATE.PAUSED;
        } else if (this.model.gameState === GAME_STATE.PAUSED) {
          this.model.gameState = GAME_STATE.PLAYING;
        }
        this.hud.sync(this.model);
      }

      if (this.input.wasPressed("Enter")) {
        if (this.model.gameState === GAME_STATE.START) {
          this.startGame(this.model.runSeed ?? generateRunSeed());
        } else if (this.model.gameState === GAME_STATE.GAME_OVER) {
          const nextSeed = generateRunSeed();
          this.startGame(nextSeed);
        }
      }

      if (this.model.gameState === GAME_STATE.PLAYING) {
        if (this.input.wasPressed("KeyX")) {
          this.tryUseSecondary();
        }
        if (this.input.wasPressed("KeyC")) {
          this.tryUseUtility();
        }
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
      this.model.score = 0;
      this.model.credits = 0;
      this.model.lives = 3;
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
      this.model.waveTimerMs = 0;
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
      this.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
      this.model.upgrades.fireRateLevel = 0;
      this.model.upgrades.magazineLevel = 0;
      this.model.loadout.secondaryId = "missile_burst";
      this.model.loadout.utilityId = "pulse_bomb";
      this.model.unlocks.secondary.missile_burst = true;
      this.model.unlocks.secondary.rail_shot = false;
      this.model.unlocks.secondary.cluster_rockets = false;
      this.model.unlocks.utility.pulse_bomb = true;
      this.model.unlocks.utility.emp_pulse = false;
      this.model.unlocks.utility.shield_dome = false;
      this.model.runSeed = seed >>> 0;
      this.rng = createSeededRng(this.model.runSeed);
      this.syncLoadoutLabels();
      this.scheduleNextUfoSpawn();
      this.startMission(this.model.wave);
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

    scheduleNextUfoSpawn() {
      this.model.nextUfoSpawnSeconds = randomRange(
        this.rng,
        this.config.ufo.spawnDelayMinSeconds,
        this.config.ufo.spawnDelayMaxSeconds
      );
    }

    chooseAsteroidTypeForWave(level) {
      const roll = this.rng();
      if (level >= 3 && roll < 0.18) return "volatile";
      if (level >= 2 && roll < 0.38) return "magnetic";
      return "normal";
    }

    spawnAsteroidPack(level, largeCount, mediumCount = 0) {
      const speedScale = 1 + (level - 1) * this.config.wave.speedScaleStep;

      for (let i = 0; i < largeCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForWave(level);
        this.model.asteroids.push(
          spawnAsteroidAwayFromShip(
            "large",
            speedScale,
            asteroidType,
            this.model,
            this.rng,
            this.config,
            this.asteroidDefs
          )
        );
      }

      for (let i = 0; i < mediumCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForWave(level);
        this.model.asteroids.push(
          spawnAsteroidAwayFromShip(
            "medium",
            speedScale * 1.12,
            asteroidType,
            this.model,
            this.rng,
            this.config,
            this.asteroidDefs
          )
        );
      }

    }

    getMissionTypeByIndex(missionIndex) {
      const order = this.config.mission.order;
      return order[(missionIndex - 1) % order.length];
    }

    startMission(missionIndex) {
      const type = this.getMissionTypeByIndex(missionIndex);
      this.model.currentMission = {
        type,
        label: type.toUpperCase(),
        objectiveText: "",
        completed: false
      };
      this.model.missionTimer = 0;
      this.model.missionSpawnTimer = 0;
      this.model.missionSpawnBudget = 0;
      this.model.missionUfoKills = 0;
      this.model.missionAsteroidKills = 0;
      this.model.waveCompletionHandled = false;
      this.model.bullets = [];
      this.model.enemyBullets = [];
      this.model.ufos = [];
      this.model.asteroids = [];
      this.model.miniBoss = null;
      this.model.utilityEffects = [];

      const missionCfg = this.config.mission;
      const level = this.model.wave;

      if (type === "survive") {
        this.model.missionTimer =
          missionCfg.survive.baseDurationSeconds + (level - 1) * missionCfg.survive.durationStepSeconds;
        this.model.missionSpawnTimer = 0.1;
        this.scheduleNextUfoSpawn();
        this.model.currentMission.label = "SURVIVE";
        this.model.currentMission.objectiveText = `Hold for ${this.model.missionTimer.toFixed(0)}s`;
      }

      if (type === "ufo_hunt") {
        this.model.missionSpawnBudget = missionCfg.ufoHunt.baseKills + Math.floor((level - 1) / 2) * missionCfg.ufoHunt.killStep;
        this.model.missionSpawnTimer = 0.2;
        this.model.currentMission.label = "UFO HUNT";
        this.model.currentMission.objectiveText = `Destroy UFOs: 0/${this.model.missionSpawnBudget}`;
      }

      if (type === "asteroid_storm") {
        this.model.missionSpawnBudget =
          missionCfg.asteroidStorm.baseTarget + (level - 1) * missionCfg.asteroidStorm.targetStep;
        this.model.currentMission.label = "ASTEROID STORM";
        this.model.currentMission.objectiveText = `Break asteroids: 0/${this.model.missionSpawnBudget}`;
        this.spawnAsteroidPack(
          level,
          missionCfg.asteroidStorm.initialLargeCount,
          missionCfg.asteroidStorm.initialMediumCount
        );
        this.model.missionSpawnTimer = missionCfg.asteroidStorm.extraSpawnIntervalSeconds;
      }

      if (type === "mini_boss") {
        const hp = missionCfg.miniBoss.hpBase + (level - 1) * missionCfg.miniBoss.hpStep;
        this.model.currentMission.label = "MINI BOSS";
        this.model.currentMission.objectiveText = `Destroy boss (${hp} HP)`;
        this.spawnMiniBoss(hp);
        this.spawnAsteroidPack(level, 2, 2);
      }
    }
    }

    fireBullet() {
      if (!this.model.ship) return false;
      if (this.model.bullets.length >= this.getCurrentMaxBullets()) return false;

      this.model.bullets.push(createBullet(this.model.ship, this.config));
      return true;
    }

    update(dt) {
      if (this.model.gameState !== GAME_STATE.PLAYING) {
        return;
      }

      const m = this.model;
      const c = this.config;

      m.shootTimer = Math.max(0, m.shootTimer - dt);
      m.secondaryCooldown = Math.max(0, m.secondaryCooldown - dt);
      m.utilityCooldown = Math.max(0, m.utilityCooldown - dt);
      if (this.input.isDown("Space") && m.shootTimer <= 0) {
        const didFire = this.fireBullet();
        if (didFire) m.shootTimer = this.getCurrentBulletCooldown();
      }

      this.updateComboTimer(dt);
      this.updateShip(dt);
      this.updateBullets(dt);
      this.updateEnemyBullets(dt);
      this.updateAsteroids(dt);
      this.updateUfos(dt);
      this.updateMiniBoss(dt);
      this.handleBulletAsteroidCollisions();
      this.handleBulletUfoCollisions();
      this.handleBulletMiniBossCollisions();
      this.handleShipThreatCollisions();
      this.updateParticles(dt);
      this.updateUtilityEffects(dt);
      this.updateMission(dt);
      this.model.flashMs = Math.max(0, this.model.flashMs - dt * 1000);

      this.hud.sync(m);
    }

    updateComboTimer(dt) {
      if (this.model.comboTimer <= 0) {
        return;
      }

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
      if (incrementCombo) {
        this.bumpCombo();
      } else if (this.model.comboCount > 0) {
        this.model.comboTimer = this.config.combo.resetSeconds;
      }

      const scored = Math.round(basePoints * this.model.comboMultiplier);
      this.model.score += scored;
      const creditsGain = Math.max(
        this.config.economy.minCreditsPerKill,
        Math.floor(basePoints * this.config.economy.creditsPerScore)
      );
      this.model.credits += creditsGain;
    }

    getCurrentBulletCooldown() {
      const primary = this.config.loadout.primary[this.model.loadout.primaryId];
      const fireRateLevel = this.model.upgrades.fireRateLevel;
      const factor = Math.pow(this.config.shop.fireRateFactorPerLevel, fireRateLevel);
      return primary.cooldownSeconds * factor;
    }

    getCurrentMaxBullets() {
      return this.config.bullet.maxActive + this.model.upgrades.magazineLevel;
    }

    getSecondarySpec() {
      return this.config.loadout.secondary[this.model.loadout.secondaryId];
    }

    getUtilitySpec() {
      return this.config.loadout.utility[this.model.loadout.utilityId];
    }

    tryUseSecondary() {
      if (this.model.secondaryCooldown > 0 || !this.model.ship) {
        return;
      }

      const ship = this.model.ship;
      const spec = this.getSecondarySpec();
      if (spec.kind === "rail") {
        const dirX = Math.cos(ship.angle);
        const dirY = Math.sin(ship.angle);
        this.model.bullets.push({
          x: ship.x + dirX * (ship.radius + 12),
          y: ship.y + dirY * (ship.radius + 12),
          vx: dirX * spec.projectileSpeed + ship.vx * 0.15,
          vy: dirY * spec.projectileSpeed + ship.vy * 0.15,
          radius: spec.radius,
          ttl: spec.ttlSeconds,
          kind: "secondary_rail",
          pierce: spec.pierce
        });
      } else {
        for (let i = 0; i < spec.count; i += 1) {
          const t = spec.count === 1 ? 0 : i / (spec.count - 1) - 0.5;
          const angle = ship.angle + t * spec.spread;
          const dirX = Math.cos(angle);
          const dirY = Math.sin(angle);
          this.model.bullets.push({
            x: ship.x + dirX * (ship.radius + 10),
            y: ship.y + dirY * (ship.radius + 10),
            vx: dirX * spec.projectileSpeed + ship.vx * 0.2,
            vy: dirY * spec.projectileSpeed + ship.vy * 0.2,
            radius: spec.radius,
            ttl: spec.ttlSeconds,
            kind: spec.kind === "cluster" ? "secondary_cluster" : "secondary",
            pierce: 0
          });
        }
      }

      this.model.secondaryCooldown = spec.cooldownSeconds;
      this.emitImpactParticles(ship.x, ship.y, 6, "255,198,132");
    }

    tryUseUtility() {
      if (this.model.utilityCooldown > 0 || !this.model.ship) {
        return;
      }

      const ship = this.model.ship;
      const spec = this.getUtilitySpec();
      this.model.utilityCooldown = spec.cooldownSeconds;
      this.model.flashMs = Math.max(this.model.flashMs, spec.flashMs);

      if (spec.kind === "pulse") {
        const pulseRadius = spec.pulseRadius;
        this.model.utilityEffects.push({
          type: "pulse",
          x: ship.x,
          y: ship.y,
          radius: 0,
          maxRadius: pulseRadius,
          life: 0.45,
          ttl: 0.45
        });

        for (let i = this.model.enemyBullets.length - 1; i >= 0; i -= 1) {
          const bullet = this.model.enemyBullets[i];
          if (Math.hypot(bullet.x - ship.x, bullet.y - ship.y) <= pulseRadius) {
            this.model.enemyBullets.splice(i, 1);
          }
        }

        for (let i = this.model.ufos.length - 1; i >= 0; i -= 1) {
          const ufo = this.model.ufos[i];
          if (Math.hypot(ufo.x - ship.x, ufo.y - ship.y) <= pulseRadius + ufo.radius) {
            this.destroyUfoByIndex(i);
          }
        }

        for (let i = this.model.asteroids.length - 1; i >= 0; i -= 1) {
          const asteroid = this.model.asteroids[i];
          if (Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y) <= pulseRadius + asteroid.radius) {
            this.destroyAsteroidByIndex(i, true);
          }
        }

        if (this.model.miniBoss) {
          const bossDist = Math.hypot(this.model.miniBoss.x - ship.x, this.model.miniBoss.y - ship.y);
          if (bossDist <= pulseRadius + this.model.miniBoss.radius) {
            this.model.miniBoss.hp -= 95;
            this.emitImpactParticles(this.model.miniBoss.x, this.model.miniBoss.y, 20, "255,120,201");
            if (this.model.miniBoss.hp <= 0) {
              this.destroyMiniBoss();
            }
          }
        }
      }

      if (spec.kind === "emp") {
        for (const ufo of this.model.ufos) {
          ufo.disabledTimer = Math.max(ufo.disabledTimer, spec.disableSeconds);
        }
        if (this.model.miniBoss) {
          this.model.miniBoss.shootTimer = Math.max(this.model.miniBoss.shootTimer, spec.disableSeconds);
        }
        this.model.enemyBullets = [];
        this.model.utilityEffects.push({
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
        this.model.utilityEffects.push({
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

      this.emitImpactParticles(ship.x, ship.y, spec.particleCount, "125,232,255");
    }

    beginNextWaveFromShop() {
      this.model.wave += 1;
      this.model.waveTimerMs = 0;
      this.model.waveCompletionHandled = false;
      this.model.gameState = GAME_STATE.PLAYING;
      this.startMission(this.model.wave);
      this.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    enterShopPhase() {
      this.model.gameState = GAME_STATE.SHOP;
      this.model.waveCompletionHandled = true;
      this.model.waveTimerMs = 0;
      this.model.comboCount = 0;
      this.model.comboMultiplier = 1;
      this.model.comboTimer = 0;
      this.model.ufos = [];
      this.model.miniBoss = null;
      this.model.enemyBullets = [];
      this.model.bullets = [];
      this.model.utilityEffects = [];
      this.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    purchaseShopItem(index) {
      const item = this.config.shop.items[index];
      if (!item) {
        return;
      }

      if (this.model.credits < item.cost) {
        this.model.shop.message = "Nedostatek credits.";
        return;
      }

      if (item.id === "repair" && this.model.lives >= this.config.shop.maxLives) {
        this.model.shop.message = "Mas plne zivoty.";
        return;
      }
      if (
        item.id === "fire_rate" &&
        this.model.upgrades.fireRateLevel >= this.config.shop.maxFireRateLevel
      ) {
        this.model.shop.message = "Fire rate je na maximu.";
        return;
      }
      if (
        item.id === "magazine" &&
        this.model.upgrades.magazineLevel >= this.config.shop.maxMagazineLevel
      ) {
        this.model.shop.message = "Magazine je na maximu.";
        return;
      }

      this.model.credits -= item.cost;

      if (item.id === "repair") {
        this.model.lives += 1;
      } else if (item.id === "fire_rate") {
        this.model.upgrades.fireRateLevel += 1;
      } else if (item.id === "magazine") {
        this.model.upgrades.magazineLevel += 1;
      }

      this.model.shop.message = `Nakoupeno: ${item.title}`;
    }

    cycleLoadoutSlot(slotName) {
      const unlockedMap = this.model.unlocks[slotName];
      const currentIdKey = slotName === "secondary" ? "secondaryId" : "utilityId";
      const unlockedIds = Object.keys(unlockedMap).filter((id) => unlockedMap[id]);
      if (unlockedIds.length === 0) {
        this.model.shop.message = "Neni odemcena zadna varianta.";
        return;
      }

      const current = this.model.loadout[currentIdKey];
      const idx = unlockedIds.indexOf(current);
      const next = unlockedIds[(idx + 1 + unlockedIds.length) % unlockedIds.length];
      this.model.loadout[currentIdKey] = next;
      this.syncLoadoutLabels();
      const label = slotName === "secondary" ? this.model.loadout.secondaryLabel : this.model.loadout.utilityLabel;
      this.model.shop.message = `Aktivni ${slotName}: ${label}`;
    }

    unlockLoadout(slotName, loadoutId) {
      const unlockSet = this.model.unlocks[slotName];
      if (!unlockSet || !(loadoutId in unlockSet)) {
        return;
      }

      if (unlockSet[loadoutId]) {
        this.model.shop.message = "Uz odemceno.";
        return;
      }

      const cost = this.config.shop.unlockCosts[loadoutId] ?? 0;
      if (this.model.credits < cost) {
        this.model.shop.message = "Nedostatek credits pro unlock.";
        return;
      }

      this.model.credits -= cost;
      unlockSet[loadoutId] = true;

      if (slotName === "secondary") {
        this.model.loadout.secondaryId = loadoutId;
      } else {
        this.model.loadout.utilityId = loadoutId;
      }
      this.syncLoadoutLabels();
      const label =
        slotName === "secondary"
          ? this.config.loadout.secondary[loadoutId].label
          : this.config.loadout.utility[loadoutId].label;
      this.model.shop.message = `Odemceno: ${label}`;
    }

    awardNearMiss() {
      this.registerScore(this.config.combo.nearMissBonus, false);
      this.emitImpactParticles(this.model.ship.x, this.model.ship.y, 4, "255,220,140");
    }

    updateShip(dt) {
      const ship = this.model.ship;
      if (!ship) return;

      const c = this.config;
      let turnInput = 0;
      if (this.input.isDown("ArrowLeft")) turnInput -= 1;
      if (this.input.isDown("ArrowRight")) turnInput += 1;

      if (turnInput !== 0) {
        ship.angularVelocity += turnInput * c.ship.rotationAcceleration * dt;
      }
      ship.angularVelocity *= c.ship.rotationDamping;
      ship.angularVelocity = clamp(
        ship.angularVelocity,
        -c.ship.rotationSpeed,
        c.ship.rotationSpeed
      );
      ship.angle += ship.angularVelocity * dt;

      if (this.input.isDown("ArrowUp")) {
        ship.vx += Math.cos(ship.angle) * c.ship.thrust * dt;
        ship.vy += Math.sin(ship.angle) * c.ship.thrust * dt;
        this.emitThrusterParticle(ship);
      }

      ship.vx *= c.ship.friction;
      ship.vy *= c.ship.friction;

      const speed = Math.hypot(ship.vx, ship.vy);
      if (speed > c.ship.maxSpeed) {
        const factor = c.ship.maxSpeed / speed;
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
      const c = this.config;
      const bullets = this.model.bullets;

      for (let i = bullets.length - 1; i >= 0; i -= 1) {
        const bullet = bullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.ttl -= dt;
        wrapPosition(bullet, c.canvas.width, c.canvas.height);
        if (bullet.ttl <= 0) bullets.splice(i, 1);
      }
    }

    updateEnemyBullets(dt) {
      const c = this.config;
      const bullets = this.model.enemyBullets;

      for (let i = bullets.length - 1; i >= 0; i -= 1) {
        const bullet = bullets[i];
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        bullet.ttl -= dt;
        wrapPosition(bullet, c.canvas.width, c.canvas.height);
        if (bullet.ttl <= 0) bullets.splice(i, 1);
      }
    }

    updateAsteroids(dt) {
      const c = this.config;
      const ship = this.model.ship;

      for (const asteroid of this.model.asteroids) {
        asteroid.x += asteroid.vx * dt;
        asteroid.y += asteroid.vy * dt;
        asteroid.rotation += asteroid.spin * dt;
        wrapPosition(asteroid, c.canvas.width, c.canvas.height);

        asteroid.nearMissCooldown = Math.max(0, asteroid.nearMissCooldown - dt);

        if (ship && asteroid.asteroidType === "magnetic") {
          const dx = asteroid.x - ship.x;
          const dy = asteroid.y - ship.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1 && dist < c.asteroid.magneticRange) {
            const pull = (1 - dist / c.asteroid.magneticRange) * c.asteroid.magneticForce * dt;
            ship.vx += (dx / dist) * pull;
            ship.vy += (dy / dist) * pull;
          }
        }

        if (ship && asteroid.nearMissCooldown <= 0) {
          const dist = Math.hypot(asteroid.x - ship.x, asteroid.y - ship.y);
          const collisionDist = asteroid.radius + ship.radius;
          const nearDist = collisionDist + c.combo.nearMissDistance;
          if (dist > collisionDist && dist < nearDist) {
            asteroid.nearMissCooldown = c.combo.nearMissCooldownSeconds;
            this.awardNearMiss();
          }
        }
      }
    }

    spawnMissionUfo() {
      const mode = this.rng() < 0.58 ? "hunter" : "sniper";
      const x = this.rng() < 0.5 ? -28 : this.config.canvas.width + 28;
      const y = randomRange(this.rng, 90, this.config.canvas.height - 90);
      this.model.ufos.push(createUfo(mode, x, y, this.config));
    }

    maybeSpawnAmbientUfo(dt) {
      if (this.model.ufos.length > 0) return;
      this.model.nextUfoSpawnSeconds -= dt;
      if (this.model.nextUfoSpawnSeconds > 0) return;
      this.spawnMissionUfo();
      this.scheduleNextUfoSpawn();
    }

    updateUfos(dt) {
      const ship = this.model.ship;
      const c = this.config;

      for (const ufo of this.model.ufos) {
        if (!ship) continue;

        const dx = ship.x - ufo.x;
        const dy = ship.y - ufo.y;
        const dist = Math.max(1, Math.hypot(dx, dy));

        if (ufo.mode === "hunter") {
          const speed = c.ufo.speedHunter;
          ufo.vx = (dx / dist) * speed;
          ufo.vy = (dy / dist) * speed;
        } else {
          const desired = c.ufo.desiredSniperDistance;
          const distanceError = dist - desired;
          const normalX = dx / dist;
          const normalY = dy / dist;
          const tangentX = -normalY;
          const tangentY = normalX;
          const radial = clamp(distanceError * 0.65, -c.ufo.speedSniper, c.ufo.speedSniper);
          const tangential = c.ufo.speedSniper * 0.72;
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
              ? c.enemyBullet.cooldownHunterSeconds
              : c.enemyBullet.cooldownSniperSeconds;
        }
      }
    }

    fireEnemyBullet(ufo, ship) {
      const dx = ship.x - ufo.x;
      const dy = ship.y - ufo.y;
      const baseAngle = Math.atan2(dy, dx);
      const spread =
        ufo.mode === "hunter"
          ? this.config.enemyBullet.spreadHunter
          : this.config.enemyBullet.spreadSniper;
      const shotAngle = baseAngle + (this.rng() - 0.5) * spread;
      const muzzleX = ufo.x + Math.cos(shotAngle) * (ufo.radius + 4);
      const muzzleY = ufo.y + Math.sin(shotAngle) * (ufo.radius + 4);
      this.model.enemyBullets.push(createEnemyBullet(muzzleX, muzzleY, shotAngle, this.config));
      this.emitImpactParticles(muzzleX, muzzleY, 2, "255,123,196");
    }

    updateParticles(dt) {
      const particles = this.model.particles;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.ttl -= dt;
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
    }

    updateUtilityEffects(dt) {
      for (let i = this.model.utilityEffects.length - 1; i >= 0; i -= 1) {
        const effect = this.model.utilityEffects[i];
        if (effect.followShip && this.model.ship) {
          effect.x = this.model.ship.x;
          effect.y = this.model.ship.y;
        }
        effect.life -= dt;
        const t = 1 - Math.max(0, effect.life / effect.ttl);
        effect.radius = effect.type === "shield" ? effect.maxRadius - Math.sin(t * Math.PI) * 6 : effect.maxRadius * t;
        if (effect.life <= 0) {
          this.model.utilityEffects.splice(i, 1);
        }
      }
    }

    addParticle(x, y, vx, vy, life, radius, color) {
      this.model.particles.push({
        x,
        y,
        vx,
        vy,
        ttl: life,
        life,
        radius,
        color
      });
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
      const asteroids = this.model.asteroids;
      const asteroid = asteroids[index];
      if (!asteroid) return;

      this.registerScore(this.getAsteroidScore(asteroid), true);
      this.model.flashMs = Math.max(this.model.flashMs, 80);
      this.emitImpactParticles(asteroid.x, asteroid.y, 16, "89,245,255");
      this.splitAsteroid(asteroid);
      asteroids.splice(index, 1);
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

    handleBulletAsteroidCollisions() {
      const bullets = this.model.bullets;
      const asteroids = this.model.asteroids;

      for (let b = bullets.length - 1; b >= 0; b -= 1) {
        const bullet = bullets[b];
        let hitIndex = -1;

        for (let a = asteroids.length - 1; a >= 0; a -= 1) {
          if (circleCollision(bullet, asteroids[a])) {
            hitIndex = a;
            break;
          }
        }

        if (hitIndex === -1) continue;

        this.destroyAsteroidByIndex(hitIndex, true);
        this.consumePlayerProjectileHit(b);
      }
    }

    splitAsteroid(asteroid) {
      const nextSize = this.asteroidDefs[asteroid.size].next;
      if (!nextSize) return;

      const speedScale = 1 + this.model.wave * this.config.wave.splitScalePerWave;
      const childType = asteroid.asteroidType === "volatile" ? "normal" : asteroid.asteroidType;

      for (let i = 0; i < this.config.asteroid.splitCount; i += 1) {
        const child = createAsteroid(
          nextSize,
          asteroid.x,
          asteroid.y,
          speedScale,
          this.rng,
          this.config,
          this.asteroidDefs,
          childType
        );
        child.vx += asteroid.vx * this.config.asteroid.splitVelocityInheritFactor;
        child.vy += asteroid.vy * this.config.asteroid.splitVelocityInheritFactor;
        this.model.asteroids.push(child);
      }
    }

    handleBulletUfoCollisions() {
      const bullets = this.model.bullets;
      const ufos = this.model.ufos;

      for (let b = bullets.length - 1; b >= 0; b -= 1) {
        let hitIndex = -1;
        for (let u = ufos.length - 1; u >= 0; u -= 1) {
          if (circleCollision(bullets[b], ufos[u])) {
            hitIndex = u;
            break;
          }
        }

        if (hitIndex === -1) continue;
        this.destroyUfoByIndex(hitIndex);
        this.consumePlayerProjectileHit(b);
      }
    }

    destroyUfoByIndex(index) {
      const ufo = this.model.ufos[index];
      if (!ufo) return;
      const ufoScore = ufo.mode === "hunter" ? this.config.ufo.scoreHunter : this.config.ufo.scoreSniper;
      this.registerScore(ufoScore, true);
      this.model.flashMs = Math.max(this.model.flashMs, 130);
      this.emitImpactParticles(ufo.x, ufo.y, 28, "255,91,186");
      this.model.ufos.splice(index, 1);
      this.model.missionUfoKills += 1;
    }

    consumePlayerProjectileHit(projectileIndex) {
      const projectile = this.model.bullets[projectileIndex];
      if (!projectile) return;

      if (projectile.pierce && projectile.pierce > 0) {
        projectile.pierce -= 1;
        if (projectile.pierce > 0) {
          return;
        }
      }

      this.model.bullets.splice(projectileIndex, 1);
    }

    handleShipThreatCollisions() {
      const ship = this.model.ship;
      if (!ship || ship.invulnMs > 0) return;

      for (const asteroid of this.model.asteroids) {
        if (circleCollision(ship, asteroid)) {
          this.hitShip();
          return;
        }
      }

      for (const ufo of this.model.ufos) {
        if (circleCollision(ship, ufo)) {
          this.hitShip();
          return;
        }
      }

      if (this.model.miniBoss && circleCollision(ship, this.model.miniBoss)) {
        this.hitShip();
        return;
      }

      for (let i = this.model.enemyBullets.length - 1; i >= 0; i -= 1) {
        if (circleCollision(ship, this.model.enemyBullets[i])) {
          this.model.enemyBullets.splice(i, 1);
          this.hitShip();
          return;
        }
      }
    }

    hitShip() {
      const ship = this.model.ship;
      this.model.lives -= 1;
      this.model.flashMs = Math.max(this.model.flashMs, 180);
      this.emitImpactParticles(ship.x, ship.y, 30, "255,98,121");

      if (this.model.lives <= 0) {
        this.endGame();
      } else {
        this.respawnShipSafely();
      }
    }

    getSpawnClearance(x, y) {
      const shipRadius = this.config.ship.radius;
      let minClearance = Number.POSITIVE_INFINITY;

      const checkThreat = (tx, ty, threatRadius) => {
        const dist = Math.hypot(x - tx, y - ty);
        const clearance = dist - (shipRadius + threatRadius);
        if (clearance < minClearance) {
          minClearance = clearance;
        }
      };

      for (const asteroid of this.model.asteroids) {
        checkThreat(asteroid.x, asteroid.y, asteroid.radius);
      }

      for (const ufo of this.model.ufos) {
        checkThreat(ufo.x, ufo.y, ufo.radius);
      }

      if (this.model.miniBoss) {
        checkThreat(this.model.miniBoss.x, this.model.miniBoss.y, this.model.miniBoss.radius);
      }

      for (const enemyBullet of this.model.enemyBullets) {
        checkThreat(enemyBullet.x, enemyBullet.y, enemyBullet.radius + 10);
      }

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

      if (bestClearance >= padding) {
        return centerCandidate;
      }

      for (let i = 0; i < attempts; i += 1) {
        const candidate = {
          x: randomRange(this.rng, 56, width - 56),
          y: randomRange(this.rng, 56, height - 56)
        };
        const clearance = this.getSpawnClearance(candidate.x, candidate.y);
        if (clearance >= padding) {
          return candidate;
        }

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
      this.model.ship = ship;
    }

    spawnMiniBoss(hp) {
      this.model.miniBoss = {
        x: this.config.canvas.width * 0.5,
        y: 120,
        radius: this.config.mission.miniBoss.radius,
        hp,
        maxHp: hp,
        phase: 0,
        shootTimer: 0
      };
    }

    updateMiniBoss(dt) {
      const boss = this.model.miniBoss;
      const ship = this.model.ship;
      if (!boss || !ship) return;

      const cfg = this.config.mission.miniBoss;
      boss.phase += dt;
      boss.x = this.config.canvas.width * 0.5 + Math.sin(boss.phase * 0.8) * 260;
      boss.y = 120 + Math.sin(boss.phase * 1.4) * 36;

      boss.shootTimer = Math.max(0, boss.shootTimer - dt);
      if (boss.shootTimer <= 0) {
        const dx = ship.x - boss.x;
        const dy = ship.y - boss.y;
        const aim = Math.atan2(dy, dx);
        this.model.enemyBullets.push(
          createEnemyBullet(boss.x, boss.y, aim + (this.rng() - 0.5) * 0.14, this.config)
        );
        boss.shootTimer = cfg.shootCooldownSeconds;
      }
    }

    handleBulletMiniBossCollisions() {
      const boss = this.model.miniBoss;
      if (!boss) return;

      const bullets = this.model.bullets;
      for (let b = bullets.length - 1; b >= 0; b -= 1) {
        if (!circleCollision(bullets[b], boss)) continue;

        const damage = bullets[b].kind === "secondary_rail" ? 45 : 28;
        boss.hp -= damage;
        this.model.flashMs = Math.max(this.model.flashMs, 70);
        this.emitImpactParticles(boss.x, boss.y, 10, "255,118,188");
        this.consumePlayerProjectileHit(b);

        if (boss.hp <= 0) {
          this.destroyMiniBoss();
          return;
        }
      }
    }

    destroyMiniBoss() {
      if (!this.model.miniBoss) return;
      this.registerScore(this.config.mission.miniBoss.scoreReward, true);
      this.emitImpactParticles(this.model.miniBoss.x, this.model.miniBoss.y, 42, "255,114,210");
      this.model.flashMs = Math.max(this.model.flashMs, 230);
      this.model.miniBoss = null;
    }

    updateMission(dt) {
      if (this.model.gameState !== GAME_STATE.PLAYING || !this.model.currentMission) {
        return;
      }

      const mission = this.model.currentMission;
      const type = mission.type;
      const threatsRemaining =
        this.model.asteroids.length + this.model.ufos.length + this.model.enemyBullets.length + (this.model.miniBoss ? 1 : 0);

      if (mission.completed) {
        if (this.model.waveCompletionHandled) {
          this.model.waveTimerMs += dt * 1000;
          if (this.model.waveTimerMs >= this.config.wave.graceMs) {
            this.enterShopPhase();
          }
        }
        return;
      }

      if (type === "survive") {
        this.model.missionTimer = Math.max(0, this.model.missionTimer - dt);
        this.model.missionSpawnTimer -= dt;
        if (this.model.missionSpawnTimer <= 0 && this.model.missionTimer > 0) {
          this.spawnAsteroidPack(this.model.wave, 1, 0);
          this.model.missionSpawnTimer = this.config.mission.survive.asteroidSpawnIntervalSeconds;
        }
        this.maybeSpawnAmbientUfo(dt);
        mission.objectiveText = `Hold for ${this.model.missionTimer.toFixed(1)}s`;
        if (this.model.missionTimer <= 0 && threatsRemaining === 0) {
          mission.completed = true;
        }
      }

      if (type === "ufo_hunt") {
        this.model.missionSpawnTimer -= dt;
        const target = this.model.missionSpawnBudget;
        const remainingKills = target - this.model.missionUfoKills;
        const desiredConcurrent = Math.min(this.config.mission.ufoHunt.maxConcurrentUfos, remainingKills);
        if (remainingKills > 0 && this.model.ufos.length < desiredConcurrent && this.model.missionSpawnTimer <= 0) {
          this.spawnMissionUfo();
          this.model.missionSpawnTimer = this.config.mission.ufoHunt.spawnIntervalSeconds;
        }
        mission.objectiveText = `Destroy UFOs: ${this.model.missionUfoKills}/${target}`;
        if (this.model.missionUfoKills >= target && threatsRemaining === 0) {
          mission.completed = true;
        }
      }

      if (type === "asteroid_storm") {
        this.model.missionSpawnTimer -= dt;
        const target = this.model.missionSpawnBudget;
        if (this.model.missionAsteroidKills < target && this.model.missionSpawnTimer <= 0) {
          this.spawnAsteroidPack(this.model.wave, 1, this.rng() < 0.5 ? 1 : 0);
          this.model.missionSpawnTimer = this.config.mission.asteroidStorm.extraSpawnIntervalSeconds;
        }
        mission.objectiveText = `Break asteroids: ${this.model.missionAsteroidKills}/${target}`;
        if (this.model.missionAsteroidKills >= target && threatsRemaining === 0) {
          mission.completed = true;
        }
      }

      if (type === "mini_boss") {
        const boss = this.model.miniBoss;
        mission.objectiveText = boss
          ? `Destroy boss HP ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}`
          : "Destroy boss";
        if (!boss && threatsRemaining === 0) {
          mission.completed = true;
        }
      }

      if (mission.completed && !this.model.waveCompletionHandled) {
        this.model.waveCompletionHandled = true;
        this.model.waveTimerMs = 0;
      }
    }

    render() {
      this.renderer.render(this.model, this.input);
    }

    applyFrameDelta(dt) {
      const maxDelta = this.config.simulation.maxFrameDeltaSeconds;
      return clamp(dt, 0, maxDelta);
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Game = Game;
})();
