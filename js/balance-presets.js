(() => {
  window.Asteroids = window.Asteroids || {};
  window.Asteroids.BALANCE_PRESET_DATA = {
    baseline: {
      label: "Baseline",
      overrides: {}
    },
    arcade_fast: {
      label: "Arcade Fast",
      overrides: {
        mission: {
          survive: { baseDurationSeconds: 15, asteroidSpawnIntervalSeconds: 2.9 },
          ufoHunt: { spawnIntervalSeconds: 3.2 },
          asteroidStorm: { extraSpawnIntervalSeconds: 4.4 }
        },
        ufo: {
          speedScalePerSector: 0.028,
          fireRateScalePerSector: 0.06
        },
        bullet: {
          maxActive: 4
        }
      }
    },
    survival_hard: {
      label: "Survival Hard",
      overrides: {
        mission: {
          survive: { baseDurationSeconds: 21, asteroidSpawnIntervalSeconds: 2.7 },
          ufoHunt: { baseKills: 2, maxConcurrentCap: 4 },
          asteroidStorm: { baseTarget: 12 }
        },
        ufo: {
          speedScalePerSector: 0.03,
          bulletSpeedScalePerSector: 0.03
        },
        economy: {
          creditsPerScore: 0.055
        }
      }
    }
  };
})();
