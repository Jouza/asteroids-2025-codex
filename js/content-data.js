(() => {
  window.Asteroids = window.Asteroids || {};
  window.Asteroids.CONTENT_DATA = {
    faction: {
      definitions: [
        {
          id: "helix_union",
          color: "#73d5ff",
          shopBias: "precision"
        },
        {
          id: "drift_cartel",
          color: "#ff9a66",
          shopBias: "scrap"
        }
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
      missionDirectives: {
        helix_union: {
          byMission: {
            ufo_hunt: {
              id: "helix_sweep",
              labelKey: "mission.directive.helix_sweep",
              objectiveMul: 1.14,
              spawnIntervalMul: 0.95
            },
            asteroid_storm: {
              id: "helix_route_secure",
              labelKey: "mission.directive.helix_route_secure",
              objectiveMul: 0.9,
              spawnIntervalMul: 1.08
            }
          }
        },
        drift_cartel: {
          byMission: {
            ufo_hunt: {
              id: "drift_hunt_quiet",
              labelKey: "mission.directive.drift_hunt_quiet",
              objectiveMul: 0.9,
              spawnIntervalMul: 1.08
            },
            asteroid_storm: {
              id: "drift_scrap_quota",
              labelKey: "mission.directive.drift_scrap_quota",
              objectiveMul: 1.14,
              spawnIntervalMul: 0.95
            }
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
      ]
    },
    mission: {
      order: ["survive", "ufo_hunt", "asteroid_storm", "mini_boss"]
    },
    missionDirector: {
      pacingBySector: [
        { maxSector: 2, difficulty: 0.86 },
        { maxSector: 4, difficulty: 1.0 },
        { maxSector: 7, difficulty: 1.18 },
        { maxSector: 999, difficulty: 1.34 }
      ],
      biomes: [
        {
          id: "belt",
          label: "Belt Fringe",
          weight: 0.3,
          factionId: "helix_union"
        },
        {
          id: "graveyard",
          label: "Wreck Graveyard",
          weight: 0.28,
          factionId: "drift_cartel",
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
          weight: 0.24,
          factionId: "helix_union",
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
          weight: 0.18,
          factionId: "drift_cartel"
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
          pullStrength: 19500,
          radius: 300
        },
        clear_skies: {
          label: "Clear Skies",
          description: "No global mission hazard.",
          weight: 0.29,
          unlockSector: 1
        }
      }
    },
    ufo: {
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
      }
    },
    loot: {
      dropChance: {
        asteroid: {
          large: 0.14,
          medium: 0.08,
          small: 0.04
        },
        ufo: {
          hunter: 0.24,
          sniper: 0.3,
          swarm: 0.22,
          kamikaze: 0.2,
          support: 0.28,
          mine_layer: 0.3
        },
        miniBoss: 1
      }
    }
  };
})();
