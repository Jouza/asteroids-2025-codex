(() => {
  const GAME_STATE = {
    START: "start",
    PLAYING: "playing",
    SHOP: "shop",
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
      rotationSpeed: 2.5,
      rotationAcceleration: 30,
      rotationDamping: 0.86,
      thrust: 320,
      friction: 0.992,
      maxSpeed: 460,
      invulnerabilityMs: 1600,
      respawnSafetyPadding: 72,
      respawnMaxAttempts: 42
    },
    bullet: {
      maxActive: 6,
      speed: 560,
      ttlSeconds: 1.05,
      cooldownSeconds: 0.14,
      radius: 2,
      inheritVelocityFactor: 0.35
    },
    loadout: {
      primary: {
        auto_cannon: {
          label: "Auto",
          cooldownSeconds: 0.14
        }
      },
      secondary: {
        missile_burst: {
          kind: "burst",
          label: "Missiles",
          role: "General DPS",
          effectText: "2-shot burst",
          impactText: "Reliable hit pressure",
          cooldownSeconds: 2.7,
          projectileSpeed: 430,
          ttlSeconds: 1.35,
          radius: 4,
          spread: 0.16,
          count: 2
        },
        rail_shot: {
          kind: "rail",
          label: "Rail",
          role: "Precision",
          effectText: "High velocity pierce",
          impactText: "Pierces up to 4 targets",
          cooldownSeconds: 3.3,
          projectileSpeed: 760,
          ttlSeconds: 1.1,
          radius: 4,
          pierce: 4
        },
        cluster_rockets: {
          kind: "cluster",
          label: "Cluster",
          role: "Area control",
          effectText: "Wide 4-shot cone",
          impactText: "Best at close packs",
          cooldownSeconds: 4.2,
          projectileSpeed: 370,
          ttlSeconds: 1.45,
          radius: 4,
          spread: 0.42,
          count: 4
        }
      },
      utility: {
        pulse_bomb: {
          kind: "pulse",
          label: "Pulse",
          role: "Emergency clear",
          effectText: "AOE wave destruction",
          impactText: "Deletes nearby threats",
          cooldownSeconds: 8.5,
          pulseRadius: 210,
          flashMs: 240,
          particleCount: 30
        },
        emp_pulse: {
          kind: "emp",
          label: "EMP",
          role: "Control",
          effectText: "Disables UFO weapons",
          impactText: "Clears enemy bullets",
          cooldownSeconds: 11.5,
          disableSeconds: 6.5,
          flashMs: 210,
          particleCount: 24
        },
        shield_dome: {
          kind: "shield",
          label: "Shield",
          role: "Survival",
          effectText: "Temporary invulnerability",
          impactText: "Great for risky positioning",
          cooldownSeconds: 13,
          shieldSeconds: 4.25,
          flashMs: 180,
          particleCount: 20
        }
      }
    },
    enemyBullet: {
      speed: 230,
      ttlSeconds: 2.4,
      radius: 3,
      cooldownHunterSeconds: 1.25,
      cooldownSniperSeconds: 1.9,
      spreadHunter: 0.3,
      spreadSniper: 0.07
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
      nearMissBonus: 15,
      nearMissDistance: 48,
      nearMissCooldownSeconds: 1.35
    },
    economy: {
      creditsPerScore: 0.075,
      minCreditsPerKill: 1
    },
    shop: {
      items: [
        {
          id: "repair",
          title: "Repair Hull (+1 life)",
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
      maxLives: 6,
      maxFireRateLevel: 8,
      maxMagazineLevel: 6,
      fireRateFactorPerLevel: 0.91,
      unlockCosts: {
        rail_shot: 220,
        cluster_rockets: 250,
        emp_pulse: 260,
        shield_dome: 280
      }
    },
    ufo: {
      spawnDelayMinSeconds: 16,
      spawnDelayMaxSeconds: 28,
      speedHunter: 88,
      speedSniper: 72,
      radius: 20,
      scoreHunter: 220,
      scoreSniper: 320,
      desiredSniperDistance: 260
    },
    wave: {
      baseAsteroids: 4,
      graceMs: 1100,
      speedScaleStep: 0.11,
      splitScalePerWave: 0.09
    },
    mission: {
      order: ["survive", "ufo_hunt", "asteroid_storm", "mini_boss"],
      survive: {
        baseDurationSeconds: 24,
        durationStepSeconds: 2.4,
        asteroidSpawnIntervalSeconds: 2.2
      },
      ufoHunt: {
        baseKills: 3,
        killStep: 1,
        maxConcurrentUfos: 2,
        spawnIntervalSeconds: 2.6
      },
      asteroidStorm: {
        baseTarget: 16,
        targetStep: 3,
        initialLargeCount: 6,
        initialMediumCount: 6,
        extraSpawnIntervalSeconds: 3.8
      },
      miniBoss: {
        hpBase: 460,
        hpStep: 80,
        radius: 34,
        speed: 82,
        shootCooldownSeconds: 1.05,
        scoreReward: 950
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
  window.Asteroids.GAME_STATE = GAME_STATE;
  window.Asteroids.GAME_CONFIG = GAME_CONFIG;
  window.Asteroids.ASTEROID_DEFS = ASTEROID_DEFS;
  window.Asteroids.ASTEROID_TYPES = ASTEROID_TYPES;
})();
