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
    HangarSystem,
    CombatSystem,
    EnemySystem,
    randomRange,
    validateGameConfig
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

  const PROFILE_STORAGE_KEY = "starfang_profile_v1";
  const PROFILE_SCHEMA_VERSION = 1;

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefaultProfile() {
    return {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      updatedAt: Date.now(),
      progression: {
        loadout: {
          primaryId: "auto_cannon",
          secondaryId: "missile_burst",
          utilityId: "pulse_bomb"
        },
        unlocks: {
          primary: {
            auto_cannon: true,
            spread_cannon: true,
            rail_lance: true,
            plasma_chain: true
          },
          secondary: {
            missile_burst: true,
            rail_shot: true,
            cluster_rockets: true
          },
          utility: {
            pulse_bomb: true,
            emp_pulse: true,
            shield_dome: true
          }
        },
        upgrades: {
          fireRateLevel: 0,
          magazineLevel: 0
        },
        inventory: [],
        equipment: {
          hull: null,
          shield: null,
          generator: null,
          engine: null,
          chipset: null
        },
        salvageParts: 0
      },
      stats: {
        runsPlayed: 0,
        totalPlaySeconds: 0,
        bestScore: 0,
        bestSector: 1,
        lifetimeScore: 0
      }
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
        sector: 1,
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
        sectorTimerMs: 0,
        runSeed: null,
        runtimeSeconds: 0,
        nextUfoSpawnSeconds: 0,
        comboCount: 0,
        comboMultiplier: 1,
        comboTimer: 0,
        comboScoringEnabled: config.arcadeMutators.comboScoringEnabled,
        sectorCompletionHandled: false,
        missionTimer: 0,
        missionSpawnTimer: 0,
        missionSpawnBudget: 0,
        missionUfoKills: 0,
        missionAsteroidKills: 0,
        currentMission: null,
        flightModel: "arcade",
        dotEffects: [],
        hangar: {
          message: "Hangar: 1-3 upgrade, 4 primary, 5 secondary, R utility, 6/7 select, 8 take/equip, 9 sell, 0 salvage, Enter start.",
          lootCrate: [],
          selectionSource: "crate",
          selectionIndex: 0
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
          primary: {
            auto_cannon: true,
            spread_cannon: true,
            rail_lance: true,
            plasma_chain: true
          },
          secondary: {
            missile_burst: true,
            rail_shot: true,
            cluster_rockets: true
          },
          utility: {
            pulse_bomb: true,
            emp_pulse: true,
            shield_dome: true
          }
        },
        upgrades: {
          fireRateLevel: 0,
          magazineLevel: 0
        },
        inventory: [],
        equipment: {
          hull: null,
          shield: null,
          generator: null,
          engine: null,
          chipset: null
        },
        activeSets: [],
        setStatusText: "No active set",
        salvageParts: 0,
        telemetry: createTelemetryState(false),
        profile: createDefaultProfile()
      };

      this.missionSystem = new MissionSystem(this);
      this.hangarSystem = new HangarSystem(this);
      this.combatSystem = new CombatSystem(this);
      this.enemySystem = new EnemySystem(this);
    }

    clamp(value, min, max) {
      return clamp(value, min, max);
    }

    getDefaultProfile() {
      return createDefaultProfile();
    }

    sanitizeModule(module) {
      if (!module || typeof module !== "object") return null;
      const slot = module.slot;
      if (!this.config.loot.slots.includes(slot)) return null;
      return {
        uid: String(module.uid || `${Date.now().toString(36)}-${Math.floor(this.rng() * 1e6).toString(36)}`),
        slot,
        rarity: String(module.rarity || "common"),
        rarityLabel: String(module.rarityLabel || "Common"),
        color: String(module.color || "#d8f5ff"),
        name: String(module.name || "Recovered Module"),
        baseName: String(module.baseName || "Module"),
        setTag: module.setTag ? String(module.setTag) : null,
        affixes: Array.isArray(module.affixes)
          ? module.affixes.map((affix) => ({
              id: String(affix.id || "affix"),
              name: String(affix.name || "Affix"),
              setTag: affix.setTag ? String(affix.setTag) : null
            }))
          : [],
        modifiers: module.modifiers && typeof module.modifiers === "object" ? { ...module.modifiers } : {},
        sellValue: Math.max(0, Math.floor(Number(module.sellValue) || 0)),
        salvageValue: Math.max(0, Math.floor(Number(module.salvageValue) || 0)),
        level: Math.max(1, Math.floor(Number(module.level) || 1))
      };
    }

    sanitizeProfile(rawProfile) {
      const defaults = this.getDefaultProfile();
      if (!rawProfile || typeof rawProfile !== "object") return defaults;

      const safe = deepClone(defaults);
      const progression = rawProfile.progression || {};
      const stats = rawProfile.stats || {};

      const validPrimary = this.config.loadout.primary[progression.loadout?.primaryId];
      const validSecondary = this.config.loadout.secondary[progression.loadout?.secondaryId];
      const validUtility = this.config.loadout.utility[progression.loadout?.utilityId];
      safe.progression.loadout.primaryId = validPrimary ? progression.loadout.primaryId : defaults.progression.loadout.primaryId;
      safe.progression.loadout.secondaryId = validSecondary
        ? progression.loadout.secondaryId
        : defaults.progression.loadout.secondaryId;
      safe.progression.loadout.utilityId = validUtility ? progression.loadout.utilityId : defaults.progression.loadout.utilityId;

      const mergeUnlockMap = (target, source) => {
        const merged = { ...target };
        if (source && typeof source === "object") {
          for (const key of Object.keys(merged)) {
            if (key in source) merged[key] = Boolean(source[key]);
          }
        }
        return merged;
      };
      safe.progression.unlocks.primary = mergeUnlockMap(defaults.progression.unlocks.primary, progression.unlocks?.primary);
      safe.progression.unlocks.secondary = mergeUnlockMap(
        defaults.progression.unlocks.secondary,
        progression.unlocks?.secondary
      );
      safe.progression.unlocks.utility = mergeUnlockMap(defaults.progression.unlocks.utility, progression.unlocks?.utility);

      safe.progression.upgrades.fireRateLevel = this.clamp(
        Math.floor(Number(progression.upgrades?.fireRateLevel) || 0),
        0,
        this.config.hangar.maxFireRateLevel
      );
      safe.progression.upgrades.magazineLevel = this.clamp(
        Math.floor(Number(progression.upgrades?.magazineLevel) || 0),
        0,
        this.config.hangar.maxMagazineLevel
      );

      const inventoryRaw = Array.isArray(progression.inventory) ? progression.inventory : [];
      safe.progression.inventory = inventoryRaw
        .map((module) => this.sanitizeModule(module))
        .filter(Boolean)
        .slice(0, this.config.loot.maxInventoryItems);

      const equipmentRaw = progression.equipment && typeof progression.equipment === "object" ? progression.equipment : {};
      for (const slot of this.config.loot.slots) {
        safe.progression.equipment[slot] = this.sanitizeModule(equipmentRaw[slot]);
      }

      safe.progression.salvageParts = Math.max(0, Math.floor(Number(progression.salvageParts) || 0));

      safe.stats.runsPlayed = Math.max(0, Math.floor(Number(stats.runsPlayed) || 0));
      safe.stats.totalPlaySeconds = Math.max(0, Number(stats.totalPlaySeconds) || 0);
      safe.stats.bestScore = Math.max(0, Math.floor(Number(stats.bestScore) || 0));
      safe.stats.bestSector = Math.max(1, Math.floor(Number(stats.bestSector) || 1));
      safe.stats.lifetimeScore = Math.max(0, Math.floor(Number(stats.lifetimeScore) || 0));

      safe.schemaVersion = PROFILE_SCHEMA_VERSION;
      safe.updatedAt = Date.now();
      return safe;
    }

    loadProfile() {
      const defaults = this.getDefaultProfile();
      try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return defaults;
        if (parsed.schemaVersion !== PROFILE_SCHEMA_VERSION) return this.sanitizeProfile(parsed);
        return this.sanitizeProfile(parsed);
      } catch (error) {
        console.warn("Profile load failed, using defaults.", error);
        return defaults;
      }
    }

    captureProgressionSnapshot() {
      return {
        loadout: {
          primaryId: this.model.loadout.primaryId,
          secondaryId: this.model.loadout.secondaryId,
          utilityId: this.model.loadout.utilityId
        },
        unlocks: deepClone(this.model.unlocks),
        upgrades: deepClone(this.model.upgrades),
        inventory: deepClone(this.model.inventory),
        equipment: deepClone(this.model.equipment),
        salvageParts: this.model.salvageParts
      };
    }

    applyProfileToModel(profile) {
      const progression = profile.progression;
      this.model.loadout.primaryId = progression.loadout.primaryId;
      this.model.loadout.secondaryId = progression.loadout.secondaryId;
      this.model.loadout.utilityId = progression.loadout.utilityId;
      this.model.unlocks = deepClone(progression.unlocks);
      this.model.upgrades = deepClone(progression.upgrades);
      this.model.inventory = deepClone(progression.inventory);
      this.model.equipment = deepClone(progression.equipment);
      this.model.salvageParts = progression.salvageParts;
      this.syncLoadoutLabels();
      this.refreshSetState();
    }

    syncModelToProfile() {
      this.model.profile.progression = this.captureProgressionSnapshot();
      this.model.profile.updatedAt = Date.now();
    }

    saveProfile(reason = "manual") {
      this.syncModelToProfile();
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.model.profile));
      } catch (error) {
        console.warn(`Profile save failed (${reason}).`, error);
      }
    }

    updateProfileStatsOnRunStart() {
      this.model.profile.stats.runsPlayed += 1;
      this.model.profile.updatedAt = Date.now();
    }

    updateProfileStatsOnRunEnd() {
      const stats = this.model.profile.stats;
      stats.totalPlaySeconds += this.model.runtimeSeconds;
      stats.bestScore = Math.max(stats.bestScore, this.model.score);
      stats.bestSector = Math.max(stats.bestSector, this.model.sector);
      stats.lifetimeScore += this.model.score;
      this.model.profile.updatedAt = Date.now();
    }

    initGame() {
      this.canvas.width = this.config.canvas.width;
      this.canvas.height = this.config.canvas.height;
      if (typeof validateGameConfig === "function") validateGameConfig(this.config);
      this.model.ship = createShip(this.config);
      this.model.profile = this.loadProfile();
      this.applyProfileToModel(this.model.profile);
      this.initializeShipResources(this.model.ship);
      this.model.runSeed = generateRunSeed();
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

      if (this.model.gameState === GAME_STATE.HANGAR) {
        this.hangarSystem.handleHangarInput();
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
      this.updateProfileStatsOnRunStart();
      this.saveProfile("run_start");
      this.input.reset();
      this.model.gameState = GAME_STATE.PLAYING;
      this.hud.sync(this.model);
    }

    endGame() {
      this.updateProfileStatsOnRunEnd();
      this.saveProfile("game_over");
      this.input.reset();
      this.model.gameState = GAME_STATE.GAME_OVER;
      this.hud.sync(this.model);
    }

    resetGame(seed) {
      const telemetryEnabled = this.model.telemetry.enabled;
      this.model.score = 0;
      this.model.credits = 0;
      this.model.sector = 1;
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
      this.model.sectorTimerMs = 0;
      this.model.runtimeSeconds = 0;
      this.model.comboCount = 0;
      this.model.comboMultiplier = 1;
      this.model.comboTimer = 0;
      this.model.comboScoringEnabled = this.config.arcadeMutators.comboScoringEnabled;
      this.model.sectorCompletionHandled = false;
      this.model.missionTimer = 0;
      this.model.missionSpawnTimer = 0;
      this.model.missionSpawnBudget = 0;
      this.model.missionUfoKills = 0;
      this.model.missionAsteroidKills = 0;
      this.model.currentMission = null;
      this.model.flightModel = "arcade";
      this.model.dotEffects = [];
      this.model.hangar.message = "Hangar: 1-3 upgrade, 4 primary, 5 secondary, R utility, 6/7 select, 8 take/equip, 9 sell, 0 salvage, Enter start.";
      this.model.hangar.lootCrate = [];
      this.model.hangar.selectionSource = "crate";
      this.model.hangar.selectionIndex = 0;
      this.applyProfileToModel(this.model.profile);
      this.model.runSeed = seed >>> 0;
      this.model.telemetry = createTelemetryState(telemetryEnabled);
      this.rng = createSeededRng(this.model.runSeed);
      this.initializeShipResources(this.model.ship);
      this.enemySystem.scheduleNextUfoSpawn();
      this.missionSystem.startMission(this.model.sector);
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

    getRarityDef(rarityId) {
      return this.config.loot.rarities.find((rarity) => rarity.id === rarityId) ?? this.config.loot.rarities[0];
    }

    getSetCountMap() {
      const counts = {};
      for (const slot of Object.keys(this.model.equipment)) {
        const module = this.model.equipment[slot];
        const setTag = module?.setTag;
        if (!setTag) continue;
        counts[setTag] = (counts[setTag] ?? 0) + 1;
      }
      return counts;
    }

    getActiveSets() {
      const countMap = this.getSetCountMap();
      const entries = [];
      for (const setId of Object.keys(this.config.loot.setBonuses || {})) {
        const count = countMap[setId] ?? 0;
        if (count < 2) continue;
        const tier = count >= 3 ? 3 : 2;
        const setDef = this.config.loot.setBonuses[setId];
        entries.push({
          id: setId,
          label: setDef.label,
          count,
          tier,
          modifiers: { ...(setDef.tiers[tier] || {}) }
        });
      }
      return entries;
    }

    getSetStatusText() {
      if (!this.model.activeSets.length) return "No active set";
      return this.model.activeSets.map((entry) => `${entry.label} ${entry.count}/3 (T${entry.tier})`).join(" | ");
    }

    refreshSetState() {
      this.model.activeSets = this.getActiveSets();
      this.model.setStatusText = this.getSetStatusText();
    }

    getModuleModifiers() {
      const totals = {
        hullPct: 0,
        shieldPct: 0,
        energyPct: 0,
        shieldRegenPct: 0,
        energyRegenPct: 0,
        heatDissipationPct: 0,
        thrustPct: 0,
        rotationAccelPct: 0,
        rotationSpeedPct: 0,
        maxSpeedPct: 0,
        primaryCooldownPct: 0,
        secondaryCooldownPct: 0,
        utilityCooldownPct: 0,
        primaryDamagePct: 0,
        critChanceFlat: 0,
        collisionResist: 0,
        plasmaResist: 0,
        salvageYieldPct: 0,
        creditsGainPct: 0
      };

      for (const slot of Object.keys(this.model.equipment)) {
        const module = this.model.equipment[slot];
        if (!module?.modifiers) continue;
        const modifiers = module.modifiers;
        for (const key of Object.keys(modifiers)) {
          if (!(key in totals)) totals[key] = 0;
          totals[key] += modifiers[key];
        }
      }

      this.refreshSetState();
      for (const activeSet of this.model.activeSets) {
        const setModifiers = activeSet.modifiers || {};
        for (const key of Object.keys(setModifiers)) {
          if (!(key in totals)) totals[key] = 0;
          totals[key] += setModifiers[key];
        }
      }

      return totals;
    }

    applyPct(baseValue, pctBonus = 0) {
      return baseValue * (1 + pctBonus);
    }

    getCooldownMultiplier(slotKey) {
      const modifiers = this.getModuleModifiers();
      let cooldownPct = 0;
      if (slotKey === "primary") cooldownPct = modifiers.primaryCooldownPct ?? 0;
      if (slotKey === "secondary") cooldownPct = modifiers.secondaryCooldownPct ?? 0;
      if (slotKey === "utility") cooldownPct = modifiers.utilityCooldownPct ?? 0;
      return this.clamp(1 - cooldownPct, 0.35, 2.4);
    }

    getPlayerCritChance() {
      const modifiers = this.getModuleModifiers();
      return this.clamp(this.config.damage.player.critChance + (modifiers.critChanceFlat ?? 0), 0, 0.75);
    }

    getPlayerDamageMultiplier() {
      const modifiers = this.getModuleModifiers();
      return Math.max(0.2, 1 + (modifiers.primaryDamagePct ?? 0));
    }

    rollWeighted(items, weightGetter) {
      const totalWeight = items.reduce((sum, item) => sum + Math.max(0, weightGetter(item)), 0);
      if (totalWeight <= 0) return items[0];
      let roll = this.rng() * totalWeight;
      for (const item of items) {
        roll -= Math.max(0, weightGetter(item));
        if (roll <= 0) return item;
      }
      return items[items.length - 1];
    }

    rollLootRarity() {
      const rarities = this.config.loot.rarities;
      const luck = this.clamp((this.model.sector - 1) * 0.016, 0, 0.42);
      return this.rollWeighted(rarities, (rarity) => {
        if (rarity.id === "common") return rarity.weight * (1 - luck * 1.55);
        if (rarity.id === "uncommon") return rarity.weight * (1 + luck * 0.55);
        if (rarity.id === "rare") return rarity.weight * (1 + luck * 1.25);
        if (rarity.id === "exotic") return rarity.weight * (1 + luck * 1.85);
        if (rarity.id === "prototype") return rarity.weight * (1 + luck * 2.25);
        return rarity.weight * (1 + luck * 2.8);
      });
    }

    mergeModifiers(base, add) {
      const merged = { ...base };
      for (const key of Object.keys(add || {})) {
        merged[key] = (merged[key] ?? 0) + add[key];
      }
      return merged;
    }

    createModuleDrop() {
      const slot = this.config.loot.slots[Math.floor(this.rng() * this.config.loot.slots.length)];
      const bases = this.config.loot.basesBySlot[slot];
      const base = bases[Math.floor(this.rng() * bases.length)];
      const rarity = this.rollLootRarity();
      const affixPool = this.config.loot.affixes.filter((affix) => affix.slots.includes(slot));
      const affixes = [];
      let modifiers = { ...(base.modifiers || {}) };
      const targetAffixes = Math.min(rarity.affixCount, affixPool.length);

      while (affixes.length < targetAffixes) {
        const candidate = affixPool[Math.floor(this.rng() * affixPool.length)];
        if (affixes.some((affix) => affix.id === candidate.id)) continue;
        affixes.push(candidate);
        modifiers = this.mergeModifiers(modifiers, candidate.modifiers);
      }

      if (targetAffixes > 0 && this.rng() < 0.45) {
        const setAffixes = affixPool.filter((affix) => affix.setTag);
        if (setAffixes.length > 0 && !affixes.some((affix) => affix.setTag)) {
          const setAffix = setAffixes[Math.floor(this.rng() * setAffixes.length)];
          const replaceIndex = affixes.length > 0 ? Math.floor(this.rng() * affixes.length) : -1;
          if (replaceIndex >= 0) affixes[replaceIndex] = setAffix;
          else affixes.push(setAffix);
          modifiers = { ...(base.modifiers || {}) };
          for (const affix of affixes) modifiers = this.mergeModifiers(modifiers, affix.modifiers);
        }
      }

      const setTag = affixes.find((affix) => affix.setTag)?.setTag ?? null;

      const valueBase = 45 + this.model.sector * 8;
      const sellValue = Math.max(
        20,
        Math.round((valueBase + affixes.length * 14) * rarity.valueMult * this.config.economy.moduleSellValueMultiplier)
      );
      const salvageValue = Math.max(1, Math.round(rarity.salvage + affixes.length * 2));

      return {
        uid: `${Date.now().toString(36)}-${Math.floor(this.rng() * 1e6).toString(36)}`,
        slot,
        rarity: rarity.id,
        rarityLabel: rarity.label,
        color: rarity.color,
        name: `${rarity.label} ${base.name}`,
        baseName: base.name,
        setTag,
        affixes: affixes.map((affix) => ({ id: affix.id, name: affix.name, setTag: affix.setTag || null })),
        modifiers,
        sellValue,
        salvageValue,
        level: this.model.sector
      };
    }

    tryDropModule(source, detail) {
      const lootCfg = this.config.loot.dropChance;
      let chance = 0;
      if (source === "asteroid") chance = lootCfg.asteroid[detail] ?? 0;
      else if (source === "ufo") chance = lootCfg.ufo[detail] ?? 0;
      else if (source === "miniBoss") chance = lootCfg.miniBoss;
      if (this.rng() > chance) return;

      const drop = this.createModuleDrop();
      this.model.hangar.lootCrate.push(drop);
      this.model.hangar.message = `Recovered module: ${drop.name}`;
      if (this.model.hangar.lootCrate.length === 1 && this.model.hangar.selectionSource === "crate") {
        this.model.hangar.selectionIndex = 0;
      }
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
      const baseProfile = this.config.ship.flightModel[this.model.flightModel] ?? this.config.ship.flightModel.arcade;
      const modifiers = this.getModuleModifiers();
      return {
        ...baseProfile,
        thrust: this.applyPct(baseProfile.thrust, modifiers.thrustPct),
        maxSpeed: this.applyPct(baseProfile.maxSpeed, modifiers.maxSpeedPct),
        rotationAcceleration: this.applyPct(baseProfile.rotationAcceleration, modifiers.rotationAccelPct),
        rotationSpeed: this.applyPct(baseProfile.rotationSpeed, modifiers.rotationSpeedPct)
      };
    }

    toggleFlightModel() {
      this.model.flightModel = this.model.flightModel === "arcade" ? "sim_lite" : "arcade";
    }

    initializeShipResources(ship) {
      if (!ship) return;
      const modifiers = this.getModuleModifiers();
      ship.hullMax = Math.round(this.applyPct(this.config.ship.baseHull, modifiers.hullPct));
      ship.hull = ship.hullMax;
      ship.shieldMax = Math.round(this.applyPct(this.config.ship.baseShield, modifiers.shieldPct));
      ship.shield = ship.shieldMax;
      ship.energyMax = Math.round(this.applyPct(this.config.ship.baseEnergy, modifiers.energyPct));
      ship.energy = ship.energyMax;
      ship.heatMax = this.config.ship.baseHeat;
      ship.heat = 0;
      ship.lastDamageAt = -999;
    }

    updateShipResources(dt) {
      const ship = this.model.ship;
      if (!ship) return;

      const cfg = this.config.ship;
      const modifiers = this.getModuleModifiers();
      ship.energy = Math.min(
        ship.energyMax,
        ship.energy + this.applyPct(cfg.energyRegenPerSecond, modifiers.energyRegenPct) * dt
      );
      ship.heat = Math.max(0, ship.heat - this.applyPct(cfg.heatDissipationPerSecond, modifiers.heatDissipationPct) * dt);

      const sinceDamage = this.model.runtimeSeconds - ship.lastDamageAt;
      if (sinceDamage >= cfg.shieldRegenDelaySeconds) {
        ship.shield = Math.min(
          ship.shieldMax,
          ship.shield + this.applyPct(cfg.shieldRegenPerSecond, modifiers.shieldRegenPct) * dt
        );
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

    resolvePlayerDamage(baseDamage, damageType = "kinetic", critChance = this.getPlayerCritChance()) {
      const isCrit = this.rng() < this.clamp(critChance, 0, 1);
      const critMultiplier = this.config.damage.player.critMultiplier ?? this.config.damage.critMultiplier;
      return {
        damageType,
        damage: Math.max(0, baseDamage * this.getPlayerDamageMultiplier() * (isCrit ? critMultiplier : 1)),
        isCrit
      };
    }

    applyDamageToShip(profileId, overrides = {}) {
      const ship = this.model.ship;
      if (!ship) return false;
      if (!overrides.bypassInvulnerability && ship.invulnMs > 0) return false;

      const event = this.createDamageEvent(profileId, overrides);
      const modifiers = this.getModuleModifiers();
      const resistProfile = {
        ...this.config.damage.shipResist,
        collision: this.clamp((this.config.damage.shipResist.collision ?? 0) + (modifiers.collisionResist ?? 0), 0, 0.9),
        plasma: this.clamp((this.config.damage.shipResist.plasma ?? 0) + (modifiers.plasmaResist ?? 0), 0, 0.9)
      };
      const resolved = this.resolveDamage(event, resistProfile);
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

    applyDamageToMiniBoss(baseDamage, damageType = "kinetic", critChance = this.getPlayerCritChance()) {
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
      if (!this.model.comboScoringEnabled) {
        this.model.comboCount = 0;
        this.model.comboMultiplier = 1;
        this.model.comboTimer = 0;
        return;
      }
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
      if (this.model.comboScoringEnabled) {
        if (incrementCombo) this.bumpCombo();
        else if (this.model.comboCount > 0) this.model.comboTimer = this.config.combo.resetSeconds;
      }

      const missionType = this.model.currentMission?.type;
      const scoreMissionMult = this.config.mission.rewards.scoreByType[missionType] ?? 1;
      const creditsMissionMult = this.config.mission.rewards.creditsByType[missionType] ?? 1;
      const modifiers = this.getModuleModifiers();
      const comboMultiplier = this.model.comboScoringEnabled ? this.model.comboMultiplier : 1;
      const scored = Math.round(basePoints * comboMultiplier * scoreMissionMult);
      this.model.score += scored;
      this.model.telemetry.scoreEarned += scored;
      const creditsGain = Math.max(
        this.config.economy.minCreditsPerKill,
        Math.floor(basePoints * this.config.economy.creditsPerScore * creditsMissionMult * (1 + (modifiers.creditsGainPct ?? 0)))
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
        sector: this.model.sector,
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
        sector: active.sector,
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
      const primary = this.getPrimarySpec();
      const factor = Math.pow(this.config.hangar.fireRateFactorPerLevel, this.model.upgrades.fireRateLevel);
      const ship = this.model.ship;
      const softThreshold = this.config.ship.overheatSoftThreshold;
      const overheatRatio =
        ship && ship.heat > softThreshold ? (ship.heat - softThreshold) / (ship.heatMax - softThreshold) : 0;
      const heatPenalty = 1 + overheatRatio * (1 / this.config.ship.overheatPenaltyFactor - 1);
      return primary.cooldownSeconds * factor * heatPenalty * this.getCooldownMultiplier("primary");
    }

    canFirePrimary() {
      const ship = this.model.ship;
      if (!ship) return false;
      const primary = this.getPrimarySpec();
      return this.canSpendShipResources(primary.energyCost, primary.heatGain);
    }

    consumePrimaryShotResources() {
      const primary = this.getPrimarySpec();
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
      const sectorBonus = Math.min(
        this.config.bullet.sectorBonusMax,
        Math.floor((this.model.sector - 1) / this.config.bullet.sectorBonusEverySectors)
      );
      return this.config.bullet.maxActive + this.model.upgrades.magazineLevel + sectorBonus;
    }

    getSecondarySpec() {
      return this.config.loadout.secondary[this.model.loadout.secondaryId];
    }

    getPrimarySpec() {
      return this.config.loadout.primary[this.model.loadout.primaryId];
    }

    getUtilitySpec() {
      return this.config.loadout.utility[this.model.loadout.utilityId];
    }

    awardNearMiss() {
      const ship = this.model.ship;
      if (!ship) return;
      ship.energy = Math.min(ship.energyMax, ship.energy + this.config.combo.nearMissEnergyGain);
      ship.heat = Math.max(0, ship.heat - this.config.combo.nearMissHeatReduction);
      ship.shield = Math.min(ship.shieldMax, ship.shield + this.config.combo.nearMissShieldGain);
      this.emitImpactParticles(ship.x, ship.y, 6, "255,220,140");
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
      this.tryDropModule("asteroid", asteroid.size);

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
      this.tryDropModule("ufo", ufo.mode);
    }

    destroyMiniBoss() {
      if (!this.model.miniBoss) return;
      this.registerScore(this.config.mission.miniBoss.scoreReward, true);
      this.model.telemetry.kills.miniBosses += 1;
      this.emitImpactParticles(this.model.miniBoss.x, this.model.miniBoss.y, 42, "255,114,210");
      this.model.flashMs = Math.max(this.model.flashMs, 230);
      this.model.miniBoss = null;
      this.tryDropModule("miniBoss");
      this.tryDropModule("miniBoss");
    }

    findClosestChainTarget(fromX, fromY, radius) {
      let best = null;
      let bestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < this.model.asteroids.length; i += 1) {
        const asteroid = this.model.asteroids[i];
        const dist = Math.hypot(asteroid.x - fromX, asteroid.y - fromY);
        if (dist <= radius && dist < bestDist) {
          bestDist = dist;
          best = { type: "asteroid", index: i, x: asteroid.x, y: asteroid.y };
        }
      }

      for (let i = 0; i < this.model.ufos.length; i += 1) {
        const ufo = this.model.ufos[i];
        const dist = Math.hypot(ufo.x - fromX, ufo.y - fromY);
        if (dist <= radius && dist < bestDist) {
          bestDist = dist;
          best = { type: "ufo", index: i, x: ufo.x, y: ufo.y };
        }
      }

      if (this.model.miniBoss) {
        const boss = this.model.miniBoss;
        const dist = Math.hypot(boss.x - fromX, boss.y - fromY);
        if (dist <= radius && dist < bestDist) {
          best = { type: "miniBoss", index: -1, x: boss.x, y: boss.y };
        }
      }

      return best;
    }

    triggerPrimaryChain(fromX, fromY, chainTargets, chainRadius, chainBossDamage = 12) {
      let originX = fromX;
      let originY = fromY;

      for (let step = 0; step < chainTargets; step += 1) {
        const target = this.findClosestChainTarget(originX, originY, chainRadius);
        if (!target) break;

        if (target.type === "asteroid") this.destroyAsteroidByIndex(target.index, true);
        else if (target.type === "ufo") this.destroyUfoByIndex(target.index);
        else if (target.type === "miniBoss") this.applyDamageToMiniBoss(chainBossDamage, "plasma", 0.06);

        this.emitImpactParticles(target.x, target.y, 8, "122,228,255");
        originX = target.x;
        originY = target.y;
      }
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
