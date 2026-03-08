(() => {
  const { APP_META, GAME_STATE } = window.Asteroids;
  const tr = (key, params = {}) => {
    if (typeof window.Asteroids?.t === "function") return window.Asteroids.t(key, params);
    const dict = window.Asteroids?.i18n?.dictionaries?.en || {};
    const template = dict[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, p) => (params[p] != null ? String(params[p]) : `{${p}}`));
  };

  const stateLabelKeyByState = {
    [GAME_STATE.START]: "state.start",
    [GAME_STATE.PLAYING]: "state.playing",
    [GAME_STATE.HANGAR]: "state.hangar",
    [GAME_STATE.PAUSED]: "state.paused",
    [GAME_STATE.GAME_OVER]: "state.game_over",
    [GAME_STATE.VICTORY]: "state.victory"
  };

  class Hud {
    constructor() {
      this.scoreEl = document.getElementById("score");
      this.creditsEl = document.getElementById("credits");
      this.hullValueEl = document.getElementById("hullValue");
      this.shieldValueEl = document.getElementById("shieldValue");
      this.energyValueEl = document.getElementById("energyValue");
      this.heatValueEl = document.getElementById("heatValue");
      this.hullBarEl = document.getElementById("hullBar");
      this.shieldBarEl = document.getElementById("shieldBar");
      this.energyBarEl = document.getElementById("energyBar");
      this.heatBarEl = document.getElementById("heatBar");
      this.sectorEl = document.getElementById("sector");
      this.missionEl = document.getElementById("mission");
      this.setStatusEl = document.getElementById("setStatus");
      this.identityStatusEl = document.getElementById("identityStatus");
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
      return seconds <= 0 ? tr("hud.ready") : `${seconds.toFixed(1)}s`;
    }

    formatUrgentCooldown(seconds) {
      if (seconds <= 0) return tr("hud.ready");
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

    updateGauge(valueEl, barEl, current, max) {
      const safeMax = Math.max(1, Number(max) || 1);
      const safeCurrent = Math.max(0, Number(current) || 0);
      const pct = Math.max(0, Math.min(1, safeCurrent / safeMax));
      if (valueEl) valueEl.textContent = `${Math.ceil(safeCurrent)}/${Math.ceil(safeMax)}`;
      if (barEl) barEl.style.width = `${(pct * 100).toFixed(1)}%`;
    }

    sync(model) {
      const ship = model.ship;
      const alerts = model.uiAlerts || {};
      const hull = ship ? ship.hull : 0;
      const hullMax = ship ? ship.hullMax : 1;
      const shield = ship ? ship.shield : 0;
      const shieldMax = ship ? ship.shieldMax : 1;
      const energy = ship ? ship.energy : 0;
      const energyMax = ship ? ship.energyMax : 1;
      const heat = ship ? ship.heat : 0;
      const heatMax = ship ? ship.heatMax : 1;

      this.scoreEl.textContent = String(model.score);
      this.creditsEl.textContent = String(model.credits);
      this.updateGauge(this.hullValueEl, this.hullBarEl, hull, hullMax);
      this.updateGauge(this.shieldValueEl, this.shieldBarEl, shield, shieldMax);
      this.updateGauge(this.energyValueEl, this.energyBarEl, energy, energyMax);
      this.updateGauge(this.heatValueEl, this.heatBarEl, heat, heatMax);
      this.sectorEl.textContent = String(model.sector);
      this.missionEl.textContent = this.truncate(model.currentMission?.label || "-", 14);
      this.setStatusEl.textContent = this.truncate(model.setStatusText || tr("hud.no_active_set"), 24);
      if (this.identityStatusEl) {
        this.identityStatusEl.textContent = this.truncate(model.identityStatusText || tr("hud.identity_unknown"), 28);
      }
      this.flightModeEl.textContent = model.flightModel === "sim_lite" ? tr("hud.flight_sim_lite") : tr("hud.flight_arcade");
      this.primaryStatusEl.textContent = `${model.loadout.primaryLabel} D:${this.formatUrgentCooldown(model.dashCooldown)}`;
      this.secondaryStatusEl.textContent = `${model.loadout.secondaryLabel} ${this.formatUrgentCooldown(model.secondaryCooldown)}`;
      this.utilityStatusEl.textContent = `${model.loadout.utilityLabel} ${this.formatUrgentCooldown(model.utilityCooldown)}`;
      const stateKey = stateLabelKeyByState[model.gameState];
      this.stateEl.textContent = stateKey ? tr(stateKey) : tr("hud.unknown");

      this.setHudItemState(
        this.hullValueEl,
        alerts.lowHull ? "danger" : "normal"
      );
      this.setHudItemState(this.shieldValueEl, alerts.shieldBroken ? "warn" : "normal");
      this.setHudItemState(this.energyValueEl, alerts.lowEnergy ? "warn" : "normal");
      this.setHudItemState(this.heatValueEl, alerts.highHeat ? "danger" : "normal");
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
