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
        this.versionBadgeEl.textContent = `${APP_META.channel} ${APP_META.version}`;
      }
    }

    formatCooldown(seconds) {
      return seconds <= 0 ? "Ready" : `${seconds.toFixed(1)}s`;
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

      this.scoreEl.textContent = String(model.score);
      this.creditsEl.textContent = String(model.credits);
      this.hullShieldEl.textContent = `${hull}|${shield}`;
      this.energyHeatEl.textContent = `${energy}|${heat}`;
      this.sectorEl.textContent = String(model.sector);
      this.missionEl.textContent = this.truncate(model.currentMission?.label || "-", 14);
      this.setStatusEl.textContent = this.truncate(model.setStatusText || "No active set", 24);
      this.flightModeEl.textContent = model.flightModel === "sim_lite" ? "SIM LITE" : "ARCADE";
      this.primaryStatusEl.textContent = `${model.loadout.primaryLabel} D:${this.formatCooldown(model.dashCooldown)}`;
      this.secondaryStatusEl.textContent = `${model.loadout.secondaryLabel} ${this.formatCooldown(model.secondaryCooldown)}`;
      this.utilityStatusEl.textContent = `${model.loadout.utilityLabel} ${this.formatCooldown(model.utilityCooldown)}`;
      this.stateEl.textContent = STATE_LABELS[model.gameState] || "UNKNOWN";
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Hud = Hud;
})();
