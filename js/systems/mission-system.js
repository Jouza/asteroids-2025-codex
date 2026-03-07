(() => {
  class MissionSystem {
    constructor(game) {
      this.game = game;
    }

    chooseAsteroidTypeForWave(level) {
      const g = this.game;
      const roll = g.rng();
      if (level >= 3 && roll < 0.18) return "volatile";
      if (level >= 2 && roll < 0.38) return "magnetic";
      return "normal";
    }

    spawnAsteroidPack(level, largeCount, mediumCount = 0) {
      const g = this.game;
      const speedScale = 1 + (level - 1) * g.config.wave.speedScaleStep;

      for (let i = 0; i < largeCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForWave(level);
        g.model.asteroids.push(
          window.Asteroids.spawnAsteroidAwayFromShip(
            "large",
            speedScale,
            asteroidType,
            g.model,
            g.rng,
            g.config,
            g.asteroidDefs
          )
        );
      }

      for (let i = 0; i < mediumCount; i += 1) {
        const asteroidType = this.chooseAsteroidTypeForWave(level);
        g.model.asteroids.push(
          window.Asteroids.spawnAsteroidAwayFromShip(
            "medium",
            speedScale * 1.12,
            asteroidType,
            g.model,
            g.rng,
            g.config,
            g.asteroidDefs
          )
        );
      }
    }

    getMissionTypeByIndex(missionIndex) {
      const g = this.game;
      const order = g.config.mission.order;
      return order[(missionIndex - 1) % order.length];
    }

    startMission(missionIndex) {
      const g = this.game;
      const type = this.getMissionTypeByIndex(missionIndex);
      g.model.currentMission = {
        type,
        label: type.toUpperCase(),
        objectiveText: "",
        completed: false
      };
      g.model.missionTimer = 0;
      g.model.missionSpawnTimer = 0;
      g.model.missionSpawnBudget = 0;
      g.model.missionUfoKills = 0;
      g.model.missionAsteroidKills = 0;
      g.model.waveCompletionHandled = false;
      g.model.bullets = [];
      g.model.enemyBullets = [];
      g.model.ufos = [];
      g.model.asteroids = [];
      g.model.miniBoss = null;
      g.model.utilityEffects = [];

      const missionCfg = g.config.mission;
      const level = g.model.wave;

      if (type === "survive") {
        g.model.missionTimer =
          missionCfg.survive.baseDurationSeconds + (level - 1) * missionCfg.survive.durationStepSeconds;
        g.model.missionSpawnTimer = 0.1;
        g.enemySystem.scheduleNextUfoSpawn();
        g.model.currentMission.label = "SURVIVE";
        g.model.currentMission.objectiveText = `Hold for ${g.model.missionTimer.toFixed(0)}s`;
      }

      if (type === "ufo_hunt") {
        g.model.missionSpawnBudget =
          missionCfg.ufoHunt.baseKills + Math.floor((level - 1) / 2) * missionCfg.ufoHunt.killStep;
        g.model.missionSpawnTimer = 0.2;
        g.model.currentMission.label = "UFO HUNT";
        g.model.currentMission.objectiveText = `Destroy UFOs: 0/${g.model.missionSpawnBudget}`;
      }

      if (type === "asteroid_storm") {
        g.model.missionSpawnBudget =
          missionCfg.asteroidStorm.baseTarget + (level - 1) * missionCfg.asteroidStorm.targetStep;
        g.model.currentMission.label = "ASTEROID STORM";
        g.model.currentMission.objectiveText = `Break asteroids: 0/${g.model.missionSpawnBudget}`;
        this.spawnAsteroidPack(
          level,
          missionCfg.asteroidStorm.initialLargeCount,
          missionCfg.asteroidStorm.initialMediumCount
        );
        g.model.missionSpawnTimer = missionCfg.asteroidStorm.extraSpawnIntervalSeconds;
      }

      if (type === "mini_boss") {
        const hp = missionCfg.miniBoss.hpBase + (level - 1) * missionCfg.miniBoss.hpStep;
        g.model.currentMission.label = "MINI BOSS";
        g.model.currentMission.objectiveText = `Destroy boss (${hp} HP)`;
        g.enemySystem.spawnMiniBoss(hp);
        this.spawnAsteroidPack(level, 2, 2);
      }

      g.onMissionStarted();
    }

    updateMission(dt) {
      const g = this.game;
      if (g.model.gameState !== window.Asteroids.GAME_STATE.PLAYING || !g.model.currentMission) return;

      const mission = g.model.currentMission;
      const type = mission.type;
      const threatsRemaining =
        g.model.asteroids.length +
        g.model.ufos.length +
        g.model.enemyBullets.length +
        (g.model.miniBoss ? 1 : 0);

      if (mission.completed) {
        if (g.model.waveCompletionHandled) {
          g.model.waveTimerMs += dt * 1000;
          if (g.model.waveTimerMs >= g.config.wave.graceMs) {
            g.shopSystem.enterShopPhase();
          }
        }
        return;
      }

      if (type === "survive") {
        g.model.missionTimer = Math.max(0, g.model.missionTimer - dt);
        g.model.missionSpawnTimer -= dt;
        if (g.model.missionSpawnTimer <= 0 && g.model.missionTimer > 0) {
          this.spawnAsteroidPack(g.model.wave, 1, 0);
          g.model.missionSpawnTimer = g.config.mission.survive.asteroidSpawnIntervalSeconds;
        }
        g.enemySystem.maybeSpawnAmbientUfo(dt);
        mission.objectiveText = `Hold for ${g.model.missionTimer.toFixed(1)}s`;
        if (g.model.missionTimer <= 0 && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "ufo_hunt") {
        g.model.missionSpawnTimer -= dt;
        const target = g.model.missionSpawnBudget;
        const remainingKills = target - g.model.missionUfoKills;
        const desiredConcurrent = Math.min(g.config.mission.ufoHunt.maxConcurrentUfos, remainingKills);
        if (remainingKills > 0 && g.model.ufos.length < desiredConcurrent && g.model.missionSpawnTimer <= 0) {
          g.enemySystem.spawnMissionUfo();
          g.model.missionSpawnTimer = g.config.mission.ufoHunt.spawnIntervalSeconds;
        }
        mission.objectiveText = `Destroy UFOs: ${g.model.missionUfoKills}/${target}`;
        if (g.model.missionUfoKills >= target && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "asteroid_storm") {
        g.model.missionSpawnTimer -= dt;
        const target = g.model.missionSpawnBudget;
        if (g.model.missionAsteroidKills < target && g.model.missionSpawnTimer <= 0) {
          this.spawnAsteroidPack(g.model.wave, 1, g.rng() < 0.5 ? 1 : 0);
          g.model.missionSpawnTimer = g.config.mission.asteroidStorm.extraSpawnIntervalSeconds;
        }
        mission.objectiveText = `Break asteroids: ${g.model.missionAsteroidKills}/${target}`;
        if (g.model.missionAsteroidKills >= target && threatsRemaining === 0) mission.completed = true;
      }

      if (type === "mini_boss") {
        const boss = g.model.miniBoss;
        mission.objectiveText = boss
          ? `Destroy boss HP ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}`
          : "Destroy boss";
        if (!boss && threatsRemaining === 0) mission.completed = true;
      }

      if (mission.completed && !g.model.waveCompletionHandled) {
        g.onMissionCompleted();
        g.model.waveCompletionHandled = true;
        g.model.waveTimerMs = 0;
      }
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.MissionSystem = MissionSystem;
})();
