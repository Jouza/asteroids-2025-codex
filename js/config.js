(() => {
  const buildVersion = window.Asteroids?.APP_BUILD_META?.version || "UNKNOWN";
  const GAME_STATE = {
    START: "start",
    PLAYING: "playing",
    HANGAR: "hangar",
    PAUSED: "paused",
    GAME_OVER: "game_over"
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
      dash: {
        cooldownSeconds: 1.1,
        impulse: 360,
        energyCost: 28,
        heatGain: 15,
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
          label: "Auto",
          cooldownSeconds: 0.165,
          energyCost: 3.4,
          heatGain: 4.8
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
          energyCost: 18,
          heatGain: 14
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
          energyCost: 24,
          heatGain: 20
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
          energyCost: 28,
          heatGain: 24
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
          energyCost: 38,
          heatGain: 20
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
          energyCost: 34,
          heatGain: 18
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
          energyCost: 30,
          heatGain: 14
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
        asteroid_collision: { damageType: "collision", baseDamage: 34, critChance: 0.0 },
        ufo_collision: { damageType: "collision", baseDamage: 30, critChance: 0.0 },
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
      speedHunter: 88,
      speedSniper: 72,
      speedScalePerSector: 0.022,
      speedScaleMaxBonus: 0.32,
      fireRateScalePerSector: 0.05,
      fireRateScaleMaxBonus: 0.7,
      bulletSpeedScalePerSector: 0.024,
      bulletSpeedScaleMaxBonus: 0.45,
      radius: 20,
      scoreHunter: 220,
      scoreSniper: 320,
      desiredSniperDistance: 260
    },
    sector: {
      baseAsteroids: 4,
      graceMs: 1100,
      speedScaleStep: 0.11,
      splitScalePerSector: 0.09
    },
    mission: {
      order: ["survive", "ufo_hunt", "asteroid_storm", "mini_boss"],
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
        shootCooldownSeconds: 1.25,
        scoreReward: 840
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
      }
    },
    simulation: {
      fixedStepSeconds: 1 / 120,
      maxFrameDeltaSeconds: 0.25,
      maxStepCount: 8
    }
  };

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
    channel: "NEW BUILD"
  };
  window.Asteroids.GAME_STATE = GAME_STATE;
  window.Asteroids.GAME_CONFIG = GAME_CONFIG;
  window.Asteroids.ASTEROID_DEFS = ASTEROID_DEFS;
  window.Asteroids.ASTEROID_TYPES = ASTEROID_TYPES;
})();
