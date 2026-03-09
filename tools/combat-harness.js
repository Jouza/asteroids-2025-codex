#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function createStorageMock() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function createWindow(sharedStorage) {
  return {
    Asteroids: {},
    localStorage: sharedStorage,
    addEventListener() {},
    removeEventListener() {}
  };
}

function loadScriptIntoContext(context, relPath) {
  const fullPath = path.join(ROOT, relPath);
  const code = fs.readFileSync(fullPath, "utf8");
  vm.runInContext(code, context, { filename: relPath });
}

function createRuntime(sharedStorage) {
  const window = createWindow(sharedStorage);
  const context = vm.createContext({
    window,
    console,
    Math,
    Date,
    setTimeout,
    clearTimeout,
    crypto: undefined
  });

  const scripts = [
    "js/version.js",
    "js/content-data.js",
    "js/balance-data.js",
    "js/balance-presets.js",
    "js/i18n.js",
    "js/config.js",
    "js/rng.js",
    "js/entities.js",
    "js/input.js",
    "js/systems/enemy-system.js",
    "js/systems/mission-system.js",
    "js/systems/hangar-system.js",
    "js/systems/combat-system.js",
    "js/game.js"
  ];

  for (const script of scripts) {
    loadScriptIntoContext(context, script);
  }

  return window.Asteroids;
}

