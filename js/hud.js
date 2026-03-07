(() => {
  const { GAME_STATE } = window.Asteroids;

  const STATE_LABELS = {
    [GAME_STATE.START]: "START",
    [GAME_STATE.PLAYING]: "PLAYING",
    [GAME_STATE.SHOP]: "SHOP",
    [GAME_STATE.PAUSED]: "PAUSED",
    [GAME_STATE.GAME_OVER]: "GAME OVER"
  };

  class Hud {
    constructor() {
      this.scoreEl = document.getElementById("score");
      this.creditsEl = document.getElementById("credits");
      this.comboEl = document.getElementById("combo");
      this.livesEl = document.getElementById("lives");
      this.waveEl = document.getElementById("wave");
      this.missionEl = document.getElementById("mission");
      this.primaryStatusEl = document.getElementById("primaryStatus");
      this.secondaryStatusEl = document.getElementById("secondaryStatus");
      this.utilityStatusEl = document.getElementById("utilityStatus");
      this.stateEl = document.getElementById("stateLabel");
    }

    formatCooldown(seconds) {
      return seconds <= 0 ? "Ready" : `${seconds.toFixed(1)}s`;
    }

    sync(model) {
      this.scoreEl.textContent = String(model.score);
      this.creditsEl.textContent = String(model.credits);
      this.comboEl.textContent = `x${model.comboMultiplier.toFixed(2)}`;
      this.livesEl.textContent = String(model.lives);
      this.waveEl.textContent = String(model.wave);
      this.missionEl.textContent = model.currentMission?.label || "-";
      this.primaryStatusEl.textContent = `Space ${model.loadout.primaryLabel}`;
      this.secondaryStatusEl.textContent = `X ${model.loadout.secondaryLabel}: ${this.formatCooldown(
        model.secondaryCooldown
      )}`;
      this.utilityStatusEl.textContent = `C ${model.loadout.utilityLabel}: ${this.formatCooldown(
        model.utilityCooldown
      )}`;
      this.stateEl.textContent = STATE_LABELS[model.gameState] || "UNKNOWN";
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Hud = Hud;
})();
