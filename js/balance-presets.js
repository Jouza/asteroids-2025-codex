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
    },
    dev_fasttrack: {
      label: "Dev Fasttrack",
      overrides: {
        mission: {
          survive: {
            baseDurationSeconds: 6,
            durationStepSeconds: 0.3,
            asteroidSpawnIntervalSeconds: 6.8,
            minSpawnIntervalSeconds: 4.2,
            spawnRateRampPerSector: 0.02
          },
          ufoHunt: {
            baseKills: 1,
            killStep: 0,
            maxConcurrentUfos: 1,
            maxConcurrentCap: 1,
            spawnIntervalSeconds: 5.2,
            minSpawnIntervalSeconds: 3.3,
            spawnRateRampPerSector: 0.03
          },
          asteroidStorm: {
            baseTarget: 2,
            targetStep: 0,
            initialLargeCount: 1,
            initialMediumCount: 0,
            extraSpawnIntervalSeconds: 9.4,
            minExtraSpawnIntervalSeconds: 6.2,
            spawnRateRampPerSector: 0.02,
            extraMediumChance: 0.1
          },
          miniBoss: {
            hpBase: 140,
            hpStep: 20
          }
        },
        sector: {
          graceMs: 260
        },
        ufo: {
          speedScalePerSector: 0.01,
          fireRateScalePerSector: 0.015,
          bulletSpeedScalePerSector: 0.01
        }
      }
    }
  };
})();
