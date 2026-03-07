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
    assert(input.wasPressed("Digit0"), "Digit0 should be tracked");
    assert(input.wasPressed("KeyR"), "KeyR should be tracked");
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