function createGame(Asteroids) {
  const canvas = { width: 0, height: 0 };
  const renderer = { render() {} };
  const hud = { sync() {} };
  const input = {
    isDown() {
      return false;
    },
    wasPressed() {
      return false;
    },
    reset() {},
    endFrame() {}
  };
  const game = new Asteroids.Game(canvas, renderer, hud, input, Asteroids.GAME_CONFIG);
  game.initGame();
  return game;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runTests() {
  const sharedStorage = createStorageMock();
  const AsteroidsA = createRuntime(sharedStorage);
  let gameA = createGame(AsteroidsA);

  const tests = [];

  tests.push(() => {
    gameA.model.upgrades.fireRateLevel = 3;
    gameA.model.loadout.primaryId = "rail_lance";
    gameA.model.salvageParts = 17;
    gameA.model.factions.helix_union = 9;
    gameA.model.factions.drift_cartel = -4;
    gameA.model.inventory = [gameA.createModuleDrop()];
    gameA.saveProfile("harness_profile_roundtrip");

    const AsteroidsB = createRuntime(sharedStorage);
    const gameB = createGame(AsteroidsB);
    assert(gameB.model.upgrades.fireRateLevel === 3, "Profile did not persist fireRateLevel");
    assert(gameB.model.loadout.primaryId === "rail_lance", "Profile did not persist primary loadout");
    assert(gameB.model.salvageParts === 17, "Profile did not persist salvage parts");
    assert(gameB.model.factions.helix_union === 9, "Profile did not persist HELIX UNION reputation");
    assert(gameB.model.factions.drift_cartel === -4, "Profile did not persist DRIFT CARTEL reputation");
    assert(gameB.model.inventory.length >= 1, "Profile did not persist inventory");
  });

  tests.push(() => {
    const profile = gameA.getDefaultProfile();
    profile.progression.identity = {
      pilotId: "legacy_unknown_pilot",
      shipId: "legacy_unknown_ship"
    };
    sharedStorage.setItem("starfang_profile_v1", JSON.stringify(profile));

    const AsteroidsB = createRuntime(sharedStorage);
    const gameB = createGame(AsteroidsB);
    assert(gameB.model.identity.pilotId === "buzz_calder", "Invalid pilot id should migrate to supported default");
    assert(gameB.model.identity.shipId === "viper_mk2", "Invalid ship id should migrate to supported default");
    assert(
      gameB.model.hangar.message === "game.identity.migrated_default" ||
        gameB.model.hangar.message.includes("Legacy identity reset"),
      "Identity migration should show one-time profile migration notice"
    );
  });

  tests.push(() => {
    const profile = gameA.getDefaultProfile();
    profile.progression.factions = {
      helix_union: 999,
      drift_cartel: -999
    };
    sharedStorage.setItem("starfang_profile_v1", JSON.stringify(profile));
    const AsteroidsB = createRuntime(sharedStorage);
    const gameB = createGame(AsteroidsB);
    assert(gameB.model.factions.helix_union <= 100, "Faction reputation should clamp to configured max bound");
    assert(gameB.model.factions.drift_cartel >= -100, "Faction reputation should clamp to configured min bound");
  });

  tests.push(() => {
    gameA.startGame(12345);
    gameA.model.missionTimer = 0;
    gameA.model.asteroids = [
      {
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        radius: 20,
        size: "small",
        asteroidType: "normal",
        spin: 0,
        rotation: 0,
        shape: [1, 1, 1],
        nearMissCooldown: 0
      }
    ];
    gameA.model.ufos = [];
    gameA.model.enemyBullets = [];
    gameA.model.miniBoss = null;
    gameA.missionSystem.updateMission(1 / 60);
    assert(
      gameA.model.currentMission.objectiveText.startsWith("Clear remaining threats"),
      "Survive objective should switch to clear-threat text after timer expires"
    );
  });

  tests.push(() => {
    gameA.model.bullets = [];
    gameA.model.ship.energy = gameA.model.ship.energyMax;
    gameA.model.ship.heat = 0;

    gameA.model.loadout.primaryId = "spread_cannon";
    gameA.combatSystem.fireBullet();
    assert(gameA.model.bullets.length === 3, "Spread cannon should fire 3 projectiles");
    assert(gameA.model.bullets.every((bullet) => bullet.kind === "primary_spread"), "Spread kind mismatch");

    gameA.model.bullets = [];
    gameA.model.loadout.primaryId = "rail_lance";
    gameA.combatSystem.fireBullet();
    assert(gameA.model.bullets[0].kind === "primary_rail", "Rail kind mismatch");
    assert(gameA.model.bullets[0].pierce >= 1, "Rail should have pierce");

    gameA.model.bullets = [];
    gameA.model.loadout.primaryId = "plasma_chain";
    gameA.combatSystem.fireBullet();
    assert(gameA.model.bullets[0].kind === "primary_chain", "Chain kind mismatch");
    assert(gameA.model.bullets[0].chainTargets >= 1, "Chain should have chain targets");
  });

  tests.push(() => {
    gameA.startGame(31337);
    gameA.model.loadout.primaryId = "auto_cannon";
    gameA.model.bullets = [];
    const beforeShield = gameA.model.ship.shield;
    gameA.model.ship.energy = gameA.model.ship.energyMax;
    gameA.model.ship.heat = 0;
    gameA.combatSystem.fireBullet();
    assert(gameA.model.ship.shield < beforeShield, "Primary fire should drain shield in shared pool model");
    gameA.model.ship.shield = 0;
    gameA.model.bullets = [];
    const fired = gameA.combatSystem.fireBullet();
    assert(!fired, "Primary fire should be blocked when shield pool is empty");
  });

  tests.push(() => {
    const makeSetModule = (slot) => ({
      uid: `h-${slot}`,
      slot,
      rarity: "rare",
      rarityLabel: "Rare",
      color: "#76b7ff",
      name: `Set ${slot}`,
      baseName: slot,
      setTag: "corsair",
      affixes: [],
      modifiers: {},
      sellValue: 10,
      salvageValue: 3,
      level: 1
    });

    gameA.model.equipment.hull = makeSetModule("hull");
    gameA.model.equipment.shield = makeSetModule("shield");
    gameA.model.equipment.engine = null;
    gameA.refreshSetState();
    const tier2 = gameA.model.activeSets.find((set) => set.id === "corsair");
    assert(tier2 && tier2.tier === 2, "Corsair set should activate at tier 2 with 2 pieces");

    gameA.model.equipment.engine = makeSetModule("engine");
    gameA.refreshSetState();
    const tier3 = gameA.model.activeSets.find((set) => set.id === "corsair");
    assert(tier3 && tier3.tier === 3, "Corsair set should activate tier 3 with 3 pieces");
  });

  tests.push(() => {
    const InputController = AsteroidsA.InputController;
    const input = new InputController();
    const mkEvt = (code) => ({
      code,
      repeat: false,
      preventDefault() {}
    });
    input.onKeyDown(mkEvt("Digit0"));
    input.onKeyDown(mkEvt("KeyR"));
    input.onKeyDown(mkEvt("KeyM"));
    input.onKeyDown(mkEvt("ArrowDown"));
    input.onKeyDown(mkEvt("Space"));
    assert(input.wasPressed("Digit0"), "Digit0 should be tracked");
    assert(input.wasPressed("KeyR"), "KeyR should be tracked");
    assert(input.wasPressed("KeyM"), "KeyM should be tracked");
    assert(input.wasPressed("ArrowDown"), "ArrowDown should be tracked");
    assert(input.wasPressed("Space"), "Space should be tracked");
  });

  tests.push(() => {
    gameA.startGame(17171);
    gameA.model.gameState = AsteroidsA.GAME_STATE.HANGAR;
    gameA.model.credits = 5000;
    gameA.model.ship.hull = Math.max(1, gameA.model.ship.hullMax - 40);
    gameA.model.ship.shield = Math.max(1, gameA.model.ship.shieldMax - 40);
    gameA.model.upgrades.fireRateLevel = 0;
    gameA.model.upgrades.magazineLevel = 0;
    gameA.model.hangar.navSection = "shop";

    const pressSpaceAt = (index) => {
      gameA.model.hangar.shopIndex = index;
      gameA.input.wasPressed = (code) => code === "Space";
      gameA.hangarSystem.handleHangarInput();
      gameA.input.wasPressed = () => false;
    };

    const shopSize = gameA.hangarSystem.getShopActionCount();

    const prevHull = gameA.model.ship.hull;
    pressSpaceAt(0); // repair
    assert(gameA.model.ship.hull > prevHull, "Shop index 0 should map to repair action");

    pressSpaceAt(1); // fire_rate
    assert(gameA.model.upgrades.fireRateLevel === 1, "Shop index 1 should map to weapon tuning");

    pressSpaceAt(2); // magazine
    assert(gameA.model.upgrades.magazineLevel === 1, "Shop index 2 should map to magazine upgrade");

    const prevPrimary = gameA.model.loadout.primaryId;
    pressSpaceAt(3); // primary cycle
    assert(gameA.model.loadout.primaryId !== prevPrimary, "Shop index 3 should map to primary loadout cycle");

    gameA.model.hangar.selectionSource = "inventory";
    gameA.model.hangar.selectionIndex = 0;
    gameA.model.inventory = [gameA.createModuleDrop()];
    const creditsBeforeSell = gameA.model.credits;
    pressSpaceAt(6); // sell selected
    assert(gameA.model.inventory.length === 0, "Shop index 6 should sell selected inventory module");
    assert(gameA.model.credits > creditsBeforeSell, "Selling selected module should grant credits");

    gameA.model.inventory = [gameA.createModuleDrop()];
    gameA.model.hangar.selectionSource = "inventory";
    gameA.model.hangar.selectionIndex = 0;
    const salvageBefore = gameA.model.salvageParts;
    pressSpaceAt(shopSize - 1); // salvage selected (last action row)
    assert(gameA.model.inventory.length === 0, "Shop index 7 should salvage selected inventory module");
    assert(gameA.model.salvageParts > salvageBefore, "Salvaging selected module should grant salvage parts");
  });

  tests.push(() => {
    gameA.startGame(27272);
    gameA.model.gameState = AsteroidsA.GAME_STATE.HANGAR;
    const drop = gameA.createModuleDrop();
    drop.slot = "hull";
    drop.name = "Harness Hull";
    gameA.model.hangar.lootCrate = [drop];
    gameA.model.inventory = [];
    gameA.model.equipment.hull = null;
    gameA.model.hangar.navSection = "loot";
    gameA.model.hangar.selectionSource = "crate";
    gameA.model.hangar.selectionIndex = 0;

    gameA.input.wasPressed = (code) => code === "Space";
    gameA.hangarSystem.handleHangarInput();
    gameA.input.wasPressed = () => false;

    assert(gameA.model.equipment.hull?.name === "Harness Hull", "Space on crate item should equip immediately");
    assert(gameA.model.hangar.lootCrate.length === 0, "Equipped crate item should be removed from crate");
  });

  tests.push(() => {
    gameA.startGame(5151);
    gameA.model.sector = 5;
    gameA.model.enemyBullets = [];
    gameA.model.asteroids = [];
    gameA.enemySystem.spawnMiniBoss(500);
    const boss = gameA.model.miniBoss;
    boss.hp = Math.floor(boss.maxHp * 0.39);
    boss.phaseIndex = 0;
    gameA.enemySystem.updateMiniBoss(1 / 60);
    assert(boss.phaseIndex >= 2, "Mini boss should transition to phase 3 at low HP threshold");
    assert(gameA.model.enemyBullets.length >= 6, "Mini boss phase transition should trigger arena mine ring");
  });

  tests.push(() => {
    gameA.startGame(5252);
    const finalSector = gameA.config.run.finalSector;
    gameA.model.sector = finalSector;
    gameA.model.runMode = "campaign";
    gameA.model.enemyBullets = [];
    gameA.model.asteroids = [];
    gameA.missionSystem.startMission(finalSector);
    const boss = gameA.model.miniBoss;
    assert(boss?.isFinalBoss, "Final encounter should spawn dedicated final boss archetype");
    const centerX = gameA.config.canvas.width * 0.5;
    gameA.enemySystem.updateMiniBoss(1 / 60);
    assert(Math.abs(boss.x - centerX) > 180, "Final boss movement should differ from regular mini boss orbit");
    boss.hp = Math.floor(boss.maxHp * 0.4);
    boss.phaseIndex = 0;
    const bulletsBefore = gameA.model.enemyBullets.length;
    gameA.enemySystem.updateMiniBoss(1 / 60);
    assert(
      gameA.model.enemyBullets.length >= bulletsBefore + 8,
      "Final boss phase transition should trigger stronger phase event pressure"
    );
  });

  tests.push(() => {
    gameA.startGame(6161);
    gameA.model.sector = 4;
    gameA.model.credits = 0;
    gameA.model.hangar.lootCrate = [];
    gameA.enemySystem.spawnMiniBoss(420);
    const guaranteedDrops = gameA.config.mission.miniBoss.rewards.guaranteedDrops;
    const expectedCredits =
      gameA.config.mission.miniBoss.rewards.creditsBase +
      (gameA.model.sector - 1) * gameA.config.mission.miniBoss.rewards.creditsStep;
    gameA.destroyMiniBoss();
    assert(gameA.model.miniBoss === null, "Mini boss should be removed after destroy");
    assert(gameA.model.credits >= expectedCredits, "Mini boss reward credits should be granted");
    assert(
      gameA.model.hangar.lootCrate.length >= guaranteedDrops,
      "Mini boss should grant guaranteed module drops"
    );
  });

  tests.push(() => {
    gameA.startGame(7171);
    gameA.model.sector = 1;
    gameA.missionSystem.startMission(2);
    const earlyBudget = gameA.model.missionSpawnBudget;
    const earlyInterval = gameA.model.currentMission.spawnIntervalSeconds;

    gameA.model.sector = 7;
    gameA.missionSystem.startMission(2);
    const lateBudget = gameA.model.missionSpawnBudget;
    const lateInterval = gameA.model.currentMission.spawnIntervalSeconds;

    assert(lateBudget > earlyBudget, "Mission pacing should scale UFO hunt budget by sector");
    assert(lateInterval < earlyInterval, "Mission pacing should reduce spawn interval at higher sectors");
  });

  tests.push(() => {
    gameA.startGame(7272);
    gameA.model.sector = 10;
    gameA.model.runMode = "campaign";
    gameA.missionSystem.startMission(2);
    const campaignBudget = gameA.model.missionSpawnBudget;
    const campaignInterval = gameA.model.currentMission.spawnIntervalSeconds;
    const campaignConcurrent = gameA.model.currentMission.maxConcurrentUfos;
    assert(gameA.getEndlessCreditsMultiplier() === 1, "Campaign credits multiplier should stay at 1.0");

    gameA.model.runMode = "endless";
    gameA.missionSystem.startMission(2);
    const endlessBudget = gameA.model.missionSpawnBudget;
    const endlessInterval = gameA.model.currentMission.spawnIntervalSeconds;
    const endlessConcurrent = gameA.model.currentMission.maxConcurrentUfos;
    const endlessCreditsMul = gameA.getEndlessCreditsMultiplier();

    assert(endlessBudget >= campaignBudget, "Endless pacing should not reduce objective budget at high sectors");
    assert(endlessInterval < campaignInterval, "Endless pacing should increase spawn pressure via shorter interval");
    assert(endlessConcurrent >= campaignConcurrent, "Endless pacing should not reduce concurrent UFO pressure");
    assert(endlessCreditsMul < 1, "Endless economy should damp credits at high sectors");
  });

  tests.push(() => {
    gameA.startGame(8181);
    gameA.model.currentMission = {
      type: "survive",
      label: "SURVIVE",
      objectiveText: "",
      completed: false,
      modifierId: "ion_storm",
      modifierLabel: "Ion Storm",
      modifierEffects: {
        shieldRegenMul: 0.2,
        shieldDrainPerSecond: 6.0
      }
    };
    gameA.model.ship.shield = gameA.model.ship.shieldMax;
    gameA.missionSystem.applyMissionEnvironmentalEffects(1.0);
    assert(gameA.model.ship.shield < gameA.model.ship.shieldMax, "Ion storm should drain shield over time");
  });

  tests.push(() => {
    gameA.startGame(8282);
    const ship = gameA.model.ship;
    const primary = gameA.getPrimarySpec();
    gameA.model.currentMission = {
      type: "survive",
      label: "SURVIVE",
      objectiveText: "",
      completed: false,
      modifierId: "ion_storm",
      modifierLabel: "Ion Storm",
      modifierEffects: {
        shieldRegenMul: 0.25,
        shieldDrainPerSecond: gameA.config.missionDirector.modifiers.ion_storm.shieldDrainPerSecond
      }
    };
    ship.shield = 0;
    ship.energy = ship.energyMax;
    ship.heat = 0;
    ship.lastDamageAt = -999;
    gameA.model.runtimeSeconds = 10;
    for (let i = 0; i < 360; i += 1) {
      gameA.missionSystem.applyMissionEnvironmentalEffects(1 / 60);
      gameA.updateShipResources(1 / 60);
      gameA.model.runtimeSeconds += 1 / 60;
    }
    const shieldCost = gameA.getSharedPoolShieldCost("primary", primary.energyCost);
    assert(
      ship.shield >= shieldCost,
      `Ion storm should not hard-lock player at 0 shield forever (shield=${ship.shield.toFixed(3)} cost=${shieldCost.toFixed(3)} regen=${gameA.config.ship.shieldRegenPerSecond} mul=${gameA.model.currentMission.modifierEffects.shieldRegenMul} drain=${gameA.model.currentMission.modifierEffects.shieldDrainPerSecond})`
    );
    assert(gameA.canFirePrimary(), "Primary fire should recover after ion storm shield starvation");
  });

  tests.push(() => {
    gameA.startGame(8383);
    const ship = gameA.model.ship;
    const originalIsDown = gameA.input.isDown;
    ship.x = 480;
    ship.y = 360;
    ship.vx = 0;
    ship.vy = 0;
    gameA.model.currentMission = {
      type: "survive",
      label: "SURVIVE",
      objectiveText: "",
      completed: false,
      modifierId: "gravity_anomaly",
      modifierLabel: "Gravity Anomaly",
      modifierEffects: {},
      gravityAnomaly: {
        x: ship.x + 1,
        y: ship.y,
        radius: 300,
        pullStrength: 14800,
        coreRadius: 62,
        maxShipPullAccel: 210,
        maxAsteroidPullAccel: 130,
        escapeThrustPullMultiplier: 0.58
      }
    };

    gameA.input.isDown = () => false;
    gameA.missionSystem.applyMissionEnvironmentalEffects(1 / 60);
    const noThrustPull = Math.hypot(ship.vx, ship.vy);
    assert(noThrustPull < 5, "Gravity anomaly near-center pull should be capped");

    ship.vx = 0;
    ship.vy = 0;
    gameA.input.isDown = (code) => code === "ArrowUp";
    gameA.missionSystem.applyMissionEnvironmentalEffects(1 / 60);
    const thrustPull = Math.hypot(ship.vx, ship.vy);
    assert(thrustPull < noThrustPull, "Thrusting should reduce gravity anomaly pull for escape");
    gameA.input.isDown = originalIsDown;
  });

  tests.push(() => {
    gameA.startGame(8484);
    gameA.model.currentMission = {
      type: "survive",
      label: "SURVIVE",
      objectiveText: "",
      completed: false,
      modifierId: "gravity_anomaly",
      modifierLabel: "Gravity Anomaly",
      modifierEffects: {},
      gravityAnomaly: {
        x: 480,
        y: 360,
        radius: 300,
        pullStrength: 14800,
        coreRadius: 62,
        maxShipPullAccel: 210,
        maxAsteroidPullAccel: 130
      }
    };
    const ufo = {
      mode: "hunter",
      x: 482,
      y: 360,
      vx: 0,
      vy: 0,
      radius: gameA.config.ufo.radius,
      hp: 40,
      maxHp: 40
    };
    gameA.model.ufos = [ufo];
    const dt = 1 / 60;
    let escapeImpulseDetected = false;
    for (let i = 0; i < 240; i += 1) {
      gameA.missionSystem.applyMissionEnvironmentalEffects(dt);
      const offsetX = ufo.x - gameA.model.currentMission.gravityAnomaly.x;
      const offsetY = ufo.y - gameA.model.currentMission.gravityAnomaly.y;
      const velOutward = offsetX * ufo.vx + offsetY * ufo.vy;
      if (velOutward > 120) escapeImpulseDetected = true;
      ufo.x += ufo.vx * dt;
      ufo.y += ufo.vy * dt;
    }
    const distFromCenter = Math.hypot(ufo.x - 480, ufo.y - 360);
    assert(escapeImpulseDetected, "Gravity anomaly should apply anti-stuck escape impulse for UFO in core");
    assert(distFromCenter > 45, `UFO should not stay stuck in anomaly core (dist=${distFromCenter.toFixed(2)})`);
  });

  tests.push(() => {
    gameA.startGame(9191);
    gameA.model.ship.invulnMs = 0;
    const before = gameA.model.hitstopSeconds;
    gameA.applyDamageToShip("enemy_bullet_hunter");
    assert(gameA.model.hitstopSeconds > before, "Player hit should trigger hitstop feedback");
  });

  tests.push(() => {
    gameA.startGame(10101);
    const ship = gameA.model.ship;
    ship.hull = ship.hullMax * 0.2;
    ship.energy = ship.energyMax * 0.1;
    ship.heat = ship.heatMax * 0.9;
    ship.shield = 0;
    gameA.model.secondaryCooldown = 0.8;
    gameA.model.utilityCooldown = 0;
    gameA.model.dashCooldown = 0;
    gameA.updateUiAlerts();
    assert(gameA.model.uiAlerts.lowHull, "Low hull alert should activate");
    assert(gameA.model.uiAlerts.lowEnergy, "Low energy alert should activate");
    assert(gameA.model.uiAlerts.highHeat, "High heat alert should activate");
    assert(gameA.model.uiAlerts.shieldBroken, "Shield broken alert should activate");
    assert(gameA.model.uiAlerts.utilityReady, "Utility ready alert should activate");
  });

  tests.push(() => {
    gameA.startGame(15151);
    const finalSector = gameA.config.run.finalSector;
    gameA.model.sector = finalSector;
    gameA.missionSystem.startMission(finalSector);
    gameA.model.miniBoss = null;
    gameA.model.asteroids = [];
    gameA.model.ufos = [];
    gameA.model.enemyBullets = [];
    gameA.missionSystem.updateMission(1 / 60);
    assert(gameA.model.gameState === AsteroidsA.GAME_STATE.VICTORY, "Campaign final encounter should end in VICTORY");
    assert(gameA.model.endlessUnlocked, "Campaign clear should unlock endless mode");
    assert(gameA.model.unlocks.endlessMode, "Endless unlock should persist in progression unlocks");
  });

  tests.push(() => {
    gameA.startGame(16161);
    const finalSector = gameA.config.run.finalSector;
    gameA.model.endlessUnlocked = true;
    gameA.model.unlocks.endlessMode = true;
    gameA.model.runMode = "endless";
    gameA.model.sector = finalSector;
    gameA.missionSystem.startMission(finalSector);
    gameA.model.miniBoss = null;
    gameA.model.asteroids = [];
    gameA.model.ufos = [];
    gameA.model.enemyBullets = [];
    gameA.missionSystem.updateMission(1 / 60);
    assert(
      gameA.model.gameState === AsteroidsA.GAME_STATE.MISSION_COMPLETE,
      "Endless mode should show mission-complete confirmation before hangar"
    );
    assert(gameA.model.sectorCompletionHandled, "Endless mode should route mission completion to hangar flow");
  });

  tests.push(() => {
    gameA.model.factions.helix_union = 0;
    gameA.model.factions.drift_cartel = 0;
    gameA.startGame(40404);
    const missionFaction = gameA.model.currentMission?.biomeFactionId;
    assert(typeof missionFaction === "string" && missionFaction.length > 0, "Mission should resolve biome faction id");
    assert(
      gameA.getFactionReputation(missionFaction) >= 1,
      "Mission start should increase reputation for the active biome faction"
    );
  });

  tests.push(() => {
    gameA.model.factions.helix_union = 0;
    gameA.model.factions.drift_cartel = 0;
    gameA.startGame(41414);
    const missionFaction = gameA.model.currentMission?.biomeFactionId;
    const before = gameA.getFactionReputation(missionFaction);
    gameA.onMissionCompleted();
    const after = gameA.getFactionReputation(missionFaction);
    assert(after > before, "Mission completion should increase active biome faction reputation");
  });

  tests.push(() => {
    gameA.startGame(43434);
    gameA.model.comboScoringEnabled = false;
    gameA.model.currentMission = {
      type: "survive",
      biomeFactionId: "helix_union"
    };
    gameA.model.factions.helix_union = 70;
    gameA.model.credits = 0;
    gameA.registerScore(100, false);
    const highRepCredits = gameA.model.credits;

    gameA.model.factions.helix_union = -70;
    gameA.model.credits = 0;
    gameA.registerScore(100, false);
    const lowRepCredits = gameA.model.credits;

    assert(highRepCredits > lowRepCredits, "Higher faction reputation should increase mission credit rewards");
  });

  tests.push(() => {
    gameA.model.factions.helix_union = 60;
    gameA.model.factions.drift_cartel = -10;
    const helixShop = gameA.getHangarShopItems();
    gameA.model.factions.helix_union = -10;
    gameA.model.factions.drift_cartel = 60;
    const cartelShop = gameA.getHangarShopItems();

    assert(helixShop[0]?.id !== cartelShop[0]?.id, "Dominant faction should change hangar shop offer ordering");
    assert(
      helixShop.find((item) => item.id === "fire_rate")?.resolvedCost !==
        cartelShop.find((item) => item.id === "fire_rate")?.resolvedCost,
      "Dominant faction should alter resolved shop item costs"
    );
  });

  tests.push(() => {
    gameA.model.gameState = AsteroidsA.GAME_STATE.VICTORY;
    gameA.model.overlaySettingsRow = 2;
    gameA.model.runSeed = 1234;
    gameA.model.victorySummary = gameA.buildVictorySummary();
    let enterConsumed = false;
    gameA.input.wasPressed = (code) => {
      if (code !== "Enter") return false;
      if (enterConsumed) return false;
      enterConsumed = true;
      return true;
    };
    gameA.handleMetaInput();
    gameA.input.wasPressed = () => false;
    assert(gameA.model.gameState === AsteroidsA.GAME_STATE.START, "Enter on VICTORY should route to START overlay");
    assert(gameA.model.overlaySettingsRow === 0, "Victory confirmation should reset run-setup row selection");
    assert(gameA.model.runSeed !== 1234, "Victory confirmation should generate a fresh run seed");
  });

  tests.push(() => {
    gameA.model.gameState = AsteroidsA.GAME_STATE.START;
    gameA.model.overlaySettingsRow = 4;
    gameA.model.flightModel = "arcade";
    gameA.adjustSelectedOverlaySetting(1);
    assert(gameA.model.flightModel === "sim_lite", "Run setup flight row should switch to SIM LITE");
    assert(
      gameA.model.profile.progression.flightModel === "sim_lite",
      "Selected flight model should persist into profile progression"
    );
    gameA.adjustSelectedOverlaySetting(-1);
    assert(gameA.model.flightModel === "arcade", "Run setup flight row should switch back to ARCADE");
  });

  tests.push(() => {
    gameA.model.gameState = AsteroidsA.GAME_STATE.START;
    gameA.model.overlaySettingsRow = 1;
    gameA.model.runDifficultyId = "normal";
    gameA.adjustSelectedOverlaySetting(1);
    assert(gameA.model.runDifficultyId === "veteran", "Run setup difficulty row should cycle to VETERAN");
    assert(
      gameA.model.profile.progression.runDifficultyId === "veteran",
      "Selected difficulty should persist into profile progression"
    );
    gameA.adjustSelectedOverlaySetting(1);
    assert(gameA.model.runDifficultyId === "ace", "Run setup difficulty row should cycle to ACE");
    gameA.adjustSelectedOverlaySetting(-1);
    assert(gameA.model.runDifficultyId === "veteran", "Run setup difficulty row should cycle back from ACE");
  });

  tests.push(() => {
    gameA.model.runDifficultyId = "rookie";
    const rookie = gameA.getRunDifficultyMultipliers();
    gameA.model.runDifficultyId = "normal";
    const normal = gameA.getRunDifficultyMultipliers();
    gameA.model.runDifficultyId = "ace";
    const ace = gameA.getRunDifficultyMultipliers();
    assert(rookie.enemyDamageTakenMul < normal.enemyDamageTakenMul, "Rookie should reduce incoming enemy damage");
    assert(ace.enemyDamageTakenMul > normal.enemyDamageTakenMul, "Ace should increase incoming enemy damage");
    assert(rookie.economyCreditsMul > normal.economyCreditsMul, "Rookie should boost credits economy");
    assert(ace.economyCreditsMul < normal.economyCreditsMul, "Ace should reduce credits economy");
  });

  tests.push(() => {
    gameA.startGame(51515);
    const ship = gameA.model.ship;
    gameA.model.currentMission = {
      modifierEffects: { shieldDrainPerSecond: 20 },
      gravityAnomaly: null,
      biomeHazards: []
    };
    ship.shield = 120;

    gameA.model.runDifficultyId = "rookie";
    gameA.missionSystem.applyMissionEnvironmentalEffects(1.0);
    const rookieShieldLoss = 120 - ship.shield;

    ship.shield = 120;
    gameA.model.runDifficultyId = "ace";
    gameA.missionSystem.applyMissionEnvironmentalEffects(1.0);
    const aceShieldLoss = 120 - ship.shield;

    assert(aceShieldLoss > rookieShieldLoss, "Ace should apply stronger hazard shield-drain pressure than Rookie");
  });

  tests.push(() => {
    gameA.startGame(52525);
    const moduleTemplate = {
      uid: "h-salvage",
      slot: "primary",
      rarity: "common",
      rarityLabel: "Common",
      color: "#ddd",
      name: "Harness Scrap",
      baseName: "Harness Scrap",
      affixes: [],
      modifiers: {},
      sellValue: 1,
      salvageValue: 10
    };
    gameA.model.hangar.selectionSource = "inventory";
    gameA.model.hangar.selectionIndex = 0;

    gameA.model.runDifficultyId = "rookie";
    gameA.model.inventory = [{ ...moduleTemplate, uid: "h-salvage-r" }];
    gameA.model.salvageParts = 0;
    gameA.hangarSystem.salvageSelected();
    const rookieParts = gameA.model.salvageParts;

    gameA.model.runDifficultyId = "ace";
    gameA.model.inventory = [{ ...moduleTemplate, uid: "h-salvage-a" }];
    gameA.model.salvageParts = 0;
    gameA.hangarSystem.salvageSelected();
    const aceParts = gameA.model.salvageParts;

    assert(rookieParts > aceParts, "Rookie should yield more salvage parts than Ace for the same module");
  });

  tests.push(() => {
    gameA.startGame(53535);
    const dropCfg = gameA.config.loot.dropChance;
    const cases = [];
    for (const detail of Object.keys(dropCfg.asteroid || {})) {
      cases.push({ source: "asteroid", detail, baseChance: dropCfg.asteroid[detail] ?? 0 });
    }
    for (const detail of Object.keys(dropCfg.ufo || {})) {
      cases.push({ source: "ufo", detail, baseChance: dropCfg.ufo[detail] ?? 0 });
    }
    cases.push({ source: "miniBoss", detail: undefined, baseChance: dropCfg.miniBoss ?? 0 });

    gameA.model.runDifficultyId = "rookie";
    const rookieMul = gameA.getRunDifficultyMultipliers().lootDropMul;
    gameA.model.runDifficultyId = "ace";
    const aceMul = gameA.getRunDifficultyMultipliers().lootDropMul;

    let selected = null;
    for (const item of cases) {
      const rookieChance = Math.max(0, Math.min(1, item.baseChance * rookieMul));
      const aceChance = Math.max(0, Math.min(1, item.baseChance * aceMul));
      if (rookieChance > aceChance && aceChance > 0 && rookieChance < 1) {
        selected = { ...item, rookieChance, aceChance };
        break;
      }
    }
    assert(selected, "Harness could not find a loot source where Rookie and Ace drop chances differ");

    const threshold = (selected.rookieChance + selected.aceChance) / 2;
    gameA.rng = () => threshold;
    gameA.createModuleDrop = () => ({
      uid: "h-loot",
      slot: "primary",
      rarity: "common",
      rarityLabel: "Common",
      color: "#ddd",
      name: "Harness Drop",
      baseName: "Harness Drop",
      affixes: [],
      modifiers: {},
      sellValue: 1,
      salvageValue: 1
    });

    gameA.model.hangar.lootCrate = [];
    gameA.model.runDifficultyId = "rookie";
    gameA.tryDropModule(selected.source, selected.detail);
    const rookieDrops = gameA.model.hangar.lootCrate.length;

    gameA.model.hangar.lootCrate = [];
    gameA.model.runDifficultyId = "ace";
    gameA.tryDropModule(selected.source, selected.detail);
    const aceDrops = gameA.model.hangar.lootCrate.length;

    assert(rookieDrops === 1, "Rookie should pass the selected loot-drop threshold case");
    assert(aceDrops === 0, "Ace should fail the selected loot-drop threshold case");
  });

  tests.push(() => {
    gameA.startGame(11111);
    const ship = gameA.model.ship;
    ship.invulnMs = 0;
    ship.hull = ship.hullMax;
    ship.heat = 0;
    gameA.model.currentMission = {
      type: "survive",
      label: "SURVIVE",
      objectiveText: "",
      completed: false,
      biomeId: "refinery",
      biomeLabel: "Refinery Complex",
      modifierEffects: {},
      biomeHazards: [
        {
          type: "debris_field",
          x: ship.x,
          y: ship.y,
          radius: 100,
          tickSeconds: 0.2,
          tickDamage: 8,
          slowMul: 0.985,
          tickTimer: 0,
          phase: 0,
          active: false
        },
        {
          type: "plasma_vent",
          x: ship.x,
          y: ship.y,
          radius: 110,
          tickSeconds: 0.2,
          tickDamage: 6,
          heatPerSecond: 20,
          tickTimer: 0,
          phase: 0,
          active: false
        }
      ]
    };
    gameA.missionSystem.applyMissionEnvironmentalEffects(0.25);
    assert(
      ship.shield < ship.shieldMax || ship.hull < ship.hullMax,
      "Biome hazards should damage ship in hazard radius"
    );
    assert(ship.heat > 0, "Plasma vent should increase heat");
  });

  tests.push(() => {
    gameA.startGame(12121);
    const ship = gameA.model.ship;
    gameA.model.sector = 6;
    for (let missionIndex = 1; missionIndex <= 8; missionIndex += 1) {
      gameA.missionSystem.startMission(missionIndex);
      const hazards = gameA.model.currentMission?.biomeHazards || [];
      for (const hazard of hazards) {
        const dist = Math.hypot(hazard.x - ship.x, hazard.y - ship.y);
        const minDist = hazard.radius + ship.radius + 20;
        assert(
          dist >= minDist,
          `Hazard zone spawned too close to ship start (d=${dist.toFixed(1)}, min=${minDist.toFixed(1)})`
        );
      }
    }
  });

  tests.push(() => {
    gameA.startGame(13131);
    gameA.model.pilot.level = 1;
    gameA.model.pilot.xp = 0;
    gameA.model.pilot.xpToNext = gameA.getPilotXpToNext(1);
    gameA.model.pilot.attributePoints = 0;
    gameA.model.pilot.skillPoints = 0;
    const gain = gameA.model.pilot.xpToNext + 25;
    gameA.grantPilotXp(gain, "harness_xp");
    assert(gameA.model.pilot.level >= 2, "Pilot XP gain should level up pilot");
    assert(gameA.model.pilot.attributePoints >= 1, "Pilot level up should grant attribute point");
  });

  tests.push(() => {
    gameA.startGame(14141);
    gameA.model.pilot.attributePoints = 8;
    gameA.model.pilot.attributes.reflex = 4;
    gameA.model.pilot.attributes.systems = 4;
    gameA.model.pilot.attributes.grit = 4;
    gameA.model.pilot.attributes.instinct = 4;
    const beforeReflex = gameA.model.pilot.attributes.reflex;
    const spent = gameA.spendPilotAttributePoint("reflex");
    assert(spent, "Pilot attribute point spend should succeed with available points");
    assert(gameA.model.pilot.attributes.reflex === beforeReflex + 1, "Reflex attribute should increase by 1");

    gameA.model.pilot.level = 10;
    gameA.model.pilot.skillPoints = 1;
    gameA.model.pilot.unlockedPerks = [];
    const unlock = gameA.unlockPilotPerk("ghost_focus");
    assert(unlock, "Pilot perk unlock should succeed when requirements are met");
    assert(gameA.model.pilot.unlockedPerks.includes("ghost_focus"), "Unlocked perk should be recorded");
    assert(gameA.model.pilot.skillPoints === 0, "Unlocking perk should spend one skill point");
  });

  let passed = 0;
  for (let i = 0; i < tests.length; i += 1) {
    sharedStorage.clear();
    gameA = createGame(AsteroidsA);
    tests[i]();
    passed += 1;
    console.log(`[PASS] Test ${i + 1}/${tests.length}`);
  }
  console.log(`Combat harness passed: ${passed}/${tests.length}`);
}

try {
  runTests();
} catch (error) {
  console.error("[FAIL]", error.message);
  process.exit(1);
}
