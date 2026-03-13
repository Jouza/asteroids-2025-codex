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
      actionBlocks: {
        energy: 0,
        shield: 0,
        heat: 0,
        cooldown: 0,
        magazine: 0
      },
      powerAudit: null,
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

  function createRunSummaryState() {
    return {
      missions: [],
      dropsSeen: [],
      damageTakenTotal: {
        shieldAbsorb: 0,
        hullDamage: 0
      },
      limits: {
        missions: 16,
        dropsSeen: 48
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

  function createDefaultFactionProgression() {
    return {
      helix_union: 0,
      drift_cartel: 0
    };
  }

  function createDefaultProfile() {
    return {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      updatedAt: Date.now(),
      progression: {
        flightModel: "arcade",
        runDifficultyId: "normal",
        runMutatorId: "standard",
        shopVendorId: "faction",
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
        factionIntelId: "balanced",
        factions: createDefaultFactionProgression(),
        contrabandHeat: 0,
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

  function createDefaultViewportState(config) {
    const baseWidth = Math.max(320, Math.floor(Number(config?.canvas?.width) || 960));
    const baseHeight = Math.max(240, Math.floor(Number(config?.canvas?.height) || 720));
    return {
      renderViewport: {
        cssWidth: baseWidth,
        cssHeight: baseHeight,
        pixelWidth: baseWidth,
        pixelHeight: baseHeight,
        dpr: 1
      },
      worldBounds: {
        width: baseWidth,
        height: baseHeight
      },
      balanceViewport: {
        width: baseWidth,
        height: baseHeight
      }
    };
  }

  function createDefaultTouchControlsState() {
    return {
      inputMode: "keyboard_mouse",
      pointers: {},
      pointerRoles: {},
      leftStick: {
        active: false,
        pointerId: null,
        baseX: 0,
        baseY: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        nx: 0,
        ny: 0,
        mag: 0
      },
      rightStick: {
        active: false,
        pointerId: null,
        baseX: 0,
        baseY: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        nx: 0,
        ny: 0,
        mag: 0,
        aimNx: 0,
        aimNy: 0,
        aimMag: 0
      },
      buttons: {
        thrust: { down: false, pointerId: null },
        turnLeft: { down: false, pointerId: null },
        turnRight: { down: false, pointerId: null },
        primary: { down: false, pointerId: null },
        secondary: { down: false, pointerId: null },
        utility: { down: false, pointerId: null }
      },
      actions: {
        secondaryPressed: false,
        utilityPressed: false,
        dashPressed: false,
        boostActive: false,
        fireActive: false
      },
      layout: null,
      ui: {
        overlayRows: [],
        hangarLootRows: [],
        hangarShopRows: [],
        endSummaryTapZones: null,
        overlayActionCtaZone: null,
        fullscreenTapZone: null,
        hangarBottomActions: null
      },
      actionButton: {
        visible: false,
        x: 0,
        y: 0,
        radius: 0
      }
    };
  }

  function createDefaultMobileUiState() {
    return {
      isLandscape: true,
      orientationBlocked: false,
      fullscreenState: "inactive",
      fullscreenPromptVisible: false,
      fullscreenPromptDismissed: false,
      compactHints: true,
      aimAssistEnabled: true,
      aimAssistStrength: 0.64,
      aimSmoothing: "default",
      ambientFxPreset: "default",
      threatContext: {
        bossPressure: false,
        hazardPressure: false,
        enemyPressure: false
      },
      actionVisibility: {
        secondary: { state: "high", alpha: 1, scale: 1 },
        utility: { state: "high", alpha: 1, scale: 1 },
        evade: { state: "high", alpha: 1, scale: 1 }
      },
      viewportOverride: null
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
        sentryRelays: [],
        salvageDrifters: [],
        damageNumbers: [],
        incomingHitCues: [],
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
        gameOverSummary: null,
        finalClearRewards: null,
        finalClearRewardGranted: false,
        missionCompleteSummary: null,
        flightModel: "arcade",
        runDifficultyId: "normal",
        runMutatorId: "standard",
        dotEffects: [],
        pointer: {
          x: 0,
          y: 0,
          inside: false
        },
        deviceMode: "desktop",
        inputMode: "keyboard_mouse",
        mobileUi: createDefaultMobileUiState(),
        touchControls: createDefaultTouchControlsState(),
        hangar: {
          message: tr("game.hangar.controls"),
          shopItems: [],
          shopVendorId: "faction",
          factionIntelId: "balanced",
          lootCrate: [],
          selectionSource: "crate",
          selectionIndex: 0,
          pilotAttrIndex: 0,
          pilotPerkIndex: 0,
          navSection: "shop",
          shopIndex: 0,
          pilotCursor: 0
        },
        bountyBoard: {
          sector: 1,
          factionId: null,
          offers: [],
          rerollsUsed: 0
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
        factions: createDefaultFactionProgression(),
        factionRepGainTracker: {},
        factionRunSummary: null,
        runSummary: createRunSummaryState(),
        campaignBiomeOrder: [],
        contrabandHeat: 0,
        pilot: createDefaultPilotProgression(),
        identity: createDefaultIdentitySelection(),
        identityStatusText: tr("hud.identity_unknown"),
        overlaySettingsRow: 0,
        overlayEndSummaryPage: "overview",
        uiModal: null,
        salvageParts: 0,
        telemetry: createTelemetryState(false),
        performance: createPerformanceState(false),
        profile: createDefaultProfile(),
        viewport: createDefaultViewportState(config),
        actionHint: {
          text: "",
          timer: 0,
          key: "",
          lastAtMs: 0
        },
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
      this.fullscreenRequestHandler = null;
      this.lastTouchOrientationBlocked = false;
      this.lastTouchGameState = this.model.gameState;

      this.attachPointerTracking();
      this.attachTouchControls();
    }

    mapPointerToCanvas(event) {
      if (!event || typeof this.canvas?.getBoundingClientRect !== "function") return null;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      const canvasW = Math.max(1, Math.floor(Number(this.model.viewport?.worldBounds?.width) || this.config.canvas.width));
      const canvasH = Math.max(1, Math.floor(Number(this.model.viewport?.worldBounds?.height) || this.config.canvas.height));
      const styleFit = String(this.canvas?.style?.objectFit || "").toLowerCase();
      let computedFit = "";
      if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
        try {
          computedFit = String(window.getComputedStyle(this.canvas)?.objectFit || "").toLowerCase();
        } catch (error) {
          // Ignore style lookup failures.
        }
      }
      const useContainMap = styleFit === "contain" || computedFit === "contain";
      if (!useContainMap) {
        const scaleX = canvasW / rect.width;
        const scaleY = canvasH / rect.height;
        return {
          x: (event.clientX - rect.left) * scaleX,
          y: (event.clientY - rect.top) * scaleY
        };
      }

      const canvasAspect = canvasW / canvasH;
      const rectAspect = rect.width / rect.height;
      let contentLeft = rect.left;
      let contentTop = rect.top;
      let contentWidth = rect.width;
      let contentHeight = rect.height;
      if (rectAspect > canvasAspect) {
        contentHeight = rect.height;
        contentWidth = contentHeight * canvasAspect;
        contentLeft = rect.left + (rect.width - contentWidth) * 0.5;
      } else if (rectAspect < canvasAspect) {
        contentWidth = rect.width;
        contentHeight = contentWidth / canvasAspect;
        contentTop = rect.top + (rect.height - contentHeight) * 0.5;
      }
      const localX = event.clientX - contentLeft;
      const localY = event.clientY - contentTop;
      if (localX < 0 || localY < 0 || localX > contentWidth || localY > contentHeight) return null;
      return {
        x: (localX / Math.max(1, contentWidth)) * canvasW,
        y: (localY / Math.max(1, contentHeight)) * canvasH
      };
    }

    attachPointerTracking() {
      if (!this.canvas || typeof this.canvas.addEventListener !== "function") return;
      const updatePointer = (event) => {
        const point = this.mapPointerToCanvas(event);
        if (!point) return;
        this.model.pointer.x = point.x;
        this.model.pointer.y = point.y;
        this.model.pointer.inside = true;
      };
      this.canvas.addEventListener("mousemove", updatePointer);
      this.canvas.addEventListener("mouseenter", updatePointer);
      this.canvas.addEventListener("mouseleave", () => {
        this.model.pointer.inside = false;
      });
    }

    attachTouchControls() {
      if (!this.canvas || typeof this.canvas.addEventListener !== "function") return;
      if (this.canvas.style) this.canvas.style.touchAction = "none";

      const getPointerId = (event) => {
        const id = event?.pointerId;
        return Number.isFinite(Number(id)) ? Number(id) : -1;
      };

      this.canvas.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "touch") return;
        if (this.model.uiModal) return;
        const point = this.mapPointerToCanvas(event);
        if (!point) return;
        this.model.inputMode = "touch";
        this.model.touchControls.inputMode = "touch";
        this.model.pointer.x = point.x;
        this.model.pointer.y = point.y;
        this.model.pointer.inside = true;
        const pointerId = getPointerId(event);
        this.model.touchControls.pointers[pointerId] = { id: pointerId, x: point.x, y: point.y };
        this.onTouchPointerDown(pointerId, point.x, point.y);
        if (typeof this.canvas.setPointerCapture === "function") {
          try {
            this.canvas.setPointerCapture(event.pointerId);
          } catch (error) {
            // Ignore unsupported capture errors.
          }
        }
        event.preventDefault();
      });

      this.canvas.addEventListener("pointermove", (event) => {
        if (event.pointerType !== "touch") return;
        const point = this.mapPointerToCanvas(event);
        if (!point) return;
        const pointerId = getPointerId(event);
        this.model.pointer.x = point.x;
        this.model.pointer.y = point.y;
        this.model.pointer.inside = true;
        this.model.touchControls.pointers[pointerId] = { id: pointerId, x: point.x, y: point.y };
        this.onTouchPointerMove(pointerId, point.x, point.y);
        event.preventDefault();
      });

      const release = (event) => {
        if (event.pointerType !== "touch") return;
        const point = this.mapPointerToCanvas(event) || { x: this.model.pointer.x, y: this.model.pointer.y };
        const pointerId = getPointerId(event);
        delete this.model.touchControls.pointers[pointerId];
        this.onTouchPointerUp(pointerId, point.x, point.y);
        if (typeof this.canvas.releasePointerCapture === "function") {
          try {
            this.canvas.releasePointerCapture(event.pointerId);
          } catch (error) {
            // Ignore unsupported release errors.
          }
        }
        event.preventDefault();
      };

      this.canvas.addEventListener("pointerup", release);
      this.canvas.addEventListener("pointercancel", release);
      const doc = this.canvas.ownerDocument;
      const view = doc?.defaultView;
      if (doc?.addEventListener) {
        doc.addEventListener("visibilitychange", () => {
          if (doc.visibilityState === "hidden") this.resetTouchButtonsState(true);
        });
      }
      if (view?.addEventListener) {
        view.addEventListener("blur", () => this.resetTouchButtonsState(true));
      }
    }

    clamp(value, min, max) {
      return clamp(value, min, max);
    }

    setUiModal(modalId = null) {
      this.model.uiModal = modalId || null;
    }

    setFullscreenRequestHandler(handler = null) {
      this.fullscreenRequestHandler = typeof handler === "function" ? handler : null;
    }

    resetTouchControlRuntime() {
      const touch = createDefaultTouchControlsState();
      touch.inputMode = this.model.inputMode || "keyboard_mouse";
      this.model.touchControls = touch;
    }

    resetTouchButtonsState(clearPointers = false) {
      const touch = this.model.touchControls;
      if (!touch) return;
      for (const key of Object.keys(touch.buttons || {})) {
        const button = touch.buttons[key];
        if (!button) continue;
        button.down = false;
        button.pointerId = null;
      }
      touch.actions.secondaryPressed = false;
      touch.actions.utilityPressed = false;
      touch.actions.dashPressed = false;
      touch.actions.boostActive = false;
      touch.actions.fireActive = false;
      touch.leftStick.active = false;
      touch.leftStick.pointerId = null;
      touch.rightStick.active = false;
      touch.rightStick.pointerId = null;
      touch.rightStick.aimNx = 0;
      touch.rightStick.aimNy = 0;
      touch.rightStick.aimMag = 0;
      if (clearPointers) {
        touch.pointers = {};
        touch.pointerRoles = {};
      }
    }

    updateAdaptiveViewport(forceDesktopBaseline = false) {
      const viewport = this.getViewportInfo();
      const baseWidth = Math.max(320, Math.floor(Number(this.model.viewport?.balanceViewport?.width) || this.config.canvas.width || 960));
      const baseHeight = Math.max(240, Math.floor(Number(this.model.viewport?.balanceViewport?.height) || this.config.canvas.height || 720));
      const isTouchMobile = this.model.deviceMode === "touch_mobile";
      let cssWidth = forceDesktopBaseline || !isTouchMobile ? baseWidth : Math.max(320, Math.floor(viewport.width));
      let cssHeight = forceDesktopBaseline || !isTouchMobile ? baseHeight : Math.max(240, Math.floor(viewport.height));
      if (!forceDesktopBaseline && isTouchMobile && typeof this.canvas?.getBoundingClientRect === "function") {
        const rect = this.canvas.getBoundingClientRect();
        if (rect && Number.isFinite(rect.width) && Number.isFinite(rect.height) && rect.width > 0 && rect.height > 0) {
          const rectW = Math.max(1, Math.floor(rect.width));
          const rectH = Math.max(1, Math.floor(rect.height));
          const viewportW = Math.max(1, Math.floor(viewport.width));
          const viewportH = Math.max(1, Math.floor(viewport.height));
          const saneWidth = rectW >= Math.floor(viewportW * 0.55);
          const saneHeight = rectH >= Math.floor(viewportH * 0.55);
          if (saneWidth && saneHeight) {
            cssWidth = Math.max(240, rectW);
            cssHeight = Math.max(180, rectH);
          }
        }
      }
      const perf = this.model.performance || {};
      const perfQuality = String(perf.qualityLevel || "high");
      const perfDprCap = perfQuality === "low" ? 1.0 : perfQuality === "medium" ? 1.25 : 1.5;
      const deviceDpr = Number(this.canvas?.ownerDocument?.defaultView?.devicePixelRatio || (typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1);
      const dpr = this.clamp(deviceDpr, 1, perfDprCap);
      const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
      const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));
      if (this.canvas) {
        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;
      }
      if (this.renderer?.ctx && typeof this.renderer.ctx.setTransform === "function") {
        this.renderer.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.config.canvas.width = cssWidth;
      this.config.canvas.height = cssHeight;
      if (!this.model.viewport || typeof this.model.viewport !== "object") {
        this.model.viewport = createDefaultViewportState(this.config);
      }
      this.model.viewport.renderViewport = {
        cssWidth,
        cssHeight,
        pixelWidth,
        pixelHeight,
        dpr
      };
      this.model.viewport.worldBounds = {
        width: cssWidth,
        height: cssHeight
      };
      if (this.model.ship) {
        this.model.ship.x = this.clamp(this.model.ship.x, 0, cssWidth);
        this.model.ship.y = this.clamp(this.model.ship.y, 0, cssHeight);
      }
    }

    getBalanceNormalizedDistance(distance = 1) {
      const world = this.model.viewport?.worldBounds || this.config.canvas;
      const balance = this.model.viewport?.balanceViewport || this.config.canvas;
      const worldArea = Math.max(1, Number(world.width || 1) * Number(world.height || 1));
      const balanceArea = Math.max(1, Number(balance.width || 1) * Number(balance.height || 1));
      const normalization = Math.sqrt(balanceArea / worldArea);
      return Number(distance) * normalization;
    }

    getRuntimeWorldBounds() {
      const world = this.model.viewport?.worldBounds;
      const width = Math.floor(Number(world?.width));
      const height = Math.floor(Number(world?.height));
      if (Number.isFinite(width) && Number.isFinite(height) && width >= 120 && height >= 120) {
        return { width, height, valid: true };
      }
      const fallbackWidth = Math.floor(Number(this.config?.canvas?.width) || 960);
      const fallbackHeight = Math.floor(Number(this.config?.canvas?.height) || 720);
      const fallbackValid = Number.isFinite(fallbackWidth) && Number.isFinite(fallbackHeight) && fallbackWidth >= 120 && fallbackHeight >= 120;
      return {
        width: fallbackWidth,
        height: fallbackHeight,
        valid: fallbackValid
      };
    }

    getViewportInfo() {
      const override = this.model.mobileUi?.viewportOverride;
      if (override && Number.isFinite(Number(override.width)) && Number.isFinite(Number(override.height))) {
        return {
          width: Math.max(1, Math.floor(Number(override.width))),
          height: Math.max(1, Math.floor(Number(override.height)))
        };
      }
      const win = this.canvas?.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
      const candidates = [];
      const pushCandidate = (w, h) => {
        if (!Number.isFinite(Number(w)) || !Number.isFinite(Number(h))) return;
        const width = Math.max(1, Math.floor(Number(w)));
        const height = Math.max(1, Math.floor(Number(h)));
        if (width < 120 || height < 120) return;
        candidates.push({ width, height, area: width * height });
      };
      const visualViewport = win?.visualViewport;
      if (visualViewport) {
        pushCandidate(visualViewport.width, visualViewport.height);
      }
      if (win) {
        pushCandidate(win.innerWidth, win.innerHeight);
      }
      const docEl = this.canvas?.ownerDocument?.documentElement;
      if (docEl) {
        pushCandidate(docEl.clientWidth, docEl.clientHeight);
      }
      if (candidates.length) {
        candidates.sort((a, b) => b.area - a.area);
        return {
          width: candidates[0].width,
          height: candidates[0].height
        };
      }
      return {
        width: Math.max(1, Math.floor(Number(this.config?.canvas?.width) || 960)),
        height: Math.max(1, Math.floor(Number(this.config?.canvas?.height) || 720))
      };
    }

    updateMobileActionVisibility(dt = 0) {
      const mobileUi = this.model.mobileUi;
      if (!mobileUi) return;
      const hazards = Array.isArray(this.model.currentMission?.biomeHazards) ? this.model.currentMission.biomeHazards : [];
      const hazardPressure = hazards.some((hazard) => hazard?.telegraphActive);
      const enemyPressure =
        this.model.enemyBullets.length >= 10 || this.model.ufos.length >= 3 || this.model.sentryRelays.length >= 1;
      const bossPressure = Boolean(this.model.miniBoss);
      mobileUi.threatContext = {
        bossPressure,
        hazardPressure,
        enemyPressure
      };
      const threatLevel = bossPressure ? 1 : hazardPressure || enemyPressure ? 0.72 : 0.28;
      const settle = this.clamp(Number(dt) || 0.016, 0.001, 0.08) * 6;
      const resolveAction = (ready, cooldown) => {
        const shouldHigh = ready || threatLevel >= 0.7;
        const targetAlpha = shouldHigh ? 0.96 : cooldown > 0.01 ? 0.34 : 0.42;
        const targetScale = shouldHigh ? 1 : 0.92;
        return { shouldHigh, targetAlpha, targetScale };
      };
      const updateEntry = (entry, ready, cooldown) => {
        if (!entry) return;
        const { shouldHigh, targetAlpha, targetScale } = resolveAction(ready, cooldown);
        const prevAlpha = Number(entry.alpha) || targetAlpha;
        const prevScale = Number(entry.scale) || targetScale;
        entry.state = shouldHigh ? "high" : "low";
        entry.alpha = prevAlpha + (targetAlpha - prevAlpha) * settle;
        entry.scale = prevScale + (targetScale - prevScale) * settle;
      };
      updateEntry(mobileUi.actionVisibility.secondary, this.model.secondaryCooldown <= 0.01, this.model.secondaryCooldown);
      updateEntry(mobileUi.actionVisibility.utility, this.model.utilityCooldown <= 0.01, this.model.utilityCooldown);
      const evadeReady = this.model.dashCooldown <= 0.01 || threatLevel >= 0.7;
      updateEntry(mobileUi.actionVisibility.evade, evadeReady, this.model.dashCooldown);
    }

    updateMobileUiState(dt = 0) {
      const mobileUi = this.model.mobileUi;
      if (!mobileUi) return;
      const assistCfg = this.getTouchAimAssistConfig();
      mobileUi.aimAssistEnabled = mobileUi.aimAssistEnabled !== false;
      mobileUi.aimAssistStrength = this.clamp(
        Number.isFinite(Number(mobileUi.aimAssistStrength)) ? Number(mobileUi.aimAssistStrength) : assistCfg.strengthDefault,
        assistCfg.strengthMin,
        assistCfg.strengthMax
      );
      mobileUi.aimSmoothing =
        mobileUi.aimSmoothing === "low" || mobileUi.aimSmoothing === "high" ? mobileUi.aimSmoothing : "default";
      mobileUi.ambientFxPreset =
        mobileUi.ambientFxPreset === "low" || mobileUi.ambientFxPreset === "high" ? mobileUi.ambientFxPreset : "default";
      const viewport = this.getViewportInfo();
      const touchActive = this.model.inputMode === "touch" || this.model.touchControls?.inputMode === "touch";
      const smallViewport = viewport.width <= 1024;
      const nextMode = touchActive || smallViewport ? "touch_mobile" : "desktop";
      this.model.deviceMode = nextMode;
      mobileUi.isLandscape = viewport.width >= viewport.height;
      mobileUi.orientationBlocked = nextMode === "touch_mobile" && !mobileUi.isLandscape;
      const fullscreenActive = mobileUi.fullscreenState === "active";
      mobileUi.fullscreenPromptVisible =
        nextMode === "touch_mobile" &&
        this.model.gameState === GAME_STATE.PLAYING &&
        mobileUi.isLandscape &&
        !mobileUi.orientationBlocked &&
        !fullscreenActive &&
        !mobileUi.fullscreenPromptDismissed;
      this.updateMobileActionVisibility(dt);
    }

    shouldPauseForMobileOrientation() {
      const mobileUi = this.model.mobileUi;
      return Boolean(this.model.deviceMode === "touch_mobile" && mobileUi?.orientationBlocked);
    }

    tryEnterFullscreenFromGesture() {
      const mobileUi = this.model.mobileUi;
      if (!mobileUi) return false;
      mobileUi.fullscreenState = "requested";
      if (typeof this.fullscreenRequestHandler !== "function") {
        mobileUi.fullscreenState = "denied";
        return false;
      }
      const success = this.fullscreenRequestHandler();
      mobileUi.fullscreenState = success ? "requested" : "denied";
      if (success) {
        mobileUi.fullscreenPromptVisible = false;
      } else {
        this.model.hangar.message = tr("touch.mobile.fullscreen_denied");
      }
      return success;
    }

    getTouchLayout() {
      const width = this.config.canvas.width;
      const height = this.config.canvas.height;
      const margin = this.clamp(Math.round(Math.min(width, height) * 0.03), 14, 30);
      const buttonGap = this.clamp(Math.round(Math.min(width, height) * 0.014), 8, 16);
      const thrustW = this.clamp(Math.round(width * 0.24), 150, 250);
      const thrustH = this.clamp(Math.round(height * 0.16), 84, 140);
      const rightClusterMaxW = Math.max(216, width - margin * 2);
      const rightWCap = Math.max(72, Math.floor((rightClusterMaxW - buttonGap * 2) / 3));
      const rightW = this.clamp(Math.round(width * 0.16), 72, Math.min(180, rightWCap));
      const rightH = this.clamp(Math.round(height * 0.12), 62, 94);
      const rightRightX = width - margin - rightW;
      const rightCenterX = rightRightX - rightW - buttonGap;
      const rightLeftX = rightCenterX - rightW - buttonGap;
      const bottomY = height - margin - rightH;
      const upperY = bottomY - rightH - buttonGap;
      const thrustY = height - margin - thrustH;
      const actionRadius = this.clamp(Math.round(Math.min(width, height) * 0.045), 24, 38);
      return {
        leftStick: { x: margin + thrustW * 0.5, y: thrustY + thrustH * 0.5, radius: 0, width: thrustW, height: thrustH },
        rightStick: {
          x: rightRightX + rightW * 0.5,
          y: bottomY + rightH * 0.5,
          radius: 0,
          width: rightW,
          height: rightH
        },
        buttons: {
          thrust: { x: margin, y: thrustY, w: thrustW, h: thrustH },
          turnLeft: { x: rightCenterX, y: bottomY, w: rightW, h: rightH },
          turnRight: { x: rightRightX, y: bottomY, w: rightW, h: rightH },
          primary: { x: rightLeftX, y: upperY, w: rightW, h: rightH },
          secondary: { x: rightCenterX, y: upperY, w: rightW, h: rightH },
          utility: { x: rightRightX, y: upperY, w: rightW, h: rightH },
          action: {
            x: rightCenterX + (rightW + buttonGap) * 0.5,
            y: bottomY - rightH * 0.4,
            radius: actionRadius
          }
        }
      };
    }

    getTouchSplitX(layout) {
      if (layout?.leftStick && layout?.rightStick) {
        return (Number(layout.leftStick.x) + Number(layout.rightStick.x)) / 2;
      }
      return this.config.canvas.width * 0.5;
    }

    getTouchAimTuningConfig() {
      const aimCfg = this.config?.touchControls?.aimInput || {};
      const multipliers = aimCfg.smoothingMultipliers && typeof aimCfg.smoothingMultipliers === "object" ? aimCfg.smoothingMultipliers : {};
      return {
        deadzone: this.clamp(Number(aimCfg.deadzone) || 0.16, 0.04, 0.5),
        responseExponent: this.clamp(Number(aimCfg.responseExponent) || 1.35, 0.7, 2.5),
        fireThreshold: this.clamp(Number(aimCfg.fireThreshold) || 0.22, 0.05, 0.9),
        baseSmoothingSeconds: this.clamp(Number(aimCfg.baseSmoothingSeconds) || 0.06, 0.005, 0.2),
        smoothingMultipliers: {
          low: this.clamp(Number(multipliers.low) || 0.72, 0.4, 1.6),
          default: this.clamp(Number(multipliers.default) || 1, 0.4, 1.6),
          high: this.clamp(Number(multipliers.high) || 1.34, 0.4, 1.8)
        }
      };
    }

    getTouchAimAssistConfig() {
      const cfg = this.config?.touchControls?.aimAssist || {};
      const min = this.clamp(Number(cfg.strengthMin) || 0.4, 0.05, 1);
      const max = this.clamp(Number(cfg.strengthMax) || 1, min, 1.8);
      return {
        enabledDefault: cfg.enabledDefault !== false,
        strengthMin: min,
        strengthMax: max,
        strengthDefault: this.clamp(Number(cfg.strengthDefault) || 0.64, min, max),
        coneRad: (this.clamp(Number(cfg.coneDegrees) || 22, 4, 55) * Math.PI) / 180,
        maxCorrectionRad: (this.clamp(Number(cfg.maxCorrectionDegrees) || 10, 2, 28) * Math.PI) / 180,
        maxRange: this.clamp(Number(cfg.maxRange) || 500, 120, 1400),
        ufoPriority: this.clamp(Number(cfg.ufoPriority) || 1, 0.4, 2.2),
        bossPriority: this.clamp(Number(cfg.bossPriority) || 1.45, 0.4, 2.5),
        weakpointOpenBonus: this.clamp(Number(cfg.weakpointOpenBonus) || 0.35, 0, 1)
      };
    }

    getTouchMoveProfile() {
      const cfg = this.config?.touchControls?.move || {};
      const curve = String(cfg.throttleCurve || "linear").toLowerCase();
      return {
        throttleCurve: curve === "linear" ? "linear" : "linear"
      };
    }

    getTouchRightStickProfile() {
      const cfg = this.config?.touchControls?.rightStick || {};
      const mode = String(cfg.mode || "relative_turn").toLowerCase();
      return {
        mode: mode === "relative_turn" ? "relative_turn" : "relative_turn",
        turnDeadzone: this.clamp(Number(cfg.turnDeadzone) || 0.14, 0.05, 0.5)
      };
    }

    getTouchEvadeProfile() {
      const cfg = this.config?.touchControls?.evade || {};
      const mode = String(cfg.mode || "dash_only").toLowerCase();
      return {
        mode: mode === "dash_only" ? "dash_only" : "dash_only"
      };
    }

    getTouchAimSmoothingMode() {
      const mode = String(this.model.mobileUi?.aimSmoothing || "default").toLowerCase();
      return mode === "low" || mode === "high" ? mode : "default";
    }

    getTouchAimSmoothingSeconds() {
      const tuning = this.getTouchAimTuningConfig();
      const mode = this.getTouchAimSmoothingMode();
      const mul = tuning.smoothingMultipliers?.[mode] ?? tuning.smoothingMultipliers.default;
      return this.clamp(tuning.baseSmoothingSeconds * mul, 0.005, 0.26);
    }

    resolveTouchAimAssist(rawAngle) {
      if (this.model.gameState !== GAME_STATE.PLAYING) return rawAngle;
      if (this.model.deviceMode !== "touch_mobile" || this.model.inputMode !== "touch") return rawAngle;
      const ship = this.model.ship;
      if (!ship) return rawAngle;
      const assistCfg = this.getTouchAimAssistConfig();
      const mobileUi = this.model.mobileUi || {};
      const assistEnabled = mobileUi.aimAssistEnabled !== false;
      if (!assistEnabled) return rawAngle;
      const strength = this.clamp(
        Number(mobileUi.aimAssistStrength),
        assistCfg.strengthMin,
        assistCfg.strengthMax
      );
      const candidates = [];
      for (const ufo of this.model.ufos) {
        if (!ufo) continue;
        candidates.push({
          x: ufo.x,
          y: ufo.y,
          radius: Math.max(8, Number(ufo.radius) || 16),
          priority: assistCfg.ufoPriority
        });
      }
      const boss = this.model.miniBoss;
      if (boss) {
        const bonus = boss.weakpointOpen ? assistCfg.weakpointOpenBonus : 0;
        candidates.push({
          x: boss.x,
          y: boss.y,
          radius: Math.max(14, Number(boss.radius) || 28),
          priority: assistCfg.bossPriority + bonus
        });
      }
      if (!candidates.length) return rawAngle;
      let best = null;
      for (const target of candidates) {
        const dx = target.x - ship.x;
        const dy = target.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist > assistCfg.maxRange) continue;
        const angleToTarget = Math.atan2(dy, dx);
        const delta = Math.atan2(Math.sin(angleToTarget - rawAngle), Math.cos(angleToTarget - rawAngle));
        const absDelta = Math.abs(delta);
        if (absDelta > assistCfg.coneRad) continue;
        const angleScore = 1 - absDelta / assistCfg.coneRad;
        const distanceScore = 1 - this.clamp(dist / assistCfg.maxRange, 0, 1);
        const radiusScore = this.clamp((target.radius || 0) / 44, 0, 0.32);
        const score = (angleScore * 0.72 + distanceScore * 0.28 + radiusScore) * target.priority;
        if (!best || score > best.score) {
          best = { delta, score, angleScore };
        }
      }
      if (!best) return rawAngle;
      const correctionLimit = assistCfg.maxCorrectionRad;
      const limitedDelta = this.clamp(best.delta, -correctionLimit, correctionLimit);
      const blend = this.clamp(strength * (0.22 + best.angleScore * 0.38), 0, 0.72);
      return rawAngle + limitedDelta * blend;
    }

    updateTouchInputState(dt) {
      const touch = this.model.touchControls;
      if (!touch || this.model.inputMode !== "touch") return;
      touch.layout = this.getTouchLayout();
      const orientationBlocked = Boolean(this.model.mobileUi?.orientationBlocked);
      if (
        this.lastTouchOrientationBlocked !== orientationBlocked ||
        this.lastTouchGameState !== this.model.gameState
      ) {
        this.resetTouchButtonsState(true);
      }
      this.lastTouchOrientationBlocked = orientationBlocked;
      this.lastTouchGameState = this.model.gameState;
      const pointerMap = touch.pointers || {};
      for (const key of Object.keys(touch.buttons || {})) {
        const button = touch.buttons[key];
        if (!button || button.pointerId == null) continue;
        if (!Object.prototype.hasOwnProperty.call(pointerMap, button.pointerId)) {
          button.down = false;
          button.pointerId = null;
        }
      }
      touch.actions.boostActive = false;
      touch.actions.dashPressed = false;
      touch.actions.fireActive = Boolean(touch.buttons?.primary?.down);
      if (this.model.gameState !== GAME_STATE.PLAYING) {
        touch.actions.fireActive = false;
        touch.actions.boostActive = false;
      }
    }

    getTouchMoveIntent() {
      const touch = this.model.touchControls;
      if (!touch || this.model.inputMode !== "touch") return null;
      const thrustDown = Boolean(touch.buttons?.thrust?.down);
      const turnLeftDown = Boolean(touch.buttons?.turnLeft?.down);
      const turnRightDown = Boolean(touch.buttons?.turnRight?.down);
      let turn = 0;
      if (turnLeftDown && !turnRightDown) turn = -1;
      else if (turnRightDown && !turnLeftDown) turn = 1;
      if (!thrustDown && turn === 0) return null;
      return {
        turn,
        thrust: thrustDown,
        thrustScale: thrustDown ? 1 : 0
      };
    }

    getTouchTurnIntent() {
      return null;
    }

    getTouchAimIntent(dt = this.config.simulation?.fixedStepSeconds || 1 / 120) {
      const touch = this.model.touchControls;
      if (!touch || this.model.inputMode !== "touch") return null;
      const right = touch.rightStick;
      const tuning = this.getTouchAimTuningConfig();
      if (!right.active || right.mag < tuning.deadzone) return null;
      const rawAngle = Math.atan2(right.ny, right.nx);
      const normalizedMagnitude = this.clamp((right.mag - tuning.deadzone) / Math.max(0.001, 1 - tuning.deadzone), 0, 1);
      const curvedMag = Math.pow(normalizedMagnitude, tuning.responseExponent);
      const targetNx = Math.cos(rawAngle) * curvedMag;
      const targetNy = Math.sin(rawAngle) * curvedMag;
      const smoothingSeconds = this.getTouchAimSmoothingSeconds();
      const alpha = this.clamp((Number(dt) || 0.0083) / Math.max(0.001, smoothingSeconds + (Number(dt) || 0.0083)), 0.08, 1);
      if (!Number.isFinite(right.aimNx) || !Number.isFinite(right.aimNy)) {
        right.aimNx = targetNx;
        right.aimNy = targetNy;
      } else {
        right.aimNx += (targetNx - right.aimNx) * alpha;
        right.aimNy += (targetNy - right.aimNy) * alpha;
      }
      right.aimMag = Math.hypot(right.aimNx, right.aimNy);
      if (right.aimMag < 0.04) return null;
      const smoothedAngle = Math.atan2(right.aimNy, right.aimNx);
      const assistedAngle = this.resolveTouchAimAssist(smoothedAngle);
      return {
        angle: assistedAngle,
        active: true
      };
    }

    getTouchCombatActions() {
      const touch = this.model.touchControls;
      if (!touch || this.model.inputMode !== "touch") {
        return {
          fireActive: false,
          secondaryPressed: false,
          utilityPressed: false,
          dashPressed: false,
          boostActive: false
        };
      }
      return { ...touch.actions };
    }

    consumeTouchCombatAction(actionKey) {
      const touch = this.model.touchControls;
      if (!touch || !touch.actions) return;
      if (actionKey === "secondaryPressed") touch.actions.secondaryPressed = false;
      else if (actionKey === "utilityPressed") touch.actions.utilityPressed = false;
      else if (actionKey === "dashPressed") touch.actions.dashPressed = false;
    }

    onTouchPointerDown(pointerId, x, y) {
      const touch = this.model.touchControls;
      if (!touch) return;
      touch.pointers[pointerId] = { id: pointerId, x, y };
      if (this.model.inputMode !== "touch") {
        this.model.inputMode = "touch";
        touch.inputMode = "touch";
      }
      touch.layout = this.getTouchLayout();
      const layout = touch.layout;
      const roleMap = touch.pointerRoles || (touch.pointerRoles = {});
      if (roleMap[pointerId]) return;
      const buttons = layout.buttons || {};
      const hitRect = (rect) =>
        rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
      if (!touch.buttons.secondary.down && hitRect(buttons.secondary)) {
        touch.buttons.secondary.down = true;
        touch.buttons.secondary.pointerId = pointerId;
        touch.actions.secondaryPressed = true;
        roleMap[pointerId] = "button_secondary";
        return;
      }
      if (!touch.buttons.utility.down && hitRect(buttons.utility)) {
        touch.buttons.utility.down = true;
        touch.buttons.utility.pointerId = pointerId;
        touch.actions.utilityPressed = true;
        roleMap[pointerId] = "button_utility";
        return;
      }
      if (!touch.buttons.primary.down && hitRect(buttons.primary)) {
        touch.buttons.primary.down = true;
        touch.buttons.primary.pointerId = pointerId;
        roleMap[pointerId] = "button_primary";
        return;
      }
      if (!touch.buttons.turnLeft.down && hitRect(buttons.turnLeft)) {
        touch.buttons.turnLeft.down = true;
        touch.buttons.turnLeft.pointerId = pointerId;
        roleMap[pointerId] = "button_turn_left";
        return;
      }
      if (!touch.buttons.turnRight.down && hitRect(buttons.turnRight)) {
        touch.buttons.turnRight.down = true;
        touch.buttons.turnRight.pointerId = pointerId;
        roleMap[pointerId] = "button_turn_right";
        return;
      }
      if (!touch.buttons.thrust.down && hitRect(buttons.thrust)) {
        touch.buttons.thrust.down = true;
        touch.buttons.thrust.pointerId = pointerId;
        roleMap[pointerId] = "button_thrust";
      }
    }

    onTouchPointerMove(pointerId, x, y) {
      const touch = this.model.touchControls;
      if (!touch || !touch.layout) return;
      touch.pointers[pointerId] = { id: pointerId, x, y };
      const role = touch.pointerRoles?.[pointerId];
      if (!role) return;
      const buttons = touch.layout.buttons || {};
      const hitRect = (rect) =>
        rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
      if (role === "button_thrust" && touch.buttons.thrust.pointerId === pointerId) {
        touch.buttons.thrust.down = hitRect(buttons.thrust);
      } else if (role === "button_turn_left" && touch.buttons.turnLeft.pointerId === pointerId) {
        touch.buttons.turnLeft.down = hitRect(buttons.turnLeft);
      } else if (role === "button_turn_right" && touch.buttons.turnRight.pointerId === pointerId) {
        touch.buttons.turnRight.down = hitRect(buttons.turnRight);
      } else if (role === "button_secondary" && touch.buttons.secondary.pointerId === pointerId) {
        touch.buttons.secondary.down = hitRect(buttons.secondary);
      } else if (role === "button_utility" && touch.buttons.utility.pointerId === pointerId) {
        touch.buttons.utility.down = hitRect(buttons.utility);
      } else if (role === "button_primary" && touch.buttons.primary.pointerId === pointerId) {
        touch.buttons.primary.down = hitRect(buttons.primary);
      }
    }

    onTouchPointerUp(pointerId, x, y) {
      const touch = this.model.touchControls;
      if (!touch) return;
      if (touch.pointers && Object.prototype.hasOwnProperty.call(touch.pointers, pointerId)) {
        delete touch.pointers[pointerId];
      }
      if (touch.pointerRoles && Object.prototype.hasOwnProperty.call(touch.pointerRoles, pointerId)) {
        delete touch.pointerRoles[pointerId];
      }
      if (touch.buttons.thrust.pointerId === pointerId) {
        touch.buttons.thrust.down = false;
        touch.buttons.thrust.pointerId = null;
      }
      if (touch.buttons.turnLeft.pointerId === pointerId) {
        touch.buttons.turnLeft.down = false;
        touch.buttons.turnLeft.pointerId = null;
      }
      if (touch.buttons.turnRight.pointerId === pointerId) {
        touch.buttons.turnRight.down = false;
        touch.buttons.turnRight.pointerId = null;
      }
      if (touch.buttons.secondary.pointerId === pointerId) {
        touch.buttons.secondary.down = false;
        touch.buttons.secondary.pointerId = null;
      }
      if (touch.buttons.utility.pointerId === pointerId) {
        touch.buttons.utility.down = false;
        touch.buttons.utility.pointerId = null;
      }
      if (touch.buttons.primary.pointerId === pointerId) {
        touch.buttons.primary.down = false;
        touch.buttons.primary.pointerId = null;
      }
      this.handleTouchTapNavigation(x, y);
    }

    updateTouchStickState(stick, radius) {
      const dx = stick.x - stick.baseX;
      const dy = stick.y - stick.baseY;
      const halfW = Math.max(1, (Number(stick.width) || radius * 2) * 0.5);
      const halfH = Math.max(1, (Number(stick.height) || radius * 2) * 0.5);
      const normX = this.clamp(dx / halfW, -1, 1);
      const normY = this.clamp(dy / halfH, -1, 1);
      stick.nx = normX;
      stick.ny = normY;
      stick.mag = this.clamp(Math.max(Math.abs(normX), Math.abs(normY)), 0, 1);
    }

    handleTouchTapNavigation(x, y) {
      if (this.model.inputMode !== "touch" || this.model.uiModal) return;
      const touch = this.model.touchControls;
      if (!touch) return;
      const fullscreenZone = touch.ui?.fullscreenTapZone;
      if (
        fullscreenZone &&
        x >= fullscreenZone.x &&
        x <= fullscreenZone.x + fullscreenZone.w &&
        y >= fullscreenZone.y &&
        y <= fullscreenZone.y + fullscreenZone.h
      ) {
        this.tryEnterFullscreenFromGesture();
        return;
      }
      if (this.model.gameState === GAME_STATE.PLAYING) {
        return;
      }
      const overlayActionZone = touch.ui?.overlayActionCtaZone;
      if (
        overlayActionZone &&
        x >= overlayActionZone.x &&
        x <= overlayActionZone.x + overlayActionZone.w &&
        y >= overlayActionZone.y &&
        y <= overlayActionZone.y + overlayActionZone.h
      ) {
        if (this.model.gameState === GAME_STATE.START) {
          this.startGame(this.model.runSeed ?? generateRunSeed());
        } else if (this.model.gameState === GAME_STATE.GAME_OVER || this.model.gameState === GAME_STATE.VICTORY) {
          this.model.overlaySettingsRow = 0;
          this.model.overlayEndSummaryPage = "overview";
          this.model.gameState = GAME_STATE.START;
          this.model.runSeed = generateRunSeed();
          this.hud.sync(this.model);
        }
        return;
      }
      const layout = touch.layout || this.getTouchLayout();
      const actionBtn = layout.buttons?.action;
      if (
        this.model.gameState === GAME_STATE.HANGAR &&
        actionBtn &&
        Math.hypot(x - actionBtn.x, y - actionBtn.y) <= actionBtn.radius * 1.28
      ) {
        this.hangarSystem.activateNavSelection();
        return;
      }
      if (this.model.gameState === GAME_STATE.START) this.handleTouchRunSetupTap(x, y);
      else if (this.model.gameState === GAME_STATE.HANGAR) this.handleTouchHangarTap(x, y);
      else if (this.model.gameState === GAME_STATE.GAME_OVER || this.model.gameState === GAME_STATE.VICTORY) {
        this.handleTouchEndSummaryTap(x, y);
      }
    }

    handleTouchRunSetupTap(x, y) {
      const rows = this.model.touchControls?.ui?.overlayRows;
      if (!Array.isArray(rows) || !rows.length) return;
      for (const row of rows) {
        const pad = 8;
        if (x >= row.x - pad && x <= row.x + row.w + pad && y >= row.y - pad && y <= row.y + row.h + pad) {
          const order = this.getOverlaySettingRows();
          const index = order.indexOf(row.id);
          if (index >= 0) this.model.overlaySettingsRow = index;
          if (x <= row.leftX + row.sideW) this.adjustSelectedOverlaySetting(-1);
          else if (x >= row.rightX) this.adjustSelectedOverlaySetting(1);
          return;
        }
      }
    }

    handleTouchEndSummaryTap(x, y) {
      const zones = this.model.touchControls?.ui?.endSummaryTapZones;
      if (!zones) return;
      if (x >= zones.left.x && x <= zones.left.x + zones.left.w && y >= zones.left.y && y <= zones.left.y + zones.left.h) {
        this.cycleOverlayEndSummaryPage(-1);
        return;
      }
      if (x >= zones.right.x && x <= zones.right.x + zones.right.w && y >= zones.right.y && y <= zones.right.y + zones.right.h) {
        this.cycleOverlayEndSummaryPage(1);
      }
    }

    handleTouchHangarTap(x, y) {
      const ui = this.model.touchControls?.ui;
      if (!ui) return;
      const actions = ui.hangarBottomActions;
      if (actions) {
        const inRect = (zone) => x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
        if (actions.action && inRect(actions.action)) {
          this.hangarSystem.activateNavSelection();
          return;
        }
        if (actions.launch && inRect(actions.launch)) {
          this.hangarSystem.beginNextSectorFromHangar();
          this.hud.sync(this.model);
          return;
        }
        if (actions.back && inRect(actions.back)) {
          this.model.hangar.navSection = "shop";
          this.hangarSystem.ensureNavState();
          this.hud.sync(this.model);
          return;
        }
      }
      const lootRows = Array.isArray(ui.hangarLootRows) ? ui.hangarLootRows : [];
      for (const row of lootRows) {
        if (x >= row.x && x <= row.x + row.w && y >= row.y && y <= row.y + row.h) {
          this.model.hangar.navSection = "loot";
          this.model.hangar.selectionSource = row.source;
          this.model.hangar.selectionIndex = row.index;
          this.hangarSystem.clampSelection();
          return;
        }
      }
      const shopRows = Array.isArray(ui.hangarShopRows) ? ui.hangarShopRows : [];
      for (const row of shopRows) {
        if (x >= row.x && x <= row.x + row.w && y >= row.y && y <= row.y + row.h) {
          this.model.hangar.navSection = "shop";
          this.model.hangar.shopIndex = row.actionIndex;
          this.hangarSystem.ensureNavState();
          return;
        }
      }
    }

    getDefaultProfile() {
      return createDefaultProfile();
    }

    getFactionDefs() {
      const defs = this.config.faction?.definitions;
      if (!Array.isArray(defs) || !defs.length) {
        return [
          { id: "helix_union", color: "#73d5ff", shopBias: "precision" },
          { id: "drift_cartel", color: "#ff9a66", shopBias: "scrap" }
        ];
      }
      return defs.filter((entry) => entry && typeof entry.id === "string" && entry.id.length > 0);
    }

    getFactionIntelDefs() {
      const defs = this.config.faction?.intelOptions;
      if (!Array.isArray(defs) || !defs.length) {
        return [
          { id: "balanced", pressureMul: 1, creditsMul: 1, salvageMul: 1, reputationDelta: {} },
          { id: "helix_contract", pressureMul: 1.06, creditsMul: 1.12, salvageMul: 0.9, reputationDelta: { helix_union: 2, drift_cartel: -1 } },
          { id: "drift_contract", pressureMul: 1.06, creditsMul: 0.9, salvageMul: 1.12, reputationDelta: { helix_union: -1, drift_cartel: 2 } }
        ];
      }
      return defs.filter((entry) => entry && typeof entry.id === "string" && entry.id.length > 0);
    }

    getFactionThresholdDefs() {
      const defs = this.config.faction?.repThresholds;
      if (!Array.isArray(defs) || !defs.length) return [];
      return defs
        .filter((entry) => entry && typeof entry.id === "string" && Number.isFinite(Number(entry.minRep)))
        .map((entry) => ({
          id: entry.id,
          minRep: Math.floor(Number(entry.minRep)),
          maxRep: Number.isFinite(Number(entry.maxRep)) ? Math.floor(Number(entry.maxRep)) : null,
          effects: entry.effects && typeof entry.effects === "object" ? { ...entry.effects } : {}
        }))
        .sort((a, b) => a.minRep - b.minRep);
    }

    sanitizeFactionIntelId(id) {
      const defs = this.getFactionIntelDefs();
      const fallback = defs.find((entry) => entry.id === "balanced")?.id || defs[0]?.id || "balanced";
      if (!id) return fallback;
      return defs.some((entry) => entry.id === id) ? id : fallback;
    }

    sanitizeHangarVendorId(id) {
      return id === "black_market" ? "black_market" : "faction";
    }

    getHangarVendorId() {
      return this.sanitizeHangarVendorId(this.model.hangar?.shopVendorId);
    }

    cycleHangarVendor(direction = 1) {
      const order = ["faction", "black_market"];
      const current = this.getHangarVendorId();
      const idx = order.indexOf(current);
      const next = order[(idx + direction + order.length) % order.length];
      this.model.hangar.shopVendorId = next;
      this.model.hangar.message = tr("game.hangar.vendor_changed", { vendor: tr(`game.hangar.vendor.${next}`) });
      if (typeof this.hangarSystem?.refreshShopOffers === "function") {
        this.hangarSystem.refreshShopOffers();
      }
      this.saveProfile("hangar_vendor_change");
      this.hud.sync(this.model);
      return next;
    }

    getContrabandItemIdSet() {
      const ids = this.config.faction?.contrabandItemIds;
      if (!Array.isArray(ids)) return new Set();
      return new Set(ids.filter((id) => typeof id === "string" && id.length > 0));
    }

    getContrabandHeat() {
      return Math.max(0, Math.floor(Number(this.model.contrabandHeat) || 0));
    }

    getContrabandPressureMultiplier() {
      const heat = this.getContrabandHeat();
      const perStack = Math.max(0, Number(this.config.faction?.contrabandHeatPressurePerStack) || 0);
      return this.clamp(1 + heat * perStack, 1, 2.2);
    }

    applyContrabandPurchaseEffects(itemId) {
      if (!this.getContrabandItemIdSet().has(itemId)) return false;
      const heatGain = Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatPerPurchase) || 1));
      const heatMax = Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatMax) || 12));
      const penalty = Math.max(0, Math.floor(Number(this.config.faction?.contrabandRepPenalty) || 2));

      this.model.contrabandHeat = this.clamp(this.getContrabandHeat() + heatGain, 0, heatMax);
      for (const faction of this.getFactionDefs()) {
        this.addFactionReputation(faction.id, -penalty, {
          reasonKey: "game.faction.reason.contraband",
          announce: false,
          saveProfile: false,
          applyGainTuning: false
        });
      }
      this.model.hangar.message = tr("game.contraband.applied", { heat: this.model.contrabandHeat });
      this.hud.sync(this.model);
      return true;
    }

    decayContrabandHeatOnMissionComplete() {
      const decay = Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatDecayOnMissionComplete) || 1));
      if (decay <= 0) return 0;
      const before = this.getContrabandHeat();
      const after = this.clamp(before - decay, 0, Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatMax) || 12)));
      this.model.contrabandHeat = after;
      return before - after;
    }

    getSelectedFactionIntelProfile() {
      const defs = this.getFactionIntelDefs();
      const selectedId = this.sanitizeFactionIntelId(this.model.hangar?.factionIntelId);
      return defs.find((entry) => entry.id === selectedId) || defs[0];
    }

    cycleFactionIntel(direction = 1) {
      const defs = this.getFactionIntelDefs();
      if (!defs.length) return false;
      const currentId = this.sanitizeFactionIntelId(this.model.hangar?.factionIntelId);
      const currentIndex = defs.findIndex((entry) => entry.id === currentId);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + defs.length) % defs.length;
      const next = defs[nextIndex];
      this.model.hangar.factionIntelId = next.id;
      this.model.hangar.message = tr("game.faction.intel_changed", { intel: tr(`game.faction.intel.${next.id}`) });
      this.saveProfile("faction_intel_change");
      this.hud.sync(this.model);
      return true;
    }

    getFactionRepBounds() {
      const minCfg = Number(this.config.faction?.repMin);
      const maxCfg = Number(this.config.faction?.repMax);
      const min = Number.isFinite(minCfg) ? Math.floor(minCfg) : -100;
      const max = Number.isFinite(maxCfg) ? Math.floor(maxCfg) : 100;
      return { min: Math.min(min, max), max: Math.max(min, max) };
    }

    sanitizeFactionProgression(rawFactions) {
      const safeRaw = rawFactions && typeof rawFactions === "object" ? rawFactions : {};
      const defs = this.getFactionDefs();
      const bounds = this.getFactionRepBounds();
      const result = {};
      for (const faction of defs) {
        const value = Math.floor(Number(safeRaw[faction.id]) || 0);
        result[faction.id] = this.clamp(value, bounds.min, bounds.max);
      }
      return result;
    }

    getFactionReputation(factionId) {
      if (!factionId) return 0;
      const factions = this.model.factions && typeof this.model.factions === "object" ? this.model.factions : {};
      return Math.floor(Number(factions[factionId]) || 0);
    }

    formatSignedInteger(value) {
      const number = Math.floor(Number(value) || 0);
      if (number > 0) return `+${number}`;
      return String(number);
    }

    getFactionSectorRepGainCap() {
      const base = Math.max(0, Math.floor(Number(this.config.faction?.repGainSectorCapBase) || 5));
      const step = Math.max(0, Math.floor(Number(this.config.faction?.repGainSectorCapStep) || 1));
      return base + Math.max(0, this.model.sector - 1) * step;
    }

    getFactionRepGainTrackerEntry(factionId) {
      this.model.factionRepGainTracker =
        this.model.factionRepGainTracker && typeof this.model.factionRepGainTracker === "object"
          ? this.model.factionRepGainTracker
          : {};
      const currentSector = Math.max(1, Math.floor(Number(this.model.sector) || 1));
      const existing = this.model.factionRepGainTracker[factionId];
      if (!existing || existing.sector !== currentSector) {
        this.model.factionRepGainTracker[factionId] = { sector: currentSector, gain: 0 };
      }
      return this.model.factionRepGainTracker[factionId];
    }

    getTunedPositiveFactionGain(factionId, delta) {
      const raw = Math.max(0, Math.floor(Number(delta) || 0));
      if (raw <= 0) return 0;
      const rep = this.getFactionReputation(factionId);
      const diminishStart = Math.floor(Number(this.config.faction?.repGainDiminishStart) || 20);
      const diminishMaxReduction = this.clamp(Number(this.config.faction?.repGainDiminishMaxReduction) || 0.7, 0, 0.95);
      let tuned = raw;
      if (rep >= diminishStart) {
        const bounds = this.getFactionRepBounds();
        const span = Math.max(1, bounds.max - diminishStart);
        const progress = this.clamp((rep - diminishStart) / span, 0, 1);
        const reduction = progress * diminishMaxReduction;
        tuned = Math.max(1, Math.round(raw * (1 - reduction)));
      }
      const cap = this.getFactionSectorRepGainCap();
      if (cap <= 0) return 0;
      const tracker = this.getFactionRepGainTrackerEntry(factionId);
      const remaining = Math.max(0, cap - Math.max(0, Math.floor(Number(tracker.gain) || 0)));
      if (remaining <= 0) return 0;
      return Math.min(tuned, remaining);
    }

    recordPositiveFactionGain(factionId, gain) {
      const applied = Math.max(0, Math.floor(Number(gain) || 0));
      if (applied <= 0) return;
      const tracker = this.getFactionRepGainTrackerEntry(factionId);
      tracker.gain = Math.max(0, Math.floor(Number(tracker.gain) || 0)) + applied;
    }

    getFactionThresholdProfile(factionId = this.model.currentMission?.biomeFactionId || null) {
      if (!factionId) return null;
      const rep = this.getFactionReputation(factionId);
      const defs = this.getFactionThresholdDefs();
      let active = null;
      for (const tier of defs) {
        if (rep < tier.minRep) continue;
        if (Number.isFinite(tier.maxRep) && rep > tier.maxRep) continue;
        active = tier;
      }
      return active;
    }

    getFactionThresholdIdForRep(repValue) {
      const rep = Math.floor(Number(repValue) || 0);
      const defs = this.getFactionThresholdDefs();
      let activeId = null;
      for (const tier of defs) {
        if (rep < tier.minRep) continue;
        if (Number.isFinite(tier.maxRep) && rep > tier.maxRep) continue;
        activeId = tier.id;
      }
      return activeId;
    }

    initFactionRunSummary() {
      const startRep = {};
      const thresholdUnlocks = {};
      for (const faction of this.getFactionDefs()) {
        const rep = this.getFactionReputation(faction.id);
        startRep[faction.id] = rep;
        thresholdUnlocks[faction.id] = [];
      }
      this.model.factionRunSummary = {
        active: true,
        startedAtSeconds: this.model.runtimeSeconds,
        startRep,
        thresholdUnlocks,
        timeline: [],
        maxTimelineEntries: 24
      };
    }

    recordFactionRunTimelineEntry(entry) {
      const summary = this.model.factionRunSummary;
      if (!summary || !summary.active) return;
      const safeEntry = entry && typeof entry === "object" ? entry : null;
      if (!safeEntry || !safeEntry.factionId) return;
      const maxEntries = Math.max(8, Math.floor(Number(summary.maxTimelineEntries) || 24));
      summary.timeline.push({
        sector: Math.max(1, Math.floor(Number(this.model.sector) || 1)),
        runtimeSeconds: Number(this.model.runtimeSeconds) || 0,
        ...safeEntry
      });
      if (summary.timeline.length > maxEntries) {
        summary.timeline.splice(0, summary.timeline.length - maxEntries);
      }
    }

    registerFactionThresholdUnlock(factionId, thresholdId, sourceEntry = null) {
      if (!factionId || !thresholdId) return;
      const summary = this.model.factionRunSummary;
      if (!summary || !summary.active) return;
      const byFaction = summary.thresholdUnlocks && typeof summary.thresholdUnlocks === "object" ? summary.thresholdUnlocks : {};
      const list = Array.isArray(byFaction[factionId]) ? byFaction[factionId] : [];
      if (!list.includes(thresholdId)) list.push(thresholdId);
      byFaction[factionId] = list;
      summary.thresholdUnlocks = byFaction;
      this.recordFactionRunTimelineEntry({
        type: "threshold_unlock",
        factionId,
        thresholdId,
        reasonKey: sourceEntry?.reasonKey || "game.faction.reason.mission_complete"
      });
    }

    buildFactionRunSummarySnapshot() {
      const summary = this.model.factionRunSummary;
      if (!summary) return null;
      const defs = this.getFactionDefs();
      const byFaction = defs.map((faction) => {
        const startRep = Math.floor(Number(summary.startRep?.[faction.id]) || 0);
        const endRep = this.getFactionReputation(faction.id);
        const unlocked = Array.isArray(summary.thresholdUnlocks?.[faction.id])
          ? summary.thresholdUnlocks[faction.id].slice()
          : [];
        return {
          factionId: faction.id,
          startRep,
          endRep,
          deltaRep: endRep - startRep,
          unlockedThresholdIds: unlocked
        };
      });
      const timeline = Array.isArray(summary.timeline) ? summary.timeline.slice(-8) : [];
      return {
        byFaction,
        timeline
      };
    }

    getFactionMissionDirective(factionId = this.model.currentMission?.biomeFactionId || null, missionType = this.model.currentMission?.type || null) {
      if (!factionId || !missionType) return null;
      const directives = this.config.faction?.missionDirectives;
      if (!directives || typeof directives !== "object") return null;
      const factionDirective = directives[factionId];
      const byMission =
        factionDirective && typeof factionDirective === "object" && factionDirective.byMission && typeof factionDirective.byMission === "object"
          ? factionDirective.byMission
          : null;
      if (!byMission) return null;
      const raw = byMission[missionType];
      if (!raw || typeof raw !== "object") return null;
      const objectiveMul = this.clamp(Number(raw.objectiveMul) || 1, 0.7, 1.4);
      const spawnIntervalMul = this.clamp(Number(raw.spawnIntervalMul) || 1, 0.7, 1.4);
      const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : `${factionId}_${missionType}`;
      const labelKey =
        typeof raw.labelKey === "string" && raw.labelKey.length > 0 ? raw.labelKey : `mission.directive.${id}`;
      return {
        id,
        labelKey,
        label: tr(labelKey),
        objectiveMul,
        spawnIntervalMul
      };
    }

    addFactionReputation(factionId, delta, options = {}) {
      const defs = this.getFactionDefs();
      if (!defs.some((entry) => entry.id === factionId)) return 0;
      let deltaInt = Math.floor(Number(delta) || 0);
      if (deltaInt > 0 && options.applyGainTuning !== false) {
        deltaInt = this.getTunedPositiveFactionGain(factionId, deltaInt);
      }
      if (deltaInt === 0) return 0;
      const bounds = this.getFactionRepBounds();
      const before = this.getFactionReputation(factionId);
      const after = this.clamp(before + deltaInt, bounds.min, bounds.max);
      const applied = after - before;
      if (applied === 0) return 0;
      if (applied > 0 && options.applyGainTuning !== false) this.recordPositiveFactionGain(factionId, applied);

      this.model.factions = this.model.factions && typeof this.model.factions === "object" ? this.model.factions : {};
      this.model.factions[factionId] = after;
      const beforeThresholdId = this.getFactionThresholdIdForRep(before);
      const afterThresholdId = this.getFactionThresholdIdForRep(after);
      const reasonKey = options.reasonKey || "game.faction.reason.mission_start";
      this.recordFactionRunTimelineEntry({
        type: "rep_delta",
        factionId,
        delta: applied,
        beforeRep: before,
        afterRep: after,
        reasonKey
      });
      if (afterThresholdId && afterThresholdId !== beforeThresholdId) {
        this.registerFactionThresholdUnlock(factionId, afterThresholdId, { reasonKey });
      }

      if (options.announce !== false) {
        this.model.hangar.message = tr("game.faction.rep_changed", {
          faction: tr(`game.faction.${factionId}`),
          delta: this.formatSignedInteger(applied),
          reason: tr(reasonKey)
        });
        this.hud.sync(this.model);
      }
      if (options.saveProfile !== false) {
        this.saveProfile(options.saveReason || "faction_reputation_change");
      }
      return applied;
    }

    applyMissionFactionReputation(baseDelta, reasonKey, options = {}) {
      const missionFactionId = this.model.currentMission?.biomeFactionId;
      if (!missionFactionId) return 0;
      const gain = Math.floor(Number(baseDelta) || 0);
      if (gain === 0) return 0;

      let totalApplied = 0;
      const primaryApplied = this.addFactionReputation(missionFactionId, gain, {
        reasonKey,
        announce: options.announce,
        saveProfile: false
      });
      totalApplied += Math.abs(primaryApplied);
      if (primaryApplied > 0) {
        const rivalLossMul = Math.max(0, Number(this.config.faction?.rivalRepLossOnGainMul) || 0);
        if (rivalLossMul > 0) {
          const rivalLoss = Math.max(1, Math.round(primaryApplied * rivalLossMul));
          for (const faction of this.getFactionDefs()) {
            if (faction.id === missionFactionId) continue;
            const appliedLoss = this.addFactionReputation(faction.id, -rivalLoss, {
              reasonKey,
              announce: false,
              saveProfile: false
            });
            totalApplied += Math.abs(appliedLoss);
          }
        }
      }

      if (totalApplied > 0 && options.saveProfile !== false) {
        this.saveProfile(options.saveReason || "faction_reputation_change");
      }
      return totalApplied;
    }

    getDominantFactionState() {
      const defs = this.getFactionDefs();
      if (!defs.length) return null;
      let best = null;
      for (const faction of defs) {
        const rep = this.getFactionReputation(faction.id);
        if (!best || rep > best.rep) best = { ...faction, rep };
      }
      return best;
    }

    getFactionRewardMultipliers(factionId = this.model.currentMission?.biomeFactionId || null) {
      if (!factionId) return { creditsMul: 1, salvageMul: 1 };
      const rep = this.getFactionReputation(factionId);
      const influence = this.clamp(rep / 100, -1, 1);
      const creditsScale = Number(this.config.faction?.rewardCreditsPerRep100) || 0;
      const salvageScale = Number(this.config.faction?.rewardSalvagePerRep100) || 0;
      const threshold = this.getFactionThresholdProfile(factionId);
      const thresholdCreditsMul = this.clamp(Number(threshold?.effects?.creditsMul) || 1, 0.7, 1.4);
      const thresholdSalvageMul = this.clamp(Number(threshold?.effects?.salvageMul) || 1, 0.7, 1.4);
      return {
        creditsMul: this.clamp((1 + influence * creditsScale) * thresholdCreditsMul, 0.65, 1.45),
        salvageMul: this.clamp((1 + influence * salvageScale) * thresholdSalvageMul, 0.65, 1.45)
      };
    }

    getFactionIntelRewardMultipliers() {
      const intel = this.model.currentMission?.intelProfile || this.getSelectedFactionIntelProfile();
      return {
        creditsMul: this.clamp(Number(intel?.creditsMul) || 1, 0.7, 1.5),
        salvageMul: this.clamp(Number(intel?.salvageMul) || 1, 0.7, 1.5)
      };
    }

    applyMissionFactionIntelReputation() {
      const mission = this.model.currentMission;
      if (!mission || mission.intelRepApplied) return 0;
      const intel = mission.intelProfile || this.getSelectedFactionIntelProfile();
      const repDelta = intel?.reputationDelta;
      if (!repDelta || typeof repDelta !== "object") {
        mission.intelRepApplied = true;
        return 0;
      }
      let total = 0;
      for (const faction of this.getFactionDefs()) {
        const delta = Math.floor(Number(repDelta[faction.id]) || 0);
        if (delta === 0) continue;
        const applied = this.addFactionReputation(faction.id, delta, {
          reasonKey: "game.faction.reason.intel_contract",
          announce: false,
          saveProfile: false
        });
        total += Math.abs(applied);
      }
      mission.intelRepApplied = true;
      if (total > 0) this.saveProfile("faction_intel_contract");
      return total;
    }

    getFactionShopItemCost(itemId, baseCost) {
      const defs = this.getFactionDefs();
      let multiplier = 1;
      const priceScale = Number(this.config.faction?.shopPriceInfluencePerRep100) || 0.14;
      const penaltyScale = Number(this.config.faction?.shopPenaltyInfluencePerRep100) || 0.06;
      for (const faction of defs) {
        const influence = this.clamp(this.getFactionReputation(faction.id) / 100, -1, 1);
        if (Math.abs(influence) <= 0.0001) continue;
        if (faction.shopBias === "precision") {
          if (itemId === "fire_rate" || itemId === "magazine") multiplier *= 1 - influence * priceScale;
          else if (itemId === "repair") multiplier *= 1 + influence * penaltyScale;
        } else if (faction.shopBias === "scrap") {
          if (itemId === "repair") multiplier *= 1 - influence * priceScale;
          else if (itemId === "fire_rate" || itemId === "magazine") multiplier *= 1 + influence * penaltyScale;
        }
      }
      const dominant = this.getDominantFactionState();
      if (dominant?.id) {
        const threshold = this.getFactionThresholdProfile(dominant.id);
        const thresholdShopMul = this.clamp(Number(threshold?.effects?.shopPriceMul) || 1, 0.75, 1.3);
        multiplier *= thresholdShopMul;
      }
      const clampedMultiplier = this.clamp(multiplier, 0.7, 1.4);
      return Math.max(1, Math.round((Number(baseCost) || 0) * clampedMultiplier));
    }

    getHangarShopItems() {
      const baseItems = Array.isArray(this.config.hangar?.items) ? this.config.hangar.items : [];
      const vendor = this.getHangarVendorId();
      if (vendor === "black_market") {
        const priceMul = this.clamp(Number(this.config.faction?.blackMarketPriceMul) || 1.2, 1, 2.2);
        const contrabandDiscount = this.clamp(Number(this.config.faction?.contrabandDiscountMul) || 0.72, 0.4, 1);
        const contrabandSet = this.getContrabandItemIdSet();
        return baseItems.map((item, index) => ({
          ...item,
          baseIndex: index,
          isContraband: contrabandSet.has(item.id),
          resolvedCost: Math.max(
            1,
            Math.round((Number(item.cost) || 0) * priceMul * (contrabandSet.has(item.id) ? contrabandDiscount : 1))
          )
        }));
      }
      const items = baseItems.map((item, index) => ({
        ...item,
        baseIndex: index,
        resolvedCost: this.getFactionShopItemCost(item.id, item.cost)
      }));
      const dominant = this.getDominantFactionState();
      const threshold = Math.max(0, Number(this.config.faction?.shopBiasThresholdRep) || 15);
      if (!dominant || dominant.rep < threshold) return items;
      let priorityMap = null;
      if (dominant.shopBias === "precision") {
        priorityMap = { fire_rate: 0, magazine: 1, repair: 2 };
      } else if (dominant.shopBias === "scrap") {
        priorityMap = { repair: 0, magazine: 1, fire_rate: 2 };
      }
      if (!priorityMap) return items;
      return items
        .slice()
        .sort((a, b) => {
          const aPriority = priorityMap[a.id] ?? 100;
          const bPriority = priorityMap[b.id] ?? 100;
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.baseIndex - b.baseIndex;
        });
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

      safe.progression.flightModel =
        progression.flightModel === "sim_lite" || progression.flightModel === "arcade"
          ? progression.flightModel
          : defaults.progression.flightModel;
      const difficultyDefs = this.getRunDifficultyDefs();
      const fallbackDifficultyId = difficultyDefs.find((entry) => entry.id === defaults.progression.runDifficultyId)?.id || "normal";
      const requestedDifficultyId = progression.runDifficultyId;
      safe.progression.runDifficultyId = difficultyDefs.some((entry) => entry.id === requestedDifficultyId)
        ? requestedDifficultyId
        : fallbackDifficultyId;
      const mutatorDefs = this.getRunMutatorDefs();
      const fallbackMutatorId = mutatorDefs.find((entry) => entry.id === defaults.progression.runMutatorId)?.id || "standard";
      const requestedMutatorId = progression.runMutatorId;
      safe.progression.runMutatorId = mutatorDefs.some((entry) => entry.id === requestedMutatorId)
        ? requestedMutatorId
        : fallbackMutatorId;
      safe.progression.shopVendorId = this.sanitizeHangarVendorId(progression.shopVendorId);
      safe.progression.factionIntelId = this.sanitizeFactionIntelId(progression.factionIntelId);

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
      safe.progression.contrabandHeat = this.clamp(
        Math.floor(Number(progression.contrabandHeat) || 0),
        0,
        Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatMax) || 12))
      );

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
      safe.progression.factions = this.sanitizeFactionProgression(progression.factions);

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
        flightModel: this.model.flightModel,
        runDifficultyId: this.model.runDifficultyId,
        runMutatorId: this.model.runMutatorId,
        shopVendorId: this.model.hangar.shopVendorId,
        factionIntelId: this.model.hangar.factionIntelId,
        loadout: {
          primaryId: this.model.loadout.primaryId,
          secondaryId: this.model.loadout.secondaryId,
          utilityId: this.model.loadout.utilityId
        },
        unlocks: deepClone(this.model.unlocks),
        upgrades: deepClone(this.model.upgrades),
        inventory: deepClone(this.model.inventory),
        equipment: deepClone(this.model.equipment),
        factions: deepClone(this.model.factions),
        contrabandHeat: this.model.contrabandHeat,
        identity: deepClone(this.model.identity),
        salvageParts: this.model.salvageParts,
        pilot: deepClone(this.model.pilot)
      };
    }

    applyProfileToModel(profile) {
      const progression = profile.progression;
      this.model.flightModel = progression.flightModel === "sim_lite" ? "sim_lite" : "arcade";
      const difficultyDefs = this.getRunDifficultyDefs();
      const fallbackDifficultyId = difficultyDefs.find((entry) => entry.id === "normal")?.id || difficultyDefs[0]?.id || "normal";
      this.model.runDifficultyId = difficultyDefs.some((entry) => entry.id === progression.runDifficultyId)
        ? progression.runDifficultyId
        : fallbackDifficultyId;
      const mutatorDefs = this.getRunMutatorDefs();
      const fallbackMutatorId = mutatorDefs.find((entry) => entry.id === "standard")?.id || mutatorDefs[0]?.id || "standard";
      this.model.runMutatorId = mutatorDefs.some((entry) => entry.id === progression.runMutatorId)
        ? progression.runMutatorId
        : fallbackMutatorId;
      this.model.hangar.shopVendorId = this.sanitizeHangarVendorId(progression.shopVendorId);
      this.model.hangar.factionIntelId = this.sanitizeFactionIntelId(progression.factionIntelId);
      this.model.loadout.primaryId = progression.loadout.primaryId;
      this.model.loadout.secondaryId = progression.loadout.secondaryId;
      this.model.loadout.utilityId = progression.loadout.utilityId;
      this.model.unlocks = deepClone(progression.unlocks);
      this.model.upgrades = deepClone(progression.upgrades);
      this.model.inventory = deepClone(progression.inventory);
      this.model.equipment = deepClone(progression.equipment);
      this.model.factions = this.sanitizeFactionProgression(progression.factions);
      this.model.contrabandHeat = this.clamp(
        Math.floor(Number(progression.contrabandHeat) || 0),
        0,
        Math.max(0, Math.floor(Number(this.config.faction?.contrabandHeatMax) || 12))
      );
      this.model.identity = deepClone(progression.identity || createDefaultIdentitySelection());
      this.model.salvageParts = progression.salvageParts;
      this.model.pilot = deepClone(progression.pilot || createDefaultPilotProgression());
      this.model.endlessUnlocked = Boolean(progression.unlocks?.endlessMode);
      if (!this.model.endlessUnlocked && this.model.runMode === "endless") this.model.runMode = "campaign";
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
      this.updateAdaptiveViewport(true);
      if (typeof validateGameConfig === "function") validateGameConfig(this.config);
      this.model.ship = createShip(this.config);
      this.model.profile = this.loadProfile();
      this.applyProfileToModel(this.model.profile);
      this.initializeShipResources(this.model.ship);
      this.refreshPowerAudit();
      this.model.runSeed = generateRunSeed();
      this.enemySystem.scheduleNextUfoSpawn();
      this.hud.sync(this.model);
    }

    handleMetaInput() {
      this.updateMobileUiState(1 / 60);
      this.updateTouchInputState(1 / 60);
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

      const canToggleRunMode = this.model.gameState === GAME_STATE.START;
      if (canToggleRunMode) {
        if (this.input.wasPressed("ArrowUp")) this.cycleOverlaySettingsRow(-1);
        if (this.input.wasPressed("ArrowDown")) this.cycleOverlaySettingsRow(1);
        if (this.input.wasPressed("ArrowLeft")) this.adjustSelectedOverlaySetting(-1);
        if (this.input.wasPressed("ArrowRight")) this.adjustSelectedOverlaySetting(1);
        if (this.input.wasPressed("KeyE")) {
          this.cycleRunMode(1);
        }
      }
      const canCycleEndSummaryPage =
        this.model.gameState === GAME_STATE.GAME_OVER || this.model.gameState === GAME_STATE.VICTORY;
      if (canCycleEndSummaryPage) {
        if (this.input.wasPressed("ArrowLeft")) this.cycleOverlayEndSummaryPage(-1);
        if (this.input.wasPressed("ArrowRight")) this.cycleOverlayEndSummaryPage(1);
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
          this.input.reset();
          this.model.overlaySettingsRow = 0;
          this.model.overlayEndSummaryPage = "overview";
          this.model.gameState = GAME_STATE.START;
          this.model.runSeed = generateRunSeed();
          this.hud.sync(this.model);
        } else if (this.model.gameState === GAME_STATE.VICTORY) {
          this.input.reset();
          this.model.overlaySettingsRow = 0;
          this.model.overlayEndSummaryPage = "overview";
          this.model.gameState = GAME_STATE.START;
          this.model.runSeed = generateRunSeed();
          this.hud.sync(this.model);
        }
      }

      if (this.model.gameState === GAME_STATE.PLAYING) {
        if (this.input.wasPressed("KeyX")) this.combatSystem.tryUseSecondary();
        if (this.input.wasPressed("KeyC")) this.combatSystem.tryUseUtility();
        if (this.input.wasPressed("KeyV")) this.combatSystem.tryDash();
        const touchActions = this.getTouchCombatActions();
        if (touchActions.secondaryPressed) {
          this.combatSystem.tryUseSecondary();
          this.consumeTouchCombatAction("secondaryPressed");
        }
        if (touchActions.utilityPressed) {
          this.combatSystem.tryUseUtility();
          this.consumeTouchCombatAction("utilityPressed");
        }
      }
    }

    startGame(seed = this.model.runSeed ?? generateRunSeed()) {
      this.resetProgressionForFreshRun();
      this.resetGame(seed);
      this.updateProfileStatsOnRunStart();
      this.saveProfile("run_start");
      this.input.reset();
      this.model.gameState = GAME_STATE.PLAYING;
      this.audio.play("ui_start");
      this.hud.sync(this.model);
    }

    resetProgressionForFreshRun() {
      const defaults = createDefaultProfile().progression;
      const profile = this.model.profile?.progression;
      if (!profile) return;
      const selectedIdentity = deepClone(this.model.identity || profile.identity || defaults.identity);
      const selectedFlightModel = this.model.flightModel === "sim_lite" ? "sim_lite" : "arcade";
      const selectedDifficultyId = this.model.runDifficultyId || profile.runDifficultyId || defaults.runDifficultyId;
      const selectedMutatorId = this.model.runMutatorId || profile.runMutatorId || defaults.runMutatorId;
      const selectedShopVendorId = this.sanitizeHangarVendorId(this.model.hangar?.shopVendorId || profile.shopVendorId);
      const selectedIntelId = this.sanitizeFactionIntelId(this.model.hangar?.factionIntelId || profile.factionIntelId);
      const selectedFactions = deepClone(this.model.factions || profile.factions || defaults.factions);
      const selectedContrabandHeat = 0;
      const unlocks = deepClone(profile.unlocks || defaults.unlocks);
      profile.flightModel = selectedFlightModel;
      profile.runDifficultyId = selectedDifficultyId;
      profile.runMutatorId = selectedMutatorId;
      profile.shopVendorId = selectedShopVendorId;
      profile.factionIntelId = selectedIntelId;
      profile.loadout = deepClone(defaults.loadout);
      profile.unlocks = unlocks;
      profile.upgrades = deepClone(defaults.upgrades);
      profile.inventory = [];
      profile.equipment = deepClone(defaults.equipment);
      profile.factions = selectedFactions;
      profile.contrabandHeat = selectedContrabandHeat;
      profile.identity = selectedIdentity;
      profile.salvageParts = 0;
      profile.pilot = createDefaultPilotProgression();
    }

    getRunModeDefs() {
      return ["campaign", "boss_rush", "endless"];
    }

    cycleRunMode(direction = 1) {
      const modes = this.getRunModeDefs();
      if (!modes.length) return false;
      const currentIndex = modes.indexOf(this.model.runMode);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      for (let step = 1; step <= modes.length; step += 1) {
        const nextIndex = (safeIndex + direction * step + modes.length * 4) % modes.length;
        if (this.trySetRunMode(modes[nextIndex])) return true;
      }
      return false;
    }

    getOverlayEndSummaryPages() {
      return ["overview", "drops_damage", "timeline_faction"];
    }

    cycleOverlayEndSummaryPage(direction = 1) {
      const pages = this.getOverlayEndSummaryPages();
      const current = this.model.overlayEndSummaryPage || pages[0];
      const currentIndex = pages.indexOf(current);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      this.model.overlayEndSummaryPage = pages[(safeIndex + direction + pages.length) % pages.length];
      this.hud.sync(this.model);
    }

    trySetRunMode(mode) {
      if (!this.getRunModeDefs().includes(mode)) return false;
      if (mode === "endless" && !this.model.endlessUnlocked) {
        this.model.hangar.message = tr("game.run_mode.locked");
        this.hud.sync(this.model);
        return false;
      }
      if (this.model.runMode === mode) return false;
      this.model.runMode = mode;
      this.model.hangar.message = tr("game.run_mode.changed", { mode: tr(`game.run_mode.${mode}`) });
      this.hud.sync(this.model);
      return true;
    }

    endRun(state, saveReason, soundCue) {
      this.updateProfileStatsOnRunEnd();
      this.saveProfile(saveReason);
      this.input.reset();
      this.model.gameState = state;
      if (state === GAME_STATE.GAME_OVER || state === GAME_STATE.VICTORY) {
        this.model.overlayEndSummaryPage = "overview";
      }
      if (this.model.factionRunSummary) this.model.factionRunSummary.active = false;
      this.audio.play(soundCue);
      this.hud.sync(this.model);
    }

    endGame() {
      this.model.gameOverSummary = this.buildGameOverSummary();
      this.endRun(GAME_STATE.GAME_OVER, "game_over", "ui_game_over");
    }

    isCampaignMode() {
      return this.model.runMode === "campaign";
    }

    isBossRushMode() {
      return this.model.runMode === "boss_rush";
    }

    isFinalEncounter(missionType = this.model.currentMission?.type, sector = this.model.sector) {
      if (!this.isCampaignMode()) return false;
      const runCfg = this.config.run || {};
      const finalSector = Math.max(1, Math.floor(runCfg.finalSector ?? 4));
      const finalMissionType = runCfg.finalMissionType || "mini_boss";
      return sector >= finalSector && missionType === finalMissionType;
    }

    isBossRushFinalEncounter(missionType = this.model.currentMission?.type, sector = this.model.sector) {
      if (!this.isBossRushMode()) return false;
      const bossRushCfg = this.config.run?.bossRush || {};
      const finalSector = Math.max(1, Math.floor(bossRushCfg.finalSector ?? this.config.run?.finalSector ?? 4));
      const finalMissionType = bossRushCfg.finalMissionType || "mini_boss";
      return sector >= finalSector && missionType === finalMissionType;
    }

    buildEndRunSummary({ statusKey = null } = {}) {
      const selectedPilot = this.getSelectedIdentityPilot();
      const selectedShip = this.getSelectedIdentityShip();
      const runSummary = this.model.runSummary || createRunSummaryState();
      const rarityDefs = Array.isArray(this.config?.loot?.rarities) ? this.config.loot.rarities : [];
      const rarityRankById = {};
      for (let i = 0; i < rarityDefs.length; i += 1) {
        const rarity = rarityDefs[i];
        if (!rarity?.id) continue;
        rarityRankById[rarity.id] = Number.isFinite(Number(rarity.rank)) ? Number(rarity.rank) : i;
      }
      const toDropRank = (drop) => {
        const id = drop?.rarityId;
        return Number.isFinite(Number(rarityRankById[id])) ? Number(rarityRankById[id]) : 0;
      };
      const topDrops = Array.isArray(runSummary.dropsSeen)
        ? runSummary.dropsSeen
            .slice()
            .sort((a, b) => {
              const rankDelta = toDropRank(b) - toDropRank(a);
              if (rankDelta !== 0) return rankDelta;
              return (Number(b.runtimeSeconds) || 0) - (Number(a.runtimeSeconds) || 0);
            })
            .slice(0, 6)
        : [];
      const missionTimeline = Array.isArray(runSummary.missions) ? runSummary.missions.slice(-6) : [];
      return {
        runMode: this.model.runMode || "campaign",
        statusKey,
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
        factionSummary: this.buildFactionRunSummarySnapshot(),
        salvageParts: this.model.salvageParts,
        missionsCompleted: this.model.telemetry.completedMissions,
        miniBossKills: this.model.telemetry.kills.miniBosses,
        finalClearRewards: this.model.finalClearRewards
          ? {
              mode: this.model.finalClearRewards.mode,
              credits: this.model.finalClearRewards.credits,
              salvage: this.model.finalClearRewards.salvage,
              score: this.model.finalClearRewards.score,
              dropsCount: this.model.finalClearRewards.dropsCount
            }
          : null,
        runSummary: {
          damageTakenTotal: {
            shieldAbsorb: Math.max(0, Number(runSummary.damageTakenTotal?.shieldAbsorb) || 0),
            hullDamage: Math.max(0, Number(runSummary.damageTakenTotal?.hullDamage) || 0)
          },
          topDrops,
          missionTimeline
        }
      };
    }

    buildVictorySummary({ statusKey = null } = {}) {
      return this.buildEndRunSummary({ statusKey });
    }

    buildGameOverSummary() {
      return this.buildEndRunSummary();
    }

    completeRunVictory({ unlockEndless = false, statusKey = null } = {}) {
      let resolvedStatusKey = statusKey;
      if (unlockEndless && !this.model.endlessUnlocked) {
        this.model.endlessUnlocked = true;
        this.model.unlocks.endlessMode = true;
        this.model.hangar.message = tr("game.unlock.endless");
        if (!resolvedStatusKey) resolvedStatusKey = "overlay.endless_unlocked";
      } else if (!resolvedStatusKey) {
        resolvedStatusKey = this.isBossRushMode() ? "overlay.boss_rush_complete" : "overlay.campaign_complete";
      }
      this.applyFinalClearRewards();
      this.model.victorySummary = this.buildVictorySummary({ statusKey: resolvedStatusKey });
      this.endRun(GAME_STATE.VICTORY, "victory", "mission_complete");
    }

    getFinalClearRewardProfile() {
      const profiles = this.config.run?.finalClearRewards;
      if (!profiles || typeof profiles !== "object") return null;
      if (this.isBossRushMode()) return profiles.boss_rush || null;
      if (this.isCampaignMode()) return profiles.campaign || null;
      return null;
    }

    getRarityRankMap() {
      const map = {};
      const rarities = Array.isArray(this.config.loot?.rarities) ? this.config.loot.rarities : [];
      for (let i = 0; i < rarities.length; i += 1) {
        const rarity = rarities[i];
        if (!rarity?.id) continue;
        map[rarity.id] = Number.isFinite(Number(rarity.rank)) ? Number(rarity.rank) : i;
      }
      return map;
    }

    createModuleDropWithRarityFloor(floorId = null) {
      const normalizedFloor = typeof floorId === "string" && floorId.length > 0 ? floorId : null;
      if (!normalizedFloor) return this.createModuleDrop();
      const ranks = this.getRarityRankMap();
      const floorRank = Number.isFinite(Number(ranks[normalizedFloor])) ? Number(ranks[normalizedFloor]) : null;
      if (floorRank == null) return this.createModuleDrop();
      let best = this.createModuleDrop();
      let bestRank = Number.isFinite(Number(ranks[best.rarityId])) ? Number(ranks[best.rarityId]) : -1;
      for (let i = 0; i < 8 && bestRank < floorRank; i += 1) {
        const candidate = this.createModuleDrop();
        const candidateRank = Number.isFinite(Number(ranks[candidate.rarityId])) ? Number(ranks[candidate.rarityId]) : -1;
        if (candidateRank > bestRank) {
          best = candidate;
          bestRank = candidateRank;
        }
        if (candidateRank >= floorRank) return candidate;
      }
      return best;
    }

    applyFinalClearRewards() {
      if (this.model.finalClearRewardGranted) return this.model.finalClearRewards || null;
      const profile = this.getFinalClearRewardProfile();
      if (!profile) return null;
      const credits = Math.max(0, Math.floor(Number(profile.creditsBase) || 0));
      const salvage = Math.max(0, Math.floor(Number(profile.salvageBase) || 0));
      const score = Math.max(0, Math.floor(Number(profile.scoreBonus) || 0));
      const guaranteedDrops = Math.max(0, Math.floor(Number(profile.guaranteedDrops) || 0));
      const dropRarityFloor = typeof profile.dropRarityFloor === "string" ? profile.dropRarityFloor : null;
      if (credits > 0) {
        this.model.credits += credits;
        this.model.telemetry.creditsEarned += credits;
      }
      if (salvage > 0) this.model.salvageParts += salvage;
      if (score > 0) this.registerScore(score, true);
      for (let i = 0; i < guaranteedDrops; i += 1) {
        const drop = this.createModuleDropWithRarityFloor(dropRarityFloor);
        this.model.hangar.lootCrate.push(drop);
        this.recordRunSummaryDrop(drop, "finalClear");
      }
      this.model.finalClearRewards = {
        mode: this.isBossRushMode() ? "boss_rush" : "campaign",
        credits,
        salvage,
        score,
        dropsCount: guaranteedDrops
      };
      this.model.finalClearRewardGranted = true;
      return this.model.finalClearRewards;
    }

    onMissionCompletionResolved() {
      if (this.isFinalEncounter()) {
        this.completeRunVictory({ unlockEndless: true });
        return true;
      }
      if (this.isBossRushFinalEncounter()) {
        this.completeRunVictory({ unlockEndless: false, statusKey: "overlay.boss_rush_complete" });
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
      this.model.sentryRelays = [];
      this.model.salvageDrifters = [];
      this.model.damageNumbers = [];
      this.model.incomingHitCues = [];
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
      this.model.gameOverSummary = null;
      this.model.finalClearRewards = null;
      this.model.finalClearRewardGranted = false;
      this.model.missionCompleteSummary = null;
      this.model.bountyBoard = { sector: 1, factionId: null, offers: [], rerollsUsed: 0 };
      if (!this.model.endlessUnlocked && this.model.runMode === "endless") this.model.runMode = "campaign";
      this.model.flightModel = "arcade";
      this.model.dotEffects = [];
      this.model.hangar.message = tr("game.hangar.controls");
      this.model.hangar.shopItems = [];
      this.model.hangar.shopVendorId = "faction";
      this.model.hangar.lootCrate = [];
      this.model.hangar.selectionSource = "crate";
      this.model.hangar.selectionIndex = 0;
      this.model.hangar.pilotAttrIndex = 0;
      this.model.hangar.pilotPerkIndex = 0;
      this.model.hangar.navSection = "shop";
      this.model.hangar.shopIndex = 0;
      this.model.hangar.pilotCursor = 0;
      const persistedMobilePrefs = {
        compactHints: Boolean(this.model.mobileUi?.compactHints),
        fullscreenPromptDismissed: Boolean(this.model.mobileUi?.fullscreenPromptDismissed),
        aimAssistEnabled: this.model.mobileUi?.aimAssistEnabled !== false,
        aimAssistStrength: Number(this.model.mobileUi?.aimAssistStrength),
        aimSmoothing: this.model.mobileUi?.aimSmoothing,
        ambientFxPreset: this.model.mobileUi?.ambientFxPreset
      };
      const assistCfg = this.getTouchAimAssistConfig();
      this.model.mobileUi = createDefaultMobileUiState();
      this.model.mobileUi.compactHints = persistedMobilePrefs.compactHints;
      this.model.mobileUi.fullscreenPromptDismissed = persistedMobilePrefs.fullscreenPromptDismissed;
      this.model.mobileUi.aimAssistEnabled = persistedMobilePrefs.aimAssistEnabled;
      this.model.mobileUi.aimAssistStrength = this.clamp(
        Number.isFinite(persistedMobilePrefs.aimAssistStrength) ? persistedMobilePrefs.aimAssistStrength : assistCfg.strengthDefault,
        assistCfg.strengthMin,
        assistCfg.strengthMax
      );
      this.model.mobileUi.aimSmoothing =
        persistedMobilePrefs.aimSmoothing === "low" || persistedMobilePrefs.aimSmoothing === "high"
          ? persistedMobilePrefs.aimSmoothing
          : "default";
      this.model.mobileUi.ambientFxPreset =
        persistedMobilePrefs.ambientFxPreset === "low" || persistedMobilePrefs.ambientFxPreset === "high"
          ? persistedMobilePrefs.ambientFxPreset
          : "default";
      this.model.factionRepGainTracker = {};
      this.model.runSummary = createRunSummaryState();
      this.model.campaignBiomeOrder = [];
      this.model.overlaySettingsRow = 0;
      this.model.overlayEndSummaryPage = "overview";
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
      this.initFactionRunSummary();
      this.ensureBountyBoardForSector(this.model.sector, { force: true });
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
      return ["mode", "difficulty", "mutator", "pilot", "ship", "flight"];
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
        this.cycleRunMode(direction);
        return;
      }
      if (row === "pilot") {
        this.cycleIdentityPilot(direction);
        return;
      }
      if (row === "ship") {
        this.cycleIdentityShip(direction);
        return;
      }
      if (row === "flight") {
        this.trySetFlightModel(direction < 0 ? "arcade" : "sim_lite");
        return;
      }
      if (row === "difficulty") {
        this.cycleRunDifficulty(direction);
        return;
      }
      if (row === "mutator") {
        this.cycleRunMutator(direction);
      }
    }

    getRunDifficultyDefs() {
      const defs = this.config.run?.difficultyPresets;
      if (!Array.isArray(defs) || !defs.length) {
        return [
          {
            id: "normal",
            pressureMul: 1,
            enemyDamageTakenMul: 1,
            playerDamageMul: 1,
            economyCreditsMul: 1,
            economySalvageMul: 1,
            lootDropMul: 1,
            hazardIntensityMul: 1
          }
        ];
      }
      return defs;
    }

    getRunDifficultyProfile() {
      const defs = this.getRunDifficultyDefs();
      const fallback = defs.find((entry) => entry.id === "normal") || defs[0];
      return defs.find((entry) => entry.id === this.model.runDifficultyId) || fallback;
    }

    getRunDifficultyMultipliers() {
      const profile = this.getRunDifficultyProfile();
      const mutator = this.getRunMutatorProfile();
      return {
        id: profile.id || "normal",
        difficultyId: profile.id || "normal",
        mutatorId: mutator.id || "standard",
        pressureMul: this.clamp((Number(profile.pressureMul) || 1) * (Number(mutator.pressureMul) || 1), 0.6, 2),
        enemyDamageTakenMul: this.clamp(
          (Number(profile.enemyDamageTakenMul) || 1) * (Number(mutator.enemyDamageTakenMul) || 1),
          0.4,
          2.2
        ),
        playerDamageMul: this.clamp((Number(profile.playerDamageMul) || 1) * (Number(mutator.playerDamageMul) || 1), 0.4, 2.2),
        economyCreditsMul: this.clamp((Number(profile.economyCreditsMul) || 1) * (Number(mutator.economyCreditsMul) || 1), 0.35, 2),
        economySalvageMul: this.clamp((Number(profile.economySalvageMul) || 1) * (Number(mutator.economySalvageMul) || 1), 0.35, 2),
        lootDropMul: this.clamp((Number(profile.lootDropMul) || 1) * (Number(mutator.lootDropMul) || 1), 0.35, 2),
        hazardIntensityMul: this.clamp((Number(profile.hazardIntensityMul) || 1) * (Number(mutator.hazardIntensityMul) || 1), 0.35, 2)
      };
    }

    getRunMutatorDefs() {
      const defs = this.config.mission?.mutators;
      if (!Array.isArray(defs) || !defs.length) {
        return [
          {
            id: "standard",
            pressureMul: 1,
            enemyDamageTakenMul: 1,
            playerDamageMul: 1,
            economyCreditsMul: 1,
            economySalvageMul: 1,
            lootDropMul: 1,
            hazardIntensityMul: 1
          }
        ];
      }
      return defs;
    }

    getRunMutatorProfile() {
      const defs = this.getRunMutatorDefs();
      const fallback = defs.find((entry) => entry.id === "standard") || defs[0];
      return defs.find((entry) => entry.id === this.model.runMutatorId) || fallback;
    }

    cycleRunDifficulty(direction = 1) {
      const defs = this.getRunDifficultyDefs();
      if (!defs.length) return false;
      const currentIndex = defs.findIndex((entry) => entry.id === this.model.runDifficultyId);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + defs.length) % defs.length;
      return this.trySetRunDifficulty(defs[nextIndex].id);
    }

    trySetRunDifficulty(id, { saveProfile = true } = {}) {
      const defs = this.getRunDifficultyDefs();
      if (!defs.some((entry) => entry.id === id)) return false;
      if (this.model.runDifficultyId === id) return false;
      this.model.runDifficultyId = id;
      this.model.hangar.message = tr("game.run_difficulty.changed", { difficulty: tr(`game.difficulty.${id}`) });
      if (saveProfile) this.saveProfile("run_difficulty_change");
      this.hud.sync(this.model);
      return true;
    }

    cycleRunMutator(direction = 1) {
      const defs = this.getRunMutatorDefs();
      if (!defs.length) return false;
      const currentIndex = defs.findIndex((entry) => entry.id === this.model.runMutatorId);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + defs.length) % defs.length;
      return this.trySetRunMutator(defs[nextIndex].id);
    }

    trySetRunMutator(id, { saveProfile = true } = {}) {
      const defs = this.getRunMutatorDefs();
      if (!defs.some((entry) => entry.id === id)) return false;
      if (this.model.runMutatorId === id) return false;
      this.model.runMutatorId = id;
      this.model.hangar.message = tr("game.run_mutator.changed", { mutator: tr(`game.mutator.${id}`) });
      if (saveProfile) this.saveProfile("run_mutator_change");
      this.hud.sync(this.model);
      return true;
    }

    trySetFlightModel(mode, { saveProfile = true } = {}) {
      const next = mode === "sim_lite" ? "sim_lite" : mode === "arcade" ? "arcade" : null;
      if (!next) return false;
      if (this.model.flightModel === next) return false;
      this.model.flightModel = next;
      this.model.hangar.message = tr("game.flight_mode.changed", {
        mode: next === "sim_lite" ? tr("hud.flight_sim_lite") : tr("hud.flight_arcade")
      });
      if (saveProfile) this.saveProfile("flight_model_change");
      this.hud.sync(this.model);
      return true;
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

    createModifierTotals() {
      return {
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
    }

    addModifiersToTotals(target, source) {
      if (!source) return;
      for (const key of Object.keys(source)) {
        if (!(key in target)) target[key] = 0;
        target[key] += source[key];
      }
    }

    getModifierBreakdown() {
      const total = this.createModifierTotals();
      const equipment = this.createModifierTotals();
      const sets = this.createModifierTotals();
      const pilotAttr = this.createModifierTotals();
      const pilotPerk = this.createModifierTotals();
      const identity = this.createModifierTotals();

      for (const slot of Object.keys(this.model.equipment)) {
        const module = this.model.equipment[slot];
        if (!module?.modifiers) continue;
        this.addModifiersToTotals(equipment, module.modifiers);
      }

      this.refreshSetState();
      for (const activeSet of this.model.activeSets) {
        this.addModifiersToTotals(sets, activeSet.modifiers || {});
      }

      this.addModifiersToTotals(pilotAttr, this.getPilotAttributeBonuses());
      this.addModifiersToTotals(pilotPerk, this.getPilotPerkBonuses());

      const identityPilot = this.getSelectedIdentityPilot();
      const identityShip = this.getSelectedIdentityShip();
      this.addModifiersToTotals(identity, identityPilot?.modifiers);
      this.addModifiersToTotals(identity, identityShip?.modifiers);

      this.addModifiersToTotals(total, equipment);
      this.addModifiersToTotals(total, sets);
      this.addModifiersToTotals(total, pilotAttr);
      this.addModifiersToTotals(total, pilotPerk);
      this.addModifiersToTotals(total, identity);

      return { total, equipment, sets, pilotAttr, pilotPerk, identity };
    }

    getModuleModifiers() {
      return this.getModifierBreakdown().total;
    }

    scoreModifierTotals(modifiers = {}) {
      const weights = {
        primaryDamagePct: 130,
        critChanceFlat: 520,
        primaryCooldownPct: 92,
        secondaryCooldownPct: 72,
        utilityCooldownPct: 68,
        hullPct: 82,
        shieldPct: 78,
        energyRegenPct: 74,
        heatDissipationPct: 72,
        shieldRegenPct: 52,
        maxSpeedPct: 56,
        thrustPct: 56,
        rotationSpeedPct: 42,
        rotationAccelPct: 38,
        collisionResist: 120,
        plasmaResist: 90,
        creditsGainPct: 28,
        salvageYieldPct: 24
      };
      let score = 0;
      for (const key of Object.keys(weights)) {
        score += (modifiers[key] ?? 0) * weights[key];
      }
      return Math.round(score * 10) / 10;
    }

    scoreBiomeEvent(event) {
      if (!event) return 0;
      let score = 0;
      score += (event.credits ?? 0) * 0.7;
      score += (event.salvageParts ?? 0) * 2.8;
      score += (event.energy ?? 0) * 0.45;
      score += (event.shield ?? 0) * 0.75;
      score += -(event.heat ?? 0) * 0.52;
      score += -(event.cooldownDelta ?? 0) * 18;
      return Math.round(score * 10) / 10;
    }

    refreshPowerAudit() {
      const telemetry = this.model.telemetry;
      if (!telemetry) return;
      const breakdown = this.getModifierBreakdown();
      const event = this.model.currentMission?.biomeMiniEvent || null;

      const pilotCombined = this.createModifierTotals();
      this.addModifiersToTotals(pilotCombined, breakdown.pilotAttr);
      this.addModifiersToTotals(pilotCombined, breakdown.pilotPerk);

      const gearCombined = this.createModifierTotals();
      this.addModifiersToTotals(gearCombined, breakdown.equipment);
      this.addModifiersToTotals(gearCombined, breakdown.sets);

      telemetry.powerAudit = {
        gear: this.scoreModifierTotals(gearCombined),
        pilot: this.scoreModifierTotals(pilotCombined),
        identity: this.scoreModifierTotals(breakdown.identity),
        biomeEvent: this.scoreBiomeEvent(event)
      };
      telemetry.powerAudit.total =
        telemetry.powerAudit.gear +
        telemetry.powerAudit.pilot +
        telemetry.powerAudit.identity +
        telemetry.powerAudit.biomeEvent;
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
      const runDiff = this.getRunDifficultyMultipliers();
      return Math.max(0.2, (1 + (modifiers.primaryDamagePct ?? 0)) * runDiff.playerDamageMul);
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

    getLootFactionIdForDrop() {
      const missionFaction = this.model.currentMission?.biomeFactionId;
      if (missionFaction) return missionFaction;
      const dominant = this.getDominantFactionState();
      return dominant?.id || null;
    }

    getFactionLootIdentityProfile(factionId = this.getLootFactionIdForDrop()) {
      if (!factionId) return null;
      const raw = this.config.faction?.lootIdentity?.[factionId];
      if (!raw || typeof raw !== "object") return null;
      const affixWeightsRaw = raw.affixWeights && typeof raw.affixWeights === "object" ? raw.affixWeights : {};
      const setTagWeightsRaw = raw.setTagWeights && typeof raw.setTagWeights === "object" ? raw.setTagWeights : {};
      const affixWeights = {};
      const setTagWeights = {};
      for (const key of Object.keys(affixWeightsRaw)) {
        affixWeights[key] = this.clamp(Number(affixWeightsRaw[key]) || 1, 0.1, 4);
      }
      for (const key of Object.keys(setTagWeightsRaw)) {
        setTagWeights[key] = this.clamp(Number(setTagWeightsRaw[key]) || 1, 0.1, 4);
      }
      return {
        factionId,
        affixWeights,
        setTagWeights
      };
    }

    getFactionWeightedAffixScore(affix, lootIdentityProfile = null) {
      if (!affix) return 0;
      if (!lootIdentityProfile) return 1;
      const idMul = lootIdentityProfile.affixWeights?.[affix.id] ?? 1;
      const setMul = affix.setTag ? lootIdentityProfile.setTagWeights?.[affix.setTag] ?? 1 : 1;
      return Math.max(0.1, idMul * setMul);
    }

    pickUniqueAffixes(affixPool, targetCount, lootIdentityProfile = null) {
      const remaining = Array.isArray(affixPool) ? affixPool.slice() : [];
      const picked = [];
      while (picked.length < targetCount && remaining.length > 0) {
        const candidate = this.rollWeighted(remaining, (affix) => this.getFactionWeightedAffixScore(affix, lootIdentityProfile));
        if (!candidate) break;
        picked.push(candidate);
        const removeIndex = remaining.findIndex((affix) => affix.id === candidate.id);
        if (removeIndex >= 0) remaining.splice(removeIndex, 1);
      }
      return picked;
    }

    createModuleDrop() {
      const slot = this.config.loot.slots[Math.floor(this.rng() * this.config.loot.slots.length)];
      const bases = this.config.loot.basesBySlot[slot];
      const base = bases[Math.floor(this.rng() * bases.length)];
      const rarity = this.rollLootRarity();
      const affixPool = this.config.loot.affixes.filter((affix) => affix.slots.includes(slot));
      const lootIdentity = this.getFactionLootIdentityProfile();
      let modifiers = { ...(base.modifiers || {}) };
      const targetAffixes = Math.min(rarity.affixCount, affixPool.length);
      let affixes = this.pickUniqueAffixes(affixPool, targetAffixes, lootIdentity);
      for (const candidate of affixes) modifiers = this.mergeModifiers(modifiers, candidate.modifiers);

      if (targetAffixes > 0 && this.rng() < 0.45) {
        const setAffixes = affixPool.filter((affix) => affix.setTag);
        if (setAffixes.length > 0 && !affixes.some((affix) => affix.setTag)) {
          const setAffix = this.rollWeighted(setAffixes, (affix) => this.getFactionWeightedAffixScore(affix, lootIdentity));
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
      chance *= this.getRunDifficultyMultipliers().lootDropMul;
      chance = this.clamp(chance, 0, 1);
      if (this.rng() > chance) return;

      const drop = this.createModuleDrop();
      this.model.hangar.lootCrate.push(drop);
      this.recordRunSummaryDrop(drop, source);
      this.model.hangar.message = `Recovered module: ${drop.name}`;
      if (this.model.hangar.lootCrate.length === 1 && this.model.hangar.selectionSource === "crate") {
        this.model.hangar.selectionIndex = 0;
      }
    }

    update(dt) {
      if (this.model.gameState !== GAME_STATE.PLAYING) return;
      this.updateMobileUiState(dt);
      if (this.shouldPauseForMobileOrientation()) {
        this.hud.sync(this.model);
        return;
      }
      this.updateTouchInputState(dt);
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
      if (this.model.actionHint?.timer > 0) {
        this.model.actionHint.timer = Math.max(0, this.model.actionHint.timer - dt);
        if (this.model.actionHint.timer <= 0) this.model.actionHint.text = "";
      }

      this.model.shootTimer = Math.max(0, this.model.shootTimer - dt);
      this.model.secondaryCooldown = Math.max(0, this.model.secondaryCooldown - dt);
      this.model.utilityCooldown = Math.max(0, this.model.utilityCooldown - dt);
      this.model.dashCooldown = Math.max(0, this.model.dashCooldown - dt);
      this.updateDamageNumbers(dt);
      this.updateIncomingHitCues(dt);
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

      const touchActions = this.getTouchCombatActions();
      const wantsPrimaryFire = this.input.isDown("Space") || touchActions.fireActive;
      if (wantsPrimaryFire && this.model.shootTimer <= 0) {
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
      this.combatSystem.updateMissionEntities(dt);
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
      this.combatSystem.handleBulletMissionEntityCollisions();
      this.combatSystem.handleEnemyBulletAsteroidCollisions();
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

    setActionHint(key, params = {}, options = {}) {
      const nowMs = this.getNowMs();
      const duration = Math.max(0.6, Number(options.durationSeconds) || 1.8);
      const cooldownMs = Math.max(120, Number(options.cooldownMs) || 280);
      const hint = this.model.actionHint || { text: "", timer: 0, key: "", lastAtMs: 0 };
      if (hint.key === key && nowMs - (hint.lastAtMs || 0) < cooldownMs) return;
      hint.key = key;
      hint.text = tr(key, params);
      hint.timer = duration;
      hint.lastAtMs = nowMs;
      this.model.actionHint = hint;
    }

    registerActionBlock(type, hintKey, hintParams = {}) {
      const blocks = this.model.telemetry?.actionBlocks;
      if (blocks && type in blocks) blocks[type] += 1;
      if (hintKey) this.setActionHint(hintKey, hintParams);
    }

    showResourceBlockHint(energyCost, heatGain = 0, options = {}) {
      const reasonKey = this.getSpendBlockReason(energyCost, heatGain, options);
      if (!reasonKey) return null;
      if (reasonKey === "game.action.block.energy") {
        this.registerActionBlock("energy", reasonKey, { cost: Number(energyCost || 0).toFixed(1) });
      } else if (reasonKey === "game.action.block.shield") {
        this.registerActionBlock("shield", reasonKey, { cost: Number(options.shieldCost || 0).toFixed(1) });
      } else if (reasonKey === "game.action.block.heat") {
        this.registerActionBlock("heat", reasonKey);
      } else {
        this.setActionHint(reasonKey);
      }
      return reasonKey;
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
      const next = this.model.flightModel === "arcade" ? "sim_lite" : "arcade";
      this.trySetFlightModel(next);
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
      const runDiff = this.getRunDifficultyMultipliers();

      if (resolved.damage > 0) {
        ship.lastDamageAt = this.model.runtimeSeconds;
        if (overrides.applyHitInvulnerability !== false) {
          ship.invulnMs = Math.max(ship.invulnMs, this.config.ship.hitInvulnerabilityMs);
        }
        let remaining = resolved.damage * runDiff.enemyDamageTakenMul;
        const shieldAbsorb = Math.min(ship.shield, remaining);
        ship.shield -= shieldAbsorb;
        remaining -= shieldAbsorb;
        const hullDamage = Math.max(0, remaining);
        if (remaining > 0) {
          ship.hull = Math.max(0, ship.hull - remaining);
        }
        this.pushIncomingHitCue({
          kind:
            typeof overrides.hitCueKind === "string" && overrides.hitCueKind.length > 0
              ? overrides.hitCueKind
              : resolved.damageType || event?.damageType || "kinetic",
          damageType: resolved.damageType || event?.damageType || "kinetic",
          isCrit: Boolean(resolved.isCrit),
          shieldAbsorb,
          hullDamage
        });
        this.recordRunSummaryDamage(shieldAbsorb, hullDamage);

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
      const beforeHp = Math.max(0, Number(boss.hp) || 0);
      boss.hp -= resolved.damage;
      const dealtHullDamage = Math.max(0, beforeHp - Math.max(0, Number(boss.hp) || 0));
      if (dealtHullDamage > 0) {
        const textColor = boss.weakpointOpen ? "135,246,255" : "255,176,214";
        this.spawnDamageNumber(boss.x, boss.y - boss.radius * 0.68, dealtHullDamage, "HU", textColor);
      }
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
      const runDiff = this.getRunDifficultyMultipliers();
      const factionReward = this.getFactionRewardMultipliers();
      const intelReward = this.getFactionIntelRewardMultipliers();
      const comboMultiplier = this.model.comboScoringEnabled ? this.model.comboMultiplier : 1;
      const scored = Math.round(basePoints * comboMultiplier * scoreMissionMult);
      this.model.score += scored;
      this.model.telemetry.scoreEarned += scored;
      const economyMul = this.getEndlessCreditsMultiplier();
      const creditsGain = Math.max(
        this.config.economy.minCreditsPerKill,
        Math.floor(
          basePoints *
            this.config.economy.creditsPerScore *
            creditsMissionMult *
            (1 + (modifiers.creditsGainPct ?? 0)) *
            economyMul *
            runDiff.economyCreditsMul *
            factionReward.creditsMul *
            intelReward.creditsMul
        )
      );
      this.model.credits += creditsGain;
      this.model.telemetry.creditsEarned += creditsGain;
      this.grantPilotXp(basePoints * this.config.pilot.xp.perScore, "score");
    }

    getEndlessCreditsMultiplier(sector = this.model.sector) {
      if (this.model.runMode !== "endless") return 1;
      const endlessCfg = this.config.mission?.endless || {};
      const startSector = Math.max(1, Math.floor(endlessCfg.startSector ?? 5));
      const sectorDepth = Math.max(0, sector - startSector);
      const damping = sectorDepth * Math.max(0, endlessCfg.creditsDampingPerSector ?? 0.06);
      const minMul = this.clamp(Number(endlessCfg.minCreditsMultiplier ?? 0.55), 0.1, 1);
      return this.clamp(1 - damping, minMul, 1);
    }

    getBountyBoardConfig() {
      return this.config.mission?.bountyBoard || { slots: 3, templates: [] };
    }

    getBountyTemplates() {
      const cfg = this.getBountyBoardConfig();
      const templates = Array.isArray(cfg.templates) ? cfg.templates : [];
      return templates.filter((entry) => entry && typeof entry.id === "string" && typeof entry.kind === "string");
    }

    getBountyBoardFactionId() {
      const missionFaction = this.model.currentMission?.biomeFactionId;
      if (missionFaction) return missionFaction;
      const dominant = this.getDominantFactionState();
      return dominant?.id || null;
    }

    getBountyFactionProfile(factionId = this.getBountyBoardFactionId()) {
      if (!factionId) return { factionId: null, templateWeightByKind: {}, rewardCreditsMul: 1, rewardSalvageMul: 1, repOnClaim: 0 };
      const raw = this.config.faction?.bountyBoardProfiles?.[factionId];
      if (!raw || typeof raw !== "object") {
        return { factionId, templateWeightByKind: {}, rewardCreditsMul: 1, rewardSalvageMul: 1, repOnClaim: 0 };
      }
      const templateWeightByKindRaw =
        raw.templateWeightByKind && typeof raw.templateWeightByKind === "object" ? raw.templateWeightByKind : {};
      const templateWeightByKind = {};
      for (const key of Object.keys(templateWeightByKindRaw)) {
        templateWeightByKind[key] = this.clamp(Number(templateWeightByKindRaw[key]) || 1, 0.25, 3.5);
      }
      return {
        factionId,
        templateWeightByKind,
        rewardCreditsMul: this.clamp(Number(raw.rewardCreditsMul) || 1, 0.6, 1.8),
        rewardSalvageMul: this.clamp(Number(raw.rewardSalvageMul) || 1, 0.6, 1.8),
        repOnClaim: Math.max(0, Math.floor(Number(raw.repOnClaim) || 0))
      };
    }

    getBountyTemplateWeight(template, factionProfile = null) {
      if (!template) return 0;
      const kind = template.kind;
      const base = 1;
      const factionMul = factionProfile?.templateWeightByKind?.[kind] ?? 1;
      return Math.max(0.1, base * factionMul);
    }

    pickBountyTemplates(templates, count, factionProfile = null) {
      const pool = Array.isArray(templates) ? templates.slice() : [];
      const picked = [];
      while (picked.length < count && pool.length > 0) {
        const next = this.rollWeighted(pool, (entry) => this.getBountyTemplateWeight(entry, factionProfile));
        if (!next) break;
        picked.push(next);
        const removeIndex = pool.findIndex((entry) => entry.id === next.id);
        if (removeIndex >= 0) pool.splice(removeIndex, 1);
      }
      return picked;
    }

    getBountyHeatRewardMultiplier() {
      const cfg = this.getBountyBoardConfig();
      const perStack = Math.max(0, Number(cfg.heatRewardCreditsPerStack) || 0);
      const heat = this.getContrabandHeat();
      return this.clamp(1 + heat * perStack, 1, 2.2);
    }

    getBountyHeatSalvageMultiplier() {
      const cfg = this.getBountyBoardConfig();
      const perStack = Math.max(0, Number(cfg.heatRewardSalvagePerStack) || 0);
      const heat = this.getContrabandHeat();
      return this.clamp(1 + heat * perStack, 1, 2.2);
    }

    createBountyOffer(template, sector, slotIndex, factionProfile = this.getBountyFactionProfile()) {
      const safeSector = Math.max(1, Math.floor(Number(sector) || 1));
      const stepEvery = Math.max(1, Math.floor(Number(template.targetStepEverySectors) || 1));
      const scalingSteps = Math.floor((safeSector - 1) / stepEvery);
      const target = Math.max(1, Math.floor(Number(template.baseTarget) || 1) + scalingSteps * Math.max(0, Math.floor(Number(template.targetStep) || 0)));
      const rewardCreditsBase = Math.max(
        0,
        Math.floor(Number(template.rewardCreditsBase) || 0) + Math.max(0, safeSector - 1) * Math.max(0, Math.floor(Number(template.rewardCreditsStep) || 0))
      );
      const rewardSalvageBase = Math.max(
        0,
        Math.floor(Number(template.rewardSalvageBase) || 0) + Math.max(0, safeSector - 1) * Math.max(0, Math.floor(Number(template.rewardSalvageStep) || 0))
      );
      const rewardCredits = Math.max(
        0,
        Math.floor(rewardCreditsBase * (factionProfile?.rewardCreditsMul ?? 1) * this.getBountyHeatRewardMultiplier())
      );
      const rewardSalvage = Math.max(
        0,
        Math.floor(rewardSalvageBase * (factionProfile?.rewardSalvageMul ?? 1) * this.getBountyHeatSalvageMultiplier())
      );
      const id = `${template.id}_${safeSector}_${slotIndex}_${Math.floor(this.rng() * 1e6)}`;
      const labelKey = template.labelKey || `game.bounty.kind.${template.kind}`;
      return {
        id,
        templateId: template.id,
        factionId: factionProfile?.factionId || null,
        kind: template.kind,
        labelKey,
        label: tr(labelKey),
        target,
        progress: 0,
        rewardCredits,
        rewardSalvage,
        completed: false,
        claimed: false
      };
    }

    ensureBountyBoardForSector(sector = this.model.sector, { force = false } = {}) {
      const safeSector = Math.max(1, Math.floor(Number(sector) || 1));
      const previousSector = Math.max(1, Math.floor(Number(this.model.bountyBoard?.sector) || safeSector));
      const sectorChanged = previousSector !== safeSector;
      this.model.bountyBoard =
        this.model.bountyBoard && typeof this.model.bountyBoard === "object"
          ? this.model.bountyBoard
          : { sector: safeSector, factionId: null, offers: [], rerollsUsed: 0 };
      const board = this.model.bountyBoard;
      const templates = this.getBountyTemplates();
      const slots = Math.max(1, Math.floor(Number(this.getBountyBoardConfig().slots) || 3));
      const factionProfile = this.getBountyFactionProfile();
      if (!templates.length) {
        board.sector = safeSector;
        board.factionId = factionProfile.factionId || null;
        board.offers = [];
        board.rerollsUsed = 0;
        return board;
      }
      const shouldReroll = force || board.sector !== safeSector || !Array.isArray(board.offers) || board.offers.length === 0;
      if (!shouldReroll) return board;
      const selectedTemplates = this.pickBountyTemplates(templates, slots, factionProfile);
      const offers = selectedTemplates.map((template, index) => this.createBountyOffer(template, safeSector, index, factionProfile));
      board.sector = safeSector;
      board.factionId = factionProfile.factionId || null;
      board.offers = offers;
      if (force || sectorChanged) board.rerollsUsed = 0;
      board.rerollsUsed = Math.max(0, Math.floor(Number(board.rerollsUsed) || 0));
      return board;
    }

    getBountyRerollCost(sector = this.model.sector) {
      const cfg = this.getBountyBoardConfig();
      const safeSector = Math.max(1, Math.floor(Number(sector) || 1));
      const base = Math.max(0, Math.floor(Number(cfg.rerollCreditsBase) || 0));
      const step = Math.max(0, Math.floor(Number(cfg.rerollCreditsStep) || 0));
      const baseCost = base + Math.max(0, safeSector - 1) * step;
      const heatPerStack = Math.max(0, Number(cfg.heatRerollCostPerStack) || 0);
      const heatMul = this.clamp(1 + this.getContrabandHeat() * heatPerStack, 1, 2.5);
      return Math.max(0, Math.floor(baseCost * heatMul));
    }

    applyBountyClaimFactionImpact(claimedCount) {
      const count = Math.max(0, Math.floor(Number(claimedCount) || 0));
      if (count <= 0) return 0;
      const factionId = this.model.bountyBoard?.factionId || this.getBountyBoardFactionId();
      if (!factionId) return 0;
      const profile = this.getBountyFactionProfile(factionId);
      const gain = Math.max(0, Math.floor(Number(profile.repOnClaim) || 0)) * count;
      if (gain <= 0) return 0;
      let totalApplied = 0;
      const primary = this.addFactionReputation(factionId, gain, {
        reasonKey: "game.faction.reason.bounty_claim",
        announce: false,
        saveProfile: false
      });
      totalApplied += Math.abs(primary);
      if (primary > 0) {
        const rivalLossMul = Math.max(0, Number(this.config.faction?.rivalRepLossOnGainMul) || 0);
        if (rivalLossMul > 0) {
          const rivalLoss = Math.max(1, Math.round(primary * rivalLossMul));
          for (const faction of this.getFactionDefs()) {
            if (faction.id === factionId) continue;
            const appliedLoss = this.addFactionReputation(faction.id, -rivalLoss, {
              reasonKey: "game.faction.reason.bounty_claim",
              announce: false,
              saveProfile: false
            });
            totalApplied += Math.abs(appliedLoss);
          }
        }
      }
      if (totalApplied > 0) this.saveProfile("bounty_claim_reputation");
      return totalApplied;
    }

    claimCompletedBounties() {
      const board = this.ensureBountyBoardForSector(this.model.sector);
      const offers = Array.isArray(board.offers) ? board.offers : [];
      let claimedCount = 0;
      let totalCredits = 0;
      let totalSalvage = 0;
      for (const offer of offers) {
        if (!offer || !offer.completed || offer.claimed) continue;
        offer.claimed = true;
        claimedCount += 1;
        totalCredits += Math.max(0, Math.floor(Number(offer.rewardCredits) || 0));
        totalSalvage += Math.max(0, Math.floor(Number(offer.rewardSalvage) || 0));
      }
      if (claimedCount <= 0) {
        this.model.hangar.message = tr("game.bounty.claim_none");
        return false;
      }
      if (totalCredits > 0) {
        this.model.credits += totalCredits;
        this.model.telemetry.creditsEarned += totalCredits;
      }
      if (totalSalvage > 0) this.model.salvageParts += totalSalvage;
      this.applyBountyClaimFactionImpact(claimedCount);
      this.saveProfile("bounty_claim");
      this.model.hangar.message = tr("game.bounty.claimed", {
        count: claimedCount,
        credits: totalCredits,
        salvage: totalSalvage
      });
      return true;
    }

    rerollBountyBoard() {
      const board = this.ensureBountyBoardForSector(this.model.sector);
      const cfg = this.getBountyBoardConfig();
      const maxRerolls = Math.max(0, Math.floor(Number(cfg.maxRerollsPerSector) || 0));
      const used = Math.max(0, Math.floor(Number(board.rerollsUsed) || 0));
      if (used >= maxRerolls) {
        this.model.hangar.message = tr("game.bounty.reroll_limit");
        return false;
      }
      const cost = this.getBountyRerollCost(this.model.sector);
      if (this.model.credits < cost) {
        this.model.hangar.message = tr("game.bounty.reroll_no_credits", { cost });
        return false;
      }
      this.model.credits -= cost;
      board.rerollsUsed = used + 1;
      this.ensureBountyBoardForSector(this.model.sector, { force: true });
      board.rerollsUsed = used + 1;
      this.model.hangar.message = tr("game.bounty.rerolled", {
        cost,
        used: board.rerollsUsed,
        max: maxRerolls
      });
      this.saveProfile("bounty_reroll");
      return true;
    }

    getBountyProgressDelta(offer, missionSummary) {
      if (!offer || !missionSummary) return 0;
      if (offer.kind === "ufo_kills") return Math.max(0, Math.floor(Number(missionSummary.ufoKills) || 0));
      if (offer.kind === "asteroid_kills") return Math.max(0, Math.floor(Number(missionSummary.asteroidKills) || 0));
      if (offer.kind === "mission_clears") return 1;
      if (offer.kind === "credits_earned") return Math.max(0, Math.floor(Number(missionSummary.creditsGained) || 0));
      if (offer.kind === "mini_boss_kills") return Math.max(0, Math.floor(Number(missionSummary.miniBossKills) || 0));
      return 0;
    }

    processBountyBoardMissionResult(missionSummary) {
      const board = this.model.bountyBoard;
      if (!board || board.sector !== this.model.sector) return;
      const offers = Array.isArray(board.offers) ? board.offers : [];
      let completedNow = 0;
      for (const offer of offers) {
        if (!offer || offer.claimed || offer.completed) continue;
        const delta = this.getBountyProgressDelta(offer, missionSummary);
        offer.progress = Math.min(offer.target, Math.max(0, offer.progress + delta));
        offer.completed = offer.progress >= offer.target;
        if (offer.completed) completedNow += 1;
      }
      if (completedNow > 0) {
        this.model.hangar.message = tr("game.bounty.ready_to_claim", { count: completedNow });
      }
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
      this.ensureBountyBoardForSector(this.model.sector);
      this.audio.play("mission_start");
      this.audio.play("biome_stinger", {
        biomeId: mission.biomeId,
        missionAudioProfile: mission.biomeAudio
      });
      this.applyMissionFactionIntelReputation();
      this.applyMissionFactionReputation(this.config.faction?.missionStartRepGain ?? 0, "game.faction.reason.mission_start", {
        announce: false,
        saveReason: "faction_mission_start"
      });
      this.applyBiomeMiniEvent();
      this.refreshPowerAudit();

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
        playerHitsStart: this.model.telemetry.playerHitsTaken,
        damageShieldStart: Math.max(0, Number(this.model.runSummary?.damageTakenTotal?.shieldAbsorb) || 0),
        damageHullStart: Math.max(0, Number(this.model.runSummary?.damageTakenTotal?.hullDamage) || 0)
      };
    }

    formatBiomeEventBonuses(event) {
      if (!event) return "";
      const runDiff = this.getRunDifficultyMultipliers();
      const factionReward = this.getFactionRewardMultipliers();
      const intelReward = this.getFactionIntelRewardMultipliers();
      const parts = [];
      if ((event.credits ?? 0) > 0) {
        parts.push(
          tr("mission.event.bonus.credits", {
            value: Math.floor(
              (event.credits ?? 0) *
                this.getEndlessCreditsMultiplier() *
                runDiff.economyCreditsMul *
                factionReward.creditsMul *
                intelReward.creditsMul
            )
          })
        );
      }
      if ((event.salvageParts ?? 0) > 0) {
        parts.push(
          tr("mission.event.bonus.salvage", {
            value: Math.floor(event.salvageParts * runDiff.economySalvageMul * factionReward.salvageMul * intelReward.salvageMul)
          })
        );
      }
      if ((event.energy ?? 0) !== 0) parts.push(tr("mission.event.bonus.energy", { value: Math.floor(event.energy) }));
      if ((event.shield ?? 0) !== 0) parts.push(tr("mission.event.bonus.shield", { value: Math.floor(event.shield) }));
      if ((event.heat ?? 0) !== 0) parts.push(tr("mission.event.bonus.heat", { value: Math.floor(event.heat) }));
      if ((event.cooldownDelta ?? 0) !== 0) {
        parts.push(tr("mission.event.bonus.cooldown", { value: Math.abs(Number(event.cooldownDelta).toFixed(1)) }));
      }
      return parts.join(", ");
    }

    applyBiomeMiniEvent() {
      const mission = this.model.currentMission;
      if (!mission || mission.biomeMiniEventApplied) return;
      const event = mission.biomeMiniEvent;
      if (!event || typeof event !== "object") return;
      const ship = this.model.ship;
      const economyMul = this.getEndlessCreditsMultiplier();
      const runDiff = this.getRunDifficultyMultipliers();
      const factionReward = this.getFactionRewardMultipliers();
      const intelReward = this.getFactionIntelRewardMultipliers();

      if ((event.credits ?? 0) > 0) {
        const gain = Math.max(
          0,
          Math.floor(event.credits * economyMul * runDiff.economyCreditsMul * factionReward.creditsMul * intelReward.creditsMul)
        );
        this.model.credits += gain;
        this.model.telemetry.creditsEarned += gain;
      }
      if ((event.salvageParts ?? 0) > 0) {
        this.model.salvageParts += Math.max(
          0,
          Math.floor(event.salvageParts * runDiff.economySalvageMul * factionReward.salvageMul * intelReward.salvageMul)
        );
      }
      if (ship) {
        if ((event.energy ?? 0) !== 0) ship.energy = this.clamp(ship.energy + event.energy, 0, ship.energyMax);
        if ((event.shield ?? 0) !== 0) ship.shield = this.clamp(ship.shield + event.shield, 0, ship.shieldMax);
        if ((event.heat ?? 0) !== 0) ship.heat = this.clamp(ship.heat + event.heat, 0, ship.heatMax);
      }
      if ((event.cooldownDelta ?? 0) !== 0) {
        const delta = Number(event.cooldownDelta) || 0;
        this.model.shootTimer = Math.max(0, this.model.shootTimer + delta);
        this.model.secondaryCooldown = Math.max(0, this.model.secondaryCooldown + delta);
        this.model.utilityCooldown = Math.max(0, this.model.utilityCooldown + delta);
        this.model.dashCooldown = Math.max(0, this.model.dashCooldown + delta);
      }

      mission.biomeMiniEventApplied = true;
      this.applyMissionFactionReputation(this.config.faction?.biomeEventRepGain ?? 0, "game.faction.reason.biome_event", {
        announce: false,
        saveReason: "faction_biome_event"
      });
      const eventName = tr(`mission.event.${event.id}`);
      const bonusSummary = this.formatBiomeEventBonuses(event);
      mission.biomeEventText = tr("mission.event.triggered", { event: eventName, bonus: bonusSummary || "-" });
      this.model.hangar.message = mission.biomeEventText;
      if (typeof this.missionSystem?.triggerMissionBeat === "function") {
        this.missionSystem.triggerMissionBeat("biome_event", 0.72, 0.86);
      }
      this.hud.sync(this.model);
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
      this.recordRunSummaryMission({
        sector: active.sector,
        type: active.type,
        label: active.label,
        durationSeconds: this.model.telemetry.lastMission.durationSeconds,
        scoreGained: this.model.telemetry.lastMission.scoreGained,
        creditsGained: this.model.telemetry.lastMission.creditsGained,
        asteroidKills: this.model.telemetry.lastMission.asteroidKills,
        ufoKills: this.model.telemetry.lastMission.ufoKills,
        miniBossKills: this.model.telemetry.lastMission.miniBossKills,
        playerHitsTaken: this.model.telemetry.lastMission.playerHitsTaken,
        shieldDamageTaken:
          Math.max(0, Number(this.model.runSummary?.damageTakenTotal?.shieldAbsorb) || 0) -
          Math.max(0, Number(active.damageShieldStart) || 0),
        hullDamageTaken:
          Math.max(0, Number(this.model.runSummary?.damageTakenTotal?.hullDamage) || 0) -
          Math.max(0, Number(active.damageHullStart) || 0),
        runtimeSeconds: Math.max(0, Number(this.model.runtimeSeconds) || 0)
      });
      this.processBountyBoardMissionResult(this.model.telemetry.lastMission);
      this.model.telemetry.activeMission = null;
      const missionType = this.model.currentMission?.type ?? active.type;
      const xpBonus = this.config.pilot.xp.missionBonusByType[missionType] ?? 0;
      this.grantPilotXp(xpBonus, "mission");
      this.decayContrabandHeatOnMissionComplete();
      this.applyMissionFactionReputation(
        this.config.faction?.missionCompleteRepGain ?? 0,
        "game.faction.reason.mission_complete",
        { announce: true, saveReason: "faction_mission_complete" }
      );
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
      return this.getSpendBlockReason(energyCost, heatGain, options) == null;
    }

    getSpendBlockReason(energyCost, heatGain = 0, options = {}) {
      const ship = this.model.ship;
      if (!ship) return "game.action.block.no_ship";
      const hardThreshold = this.config.ship.overheatHardThreshold;
      const shieldCost = options.shieldCost ?? 0;
      if (ship.energy < energyCost) return "game.action.block.energy";
      if (ship.shield < shieldCost) return "game.action.block.shield";
      if (ship.heat + heatGain >= hardThreshold) return "game.action.block.heat";
      return null;
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

    getAsteroidSpecialProfile(type) {
      const specials = this.config.missionDirector?.asteroidSpecials || {};
      const profile = specials[type];
      return profile && typeof profile === "object" ? profile : {};
    }

    triggerEchoShellPulse(x, y, profile = null) {
      const pulseCfg = profile || this.getAsteroidSpecialProfile("echo_shell");
      const radius = Math.max(24, Number(pulseCfg.echoPulseRadius) || 126);
      const ttl = Math.max(0.2, Number(pulseCfg.echoPulseTtl) || 0.5);
      this.addRingParticle(x, y, ttl, 8, "162,238,255", Math.max(40, radius / Math.max(0.15, ttl)));
      this.emitImpactParticles(x, y, 10, "160,236,255");
      this.model.flashMs = Math.max(this.model.flashMs, 64);

      const deflectProjectile = (projectile) => {
        const dx = projectile.x - x;
        const dy = projectile.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist > radius + (projectile.radius ?? 0)) return false;
        const angle = Math.atan2(projectile.vy || 0.0001, projectile.vx || 0.0001);
        const turn = (this.rng() < 0.5 ? -1 : 1) * (0.42 + this.rng() * 0.24);
        const speed = Math.max(40, Math.hypot(projectile.vx, projectile.vy) * 0.9);
        projectile.vx = Math.cos(angle + turn) * speed;
        projectile.vy = Math.sin(angle + turn) * speed;
        projectile.ttl = Math.max(0.1, Number(projectile.ttl) - 0.25);
        return true;
      };

      for (const bullet of this.model.bullets) deflectProjectile(bullet);
      for (const bullet of this.model.enemyBullets) deflectProjectile(bullet);
    }

    getAsteroidScore(asteroid) {
      const sizeScore = this.asteroidDefs[asteroid.size].score;
      const typeScore = this.asteroidTypes[asteroid.asteroidType]?.scoreBonus ?? 0;
      return sizeScore + typeScore;
    }

    destroyAsteroidByIndex(index, allowBlast, options = {}) {
      const asteroid = this.model.asteroids[index];
      if (!asteroid) return;
      const awardRewards = options.awardRewards !== false;

      if (awardRewards) {
        this.registerScore(this.getAsteroidScore(asteroid), true);
        this.model.telemetry.kills.asteroids += 1;
      }
      this.model.flashMs = Math.max(this.model.flashMs, 80);
      this.emitExplosionFx(asteroid.x, asteroid.y, asteroid.radius, "89,245,255", "196,240,255");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.01);
      this.audio.play("asteroid_pop");
      this.combatSystem.splitAsteroid(asteroid);
      this.model.asteroids.splice(index, 1);
      if (awardRewards) {
        this.model.missionAsteroidKills += 1;
        this.tryDropModule("asteroid", asteroid.size);
      }

      if (allowBlast && asteroid.asteroidType === "volatile") {
        this.triggerVolatileBlast(asteroid.x, asteroid.y, asteroid.radius, options);
      }
    }

    triggerVolatileBlast(x, y, radius, options = {}) {
      const blastRadius = radius * this.config.asteroid.volatileBlastRadiusFactor;
      this.model.flashMs = Math.max(this.model.flashMs, 120);
      this.emitExplosionFx(x, y, blastRadius * 0.7, "255,133,100", "255,208,140");
      this.model.hitstopSeconds = Math.max(this.model.hitstopSeconds, 0.018);

      for (let i = this.model.asteroids.length - 1; i >= 0; i -= 1) {
        const target = this.model.asteroids[i];
        const dist = Math.hypot(target.x - x, target.y - y);
        if (dist <= blastRadius + target.radius) {
          this.destroyAsteroidByIndex(i, false, options);
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
      let remainingDamage = Math.max(0, Number(resolved.damage) || 0);
      let shieldDamage = 0;
      let hullDamage = 0;
      if ((ufo.shield ?? 0) > 0) {
        shieldDamage = Math.min(ufo.shield, remainingDamage);
        ufo.shield -= shieldDamage;
        remainingDamage -= shieldDamage;
      }
      if (remainingDamage > 0) {
        hullDamage = remainingDamage;
        ufo.hp -= hullDamage;
      }
      if (shieldDamage > 0) {
        this.spawnDamageNumber(ufo.x, ufo.y - ufo.radius * 0.7, shieldDamage, "SH", "118,242,255");
      }
      if (hullDamage > 0) {
        this.spawnDamageNumber(ufo.x, ufo.y - ufo.radius * 0.15, hullDamage, "HU", "255,138,202");
      }
      this.emitImpactParticles(ufo.x, ufo.y, resolved.isCrit ? 8 : 5, "255,122,198");
      if (ufo.hp <= 0) {
        this.destroyUfoByIndex(index);
        return true;
      }
      return false;
    }

    spawnDamageNumber(x, y, amount, label, colorRgb = "255,255,255") {
      const raw = Number(amount) || 0;
      if (raw <= 0) return;
      const value = Math.max(1, Math.round(raw));
      const sway = (this.rng() - 0.5) * 16;
      this.model.damageNumbers.push({
        x,
        y,
        vx: sway,
        vy: -(48 + this.rng() * 14),
        ttl: 0.65,
        maxTtl: 0.65,
        text: `-${value} ${label}`,
        color: colorRgb
      });
    }

    updateDamageNumbers(dt) {
      if (!Array.isArray(this.model.damageNumbers) || this.model.damageNumbers.length === 0) return;
      for (let i = this.model.damageNumbers.length - 1; i >= 0; i -= 1) {
        const item = this.model.damageNumbers[i];
        item.ttl -= dt;
        if (item.ttl <= 0) {
          this.model.damageNumbers.splice(i, 1);
          continue;
        }
        item.x += item.vx * dt;
        item.y += item.vy * dt;
      }
    }

    pushIncomingHitCue(cue) {
      if (!cue || typeof cue !== "object") return;
      const ttl = cue.isCrit ? 0.58 : 0.44;
      const item = {
        kind:
          typeof cue.kind === "string" && cue.kind.length > 0
            ? cue.kind
            : typeof cue.damageType === "string"
              ? cue.damageType
              : "kinetic",
        damageType: typeof cue.damageType === "string" ? cue.damageType : "kinetic",
        isCrit: Boolean(cue.isCrit),
        shieldAbsorb: Math.max(0, Number(cue.shieldAbsorb) || 0),
        hullDamage: Math.max(0, Number(cue.hullDamage) || 0),
        ttl,
        maxTtl: ttl
      };
      const list = this.model.incomingHitCues;
      if (!Array.isArray(list)) {
        this.model.incomingHitCues = [item];
        return;
      }
      list.push(item);
      const overflow = list.length - 10;
      if (overflow > 0) list.splice(0, overflow);
    }

    updateIncomingHitCues(dt) {
      const cues = this.model.incomingHitCues;
      if (!Array.isArray(cues) || cues.length === 0) return;
      for (let i = cues.length - 1; i >= 0; i -= 1) {
        cues[i].ttl -= dt;
        if (cues[i].ttl <= 0) cues.splice(i, 1);
      }
    }

    destroyMiniBoss() {
      const boss = this.model.miniBoss;
      if (!boss) return;
      const rewards = this.config.mission.miniBoss.rewards;
      const isFinalEncounter = this.model.currentMission?.isFinalEncounter;
      const rewardMultiplier = isFinalEncounter ? this.config.run.finalBossRewardMultiplier ?? 1 : 1;
      const economyMul = this.getEndlessCreditsMultiplier();
      const runDiff = this.getRunDifficultyMultipliers();
      const factionReward = this.getFactionRewardMultipliers();
      const intelReward = this.getFactionIntelRewardMultipliers();
      const creditsGain = Math.round(
        (rewards.creditsBase + Math.max(0, this.model.sector - 1) * rewards.creditsStep) *
          rewardMultiplier *
          economyMul *
          runDiff.economyCreditsMul *
          factionReward.creditsMul *
          intelReward.creditsMul
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
        this.recordRunSummaryDrop(drop, "miniBoss");
      }
      this.model.hangar.message = isFinalEncounter
        ? tr("game.boss.final_down", { credits: creditsGain, drops: rewards.guaranteedDrops })
        : tr("game.boss.down", { credits: creditsGain, drops: rewards.guaranteedDrops });
    }

    recordRunSummaryDamage(shieldAbsorb = 0, hullDamage = 0) {
      if (!this.model.runSummary || typeof this.model.runSummary !== "object") {
        this.model.runSummary = createRunSummaryState();
      }
      const totals = this.model.runSummary.damageTakenTotal || { shieldAbsorb: 0, hullDamage: 0 };
      totals.shieldAbsorb = Math.max(0, Number(totals.shieldAbsorb) || 0) + Math.max(0, Number(shieldAbsorb) || 0);
      totals.hullDamage = Math.max(0, Number(totals.hullDamage) || 0) + Math.max(0, Number(hullDamage) || 0);
      this.model.runSummary.damageTakenTotal = totals;
    }

    recordRunSummaryDrop(drop, source = "unknown") {
      if (!drop || typeof drop !== "object") return;
      if (!this.model.runSummary || typeof this.model.runSummary !== "object") {
        this.model.runSummary = createRunSummaryState();
      }
      const list = Array.isArray(this.model.runSummary.dropsSeen) ? this.model.runSummary.dropsSeen : [];
      list.push({
        name: String(drop.name || "-"),
        rarityId: String(drop.rarityId || "common"),
        rarityLabel: String(drop.rarityLabel || "Common"),
        slot: String(drop.slot || "module"),
        source: String(source || "unknown"),
        sector: Math.max(1, Math.floor(Number(this.model.sector) || 1)),
        runtimeSeconds: Math.max(0, Number(this.model.runtimeSeconds) || 0)
      });
      const cap = Math.max(12, Math.floor(Number(this.model.runSummary?.limits?.dropsSeen) || 48));
      if (list.length > cap) list.splice(0, list.length - cap);
      this.model.runSummary.dropsSeen = list;
    }

    recordRunSummaryMission(entry) {
      if (!entry || typeof entry !== "object") return;
      if (!this.model.runSummary || typeof this.model.runSummary !== "object") {
        this.model.runSummary = createRunSummaryState();
      }
      const list = Array.isArray(this.model.runSummary.missions) ? this.model.runSummary.missions : [];
      list.push({
        sector: Math.max(1, Math.floor(Number(entry.sector) || 1)),
        type: String(entry.type || "unknown"),
        label: String(entry.label || String(entry.type || "UNKNOWN")).toUpperCase(),
        durationSeconds: Math.max(0, Number(entry.durationSeconds) || 0),
        scoreGained: Math.floor(Number(entry.scoreGained) || 0),
        creditsGained: Math.floor(Number(entry.creditsGained) || 0),
        asteroidKills: Math.max(0, Math.floor(Number(entry.asteroidKills) || 0)),
        ufoKills: Math.max(0, Math.floor(Number(entry.ufoKills) || 0)),
        miniBossKills: Math.max(0, Math.floor(Number(entry.miniBossKills) || 0)),
        playerHitsTaken: Math.max(0, Math.floor(Number(entry.playerHitsTaken) || 0)),
        shieldDamageTaken: Math.max(0, Number(entry.shieldDamageTaken) || 0),
        hullDamageTaken: Math.max(0, Number(entry.hullDamageTaken) || 0),
        runtimeSeconds: Math.max(0, Number(entry.runtimeSeconds) || 0)
      });
      const cap = Math.max(8, Math.floor(Number(this.model.runSummary?.limits?.missions) || 16));
      if (list.length > cap) list.splice(0, list.length - cap);
      this.model.runSummary.missions = list;
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
