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
      ]
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
      }
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
          weight: 0.176,
          factionId: "helix_union",
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
          weight: 0.16,
          factionId: "drift_cartel",
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
          weight: 0.16,
          factionId: "helix_union",
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
          weight: 0.112,
          factionId: "drift_cartel",
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
          weight: 0.096,
          factionId: "drift_cartel",
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
          weight: 0.096,
          factionId: "helix_union",
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
        },
        {
          id: "neon_nebula",
          label: "Neon Nebula",
          weight: 0.1,
          factionId: "drift_cartel",
          audio: {
            warningSoundId: "warning_neon_nebula",
            stinger: { a: 280, b: 460, c: 700 }
          },
          miniEvent: {
            id: "neon_flux",
            energy: 14,
            cooldownDelta: -0.7
          },
          hazards: {
            type: "neon_arc_field",
            minCount: 1,
            maxCount: 2,
            radiusMin: 88,
            radiusMax: 126,
            tickSeconds: 0.45,
            tickDamage: 8,
            energyDrainPerSecond: 9,
            cooldownPressurePerSecond: 0.52
          }
        },
        {
          id: "dust_expanse",
          label: "Dust Expanse",
          weight: 0.1,
          factionId: "helix_union",
          audio: {
            warningSoundId: "warning_dust_expanse",
            stinger: { a: 160, b: 220, c: 300 }
          },
          miniEvent: {
            id: "salvage_drift",
            salvageParts: 2,
            credits: 10
          },
          hazards: {
            type: "dust_squall",
            minCount: 2,
            maxCount: 3,
            radiusMin: 92,
            radiusMax: 132,
            tickSeconds: 0.7,
            tickDamage: 9,
            slowMul: 0.98,
            accuracyDragMul: 0.985
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
