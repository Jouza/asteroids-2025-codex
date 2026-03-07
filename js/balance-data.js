(() => {
  window.Asteroids = window.Asteroids || {};
  window.Asteroids.BALANCE_DATA = {
    economy: {
      creditsPerScore: 0.062,
      minCreditsPerKill: 1,
      moduleSellValueMultiplier: 1,
      salvageToCredits: 9
    },
    bullet: {
      maxActive: 3,
      sectorBonusEverySectors: 4,
      sectorBonusMax: 2
    },
    ufo: {
      speedScalePerSector: 0.022,
      speedScaleMaxBonus: 0.32,
      fireRateScalePerSector: 0.05,
      fireRateScaleMaxBonus: 0.7,
      bulletSpeedScalePerSector: 0.024,
      bulletSpeedScaleMaxBonus: 0.45
    },
    sector: {
      speedScaleStep: 0.11,
      splitScalePerSector: 0.09
    },
    mission: {
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
        extraSpawnIntervalSeconds: 5.1,
        minExtraSpawnIntervalSeconds: 2.2,
        spawnRateRampPerSector: 0.085,
        extraMediumChance: 0.32,
        mediumChanceRampPerSector: 0.03
      },
      miniBoss: {
        hpBase: 360,
        hpStep: 78,
        speed: 82,
        shootCooldownSeconds: 1.25,
        scoreReward: 840
      }
    }
  };
})();
