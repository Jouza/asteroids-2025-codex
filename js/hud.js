(() => {
  const { APP_META, GAME_STATE } = window.Asteroids;

  const STATE_LABELS = {
    [GAME_STATE.START]: "START",
    [GAME_STATE.PLAYING]: "PLAYING",
    [GAME_STATE.HANGAR]: "HANGAR",
    [GAME_STATE.PAUSED]: "PAUSED",
    [GAME_STATE.GAME_OVER]: "GAME OVER"
  };

  class Hud {
    constructor() {
      this.scoreEl = document.getElementById("score");
      this.creditsEl = document.getElementById("credits");
      this.hullShieldEl = document.getElementById("hullShield");
      this.energyHeatEl = document.getElementById("energyHeat");
      this.sectorEl = document.getElementById("sector");
      this.missionEl = document.getElementById("mission");
      this.setStatusEl = document.getElementById("setStatus");
      this.flightModeEl = document.getElementById("flightMode");
      this.primaryStatusEl = document.getElementById("primaryStatus");
      this.secondaryStatusEl = document.getElementById("secondaryStatus");
      this.utilityStatusEl = document.getElementById("utilityStatus");
      this.versionBadgeEl = document.getElementById("versionBadge");
      this.stateEl = document.getElementById("stateLabel");

      if (this.versionBadgeEl) {
        const presetSuffix = APP_META.preset && APP_META.preset !== "baseline" ? ` [${APP_META.preset}]` : "";
        this.versionBadgeEl.textContent = `${APP_META.channel} ${APP_META.version}${presetSuffix}`;
      }
    }

    formatCooldown(seconds) {
      return seconds <= 0 ? "Ready" : `${seconds.toFixed(1)}s`;
    }

    formatUrgentCooldown(seconds) {
      if (seconds <= 0) return "Ready";
      if (seconds <= 1.2) return `${seconds.toFixed(1)}s!`;
      return `${seconds.toFixed(1)}s`;
    }

    setHudItemState(element, state = "normal") {
      if (!element) return;
      const host = element.closest(".hud-item");
      if (!host) return;
      host.classList.remove("is-warn", "is-danger", "is-ready");
      if (state === "warn") host.classList.add("is-warn");
      if (state === "danger") host.classList.add("is-danger");
      if (state === "ready") host.classList.add("is-ready");
    }

    truncate(value, maxLen = 22) {
      if (!value) return "-";
      return value.length > maxLen ? `${value.slice(0, maxLen - 3)}...` : value;
    }

    sync(model) {
      const ship = model.ship;
      const hull = ship ? `${Math.ceil(ship.hull)}/${ship.hullMax}` : "-/-";
      const shield = ship ? `${Math.ceil(ship.shield)}/${ship.shieldMax}` : "-/-";
      const energy = ship ? `${Math.ceil(ship.energy)}/${ship.energyMax}` : "-/-";
      const heat = ship ? `${Math.ceil(ship.heat)}/${ship.heatMax}` : "-/-";
      const alerts = model.uiAlerts || {};

      this.scoreEl.textContent = String(model.score);
      this.creditsEl.textContent = String(model.credits);
      this.hullShieldEl.textContent = `${hull}|${shield}`;
      this.energyHeatEl.textContent = `${energy}|${heat}`;
      this.sectorEl.textContent = String(model.sector);
      this.missionEl.textContent = this.truncate(model.currentMission?.label || "-", 14);
      this.setStatusEl.textContent = this.truncate(model.setStatusText || "No active set", 24);
      this.flightModeEl.textContent = model.flightModel === "sim_lite" ? "SIM LITE" : "ARCADE";
      this.primaryStatusEl.textContent = `${model.loadout.primaryLabel} D:${this.formatUrgentCooldown(model.dashCooldown)}`;
      this.secondaryStatusEl.textContent = `${model.loadout.secondaryLabel} ${this.formatUrgentCooldown(model.secondaryCooldown)}`;
      this.utilityStatusEl.textContent = `${model.loadout.utilityLabel} ${this.formatUrgentCooldown(model.utilityCooldown)}`;
      this.stateEl.textContent = STATE_LABELS[model.gameState] || "UNKNOWN";

      this.setHudItemState(
        this.hullShieldEl,
        alerts.lowHull ? "danger" : alerts.shieldBroken ? "warn" : "normal"
      );
      this.setHudItemState(this.energyHeatEl, alerts.highHeat ? "danger" : alerts.lowEnergy ? "warn" : "normal");
      this.setHudItemState(this.primaryStatusEl, alerts.dashReady ? "ready" : model.dashCooldown <= 1.2 ? "warn" : "normal");
      this.setHudItemState(
        this.secondaryStatusEl,
        alerts.secondaryReady ? "ready" : model.secondaryCooldown <= 1.2 ? "warn" : "normal"
      );
      this.setHudItemState(
        this.utilityStatusEl,
        alerts.utilityReady ? "ready" : model.utilityCooldown <= 1.2 ? "warn" : "normal"
      );
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Hud = Hud;
})();
