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
  const gameA = createGame(AsteroidsA);

  const tests = [];

  tests.push(() => {
    gameA.model.upgrades.fireRateLevel = 3;
    gameA.model.loadout.primaryId = "rail_lance";
    gameA.model.salvageParts = 17;
    gameA.model.inventory = [gameA.createModuleDrop()];
    gameA.saveProfile("harness_profile_roundtrip");

    const AsteroidsB = createRuntime(sharedStorage);
    const gameB = createGame(AsteroidsB);
    assert(gameB.model.upgrades.fireRateLevel === 3, "Profile did not persist fireRateLevel");
    assert(gameB.model.loadout.primaryId === "rail_lance", "Profile did not persist primary loadout");
    assert(gameB.model.salvageParts === 17, "Profile did not persist salvage parts");
    assert(gameB.model.inventory.length >= 1, "Profile did not persist inventory");
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
    assert(input.wasPressed("Digit0"), "Digit0 should be tracked");
    assert(input.wasPressed("KeyR"), "KeyR should be tracked");
    assert(input.wasPressed("KeyM"), "KeyM should be tracked");
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

  let passed = 0;
  for (let i = 0; i < tests.length; i += 1) {
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
