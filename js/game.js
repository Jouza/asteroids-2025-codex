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

  function tr(key, params = {}) {
    if (typeof window.Asteroids?.t === "function") return window.Asteroids.t(key, params);
    const dict = window.Asteroids?.i18n?.dictionaries?.en || {};
    const template = dict[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, p) => (params[p] != null ? String(params[p]) : `{${p}}`));
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

  function createPerformanceState(enabled = false) {
    const createTimingBucket = () => ({
      last: 0,
      avg: 0,
      max: 0,
      p95: 0,
      samples: []
    });
    return {
      enabled,
      frameMs: 0,
      fps: 0,
      avgFrameMs: 0,
      avgFps: 0,
      maxFrameMs: 0,
      stepsLastFrame: 0,
      avgSteps: 0,
      frameCount: 0,
      qualityLevel: "high",
      downshiftCounter: 0,
      upshiftCounter: 0,
      thresholds: {
        downshiftMs: 20,
        upshiftMs: 14
      },
      windows: {
        downshiftFrames: 45,
        upshiftFrames: 180
      },
      objects: {
        particles: 0,
        bullets: 0,
        enemyBullets: 0,
        utilityEffects: 0,
        asteroids: 0,
        ufos: 0
      },
      dropped: {
        particles: 0,
        bullets: 0,
        enemyBullets: 0,
        utilityEffects: 0
      },
      timings: {
        updateMs: createTimingBucket(),
        renderMs: createTimingBucket(),
        sections: {}
      }
    };
  }

  function createDefaultPilotProgression() {
    return {
      level: 1,
      xp: 0,
      xpToNext: 120,
      attributePoints: 0,
      skillPoints: 0,
      attributes: {
        reflex: 0,
        systems: 0,
        grit: 0,
        instinct: 0
      },
      unlockedPerks: []
    };
  }

  function createDefaultIdentitySelection() {
    return {
      pilotId: "buzz_calder",
      shipId: "viper_mk2"
    };
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
          },
          endlessMode: false
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
        identity: createDefaultIdentitySelection(),
        salvageParts: 0,
        pilot: createDefaultPilotProgression()
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
    constructor(canvas, renderer, hud, input, config = GAME_CONFIG, audio = null) {
      this.canvas = canvas;
      this.renderer = renderer;
      this.hud = hud;
      this.input = input;
      this.config = config;
      this.audio =
        audio ||
        {
          play() {},
          unlock() {},
          toggleMuted() {
            return false;
          },
          isMuted() {
            return false;
          }
        };
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
        hitstopSeconds: 0,
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
        runMode: "campaign",
        endlessUnlocked: false,
        victorySummary: null,
        missionCompleteSummary: null,
        flightModel: "arcade",
        dotEffects: [],
        pointer: {
          x: 0,
          y: 0,
          inside: false
        },
        hangar: {
          message: tr("game.hangar.controls"),
          lootCrate: [],
          selectionSource: "crate",
          selectionIndex: 0,
          pilotAttrIndex: 0,
          pilotPerkIndex: 0,
          navSection: "shop",
          shopIndex: 0,
          pilotCursor: 0
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
          },
          endlessMode: false
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
        setStatusText: tr("hud.no_active_set"),
        pilot: createDefaultPilotProgression(),
        identity: createDefaultIdentitySelection(),
        identityStatusText: tr("hud.identity_unknown"),
        overlaySettingsRow: 0,
        salvageParts: 0,
        telemetry: createTelemetryState(false),
        performance: createPerformanceState(false),
        profile: createDefaultProfile(),
        uiAlerts: {
          lowHull: false,
          lowEnergy: false,
          highHeat: false,
          shieldBroken: false,
          dashReady: true,
          secondaryReady: true,
          utilityReady: true
        }
      };

      this.missionSystem = new MissionSystem(this);
      this.hangarSystem = new HangarSystem(this);
      this.combatSystem = new CombatSystem(this);
      this.enemySystem = new EnemySystem(this);
      this.identityMigrationNoticePending = false;

      this.attachPointerTracking();
    }

    attachPointerTracking() {
      if (!this.canvas || typeof this.canvas.addEventListener !== "function") return;
      const updatePointer = (event) => {
        if (typeof this.canvas.getBoundingClientRect !== "function") return;
        const rect = this.canvas.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return;
        const scaleX = this.config.canvas.width / rect.width;
        const scaleY = this.config.canvas.height / rect.height;
        this.model.pointer.x = (event.clientX - rect.left) * scaleX;
        this.model.pointer.y = (event.clientY - rect.top) * scaleY;
        this.model.pointer.inside = true;
      };
      this.canvas.addEventListener("mousemove", updatePointer);
      this.canvas.addEventListener("mouseenter", updatePointer);
      this.canvas.addEventListener("mouseleave", () => {
        this.model.pointer.inside = false;
      });
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
      safe.progression.unlocks.endlessMode = Boolean(
        progression.unlocks?.endlessMode ?? defaults.progression.unlocks.endlessMode
      );

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

      const identityPilotDefs = this.getIdentityPilotDefs();
      const identityShipDefs = this.getIdentityShipDefs();
      const identityRaw = progression.identity && typeof progression.identity === "object" ? progression.identity : {};
      const fallbackIdentity = createDefaultIdentitySelection();
      const validPilot = identityPilotDefs.some((entry) => entry.id === identityRaw.pilotId);
      const validShip = identityShipDefs.some((entry) => entry.id === identityRaw.shipId);
      safe.progression.identity = {
        pilotId: validPilot ? identityRaw.pilotId : fallbackIdentity.pilotId,
        shipId: validShip ? identityRaw.shipId : fallbackIdentity.shipId
      };

      safe.progression.salvageParts = Math.max(0, Math.floor(Number(progression.salvageParts) || 0));

      const defaultPilot = createDefaultPilotProgression();
      const pilotRaw = progression.pilot && typeof progression.pilot === "object" ? progression.pilot : {};
      safe.progression.pilot = deepClone(defaultPilot);
      safe.progression.pilot.level = this.clamp(
        Math.floor(Number(pilotRaw.level) || defaultPilot.level),
        1,
        this.config.pilot.maxLevel
      );
      safe.progression.pilot.xpToNext = Math.max(1, Math.floor(Number(pilotRaw.xpToNext) || defaultPilot.xpToNext));
      safe.progression.pilot.xp = this.clamp(
        Math.floor(Number(pilotRaw.xp) || 0),
        0,
        safe.progression.pilot.xpToNext
      );
      safe.progression.pilot.attributePoints = Math.max(0, Math.floor(Number(pilotRaw.attributePoints) || 0));
      safe.progression.pilot.skillPoints = Math.max(0, Math.floor(Number(pilotRaw.skillPoints) || 0));
      const attributeCaps = this.config.pilot.attributeCaps;
      for (const key of Object.keys(defaultPilot.attributes)) {
        const cap = attributeCaps[key] ?? 25;
        safe.progression.pilot.attributes[key] = this.clamp(
          Math.floor(Number(pilotRaw.attributes?.[key]) || 0),
          0,
          cap
        );
      }
      const validPerkIds = new Set((this.config.pilot.perks || []).map((perk) => perk.id));
      safe.progression.pilot.unlockedPerks = Array.isArray(pilotRaw.unlockedPerks)
        ? pilotRaw.unlockedPerks.filter((id) => validPerkIds.has(id))
        : [];

      safe.stats.runsPlayed = Math.max(0, Math.floor(Number(stats.runsPlayed) || 0));
      safe.stats.totalPlaySeconds = Math.max(0, Number(stats.totalPlaySeconds) || 0);
      safe.stats.bestScore = Math.max(0, Math.floor(Number(stats.bestScore) || 0));
      safe.stats.bestSector = Math.max(1, Math.floor(Number(stats.bestSector) || 1));
      safe.stats.lifetimeScore = Math.max(0, Math.floor(Number(stats.lifetimeScore) || 0));

      safe.schemaVersion = PROFILE_SCHEMA_VERSION;
      safe.updatedAt = Date.now();
      return safe;
    }

    shouldNotifyIdentityMigration(rawProfile) {
      const identityRaw = rawProfile?.progression?.identity;
      if (!identityRaw || typeof identityRaw !== "object") return false;
      const hasPilotId = typeof identityRaw.pilotId === "string";
      const hasShipId = typeof identityRaw.shipId === "string";
      if (!hasPilotId && !hasShipId) return false;
      const identityPilotDefs = this.getIdentityPilotDefs();
      const identityShipDefs = this.getIdentityShipDefs();
      const validPilot = !hasPilotId || identityPilotDefs.some((entry) => entry.id === identityRaw.pilotId);
      const validShip = !hasShipId || identityShipDefs.some((entry) => entry.id === identityRaw.shipId);
      return !validPilot || !validShip;
    }

    loadProfile() {
      const defaults = this.getDefaultProfile();
      this.identityMigrationNoticePending = false;
      try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return defaults;
        this.identityMigrationNoticePending = this.shouldNotifyIdentityMigration(parsed);
        if (parsed.schemaVersion !== PROFILE_SCHEMA_VERSION) return this.sanitizeProfile(parsed);
        return this.sanitizeProfile(parsed);
      } catch (error) {
        console.warn("Profile load failed, using defaults.", error);
        this.identityMigrationNoticePending = false;
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
        identity: deepClone(this.model.identity),
        salvageParts: this.model.salvageParts,
        pilot: deepClone(this.model.pilot)
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
      this.model.identity = deepClone(progression.identity || createDefaultIdentitySelection());
      this.model.salvageParts = progression.salvageParts;
      this.model.pilot = deepClone(progression.pilot || createDefaultPilotProgression());
      this.model.endlessUnlocked = Boolean(progression.unlocks?.endlessMode);
      if (!this.model.endlessUnlocked) this.model.runMode = "campaign";
      this.syncIdentitySelectionState();
      this.syncLoadoutLabels();
      this.refreshSetState();
      if (this.identityMigrationNoticePending) {
        this.model.hangar.message = tr("game.identity.migrated_default");
        this.identityMigrationNoticePending = false;
      }
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
      if (typeof this.audio.updateBiomeAmbience === "function") {
        this.audio.updateBiomeAmbience(1 / 60, {
          gameState: this.model.gameState,
          mission: this.model.currentMission
        });
      }
      if (this.input.wasPressed("F3")) {
        this.model.telemetry.enabled = !this.model.telemetry.enabled;
      }
      if (this.input.wasPressed("KeyB")) {
        this.model.performance.enabled = !this.model.performance.enabled;
      }
      if (this.input.wasPressed("KeyN")) {
        this.dumpPerformanceSnapshot();
      }
      if (this.input.wasPressed("KeyF")) {
        this.toggleFlightModel();
      }
      if (this.input.wasPressed("KeyM")) {
        const muted = this.audio.toggleMuted();
        this.model.hangar.message = muted ? tr("game.audio.muted") : tr("game.audio.enabled");
      }

      if (this.model.gameState === GAME_STATE.HANGAR) {
        this.hangarSystem.handleHangarInput();
        this.hud.sync(this.model);
        return;
      }

      const canToggleRunMode =
        this.model.gameState === GAME_STATE.START ||
        this.model.gameState === GAME_STATE.GAME_OVER;
      if (canToggleRunMode) {
        if (this.input.wasPressed("ArrowUp")) this.cycleOverlaySettingsRow(-1);
        if (this.input.wasPressed("ArrowDown")) this.cycleOverlaySettingsRow(1);
        if (this.input.wasPressed("ArrowLeft")) this.adjustSelectedOverlaySetting(-1);
        if (this.input.wasPressed("ArrowRight")) this.adjustSelectedOverlaySetting(1);
        if (this.input.wasPressed("KeyE")) {
          const next = this.model.runMode === "campaign" ? "endless" : "campaign";
          this.trySetRunMode(next);
        }
      }

      if (this.input.wasPressed("KeyP")) {
        if (this.model.gameState === GAME_STATE.PLAYING) this.model.gameState = GAME_STATE.PAUSED;
        else if (this.model.gameState === GAME_STATE.PAUSED) this.model.gameState = GAME_STATE.PLAYING;
        this.hud.sync(this.model);
      }

      if (this.input.wasPressed("Enter")) {
        if (this.model.gameState === GAME_STATE.START) {
          this.startGame(this.model.runSeed ?? generateRunSeed());
        } else if (this.model.gameState === GAME_STATE.MISSION_COMPLETE) {
          this.input.reset();
          this.hangarSystem.enterHangarPhase();
          this.hud.sync(this.model);
        } else if (this.model.gameState === GAME_STATE.GAME_OVER) {
          this.startGame(generateRunSeed());
        } else if (this.model.gameState === GAME_STATE.VICTORY) {
          this.input.reset();
          this.model.overlaySettingsRow = 0;
          this.model.gameState = GAME_STATE.START;
          this.model.runSeed = generateRunSeed();
          this.hud.sync(this.model);
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
      this.audio.play("ui_start");
      this.hud.sync(this.model);
    }

    trySetRunMode(mode) {
      if (mode !== "campaign" && mode !== "endless") return false;
      if (mode === "endless" && !this.model.endlessUnlocked) {
        this.model.hangar.message = tr("game.run_mode.locked");
        this.hud.sync(this.model);
        return false;
      }
      if (this.model.runMode === mode) return false;
      this.model.runMode = mode;
      this.model.hangar.message = tr("game.run_mode.changed", { mode: this.model.runMode.toUpperCase() });
      this.hud.sync(this.model);
      return true;
    }

    endRun(state, saveReason, soundCue) {
      this.updateProfileStatsOnRunEnd();
      this.saveProfile(saveReason);
      this.input.reset();
      this.model.gameState = state;
      this.audio.play(soundCue);
      this.hud.sync(this.model);
    }

    endGame() {
      this.endRun(GAME_STATE.GAME_OVER, "game_over", "ui_game_over");
    }

    isCampaignMode() {
      return this.model.runMode === "campaign";
    }

    isFinalEncounter(missionType = this.model.currentMission?.type, sector = this.model.sector) {
      if (!this.isCampaignMode()) return false;
      const runCfg = this.config.run || {};
      const finalSector = Math.max(1, Math.floor(runCfg.finalSector ?? 4));
      const finalMissionType = runCfg.finalMissionType || "mini_boss";
      return sector >= finalSector && missionType === finalMissionType;
    }

    buildVictorySummary() {
      const selectedPilot = this.getSelectedIdentityPilot();
      const selectedShip = this.getSelectedIdentityShip();
      return {
        score: this.model.score,
        sector: this.model.sector,
        runtimeSeconds: this.model.runtimeSeconds,
        identity: {
          pilot: selectedPilot ? tr(`identity.pilot.${selectedPilot.id}.callsign`) : "-",
          ship: selectedShip ? tr(`identity.ship.${selectedShip.id}.name`) : "-"
        },
        loadout: {
          primary: this.model.loadout.primaryLabel,
          secondary: this.model.loadout.secondaryLabel,
          utility: this.model.loadout.utilityLabel
        },
        salvageParts: this.model.salvageParts,
        missionsCompleted: this.model.telemetry.completedMissions,
        miniBossKills: this.model.telemetry.kills.miniBosses
      };
    }

    completeRunVictory() {
      this.model.victorySummary = this.buildVictorySummary();
      if (!this.model.endlessUnlocked) {
        this.model.endlessUnlocked = true;
        this.model.unlocks.endlessMode = true;
        this.model.hangar.message = tr("game.unlock.endless");
      }
      this.endRun(GAME_STATE.VICTORY, "victory", "mission_complete");
    }

    onMissionCompletionResolved() {
      if (this.isFinalEncounter()) {
        this.completeRunVictory();
        return true;
      }
      this.model.missionCompleteSummary = this.buildMissionCompleteSummary();
      this.model.gameState = GAME_STATE.MISSION_COMPLETE;
      this.model.sectorCompletionHandled = true;
      this.model.sectorTimerMs = 0;
      this.input.reset();
      this.hud.sync(this.model);
      return false;
    }

    buildMissionCompleteSummary() {
      const selectedPilot = this.getSelectedIdentityPilot();
      return {
        sector: this.model.sector,
        score: this.model.score,
        pilot: selectedPilot ? tr(`identity.pilot.${selectedPilot.id}.callsign`) : "-"
      };
    }

    resetGame(seed) {
      const telemetryEnabled = this.model.telemetry.enabled;
      const performanceEnabled = this.model.performance.enabled;
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
      this.model.hitstopSeconds = 0;
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
      this.model.victorySummary = null;
      this.model.missionCompleteSummary = null;
      if (!this.model.endlessUnlocked) this.model.runMode = "campaign";
      this.model.flightModel = "arcade";
      this.model.dotEffects = [];
      this.model.hangar.message = tr("game.hangar.controls");
      this.model.hangar.lootCrate = [];
      this.model.hangar.selectionSource = "crate";
      this.model.hangar.selectionIndex = 0;
      this.model.hangar.pilotAttrIndex = 0;
      this.model.hangar.pilotPerkIndex = 0;
      this.model.hangar.navSection = "shop";
      this.model.hangar.shopIndex = 0;
      this.model.hangar.pilotCursor = 0;
      this.model.overlaySettingsRow = 0;
      this.applyProfileToModel(this.model.profile);
      this.model.runSeed = seed >>> 0;
      this.model.telemetry = createTelemetryState(telemetryEnabled);
      this.model.performance = createPerformanceState(performanceEnabled);
      this.model.uiAlerts = {
        lowHull: false,
        lowEnergy: false,
        highHeat: false,
        shieldBroken: false,
        dashReady: true,
        secondaryReady: true,
        utilityReady: true
      };
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
      if (!this.model.activeSets.length) return tr("hud.no_active_set");
      return this.model.activeSets.map((entry) => `${entry.label} ${entry.count}/3 (T${entry.tier})`).join(" | ");
    }

    refreshSetState() {
      this.model.activeSets = this.getActiveSets();
      this.model.setStatusText = this.getSetStatusText();
    }

    getPilotAttributeOrder() {
      return ["reflex", "systems", "grit", "instinct"];
    }

    getIdentityPilotDefs() {
      return this.config.identity?.pilots || [];
    }

    getIdentityShipDefs() {
      return this.config.identity?.ships || [];
    }

    getSelectedIdentityPilot() {
      const defs = this.getIdentityPilotDefs();
      if (!defs.length) return null;
      return defs.find((entry) => entry.id === this.model.identity.pilotId) || defs[0];
    }

    getSelectedIdentityShip() {
      const defs = this.getIdentityShipDefs();
      if (!defs.length) return null;
      return defs.find((entry) => entry.id === this.model.identity.shipId) || defs[0];
    }

    syncIdentitySelectionState() {
      const selectedPilot = this.getSelectedIdentityPilot();
      const selectedShip = this.getSelectedIdentityShip();
      if (selectedPilot) this.model.identity.pilotId = selectedPilot.id;
      if (selectedShip) this.model.identity.shipId = selectedShip.id;
      const pilotLabel = selectedPilot ? tr(`identity.pilot.${selectedPilot.id}.callsign`) : "-";
      const shipLabel = selectedShip ? tr(`identity.ship.${selectedShip.id}.name`) : "-";
      this.model.identityStatusText = tr("hud.identity_status", { pilot: pilotLabel, ship: shipLabel });
    }

    getOverlaySettingRows() {
      return ["mode", "pilot", "ship"];
    }

    cycleOverlaySettingsRow(direction = 1) {
      const rows = this.getOverlaySettingRows();
      const current = this.clamp(this.model.overlaySettingsRow ?? 0, 0, rows.length - 1);
      this.model.overlaySettingsRow = (current + direction + rows.length) % rows.length;
      this.hud.sync(this.model);
    }

    adjustSelectedOverlaySetting(direction = 1) {
      const rows = this.getOverlaySettingRows();
      const current = this.clamp(this.model.overlaySettingsRow ?? 0, 0, rows.length - 1);
      const row = rows[current];
      if (row === "mode") {
        this.trySetRunMode(direction < 0 ? "campaign" : "endless");
        return;
      }
      if (row === "pilot") {
        this.cycleIdentityPilot(direction);
        return;
      }
      if (row === "ship") {
        this.cycleIdentityShip(direction);
      }
    }

    cycleIdentityPilot(direction = 1) {
      const defs = this.getIdentityPilotDefs();
      if (!defs.length) return false;
      const currentIndex = defs.findIndex((entry) => entry.id === this.model.identity.pilotId);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + defs.length) % defs.length;
      this.model.identity.pilotId = defs[nextIndex].id;
      this.syncIdentitySelectionState();
      this.model.hangar.message = tr("game.identity.pilot_changed", {
        pilot: tr(`identity.pilot.${defs[nextIndex].id}.callsign`)
      });
      this.saveProfile("identity_pilot_change");
      this.hud.sync(this.model);
      return true;
    }

    cycleIdentityShip(direction = 1) {
      const defs = this.getIdentityShipDefs();
      if (!defs.length) return false;
      const currentIndex = defs.findIndex((entry) => entry.id === this.model.identity.shipId);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + defs.length) % defs.length;
      this.model.identity.shipId = defs[nextIndex].id;
      this.syncIdentitySelectionState();
      this.model.hangar.message = tr("game.identity.ship_changed", {
        ship: tr(`identity.ship.${defs[nextIndex].id}.name`)
      });
      this.saveProfile("identity_ship_change");
      this.hud.sync(this.model);
      return true;
    }

    getPilotPerkDefs() {
      return this.config.pilot.perks || [];
    }

    getPilotSelectedPerk() {
      const perks = this.getPilotPerkDefs();
      if (!perks.length) return null;
      const index = this.clamp(this.model.hangar.pilotPerkIndex ?? 0, 0, perks.length - 1);
      return perks[index];
    }

    getPilotAttributeBonuses() {
      const effects = this.config.pilot.attributeEffects;
      const attrs = this.model.pilot.attributes;
      const totals = {};
      const addScaled = (source, points) => {
        for (const key of Object.keys(source || {})) {
          totals[key] = (totals[key] ?? 0) + source[key] * points;
        }
      };
      addScaled(effects.reflex, attrs.reflex);
      addScaled(effects.systems, attrs.systems);
      addScaled(effects.grit, attrs.grit);
      addScaled(effects.instinct, attrs.instinct);
      return totals;
    }

    getPilotPerkBonuses() {
      const unlocked = new Set(this.model.pilot.unlockedPerks || []);
      const totals = {};
      for (const perk of this.getPilotPerkDefs()) {
        if (!unlocked.has(perk.id)) continue;
        for (const key of Object.keys(perk.modifiers || {})) {
          totals[key] = (totals[key] ?? 0) + perk.modifiers[key];
        }
      }
      return totals;
    }

    getPilotXpToNext(level = this.model.pilot.level) {
      const xpCfg = this.config.pilot.xp;
      const curve = Math.round(xpCfg.base * Math.pow(xpCfg.growth, Math.max(0, level - 1)));
      return this.clamp(curve, 50, 50000);
    }

    grantPilotXp(amount, reason = "generic") {
      if (amount <= 0) return;
      const pilot = this.model.pilot;
      const maxLevel = this.config.pilot.maxLevel;
      if (pilot.level >= maxLevel) return;
      pilot.xp += Math.floor(amount);
      let leveled = false;
      while (pilot.level < maxLevel && pilot.xp >= pilot.xpToNext) {
        pilot.xp -= pilot.xpToNext;
        pilot.level += 1;
        pilot.attributePoints += 1;
        if (pilot.level % this.config.pilot.xp.skillPointEveryLevels === 0) {
          pilot.skillPoints += 1;
        }
        pilot.xpToNext = this.getPilotXpToNext(pilot.level);
        leveled = true;
      }
      if (pilot.level >= maxLevel) {
        pilot.level = maxLevel;
        pilot.xp = 0;
        pilot.xpToNext = this.getPilotXpToNext(maxLevel);
      }
      if (leveled) {
        this.model.hangar.message = `Pilot level ${pilot.level}. +${pilot.attributePoints} attr / +${pilot.skillPoints} skill points available.`;
        this.saveProfile(`pilot_level_${reason}`);
      }
    }

    canUnlockPilotPerk(perk) {
      if (!perk) return false;
      const pilot = this.model.pilot;
      if (pilot.skillPoints <= 0) return false;
      if ((pilot.unlockedPerks || []).includes(perk.id)) return false;
      if (pilot.level < (perk.levelReq ?? 1)) return false;
      for (const key of Object.keys(perk.requires || {})) {
        if ((pilot.attributes[key] ?? 0) < perk.requires[key]) return false;
      }
      return true;
    }

    unlockPilotPerk(perkId) {
      const perk = this.getPilotPerkDefs().find((entry) => entry.id === perkId);
      if (!this.canUnlockPilotPerk(perk)) return false;
      this.model.pilot.skillPoints -= 1;
      this.model.pilot.unlockedPerks.push(perk.id);
      this.initializeShipResources(this.model.ship);
      this.model.hangar.message = `Perk unlocked: ${perk.label}`;
      this.saveProfile("pilot_perk_unlock");
      return true;
    }

    spendPilotAttributePoint(attributeKey) {
      const pilot = this.model.pilot;
      const caps = this.config.pilot.attributeCaps;
      if (pilot.attributePoints <= 0) return false;
      if (!(attributeKey in pilot.attributes)) return false;
      const cap = caps[attributeKey] ?? 25;
      if (pilot.attributes[attributeKey] >= cap) return false;
      pilot.attributePoints -= 1;
      pilot.attributes[attributeKey] += 1;
      this.initializeShipResources(this.model.ship);
      this.model.hangar.message = `Attribute upgraded: ${attributeKey} (${pilot.attributes[attributeKey]})`;
      this.saveProfile("pilot_attr_upgrade");
      return true;
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

      const pilotAttrBonuses = this.getPilotAttributeBonuses();
      for (const key of Object.keys(pilotAttrBonuses)) {
        if (!(key in totals)) totals[key] = 0;
        totals[key] += pilotAttrBonuses[key];
      }

      const pilotPerkBonuses = this.getPilotPerkBonuses();
      for (const key of Object.keys(pilotPerkBonuses)) {
        if (!(key in totals)) totals[key] = 0;
        totals[key] += pilotPerkBonuses[key];
      }

      const identityPilot = this.getSelectedIdentityPilot();
      const identityShip = this.getSelectedIdentityShip();
      const addIdentityModifiers = (source) => {
        for (const key of Object.keys(source || {})) {
          if (!(key in totals)) totals[key] = 0;
          totals[key] += source[key];
        }
      };
      addIdentityModifiers(identityPilot?.modifiers);
      addIdentityModifiers(identityShip?.modifiers);

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
      if (typeof this.audio.updateBiomeAmbience === "function") {
        this.audio.updateBiomeAmbience(dt, {
          gameState: this.model.gameState,
          mission: this.model.currentMission
        });
      }
      const perfEnabled = Boolean(this.model.performance?.enabled);
      let sectionStart = perfEnabled ? this.getNowMs() : 0;

      this.model.runtimeSeconds += dt;
      this.model.telemetry.runTimeSeconds += dt;

      this.model.shootTimer = Math.max(0, this.model.shootTimer - dt);
      this.model.secondaryCooldown = Math.max(0, this.model.secondaryCooldown - dt);
      this.model.utilityCooldown = Math.max(0, this.model.utilityCooldown - dt);
      this.model.dashCooldown = Math.max(0, this.model.dashCooldown - dt);
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("cooldowns", now - sectionStart);
        sectionStart = now;
      }

      if (this.model.hitstopSeconds > 0) {
        this.model.hitstopSeconds = Math.max(0, this.model.hitstopSeconds - dt);
        this.model.flashMs = Math.max(0, this.model.flashMs - dt * 1000);
        this.enforceRuntimeGuards();
        if (perfEnabled) {
          const now = this.getNowMs();
          this.recordSectionTiming("hitstop", now - sectionStart);
          sectionStart = now;
        }
        this.updateUiAlerts();
        this.hud.sync(this.model);
        return;
      }

      if (this.input.isDown("Space") && this.model.shootTimer <= 0) {
        const didFire = this.combatSystem.fireBullet();
        if (didFire) this.model.shootTimer = this.getCurrentBulletCooldown();
      }
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("fire_input", now - sectionStart);
        sectionStart = now;
      }

      this.updateComboTimer(dt);
      this.combatSystem.updateShip(dt);
      this.missionSystem.applyMissionEnvironmentalEffects(dt);
      this.updateShipResources(dt);
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("ship_and_resources", now - sectionStart);
        sectionStart = now;
      }

      this.combatSystem.updateBullets(dt);
      this.combatSystem.updateEnemyBullets(dt);
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("projectiles", now - sectionStart);
        sectionStart = now;
      }

      this.combatSystem.updateAsteroids(dt);
      this.enemySystem.updateUfos(dt);
      this.enemySystem.updateMiniBoss(dt);
      this.updateDotEffects(dt);
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("enemies_and_hazards", now - sectionStart);
        sectionStart = now;
      }

      if (this.model.gameState !== GAME_STATE.PLAYING) {
        this.hud.sync(this.model);
        return;
      }
      this.combatSystem.handleBulletAsteroidCollisions();
      this.combatSystem.handleBulletUfoCollisions();
      this.combatSystem.handleBulletMiniBossCollisions();
      this.combatSystem.handleShipThreatCollisions();
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("collisions", now - sectionStart);
        sectionStart = now;
      }

      this.combatSystem.updateParticles(dt);
      this.combatSystem.updateUtilityEffects(dt);
      this.missionSystem.updateMission(dt);
      this.model.flashMs = Math.max(0, this.model.flashMs - dt * 1000);
      this.enforceRuntimeGuards();
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("effects_and_mission", now - sectionStart);
        sectionStart = now;
      }
      this.updateUiAlerts();

      this.hud.sync(this.model);
      if (perfEnabled) {
        const now = this.getNowMs();
        this.recordSectionTiming("hud_sync", now - sectionStart);
      }
    }

    recordFramePerformance(rawFrameSeconds, stepCount = 0, updateMs = null, renderMs = null) {
      const perf = this.model.performance;
      if (!perf) return;
      const frameMs = Math.max(0, rawFrameSeconds * 1000);
      const fps = rawFrameSeconds > 0 ? 1 / rawFrameSeconds : 0;
      const alpha = 0.12;
      perf.frameMs = frameMs;
      perf.fps = fps;
      perf.avgFrameMs = perf.avgFrameMs > 0 ? perf.avgFrameMs * (1 - alpha) + frameMs * alpha : frameMs;
      perf.avgFps = perf.avgFps > 0 ? perf.avgFps * (1 - alpha) + fps * alpha : fps;
      perf.maxFrameMs = Math.max(perf.maxFrameMs * 0.995, frameMs);
      perf.stepsLastFrame = stepCount;
      perf.avgSteps = perf.avgSteps > 0 ? perf.avgSteps * (1 - alpha) + stepCount * alpha : stepCount;
      perf.frameCount += 1;
      perf.objects.particles = this.model.particles.length;
      perf.objects.bullets = this.model.bullets.length;
      perf.objects.enemyBullets = this.model.enemyBullets.length;
      perf.objects.utilityEffects = this.model.utilityEffects.length;
      perf.objects.asteroids = this.model.asteroids.length;
      perf.objects.ufos = this.model.ufos.length;
      if (Number.isFinite(updateMs)) this.recordTimingSample("updateMs", updateMs);
      if (Number.isFinite(renderMs)) this.recordTimingSample("renderMs", renderMs);
      this.updateAdaptiveQuality(perf.frameMs);
    }

    getNowMs() {
      if (typeof performance !== "undefined" && typeof performance.now === "function") return performance.now();
      return Date.now();
    }

    updateTimingBucket(bucket, sample) {
      if (!bucket || !Number.isFinite(sample)) return;
      const alpha = 0.12;
      bucket.last = sample;
      bucket.avg = bucket.avg > 0 ? bucket.avg * (1 - alpha) + sample * alpha : sample;
      bucket.max = Math.max(bucket.max * 0.995, sample);
      bucket.samples.push(sample);
      if (bucket.samples.length > 220) bucket.samples.shift();
      const sorted = [...bucket.samples].sort((a, b) => a - b);
      const index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
      bucket.p95 = sorted.length ? sorted[index] : 0;
    }

    recordTimingSample(metricKey, sample) {
      const perf = this.model.performance;
      if (!perf?.timings?.[metricKey]) return;
      this.updateTimingBucket(perf.timings[metricKey], sample);
    }

    recordSectionTiming(sectionKey, sample) {
      const perf = this.model.performance;
      if (!perf?.timings) return;
      if (!perf.timings.sections[sectionKey]) {
        perf.timings.sections[sectionKey] = { last: 0, avg: 0, max: 0, p95: 0, samples: [] };
      }
      this.updateTimingBucket(perf.timings.sections[sectionKey], sample);
    }

    dumpPerformanceSnapshot() {
      const perf = this.model.performance;
      if (!perf) return;
      const updateTiming = perf.timings?.updateMs || { avg: 0, max: 0, p95: 0 };
      const renderTiming = perf.timings?.renderMs || { avg: 0, max: 0, p95: 0 };
      const sectionEntries = Object.entries(perf.timings?.sections || {})
        .map(([name, bucket]) => ({ name, avg: bucket.avg || 0, max: bucket.max || 0, p95: bucket.p95 || 0 }))
        .sort((a, b) => b.avg - a.avg);
      const top1 = sectionEntries[0];
      const top2 = sectionEntries[1];
      const snapshot = {
        frameMs: Number(perf.frameMs.toFixed(3)),
        fps: Number(perf.fps.toFixed(2)),
        avgFrameMs: Number(perf.avgFrameMs.toFixed(3)),
        avgFps: Number(perf.avgFps.toFixed(2)),
        maxFrameMs: Number(perf.maxFrameMs.toFixed(3)),
        updateAvgMs: Number(updateTiming.avg.toFixed(3)),
        updateP95Ms: Number(updateTiming.p95.toFixed(3)),
        updateMaxMs: Number(updateTiming.max.toFixed(3)),
        renderAvgMs: Number(renderTiming.avg.toFixed(3)),
        renderP95Ms: Number(renderTiming.p95.toFixed(3)),
        renderMaxMs: Number(renderTiming.max.toFixed(3)),
        hotspot1: top1?.name || "-",
        hotspot1AvgMs: Number((top1?.avg || 0).toFixed(3)),
        hotspot2: top2?.name || "-",
        hotspot2AvgMs: Number((top2?.avg || 0).toFixed(3)),
        stepsLastFrame: perf.stepsLastFrame,
        avgSteps: Number(perf.avgSteps.toFixed(3)),
        qualityLevel: perf.qualityLevel,
        particles: perf.objects.particles,
        bullets: perf.objects.bullets,
        enemyBullets: perf.objects.enemyBullets,
        utilityEffects: perf.objects.utilityEffects,
        asteroids: perf.objects.asteroids,
        ufos: perf.objects.ufos,
        droppedParticles: perf.dropped?.particles ?? 0,
        droppedBullets: perf.dropped?.bullets ?? 0,
        droppedEnemyBullets: perf.dropped?.enemyBullets ?? 0,
        droppedUtilityEffects: perf.dropped?.utilityEffects ?? 0,
        frames: perf.frameCount
      };
      // Dev profiling helper: capture one readable runtime snapshot during playtesting.
      if (typeof console !== "undefined" && typeof console.table === "function") console.table([snapshot]);
      else if (typeof console !== "undefined" && typeof console.log === "function") console.log(snapshot);
      this.model.hangar.message = tr("game.perf.snapshot_dumped");
    }

    getFxQualityProfile() {
      const level = this.model.performance?.qualityLevel || "high";
      if (level === "low") {
        return {
          level,
          particleMultiplier: 0.45,
          thrusterSpawnChance: 0.45,
          maxParticles: 320,
          maxUtilityEffects: 14
        };
      }
      if (level === "medium") {
        return {
          level,
          particleMultiplier: 0.7,
          thrusterSpawnChance: 0.7,
          maxParticles: 500,
          maxUtilityEffects: 20
        };
      }
      return {
        level: "high",
        particleMultiplier: 1,
        thrusterSpawnChance: 1,
        maxParticles: 760,
        maxUtilityEffects: 28
      };
    }

    getRuntimeGuardLimits() {
      const profile = this.getFxQualityProfile();
      const maxPlayerBullets = Math.max(this.getCurrentMaxBullets() + 8, 44);
      const maxEnemyBullets = profile.level === "low" ? 180 : profile.level === "medium" ? 260 : 340;
      return {
        maxParticles: profile.maxParticles,
        maxUtilityEffects: profile.maxUtilityEffects,
        maxPlayerBullets,
        maxEnemyBullets
      };
    }

    trimOldest(arrayRef, maxCount, droppedKey) {
      if (!Array.isArray(arrayRef) || maxCount < 1) return;
      const overflow = arrayRef.length - maxCount;
      if (overflow <= 0) return;
      arrayRef.splice(0, overflow);
      if (droppedKey && this.model.performance?.dropped && droppedKey in this.model.performance.dropped) {
        this.model.performance.dropped[droppedKey] += overflow;
      }
    }

    updateAdaptiveQuality(frameMs) {
      const perf = this.model.performance;
      if (!perf || this.model.gameState !== GAME_STATE.PLAYING) return;

      if (frameMs >= perf.thresholds.downshiftMs) {
        perf.downshiftCounter += 1;
        perf.upshiftCounter = Math.max(0, perf.upshiftCounter - 2);
      } else if (frameMs <= perf.thresholds.upshiftMs) {
        perf.upshiftCounter += 1;
        perf.downshiftCounter = Math.max(0, perf.downshiftCounter - 1);
      } else {
        perf.downshiftCounter = Math.max(0, perf.downshiftCounter - 1);
        perf.upshiftCounter = Math.max(0, perf.upshiftCounter - 1);
      }

      if (perf.downshiftCounter >= perf.windows.downshiftFrames) {
        if (perf.qualityLevel === "high") perf.qualityLevel = "medium";
        else if (perf.qualityLevel === "medium") perf.qualityLevel = "low";
        perf.downshiftCounter = 0;
        perf.upshiftCounter = 0;
        return;
      }

      if (perf.upshiftCounter >= perf.windows.upshiftFrames) {
        if (perf.qualityLevel === "low") perf.qualityLevel = "medium";
        else if (perf.qualityLevel === "medium") perf.qualityLevel = "high";
        perf.downshiftCounter = 0;
        perf.upshiftCounter = 0;
      }
    }

    pushUtilityEffect(effect) {
      const { maxUtilityEffects } = this.getRuntimeGuardLimits();
      this.trimOldest(this.model.utilityEffects, maxUtilityEffects - 1, "utilityEffects");
      this.model.utilityEffects.push(effect);
    }

    pushPlayerBullet(bullet) {
      const { maxPlayerBullets } = this.getRuntimeGuardLimits();
      this.trimOldest(this.model.bullets, maxPlayerBullets - 1, "bullets");
      this.model.bullets.push(bullet);
    }

    pushEnemyBullet(bullet) {
      const { maxEnemyBullets } = this.getRuntimeGuardLimits();
      this.trimOldest(this.model.enemyBullets, maxEnemyBullets - 1, "enemyBullets");
      this.model.enemyBullets.push(bullet);
    }

    enforceRuntimeGuards() {
      const limits = this.getRuntimeGuardLimits();
      this.trimOldest(this.model.particles, limits.maxParticles, "particles");
      this.trimOldest(this.model.utilityEffects, limits.maxUtilityEffects, "utilityEffects");
      this.trimOldest(this.model.bullets, limits.maxPlayerBullets, "bullets");
      this.trimOldest(this.model.enemyBullets, limits.maxEnemyBullets, "enemyBullets");
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
      const missionEffects = this.model.currentMission?.modifierEffects || {};
      ship.energy = Math.min(
        ship.energyMax,
        ship.energy + this.applyPct(cfg.energyRegenPerSecond, modifiers.energyRegenPct) * dt
      );
      ship.heat = Math.max(0, ship.heat - this.applyPct(cfg.heatDissipationPerSecond, modifiers.heatDissipationPct) * dt);

      const sinceDamage = this.model.runtimeSeconds - ship.lastDamageAt;
      if (sinceDamage >= cfg.shieldRegenDelaySeconds) {
        const missionShieldMul = this.clamp(missionEffects.shieldRegenMul ?? 1, 0, 2);
        ship.shield = Math.min(
          ship.shieldMax,
          ship.shield + this.applyPct(cfg.shieldRegenPerSecond, modifiers.shieldRegenPct) * missionShieldMul * dt
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
        this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, resolved.isCrit ? 0.028 : 0.016);
        this.audio.play("player_hit");
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
      this.emitExplosionFx(ship.x, ship.y, 150, "255,98,121", "255,222,192");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.05);
      this.model.dotEffects = [];
      this.endGame();
    }

    applyDamageToMiniBoss(baseDamage, damageType = "kinetic", critChance = this.getPlayerCritChance()) {
      const boss = this.model.miniBoss;
      if (!boss) return false;
      const bossCfg = boss.isFinalBoss ? this.config.run?.finalBoss || this.config.mission.miniBoss : this.config.mission.miniBoss;
      const weakpointMultiplier = boss.weakpointOpen
        ? bossCfg.weakpointDamageMultiplier
        : bossCfg.weakpointClosedMultiplier;
      const resolved = this.resolvePlayerDamage(baseDamage * weakpointMultiplier, damageType, critChance);
      boss.hp -= resolved.damage;
      this.model.flashMs = Math.max(this.model.flashMs, resolved.isCrit ? 95 : 70);
      const hitColor = boss.weakpointOpen ? "126,237,255" : "255,118,188";
      this.emitImpactParticles(boss.x, boss.y, resolved.isCrit ? 14 : 10, hitColor);
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, resolved.isCrit ? 0.026 : 0.012);
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
      this.grantPilotXp(basePoints * this.config.pilot.xp.perScore, "score");
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
      this.audio.play("mission_start");

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
      this.audio.play("mission_complete");

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
      const missionType = this.model.currentMission?.type ?? active.type;
      const xpBonus = this.config.pilot.xp.missionBonusByType[missionType] ?? 0;
      this.grantPilotXp(xpBonus, "mission");
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
      const shieldCost = this.getSharedPoolShieldCost("primary", primary.energyCost);
      return this.canSpendShipResources(primary.energyCost, primary.heatGain, { shieldCost });
    }

    consumePrimaryShotResources() {
      const primary = this.getPrimarySpec();
      const shieldCost = this.getSharedPoolShieldCost("primary", primary.energyCost);
      this.spendShipResources(primary.energyCost, primary.heatGain, { shieldCost });
    }

    getSharedPoolShieldCost(action, energyCost = 0) {
      const shared = this.config.ship.sharedPool || {};
      if (!shared.enabled) return 0;
      const factorByAction = {
        primary: shared.primaryShieldCostFactor ?? 0.3,
        secondary: shared.secondaryShieldCostFactor ?? 0.4,
        utility: shared.utilityShieldCostFactor ?? 0.5,
        dash: shared.dashShieldCostFactor ?? 0.25
      };
      const factor = factorByAction[action] ?? 0;
      return Math.max(0, energyCost * factor);
    }

    canSpendShipResources(energyCost, heatGain = 0, options = {}) {
      const ship = this.model.ship;
      if (!ship) return false;
      const hardThreshold = this.config.ship.overheatHardThreshold;
      const shieldCost = options.shieldCost ?? 0;
      return ship.energy >= energyCost && ship.shield >= shieldCost && ship.heat + heatGain < hardThreshold;
    }

    spendShipResources(energyCost, heatGain = 0, options = {}) {
      const ship = this.model.ship;
      if (!ship) return;
      const shieldCost = options.shieldCost ?? 0;
      ship.energy = Math.max(0, ship.energy - energyCost);
      ship.shield = Math.max(0, ship.shield - shieldCost);
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
      const profile = this.getFxQualityProfile();
      if (this.model.particles.length >= profile.maxParticles) {
        this.model.performance.dropped.particles += 1;
        return;
      }
      this.model.particles.push({
        x,
        y,
        vx,
        vy,
        ttl: life,
        life,
        radius,
        color,
        kind: "spark",
        growth: 0,
        drag: 0
      });
    }

    addRingParticle(x, y, life, radius, color, growth = 120) {
      const profile = this.getFxQualityProfile();
      if (this.model.particles.length >= profile.maxParticles) {
        this.model.performance.dropped.particles += 1;
        return;
      }
      this.model.particles.push({
        x,
        y,
        vx: 0,
        vy: 0,
        ttl: life,
        life,
        radius,
        color,
        kind: "ring",
        growth,
        drag: 0
      });
    }

    addDebrisParticle(x, y, vx, vy, life, radius, color) {
      const profile = this.getFxQualityProfile();
      if (this.model.particles.length >= profile.maxParticles) {
        this.model.performance.dropped.particles += 1;
        return;
      }
      this.model.particles.push({
        x,
        y,
        vx,
        vy,
        ttl: life,
        life,
        radius,
        color,
        kind: "debris",
        growth: 0,
        drag: 0.9
      });
    }

    emitThrusterParticle(ship) {
      const profile = this.getFxQualityProfile();
      if (this.rng() > profile.thrusterSpawnChance) return;
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
      const profile = this.getFxQualityProfile();
      const effectiveCount = Math.max(1, Math.round(count * profile.particleMultiplier));
      for (let i = 0; i < effectiveCount; i += 1) {
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

    emitExplosionFx(x, y, intensity, baseColor, debrisColor = "255,236,184") {
      const sparkCount = Math.max(8, Math.round(10 + intensity * 0.32));
      const debrisCount = Math.max(4, Math.round(4 + intensity * 0.18));
      this.emitImpactParticles(x, y, sparkCount, baseColor);
      this.addRingParticle(x, y, 0.22 + intensity * 0.0022, 10 + intensity * 0.06, baseColor, 140 + intensity * 0.9);
      this.addRingParticle(x, y, 0.16 + intensity * 0.0016, 4 + intensity * 0.04, debrisColor, 110 + intensity * 0.5);
      for (let i = 0; i < debrisCount; i += 1) {
        const angle = this.rng() * Math.PI * 2;
        const speed = 70 + this.rng() * (65 + intensity * 2.1);
        this.addDebrisParticle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          0.35 + this.rng() * 0.4,
          1.4 + this.rng() * 2.2,
          debrisColor
        );
      }
    }

    updateUiAlerts() {
      const ship = this.model.ship;
      if (!ship) return;
      const prevAlerts = this.model.uiAlerts || {};
      const hullRatio = ship.hullMax > 0 ? ship.hull / ship.hullMax : 1;
      const energyRatio = ship.energyMax > 0 ? ship.energy / ship.energyMax : 1;
      const heatRatio = ship.heatMax > 0 ? ship.heat / ship.heatMax : 0;
      const shieldRatio = ship.shieldMax > 0 ? ship.shield / ship.shieldMax : 1;
      this.model.uiAlerts = {
        lowHull: hullRatio <= 0.33,
        lowEnergy: energyRatio <= 0.24,
        highHeat: heatRatio >= 0.82,
        shieldBroken: shieldRatio <= 0.02,
        dashReady: this.model.dashCooldown <= 0,
        secondaryReady: this.model.secondaryCooldown <= 0,
        utilityReady: this.model.utilityCooldown <= 0
      };
      const biomeId = this.model.currentMission?.biomeId || null;
      const missionAudioProfile = this.model.currentMission?.biomeAudio || null;
      if (this.model.uiAlerts.lowHull && !prevAlerts.lowHull) this.audio.play("warning", { biomeId, missionAudioProfile });
      if (this.model.uiAlerts.highHeat && !prevAlerts.highHeat) this.audio.play("warning", { biomeId, missionAudioProfile });
      if (this.model.uiAlerts.shieldBroken && !prevAlerts.shieldBroken) this.audio.play("warning", { biomeId, missionAudioProfile });
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
      this.emitExplosionFx(asteroid.x, asteroid.y, asteroid.radius, "89,245,255", "196,240,255");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.01);
      this.audio.play("asteroid_pop");
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
      this.emitExplosionFx(x, y, blastRadius * 0.7, "255,133,100", "255,208,140");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.018);

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
      const modeScoreMap = {
        hunter: this.config.ufo.scoreHunter,
        sniper: this.config.ufo.scoreSniper,
        swarm: this.config.ufo.scoreSwarm,
        kamikaze: this.config.ufo.scoreKamikaze,
        support: this.config.ufo.scoreSupport,
        mine_layer: this.config.ufo.scoreMineLayer
      };
      const baseScore = modeScoreMap[ufo.mode] ?? this.config.ufo.scoreHunter;
      const eliteScoreMul = ufo.eliteStats?.scoreMul ?? 1;
      this.registerScore(Math.round(baseScore * eliteScoreMul), true);
      this.model.telemetry.kills.ufos += 1;
      this.model.flashMs = Math.max(this.model.flashMs, 130);
      this.emitExplosionFx(ufo.x, ufo.y, 58, "255,91,186", "255,226,190");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.018);
      this.audio.play("ufo_pop");
      if (ufo.elitePrefix === "Volatile") {
        for (let i = 0; i < 6; i += 1) {
          const angle = (i / 6) * Math.PI * 2;
          const bullet = window.Asteroids.createEnemyBullet(ufo.x, ufo.y, angle, this.config);
          bullet.vx *= 0.85;
          bullet.vy *= 0.85;
          bullet.ttl = 1.3;
          bullet.damageProfile = "enemy_mine";
          this.pushEnemyBullet(bullet);
        }
      }
      this.model.ufos.splice(index, 1);
      this.model.missionUfoKills += 1;
      this.tryDropModule("ufo", ufo.mode);
    }

    applyDamageToUfoByIndex(index, baseDamage, damageType = "kinetic", critChance = this.getPlayerCritChance()) {
      const ufo = this.model.ufos[index];
      if (!ufo) return false;
      const resolved = this.resolvePlayerDamage(baseDamage, damageType, critChance);
      ufo.hp -= resolved.damage;
      this.emitImpactParticles(ufo.x, ufo.y, resolved.isCrit ? 8 : 5, "255,122,198");
      if (ufo.hp <= 0) {
        this.destroyUfoByIndex(index);
        return true;
      }
      return false;
    }

    destroyMiniBoss() {
      const boss = this.model.miniBoss;
      if (!boss) return;
      const rewards = this.config.mission.miniBoss.rewards;
      const isFinalEncounter = this.model.currentMission?.isFinalEncounter;
      const rewardMultiplier = isFinalEncounter ? this.config.run.finalBossRewardMultiplier ?? 1 : 1;
      const creditsGain = Math.round(
        (rewards.creditsBase + Math.max(0, this.model.sector - 1) * rewards.creditsStep) * rewardMultiplier
      );
      this.registerScore(Math.round(rewards.scoreReward * rewardMultiplier), true);
      this.model.credits += creditsGain;
      this.model.telemetry.creditsEarned += creditsGain;
      this.model.telemetry.kills.miniBosses += 1;
      this.emitExplosionFx(boss.x, boss.y, 180, "255,114,210", "255,245,189");
      this.model.flashMs = Math.max(this.model.flashMs, 230);
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.04);
      this.audio.play("boss_pop");
      this.model.miniBoss = null;
      for (let i = 0; i < rewards.guaranteedDrops; i += 1) {
        const drop = this.createModuleDrop();
        this.model.hangar.lootCrate.push(drop);
      }
      this.model.hangar.message = isFinalEncounter
        ? tr("game.boss.final_down", { credits: creditsGain, drops: rewards.guaranteedDrops })
        : tr("game.boss.down", { credits: creditsGain, drops: rewards.guaranteedDrops });
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
      const hazards = this.model.currentMission?.biomeHazards || [];
      for (const hazard of hazards) checkThreat(hazard.x, hazard.y, hazard.radius + 12);
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
