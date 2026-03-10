(() => {
  const buildVersion = window.Asteroids?.APP_BUILD_META?.version || "UNKNOWN";
  const CONTENT_DATA = window.Asteroids?.CONTENT_DATA || {};
  const BALANCE_DATA = window.Asteroids?.BALANCE_DATA || {};
  const BALANCE_PRESET_DATA = window.Asteroids?.BALANCE_PRESET_DATA || {};
  const GAME_STATE = {
    START: "start",
    PLAYING: "playing",
    MISSION_COMPLETE: "mission_complete",
    HANGAR: "hangar",
    PAUSED: "paused",
    GAME_OVER: "game_over",
    VICTORY: "victory"
  };

  const GAME_CONFIG = {
    canvas: {
      width: 960,
      height: 720
    },
    ship: {
      radius: 16,
      invulnerabilityMs: 1600,
      hitInvulnerabilityMs: 360,
      respawnSafetyPadding: 72,
      respawnMaxAttempts: 42,
      baseHull: 125,
      baseShield: 100,
      baseEnergy: 100,
      baseHeat: 100,
      shieldRegenPerSecond: 14,
      shieldRegenDelaySeconds: 2.2,
      energyRegenPerSecond: 26,
      heatDissipationPerSecond: 32,
      overheatSoftThreshold: 74,
      overheatHardThreshold: 100,
      overheatPenaltyFactor: 0.72,
      flightModel: {
        arcade: {
          rotationSpeed: 3.1,
          rotationAcceleration: 34,
          rotationDamping: 0.84,
          thrust: 342,
          friction: 0.988,
          maxSpeed: 430
        },
        sim_lite: {
          rotationSpeed: 2.45,
          rotationAcceleration: 27,
          rotationDamping: 0.9,
          thrust: 305,
          friction: 0.994,
          maxSpeed: 510
        }
      },
      boost: {
        thrustMultiplier: 1.65,
        energyCostPerSecond: 38,
        heatPerSecond: 26
      },
      sharedPool: {
        enabled: true,
        primaryShieldCostFactor: 0.26,
        secondaryShieldCostFactor: 0.38,
        utilityShieldCostFactor: 0.46,
        dashShieldCostFactor: 0.2
      },
      dash: {
        cooldownSeconds: 1.1,
        impulse: 360,
        energyCost: 24,
        heatGain: 12,
        invulnerabilityMs: 220
      }
    },
    bullet: {
      maxActive: 3,
      sectorBonusEverySectors: 4,
      sectorBonusMax: 2,
      speed: 560,
      ttlSeconds: 1.05,
      cooldownSeconds: 0.165,
      radius: 2,
      inheritVelocityFactor: 0.35
    },
    loadout: {
      primary: {
        auto_cannon: {
          kind: "auto",
          label: "Auto",
          role: "General",
          effectText: "Reliable single-shot",
          cooldownSeconds: 0.165,
          energyCost: 3.1,
          heatGain: 4.4,
          projectileSpeed: 560,
          ttlSeconds: 1.05,
          radius: 2,
          bossDamage: 28,
          spread: 0,
          count: 1,
          pierce: 0,
          chainTargets: 0,
          chainRadius: 0
        },
        spread_cannon: {
          kind: "spread",
          label: "Spread",
          role: "Close Control",
          effectText: "3-shot cone burst",
          cooldownSeconds: 0.24,
          energyCost: 4.3,
          heatGain: 6.0,
          projectileSpeed: 520,
          ttlSeconds: 0.9,
          radius: 2,
          bossDamage: 18,
          spread: 0.24,
          count: 3,
          pierce: 0,
          chainTargets: 0,
          chainRadius: 0
        },
        rail_lance: {
          kind: "rail",
          label: "Rail",
          role: "Precision",
          effectText: "Piercing high-velocity shot",
          cooldownSeconds: 0.285,
          energyCost: 5.4,
          heatGain: 7.6,
          projectileSpeed: 760,
          ttlSeconds: 1.15,
          radius: 2.4,
          bossDamage: 40,
          spread: 0,
          count: 1,
          pierce: 3,
          chainTargets: 0,
          chainRadius: 0
        },
        plasma_chain: {
          kind: "chain",
          label: "Chain",
          role: "Pack Melter",
          effectText: "Hit chains to nearby targets",
          cooldownSeconds: 0.235,
          energyCost: 4.8,
          heatGain: 6.5,
          projectileSpeed: 545,
          ttlSeconds: 1.0,
          radius: 2.2,
          bossDamage: 24,
          spread: 0,
          count: 1,
          pierce: 0,
          chainTargets: 2,
          chainRadius: 170,
          chainBossDamage: 14
        }
      },
      secondary: {
        missile_burst: {
          kind: "burst",
          label: "Missiles",
          role: "General DPS",
          effectText: "2-shot burst",
          impactText: "Reliable hit pressure",
          cooldownSeconds: 2.5,
          projectileSpeed: 430,
          ttlSeconds: 1.35,
          radius: 4,
          spread: 0.16,
          count: 2,
          bossDamage: 26,
          energyCost: 16,
          heatGain: 12
        },
        rail_shot: {
          kind: "rail",
          label: "Rail",
          role: "Precision",
          effectText: "High velocity pierce",
          impactText: "Pierces up to 4 targets",
          cooldownSeconds: 3.7,
          projectileSpeed: 760,
          ttlSeconds: 1.1,
          radius: 4,
          pierce: 4,
          bossDamage: 42,
          energyCost: 21,
          heatGain: 18
        },
        cluster_rockets: {
          kind: "cluster",
          label: "Cluster",
          role: "Area control",
          effectText: "Wide 4-shot cone",
          impactText: "Best at close packs",
          cooldownSeconds: 4.4,
          projectileSpeed: 370,
          ttlSeconds: 1.45,
          radius: 4,
          spread: 0.42,
          count: 4,
          bossDamage: 20,
          energyCost: 24,
          heatGain: 20
        }
      },
      utility: {
        pulse_bomb: {
          kind: "pulse",
          label: "Pulse",
          role: "Emergency clear",
          effectText: "AOE threat clear",
          impactText: "Deletes nearby threats",
          cooldownSeconds: 9.8,
          pulseRadius: 190,
          flashMs: 240,
          particleCount: 30,
          bossDamage: 78,
          energyCost: 32,
          heatGain: 17
        },
        emp_pulse: {
          kind: "emp",
          label: "EMP",
          role: "Control",
          effectText: "Disables UFO weapons",
          impactText: "Clears enemy bullets",
          cooldownSeconds: 12.4,
          disableSeconds: 5.2,
          flashMs: 210,
          particleCount: 24,
          energyCost: 30,
          heatGain: 15
        },
        shield_dome: {
          kind: "shield",
          label: "Shield",
          role: "Survival",
          effectText: "Temporary invulnerability",
          impactText: "Great for risky positioning",
          cooldownSeconds: 12.8,
          shieldSeconds: 3.5,
          flashMs: 180,
          particleCount: 20,
          energyCost: 26,
          heatGain: 12
        }
      }
    },
    enemyBullet: {
      speed: 215,
      ttlSeconds: 2.4,
      radius: 3,
      cooldownHunterSeconds: 1.25,
      cooldownSniperSeconds: 1.9,
      spreadHunter: 0.3,
      spreadSniper: 0.07
    },
    damage: {
      critMultiplier: 1.65,
      player: {
        critChance: 0.09,
        critMultiplier: 1.6
      },
      shipResist: {
        kinetic: 0.08,
        plasma: 0.04,
        explosive: 0.12,
        collision: 0.1,
        dot_thermal: 0.0
      },
      enemyHitProfiles: {
        enemy_bullet_hunter: { damageType: "kinetic", baseDamage: 18, critChance: 0.04, critMultiplier: 1.5 },
        enemy_bullet_sniper: { damageType: "plasma", baseDamage: 25, critChance: 0.12, critMultiplier: 1.7 },
        enemy_bullet_swarm: { damageType: "kinetic", baseDamage: 14, critChance: 0.03, critMultiplier: 1.4 },
        enemy_bullet_support: { damageType: "plasma", baseDamage: 16, critChance: 0.05, critMultiplier: 1.5 },
        enemy_mine: { damageType: "explosive", baseDamage: 24, critChance: 0.05, critMultiplier: 1.6 },
        asteroid_collision: { damageType: "collision", baseDamage: 34, critChance: 0.0 },
        ufo_collision: { damageType: "collision", baseDamage: 30, critChance: 0.0 },
        kamikaze_collision: { damageType: "collision", baseDamage: 48, critChance: 0.0 },
        mini_boss_collision: { damageType: "collision", baseDamage: 42, critChance: 0.0 },
        mini_boss_bullet: { damageType: "explosive", baseDamage: 26, critChance: 0.08, critMultiplier: 1.6 },
        volatile_burn: { damageType: "dot_thermal", baseDamage: 8, critChance: 0.0 }
      },
      dot: {
        tickSeconds: 0.25
      }
    },
    asteroid: {
      speedMin: 30,
      speedMax: 95,
      spinMin: -0.8,
      spinMax: 0.8,
      shapeVertices: 10,
      shapeVarianceMin: 0.72,
      shapeVarianceMax: 1.2,
      spawnMargin: 140,
      minDistanceFromShip: 190,
      maxSpawnRetries: 30,
      splitCount: 2,
      splitVelocityInheritFactor: 0.2,
      magneticRange: 230,
      magneticForce: 145,
      volatileBlastRadiusFactor: 2.05
    },
    combo: {
      resetSeconds: 2.25,
      multiplierStep: 0.25,
      maxMultiplier: 4,
      nearMissDistance: 48,
      nearMissCooldownSeconds: 1.35,
      nearMissEnergyGain: 8,
      nearMissHeatReduction: 6,
      nearMissShieldGain: 4
    },
    arcadeMutators: {
      comboScoringEnabled: false
    },
    economy: {
      creditsPerScore: 0.062,
      minCreditsPerKill: 1,
      moduleSellValueMultiplier: 1,
      salvageToCredits: 9
    },
    pilot: {
      maxLevel: 40,
      xp: {
        base: 120,
        growth: 1.22,
        perScore: 0.12,
        missionBonusByType: {
          survive: 26,
          ufo_hunt: 32,
          asteroid_storm: 30,
          mini_boss: 55
        },
        skillPointEveryLevels: 2
      },
      attributeCaps: {
        reflex: 25,
        systems: 25,
        grit: 25,
        instinct: 25
      },
      attributeEffects: {
        reflex: {
          rotationAccelPct: 0.012,
          rotationSpeedPct: 0.01,
          primaryCooldownPct: 0.006
        },
        systems: {
          energyRegenPct: 0.015,
          heatDissipationPct: 0.014,
          utilityCooldownPct: 0.01,
          shieldRegenPct: 0.008
        },
        grit: {
          hullPct: 0.015,
          shieldPct: 0.012,
          collisionResist: 0.006
        },
        instinct: {
          critChanceFlat: 0.002,
          primaryDamagePct: 0.006,
          creditsGainPct: 0.005
        }
      },
      perks: [
        {
          id: "vanguard_breach",
          branch: "vanguard",
          label: "Breach",
          levelReq: 3,
          requires: { grit: 4 },
          modifiers: { primaryDamagePct: 0.08, collisionResist: 0.06 }
        },
        {
          id: "vanguard_bastion",
          branch: "vanguard",
          label: "Bastion",
          levelReq: 8,
          requires: { grit: 8 },
          modifiers: { hullPct: 0.12, shieldPct: 0.12 }
        },
        {
          id: "ghost_focus",
          branch: "ghost",
          label: "Focus",
          levelReq: 4,
          requires: { reflex: 4 },
          modifiers: { primaryCooldownPct: 0.1, critChanceFlat: 0.03 }
        },
        {
          id: "ghost_vector",
          branch: "ghost",
          label: "Vector",
          levelReq: 10,
          requires: { reflex: 8 },
          modifiers: { thrustPct: 0.1, maxSpeedPct: 0.08 }
        },
        {
          id: "engineer_flux",
          branch: "engineer",
          label: "Flux",
          levelReq: 5,
          requires: { systems: 4 },
          modifiers: { energyRegenPct: 0.16, heatDissipationPct: 0.14 }
        },
        {
          id: "engineer_overclock",
          branch: "engineer",
          label: "Overclock",
          levelReq: 12,
          requires: { systems: 8 },
          modifiers: { utilityCooldownPct: 0.18, secondaryCooldownPct: 0.1 }
        },
        {
          id: "instinct_hunter",
          branch: "instinct",
          label: "Hunter",
          levelReq: 6,
          requires: { instinct: 4 },
          modifiers: { critChanceFlat: 0.04, creditsGainPct: 0.12 }
        },
        {
          id: "instinct_apex",
          branch: "instinct",
          label: "Apex",
          levelReq: 14,
          requires: { instinct: 8 },
          modifiers: { primaryDamagePct: 0.14, critChanceFlat: 0.03 }
        }
      ]
    },
    identity: {
      pilots: [
        {
          id: "buzz_calder",
          modifiers: { hullPct: 0.06, shieldPct: 0.05 }
        },
        {
          id: "neo_mercer",
          modifiers: { primaryCooldownPct: 0.05, critChanceFlat: 0.012 }
        },
        {
          id: "boba_vane",
          modifiers: { creditsGainPct: 0.08, primaryDamagePct: 0.04 }
        },
        {
          id: "luke_ryder",
          modifiers: { critChanceFlat: 0.016, primaryDamagePct: 0.03 }
        },
        {
          id: "marty_carter",
          modifiers: { utilityCooldownPct: 0.08, energyRegenPct: 0.05 }
        },
        {
          id: "max_steel",
          modifiers: { thrustPct: 0.06, maxSpeedPct: 0.05, shieldPct: -0.02 }
        }
      ],
      ships: [
        {
          id: "viper_mk2",
          modifiers: { maxSpeedPct: 0.07, hullPct: -0.04 }
        },
        {
          id: "bastion_frame",
          modifiers: { hullPct: 0.08, shieldPct: 0.05, thrustPct: -0.03 }
        },
        {
          id: "revenant_frame",
          modifiers: { primaryDamagePct: 0.06, heatDissipationPct: -0.04 }
        },
        {
          id: "helix_frame",
          modifiers: { energyRegenPct: 0.08, utilityCooldownPct: 0.06, hullPct: -0.03 }
        }
      ]
    },
    loot: {
      maxInventoryItems: 24,
      dropChance: {
        asteroid: {
          large: 0.14,
          medium: 0.08,
          small: 0.04
        },
        ufo: {
          hunter: 0.24,
          sniper: 0.3
        },
        miniBoss: 1
      },
      rarities: [
        { id: "common", label: "Common", color: "#d8f5ff", weight: 56, affixCount: 0, valueMult: 1, salvage: 3 },
        { id: "uncommon", label: "Uncommon", color: "#9bf5bb", weight: 26, affixCount: 1, valueMult: 1.35, salvage: 6 },
        { id: "rare", label: "Rare", color: "#76b7ff", weight: 12, affixCount: 2, valueMult: 1.9, salvage: 10 },
        { id: "exotic", label: "Exotic", color: "#d79cff", weight: 4.5, affixCount: 3, valueMult: 2.7, salvage: 16 },
        { id: "prototype", label: "Prototype", color: "#ffba7a", weight: 1.2, affixCount: 4, valueMult: 3.8, salvage: 24 },
        { id: "relic", label: "Relic", color: "#ffe889", weight: 0.3, affixCount: 5, valueMult: 5.2, salvage: 36 }
      ],
      slots: ["hull", "shield", "generator", "engine", "chipset"],
      basesBySlot: {
        hull: [
          { id: "reinforced_plating", name: "Reinforced Plating", modifiers: { hullPct: 0.1, collisionResist: 0.04 } },
          { id: "light_plating", name: "Light Plating", modifiers: { hullPct: 0.06, maxSpeedPct: 0.03 } }
        ],
        shield: [
          { id: "phase_barrier", name: "Phase Barrier", modifiers: { shieldPct: 0.11, shieldRegenPct: 0.08 } },
          { id: "mirror_shield", name: "Mirror Shield", modifiers: { shieldPct: 0.08, plasmaResist: 0.06 } }
        ],
        generator: [
          { id: "flux_core", name: "Flux Core", modifiers: { energyPct: 0.12, energyRegenPct: 0.12 } },
          { id: "coolant_core", name: "Coolant Core", modifiers: { energyPct: 0.07, heatDissipationPct: 0.14 } }
        ],
        engine: [
          { id: "vector_thrusters", name: "Vector Thrusters", modifiers: { thrustPct: 0.1, maxSpeedPct: 0.08 } },
          { id: "gyro_drive", name: "Gyro Drive", modifiers: { rotationAccelPct: 0.12, rotationSpeedPct: 0.08 } }
        ],
        chipset: [
          { id: "targeting_ai", name: "Targeting AI", modifiers: { primaryDamagePct: 0.1, critChanceFlat: 0.02 } },
          { id: "cooldown_matrix", name: "Cooldown Matrix", modifiers: { primaryCooldownPct: 0.08, secondaryCooldownPct: 0.08, utilityCooldownPct: 0.08 } }
        ]
      },
      affixes: [
        { id: "hardened", name: "Hardened", slots: ["hull", "shield"], modifiers: { collisionResist: 0.03, hullPct: 0.04 } },
        { id: "charged", name: "Charged", slots: ["generator", "shield"], modifiers: { energyPct: 0.07, shieldPct: 0.05 } },
        { id: "quickspin", name: "Quickspin", slots: ["engine"], modifiers: { rotationAccelPct: 0.1, rotationSpeedPct: 0.06 } },
        { id: "afterburn", name: "Afterburn", slots: ["engine", "generator"], modifiers: { thrustPct: 0.09, heatDissipationPct: -0.04 } },
        { id: "efficient", name: "Efficient", slots: ["generator", "chipset"], modifiers: { primaryCooldownPct: 0.05, secondaryCooldownPct: 0.07 } },
        { id: "tactical", name: "Tactical", slots: ["chipset"], modifiers: { utilityCooldownPct: 0.1, critChanceFlat: 0.01 } },
        { id: "reactive", name: "Reactive", slots: ["shield", "hull"], modifiers: { shieldRegenPct: 0.12 } },
        { id: "overclocked", name: "Overclocked", slots: ["chipset", "generator"], modifiers: { primaryDamagePct: 0.12, heatDissipationPct: -0.06 } },
        { id: "prospector_mark", name: "Prospector Mark", slots: ["hull", "shield", "generator", "engine", "chipset"], setTag: "prospector", modifiers: { salvageYieldPct: 0.08 } },
        { id: "corsair_mark", name: "Corsair Mark", slots: ["hull", "shield", "generator", "engine", "chipset"], setTag: "corsair", modifiers: { critChanceFlat: 0.01 } },
        { id: "warden_mark", name: "Warden Mark", slots: ["hull", "shield", "generator", "engine", "chipset"], setTag: "warden", modifiers: { collisionResist: 0.02 } }
      ],
      setBonuses: {
        prospector: {
          label: "Prospector",
          tiers: {
            2: { energyRegenPct: 0.1, salvageYieldPct: 0.15 },
            3: { energyRegenPct: 0.18, salvageYieldPct: 0.3, primaryCooldownPct: 0.06 }
          }
        },
        corsair: {
          label: "Corsair",
          tiers: {
            2: { primaryDamagePct: 0.1, critChanceFlat: 0.02 },
            3: { primaryDamagePct: 0.18, critChanceFlat: 0.04, maxSpeedPct: 0.08 }
          }
        },
        warden: {
          label: "Warden",
          tiers: {
            2: { hullPct: 0.1, shieldPct: 0.1 },
            3: { hullPct: 0.18, shieldPct: 0.16, collisionResist: 0.08, plasmaResist: 0.08 }
          }
        }
      }
    },
    hangar: {
      items: [
        {
          id: "repair",
          title: "Repair Hull+Shield",
          cost: 130
        },
        {
          id: "fire_rate",
          title: "Weapon Tuning (-9% cooldown)",
          cost: 160
        },
        {
          id: "magazine",
          title: "Magazine Upgrade (+1 max shots)",
          cost: 150
        }
      ],
      maxFireRateLevel: 8,
      maxMagazineLevel: 6,
      fireRateFactorPerLevel: 0.91
    },
    ufo: {
      spawnDelayMinSeconds: 16,
      spawnDelayMaxSeconds: 28,
      modeWeights: {
        hunter: 0.36,
        sniper: 0.26,
        swarm: 0.16,
        kamikaze: 0.1,
        support: 0.07,
        mine_layer: 0.05
      },
      unlockSectorByMode: {
        hunter: 1,
        sniper: 1,
        swarm: 2,
        kamikaze: 3,
        support: 4,
        mine_layer: 5
      },
      hpByMode: {
        hunter: 44,
        sniper: 52,
        swarm: 28,
        kamikaze: 34,
        support: 48,
        mine_layer: 56
      },
      speedHunter: 88,
      speedSniper: 72,
      speedSwarm: 108,
      speedKamikaze: 126,
      speedSupport: 74,
      speedMineLayer: 64,
      speedScalePerSector: 0.022,
      speedScaleMaxBonus: 0.32,
      fireRateScalePerSector: 0.05,
      fireRateScaleMaxBonus: 0.7,
      bulletSpeedScalePerSector: 0.024,
      bulletSpeedScaleMaxBonus: 0.45,
      radius: 20,
      scoreHunter: 220,
      scoreSniper: 320,
      scoreSwarm: 170,
      scoreKamikaze: 210,
      scoreSupport: 290,
      scoreMineLayer: 360,
      desiredSniperDistance: 260,
      desiredSupportDistance: 300,
      supportHealPerTick: 7,
      supportHealIntervalSeconds: 1.8,
      mineDeployIntervalSeconds: 2.4,
      mineTtlSeconds: 8.2,
      mineRadius: 6,
      elitePrefixChanceBase: 0.05,
      elitePrefixChancePerSector: 0.03,
      elitePrefixChanceMax: 0.32,
      elitePrefixStats: {
        Phase: { speedMul: 1.08, fireRateMul: 1.12, hpMul: 1.15, scoreMul: 1.28 },
        Berserker: { speedMul: 1.22, fireRateMul: 1.28, hpMul: 1.05, scoreMul: 1.35 },
        Armored: { speedMul: 0.82, fireRateMul: 0.92, hpMul: 1.8, scoreMul: 1.45 },
        Volatile: { speedMul: 1.04, fireRateMul: 1.0, hpMul: 1.2, scoreMul: 1.32 }
      }
    },
    sector: {
      baseAsteroids: 4,
      graceMs: 1100,
      speedScaleStep: 0.11,
      splitScalePerSector: 0.09
    },
    faction: {
      definitions: [
        { id: "helix_union", color: "#73d5ff", shopBias: "precision" },
        { id: "drift_cartel", color: "#ff9a66", shopBias: "scrap" }
      ],
      repMin: -100,
      repMax: 100,
      missionStartRepGain: 1,
      missionCompleteRepGain: 3,
      biomeEventRepGain: 1,
      rivalRepLossOnGainMul: 0.5,
      rewardCreditsPerRep100: 0.12,
      rewardSalvagePerRep100: 0.1,
      shopBiasThresholdRep: 15,
      shopPriceInfluencePerRep100: 0.14,
      shopPenaltyInfluencePerRep100: 0.06,
      blackMarketPriceMul: 1.22,
      contrabandItemIds: ["fire_rate", "magazine"],
      contrabandDiscountMul: 0.72,
      contrabandRepPenalty: 2,
      contrabandHeatPerPurchase: 1,
      contrabandHeatMax: 12,
      contrabandHeatPressurePerStack: 0.03,
      contrabandHeatDecayOnMissionComplete: 1,
      repGainSectorCapBase: 5,
      repGainSectorCapStep: 1,
      repGainDiminishStart: 20,
      repGainDiminishMaxReduction: 0.7,
      repThresholds: [
        {
          id: "strained",
          minRep: -100,
          maxRep: -20,
          effects: { shopPriceMul: 1.08, creditsMul: 0.95, salvageMul: 0.94 }
        },
        {
          id: "trusted",
          minRep: 20,
          effects: { shopPriceMul: 0.95, creditsMul: 1.06, salvageMul: 1.04 }
        },
        {
          id: "ally",
          minRep: 50,
          effects: { shopPriceMul: 0.9, creditsMul: 1.12, salvageMul: 1.1 }
        }
      ],
      bountyBoardProfiles: {
        helix_union: {
          templateWeightByKind: {
            ufo_kills: 1.35,
            mission_clears: 1.2,
            asteroid_kills: 0.86,
            credits_earned: 0.94
          },
          rewardCreditsMul: 1.08,
          rewardSalvageMul: 0.94,
          repOnClaim: 1
        },
        drift_cartel: {
          templateWeightByKind: {
            ufo_kills: 0.86,
            mission_clears: 0.94,
            asteroid_kills: 1.35,
            credits_earned: 1.18
          },
          rewardCreditsMul: 0.94,
          rewardSalvageMul: 1.08,
          repOnClaim: 1
        }
      },
      lootIdentity: {
        helix_union: {
          affixWeights: {
            efficient: 1.55,
            tactical: 1.45,
            quickspin: 1.18,
            overclocked: 1.22,
            corsair_mark: 1.42
          },
          setTagWeights: {
            corsair: 1.45,
            warden: 1.12,
            prospector: 0.88
          }
        },
        drift_cartel: {
          affixWeights: {
            hardened: 1.24,
            afterburn: 1.48,
            reactive: 1.34,
            charged: 1.18,
            prospector_mark: 1.46
          },
          setTagWeights: {
            prospector: 1.45,
            warden: 1.12,
            corsair: 0.88
          }
        }
      },
      intelOptions: [
        {
          id: "balanced",
          pressureMul: 1.0,
          creditsMul: 1.0,
          salvageMul: 1.0,
          reputationDelta: {}
        },
        {
          id: "helix_contract",
          pressureMul: 1.06,
          creditsMul: 1.12,
          salvageMul: 0.9,
          reputationDelta: { helix_union: 2, drift_cartel: -1 }
        },
        {
          id: "drift_contract",
          pressureMul: 1.06,
          creditsMul: 0.9,
          salvageMul: 1.12,
          reputationDelta: { helix_union: -1, drift_cartel: 2 }
        }
      ]
    },
    run: {
      finalSector: 4,
      finalMissionType: "mini_boss",
      bossRush: {
        finalSector: 4,
        finalMissionType: "mini_boss"
      },
      difficultyPresets: [
        {
          id: "rookie",
          pressureMul: 0.9,
          enemyDamageTakenMul: 0.82,
          playerDamageMul: 1.1,
          economyCreditsMul: 1.12,
          economySalvageMul: 1.1,
          lootDropMul: 1.08,
          hazardIntensityMul: 0.86
        },
        {
          id: "normal",
          pressureMul: 1.0,
          enemyDamageTakenMul: 1.0,
          playerDamageMul: 1.0,
          economyCreditsMul: 1.0,
          economySalvageMul: 1.0,
          lootDropMul: 1.0,
          hazardIntensityMul: 1.0
        },
        {
          id: "veteran",
          pressureMul: 1.12,
          enemyDamageTakenMul: 1.15,
          playerDamageMul: 0.94,
          economyCreditsMul: 0.94,
          economySalvageMul: 0.92,
          lootDropMul: 0.94,
          hazardIntensityMul: 1.1
        },
        {
          id: "ace",
          pressureMul: 1.24,
          enemyDamageTakenMul: 1.28,
          playerDamageMul: 0.88,
          economyCreditsMul: 0.88,
          economySalvageMul: 0.86,
          lootDropMul: 0.9,
          hazardIntensityMul: 1.2
        }
      ],
      finalBossHpMultiplier: 1.45,
      finalBossRewardMultiplier: 1.35,
      finalBoss: {
        radius: 42,
        phaseThresholds: [0.78, 0.46],
        orbitRadiusX: [250, 300, 350],
        orbitRadiusY: [120, 150, 180],
        orbitFreq: [0.55, 0.72, 0.94],
        driftFreq: [1.15, 1.35, 1.6],
        shootCooldownSeconds: [1.1, 0.86, 0.66],
        weakpointCycleSeconds: [4.1, 3.5, 2.9],
        weakpointWindowSeconds: [1.35, 1.5, 1.65],
        weakpointDamageMultiplier: 2.55,
        weakpointClosedMultiplier: 0.28,
        spiralShotsByPhase: [6, 8, 10],
        spiralSpreadRadians: [0.62, 0.8, 0.98],
        radialRingShotsByPhase: [8, 10, 12],
        radialRingSpeedFactor: [0.82, 0.9, 0.98],
        radialRingEveryShots: 3,
        mineRingEveryShots: 4,
        mineRingCountByPhase: [6, 8, 10],
        mineSpeedFactor: 0.66,
        mineTtlSeconds: 6.1,
        asteroidSpawnLargeByPhase: [1, 1, 2],
        asteroidSpawnMediumByPhase: [1, 2, 2]
      }
    },
    mission: {
      order: ["survive", "ufo_hunt", "asteroid_storm", "mini_boss"],
      mutators: [
        {
          id: "standard",
          pressureMul: 1.0,
          enemyDamageTakenMul: 1.0,
          playerDamageMul: 1.0,
          economyCreditsMul: 1.0,
          economySalvageMul: 1.0,
          lootDropMul: 1.0,
          hazardIntensityMul: 1.0
        },
        {
          id: "volatile_space",
          pressureMul: 1.08,
          enemyDamageTakenMul: 1.06,
          playerDamageMul: 0.98,
          economyCreditsMul: 1.08,
          economySalvageMul: 0.95,
          lootDropMul: 1.12,
          hazardIntensityMul: 1.2
        },
        {
          id: "scavenger_code",
          pressureMul: 0.95,
          enemyDamageTakenMul: 0.94,
          playerDamageMul: 1.04,
          economyCreditsMul: 0.9,
          economySalvageMul: 1.2,
          lootDropMul: 0.96,
          hazardIntensityMul: 0.9
        },
        {
          id: "blackout_protocol",
          pressureMul: 1.15,
          enemyDamageTakenMul: 1.16,
          playerDamageMul: 0.9,
          economyCreditsMul: 0.86,
          economySalvageMul: 0.84,
          lootDropMul: 1.06,
          hazardIntensityMul: 1.26
        }
      ],
      bountyBoard: {
        slots: 3,
        maxRerollsPerSector: 1,
        rerollCreditsBase: 22,
        rerollCreditsStep: 4,
        heatRerollCostPerStack: 0.06,
        heatRewardCreditsPerStack: 0.04,
        heatRewardSalvagePerStack: 0.03,
        templates: [
          {
            id: "ufo_hunter",
            kind: "ufo_kills",
            labelKey: "game.bounty.kind.ufo_kills",
            baseTarget: 2,
            targetStep: 1,
            targetStepEverySectors: 2,
            rewardCreditsBase: 42,
            rewardCreditsStep: 8,
            rewardSalvageBase: 1,
            rewardSalvageStep: 1
          },
          {
            id: "asteroid_breaker",
            kind: "asteroid_kills",
            labelKey: "game.bounty.kind.asteroid_kills",
            baseTarget: 8,
            targetStep: 2,
            targetStepEverySectors: 2,
            rewardCreditsBase: 38,
            rewardCreditsStep: 7,
            rewardSalvageBase: 1,
            rewardSalvageStep: 1
          },
          {
            id: "contract_runner",
            kind: "mission_clears",
            labelKey: "game.bounty.kind.mission_clears",
            baseTarget: 1,
            targetStep: 0,
            targetStepEverySectors: 1,
            rewardCreditsBase: 34,
            rewardCreditsStep: 6,
            rewardSalvageBase: 1,
            rewardSalvageStep: 0
          },
          {
            id: "credit_sweep",
            kind: "credits_earned",
            labelKey: "game.bounty.kind.credits_earned",
            baseTarget: 48,
            targetStep: 12,
            targetStepEverySectors: 2,
            rewardCreditsBase: 46,
            rewardCreditsStep: 10,
            rewardSalvageBase: 1,
            rewardSalvageStep: 1
          }
        ]
      },
      survive: {
        baseDurationSeconds: 19,
        durationStepSeconds: 2.3,
        asteroidSpawnIntervalSeconds: 3.35,
        minSpawnIntervalSeconds: 1.5,
        spawnRateRampPerSector: 0.065,
        extraLargeEverySectors: 5
      },
      ufoHunt: {
        baseKills: 1,
        killStep: 1,
        preludeMinUfos: 1,
        preludeMaxUfos: 3,
        preludeTargetScale: 0.75,
        finaleConcurrentUfos: 2,
        maxConcurrentUfos: 1,
        maxConcurrentRampEverySectors: 4,
        maxConcurrentCap: 3,
        spawnIntervalSeconds: 3.8,
        minSpawnIntervalSeconds: 1.7,
        spawnRateRampPerSector: 0.08
      },
      asteroidStorm: {
        baseTarget: 10,
        targetStep: 2,
        initialLargeCount: 3,
        initialMediumCount: 1,
        extraSpawnIntervalSeconds: 5.1,
        minExtraSpawnIntervalSeconds: 2.2,
        spawnRateRampPerSector: 0.085,
        extraMediumChance: 0.32,
        mediumChanceRampPerSector: 0.03
      },
      miniBoss: {
        hpBase: 360,
        hpStep: 78,
        radius: 34,
        speed: 82,
        phaseThresholds: [0.72, 0.42],
        movementAmplitudeX: [220, 270, 320],
        movementAmplitudeY: [26, 38, 52],
        movementFreqX: [0.72, 0.92, 1.16],
        movementFreqY: [1.18, 1.42, 1.68],
        shootCooldownSeconds: [1.28, 0.98, 0.72],
        volleyCount: [1, 2, 3],
        spreadRadians: [0.1, 0.2, 0.32],
        weakpointCycleSeconds: [4.8, 4.0, 3.4],
        weakpointWindowSeconds: [1.2, 1.35, 1.5],
        weakpointDamageMultiplier: 2.3,
        weakpointClosedMultiplier: 0.36,
        phaseEvent: {
          mineRingCount: 8,
          mineSpeedFactor: 0.62,
          mineTtlSeconds: 5.8,
          asteroidPushImpulse: 120,
          asteroidSpawnLarge: 1,
          asteroidSpawnMedium: 1
        },
        rewards: {
          scoreReward: 840,
          creditsBase: 95,
          creditsStep: 28,
          guaranteedDrops: 1
        }
      },
      rewards: {
        scoreByType: {
          survive: 1.0,
          ufo_hunt: 1.08,
          asteroid_storm: 1.05,
          mini_boss: 1.12
        },
        creditsByType: {
          survive: 1.0,
          ufo_hunt: 1.1,
          asteroid_storm: 1.06,
          mini_boss: 1.16
        }
      },
      endless: {
        startSector: 5,
        difficultyBonusPerSector: 0.045,
        maxDifficultyBonus: 0.5,
        spawnIntervalReductionPerSector: 0.025,
        maxSpawnIntervalReduction: 0.3,
        objectiveBudgetBonusPerSector: 0.02,
        maxObjectiveBudgetBonus: 0.24,
        surviveTimerReductionPerSector: 0.02,
        maxSurviveTimerReduction: 0.22,
        extraConcurrentEverySectors: 3,
        extraConcurrentCap: 2,
        creditsDampingPerSector: 0.06,
        minCreditsMultiplier: 0.55
      }
    },
    missionDirector: {
      pacingBySector: [
        { maxSector: 2, difficulty: 0.86 },
        { maxSector: 4, difficulty: 1.0 },
        { maxSector: 7, difficulty: 1.18 },
        { maxSector: 999, difficulty: 1.34 }
      ],
      biomeVisuals: {
        default: {
          ambientCadence: 1.0,
          debrisDensity: 1.0,
          fogPulse: 0.1,
          beatColor: "176,222,255",
          parallaxLayers: [
            { speed: 0.13, alpha: 0.07, size: 1.4, driftX: 1.0, driftY: 0.32 },
            { speed: 0.23, alpha: 0.1, size: 2.0, driftX: 1.12, driftY: 0.44 }
          ]
        },
        belt: {
          ambientCadence: 1.08,
          debrisDensity: 1.0,
          fogPulse: 0.08,
          beatColor: "154,218,245",
          parallaxLayers: [
            { speed: 0.2, alpha: 0.08, size: 1.3, driftX: 1.16, driftY: 0.35 },
            { speed: 0.35, alpha: 0.12, size: 1.9, driftX: 1.24, driftY: 0.42 },
            { speed: 0.5, alpha: 0.15, size: 2.3, driftX: 1.36, driftY: 0.5 }
          ]
        },
        graveyard: {
          ambientCadence: 0.86,
          debrisDensity: 1.26,
          fogPulse: 0.14,
          beatColor: "184,206,232",
          parallaxLayers: [
            { speed: 0.1, alpha: 0.08, size: 1.7, driftX: 0.86, driftY: 0.26 },
            { speed: 0.18, alpha: 0.12, size: 2.4, driftX: 0.94, driftY: 0.34 }
          ]
        },
        refinery: {
          ambientCadence: 1.2,
          debrisDensity: 0.78,
          fogPulse: 0.06,
          beatColor: "255,174,118",
          parallaxLayers: [
            { speed: 0.1, alpha: 0.07, size: 1.2, driftX: 0.76, driftY: 0.2 },
            { speed: 0.17, alpha: 0.09, size: 1.8, driftX: 0.88, driftY: 0.26 }
          ]
        },
        ion_field: {
          ambientCadence: 1.24,
          debrisDensity: 0.9,
          fogPulse: 0.16,
          beatColor: "136,182,255",
          parallaxLayers: [
            { speed: 0.14, alpha: 0.08, size: 1.4, driftX: 1.0, driftY: 0.4 },
            { speed: 0.24, alpha: 0.11, size: 1.9, driftX: 1.12, driftY: 0.52 }
          ]
        },
        shattered_relay: {
          ambientCadence: 1.12,
          debrisDensity: 1.05,
          fogPulse: 0.13,
          beatColor: "186,198,255",
          parallaxLayers: [
            { speed: 0.13, alpha: 0.08, size: 1.6, driftX: 0.96, driftY: 0.36 },
            { speed: 0.21, alpha: 0.11, size: 2.1, driftX: 1.05, driftY: 0.46 }
          ]
        },
        cryo_ring: {
          ambientCadence: 0.92,
          debrisDensity: 0.84,
          fogPulse: 0.2,
          beatColor: "162,232,255",
          parallaxLayers: [
            { speed: 0.08, alpha: 0.07, size: 1.4, driftX: 0.76, driftY: 0.18 },
            { speed: 0.14, alpha: 0.1, size: 1.9, driftX: 0.84, driftY: 0.24 }
          ]
        }
      },
      biomes: [
        {
          id: "belt",
          label: "Belt Fringe",
          weight: 0.22,
          audio: {
            warningSoundId: "warning_belt",
            stinger: { a: 260, b: 390, c: 520 }
          },
          miniEvent: {
            id: "prospector_ping",
            credits: 12
          }
        },
        {
          id: "graveyard",
          label: "Wreck Graveyard",
          weight: 0.2,
          audio: {
            warningSoundId: "warning_graveyard",
            stinger: { a: 190, b: 250, c: 330 }
          },
          miniEvent: {
            id: "scrap_cache",
            salvageParts: 3
          },
          hazards: {
            type: "debris_field",
            minCount: 2,
            maxCount: 3,
            radiusMin: 70,
            radiusMax: 110,
            tickSeconds: 0.85,
            tickDamage: 10,
            slowMul: 0.985
          }
        },
        {
          id: "refinery",
          label: "Refinery Complex",
          weight: 0.2,
          audio: {
            warningSoundId: "warning_refinery",
            stinger: { a: 240, b: 310, c: 460 }
          },
          miniEvent: {
            id: "coolant_cache",
            heat: -20,
            shield: 10
          },
          hazards: {
            type: "plasma_vent",
            minCount: 1,
            maxCount: 2,
            radiusMin: 85,
            radiusMax: 125,
            tickSeconds: 0.5,
            tickDamage: 12,
            heatPerSecond: 14
          }
        },
        {
          id: "ion_field",
          label: "Ion Field",
          weight: 0.14,
          audio: {
            warningSoundId: "warning_ion_field",
            stinger: { a: 320, b: 420, c: 620 }
          },
          miniEvent: {
            id: "capacitor_surge",
            energy: 16,
            shield: 6
          }
        },
        {
          id: "shattered_relay",
          label: "Shattered Relay",
          weight: 0.12,
          audio: {
            warningSoundId: "warning_shattered_relay",
            stinger: { a: 220, b: 340, c: 510 }
          },
          miniEvent: {
            id: "relay_hack",
            cooldownDelta: -0.9
          },
          hazards: {
            type: "relay_jammer_burst",
            minCount: 1,
            maxCount: 2,
            radiusMin: 92,
            radiusMax: 128,
            tickSeconds: 0.3,
            tickDamage: 6,
            pulseCycleSeconds: 2.6,
            pulseWindowSeconds: 0.72,
            jamCooldownPerSecond: 0.55,
            jamDragMul: 0.995,
            angularDragMul: 0.965
          }
        },
        {
          id: "cryo_ring",
          label: "Cryo Ring",
          weight: 0.12,
          audio: {
            warningSoundId: "warning_cryo_ring",
            stinger: { a: 170, b: 240, c: 300 }
          },
          miniEvent: {
            id: "cryo_focus",
            heat: -24,
            cooldownDelta: -0.4
          },
          hazards: {
            type: "cryo_shear_zone",
            minCount: 2,
            maxCount: 3,
            radiusMin: 80,
            radiusMax: 118,
            slowMul: 0.988,
            angularDampingMul: 0.95,
            coolingPerSecond: 18,
            dashCooldownPerSecond: 0.2
          }
        }
      ],
      modifiers: {
        ion_storm: {
          label: "Ion Storm",
          description: "Shields destabilize under ion surge.",
          weight: 0.28,
          unlockSector: 2,
          shieldRegenMul: 0.25,
          shieldDrainPerSecond: 2.8
        },
        low_visibility: {
          label: "Low Visibility",
          description: "Sensor fog reduces visual range.",
          weight: 0.25,
          unlockSector: 3,
          fogAlpha: 0.28
        },
        gravity_anomaly: {
          label: "Gravity Anomaly",
          description: "Anomaly well bends nearby trajectories.",
          weight: 0.18,
          unlockSector: 4,
          pullStrength: 14800,
          radius: 300,
          coreRadius: 62,
          maxShipPullAccel: 210,
          maxAsteroidPullAccel: 130,
          escapeThrustPullMultiplier: 0.58
        },
        clear_skies: {
          label: "Clear Skies",
          description: "No global mission hazard.",
          weight: 0.29,
          unlockSector: 1
        }
      }
    },
    simulation: {
      fixedStepSeconds: 1 / 120,
      maxFrameDeltaSeconds: 0.25,
      maxStepCount: 8
    }
  };

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(target, source) {
    if (!isObject(source)) return target;
    for (const key of Object.keys(source)) {
      const srcValue = source[key];
      const dstValue = target[key];
      if (isObject(srcValue) && isObject(dstValue)) deepMerge(dstValue, srcValue);
      else target[key] = srcValue;
    }
    return target;
  }

  function applyBalanceOverrides(config, overrides) {
    const allowlist = ["economy", "bullet", "ufo", "sector", "mission"];
    for (const key of allowlist) {
      if (!(key in overrides)) continue;
      if (!isObject(overrides[key])) continue;
      if (!isObject(config[key])) continue;
      deepMerge(config[key], overrides[key]);
    }
  }

  function applyContentDataOverrides(config, overrides) {
    const allowlist = ["mission", "ufo", "loot", "missionDirector", "run", "faction"];
    for (const key of allowlist) {
      if (!(key in overrides)) continue;
      if (!isObject(overrides[key])) continue;
      if (!isObject(config[key])) continue;
      deepMerge(config[key], overrides[key]);
    }
  }

  function resolvePresetName() {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const preset = params.get("preset");
      if (preset && BALANCE_PRESET_DATA[preset]) return preset;
    } catch (error) {
      // Ignore URL parsing errors in non-browser contexts.
    }
    return "baseline";
  }

  function validateGameConfig(config) {
    const checks = [
      { ok: config.economy.creditsPerScore > 0, msg: "economy.creditsPerScore must be > 0" },
      { ok: config.economy.minCreditsPerKill >= 0, msg: "economy.minCreditsPerKill must be >= 0" },
      { ok: config.bullet.maxActive >= 1 && config.bullet.maxActive <= 30, msg: "bullet.maxActive out of expected range" },
      { ok: config.mission.survive.baseDurationSeconds >= 5, msg: "mission.survive.baseDurationSeconds too low" },
      {
        ok:
          Number.isFinite(config.mission?.bountyBoard?.slots) &&
          config.mission.bountyBoard.slots >= 1 &&
          Number.isFinite(config.mission.bountyBoard.maxRerollsPerSector) &&
          config.mission.bountyBoard.maxRerollsPerSector >= 0 &&
          Number.isFinite(config.mission.bountyBoard.rerollCreditsBase) &&
          config.mission.bountyBoard.rerollCreditsBase >= 0 &&
          Number.isFinite(config.mission.bountyBoard.rerollCreditsStep) &&
          config.mission.bountyBoard.rerollCreditsStep >= 0 &&
          Number.isFinite(config.mission.bountyBoard.heatRerollCostPerStack) &&
          config.mission.bountyBoard.heatRerollCostPerStack >= 0 &&
          Number.isFinite(config.mission.bountyBoard.heatRewardCreditsPerStack) &&
          config.mission.bountyBoard.heatRewardCreditsPerStack >= 0 &&
          Number.isFinite(config.mission.bountyBoard.heatRewardSalvagePerStack) &&
          config.mission.bountyBoard.heatRewardSalvagePerStack >= 0 &&
          Array.isArray(config.mission.bountyBoard.templates) &&
          config.mission.bountyBoard.templates.length >= 1,
        msg: "mission.bountyBoard missing or invalid"
      },
      {
        ok:
          config.mission.ufoHunt.preludeMinUfos >= 1 &&
          config.mission.ufoHunt.preludeMaxUfos >= config.mission.ufoHunt.preludeMinUfos &&
          config.mission.ufoHunt.finaleConcurrentUfos >= 1,
        msg: "mission.ufoHunt staged targets are invalid"
      },
      {
        ok:
          config.missionDirector?.biomeVisuals &&
          typeof config.missionDirector.biomeVisuals === "object" &&
          !Array.isArray(config.missionDirector.biomeVisuals) &&
          typeof config.missionDirector.biomeVisuals.default === "object",
        msg: "missionDirector.biomeVisuals missing or invalid"
      },
      { ok: config.mission.asteroidStorm.baseTarget >= 1, msg: "mission.asteroidStorm.baseTarget must be >= 1" },
      { ok: config.ufo.speedScaleMaxBonus >= 0, msg: "ufo.speedScaleMaxBonus must be >= 0" },
      { ok: Array.isArray(config.run.difficultyPresets) && config.run.difficultyPresets.length >= 1, msg: "run.difficultyPresets missing" },
      {
        ok:
          Number.isFinite(config.run?.bossRush?.finalSector) &&
          config.run.bossRush.finalSector >= 1 &&
          typeof config.run.bossRush.finalMissionType === "string" &&
          config.run.bossRush.finalMissionType.length > 0,
        msg: "run.bossRush config missing or invalid"
      },
      { ok: Array.isArray(config.mission?.mutators) && config.mission.mutators.length >= 1, msg: "mission.mutators missing" },
      { ok: Array.isArray(config.faction?.definitions) && config.faction.definitions.length >= 2, msg: "faction.definitions missing" },
      { ok: Number.isFinite(config.faction?.repMin) && Number.isFinite(config.faction?.repMax), msg: "faction reputation bounds missing" },
      { ok: Array.isArray(config.faction?.intelOptions) && config.faction.intelOptions.length >= 1, msg: "faction.intelOptions missing" },
      { ok: Number.isFinite(config.faction?.blackMarketPriceMul) && config.faction.blackMarketPriceMul >= 1, msg: "faction.blackMarketPriceMul invalid" },
      { ok: Array.isArray(config.faction?.repThresholds) && config.faction.repThresholds.length >= 1, msg: "faction.repThresholds missing" },
      { ok: Array.isArray(config.faction?.contrabandItemIds) && config.faction.contrabandItemIds.length >= 1, msg: "faction.contrabandItemIds missing" },
      { ok: Number.isFinite(config.faction?.contrabandDiscountMul) && config.faction.contrabandDiscountMul > 0, msg: "faction.contrabandDiscountMul invalid" },
      {
        ok:
          config.faction?.missionDirectives == null ||
          (typeof config.faction.missionDirectives === "object" && !Array.isArray(config.faction.missionDirectives)),
        msg: "faction.missionDirectives invalid"
      },
      {
        ok:
          config.faction?.lootIdentity == null ||
          (typeof config.faction.lootIdentity === "object" && !Array.isArray(config.faction.lootIdentity)),
        msg: "faction.lootIdentity invalid"
      },
      {
        ok:
          config.faction?.bountyBoardProfiles == null ||
          (typeof config.faction.bountyBoardProfiles === "object" && !Array.isArray(config.faction.bountyBoardProfiles)),
        msg: "faction.bountyBoardProfiles invalid"
      }
    ];
    const issues = checks.filter((check) => !check.ok).map((check) => check.msg);
    if (issues.length > 0) {
      console.warn("Balance validation issues:", issues);
    }
    return issues;
  }

  applyContentDataOverrides(GAME_CONFIG, CONTENT_DATA);
  const activePreset = resolvePresetName();
  const presetOverrides = BALANCE_PRESET_DATA[activePreset]?.overrides || {};
  const resolvedBalanceData = deepMerge(deepMerge({}, BALANCE_DATA), presetOverrides);
  applyBalanceOverrides(GAME_CONFIG, resolvedBalanceData);

  const ASTEROID_DEFS = {
    large: { radius: 56, score: 20, next: "medium" },
    medium: { radius: 34, score: 50, next: "small" },
    small: { radius: 20, score: 100, next: null }
  };

  const ASTEROID_TYPES = {
    normal: { scoreBonus: 0 },
    magnetic: { scoreBonus: 35 },
    volatile: { scoreBonus: 45 }
  };

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.APP_META = {
    version: buildVersion,
    channel: "NEW BUILD",
    preset: activePreset
  };
  window.Asteroids.GAME_STATE = GAME_STATE;
  window.Asteroids.GAME_CONFIG = GAME_CONFIG;
  window.Asteroids.validateGameConfig = validateGameConfig;
  window.Asteroids.ASTEROID_DEFS = ASTEROID_DEFS;
  window.Asteroids.ASTEROID_TYPES = ASTEROID_TYPES;
})();
