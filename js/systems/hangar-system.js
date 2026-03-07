(() => {
  class HangarSystem {
    constructor(game) {
      this.game = game;
    }

    handleHangarInput() {
      const g = this.game;
      if (g.input.wasPressed("Digit1")) this.purchaseHangarItem(0);
      if (g.input.wasPressed("Digit2")) this.purchaseHangarItem(1);
      if (g.input.wasPressed("Digit3")) this.purchaseHangarItem(2);
      if (g.input.wasPressed("Digit4")) this.cycleLoadoutSlot("secondary");
      if (g.input.wasPressed("Digit5")) this.cycleLoadoutSlot("utility");
      if (g.input.wasPressed("Digit6")) this.unlockLoadout("secondary", "rail_shot");
      if (g.input.wasPressed("Digit7")) this.unlockLoadout("secondary", "cluster_rockets");
      if (g.input.wasPressed("Digit8")) this.unlockLoadout("utility", "emp_pulse");
      if (g.input.wasPressed("Digit9")) this.unlockLoadout("utility", "shield_dome");
      if (g.input.wasPressed("Enter")) this.beginNextSectorFromHangar();
    }

    beginNextSectorFromHangar() {
      const g = this.game;
      if (g.model.ship) {
        g.model.ship.shield = g.model.ship.shieldMax;
        g.model.ship.energy = g.model.ship.energyMax;
        g.model.ship.heat = 0;
      }
      g.model.wave += 1;
      g.model.waveTimerMs = 0;
      g.model.waveCompletionHandled = false;
      g.model.gameState = window.Asteroids.GAME_STATE.PLAYING;
      g.missionSystem.startMission(g.model.wave);
      g.model.hangar.message = "Hangar: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    enterHangarPhase() {
      const g = this.game;
      g.model.gameState = window.Asteroids.GAME_STATE.HANGAR;
      g.model.waveCompletionHandled = true;
      g.model.waveTimerMs = 0;
      g.model.comboCount = 0;
      g.model.comboMultiplier = 1;
      g.model.comboTimer = 0;
      g.model.ufos = [];
      g.model.miniBoss = null;
      g.model.enemyBullets = [];
      g.model.bullets = [];
      g.model.utilityEffects = [];
      g.model.hangar.message = "Hangar: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    purchaseHangarItem(index) {
      const g = this.game;
      const item = g.config.hangar.items[index];
      if (!item) return;

      if (g.model.credits < item.cost) {
        g.model.hangar.message = "Nedostatek credits.";
        return;
      }

      if (item.id === "repair") {
        const ship = g.model.ship;
        const canRepairHullShield = ship && (ship.hull < ship.hullMax || ship.shield < ship.shieldMax);
        if (!canRepairHullShield) {
          g.model.hangar.message = "Hull i shield jsou plne.";
          return;
        }
      }
      if (item.id === "fire_rate" && g.model.upgrades.fireRateLevel >= g.config.hangar.maxFireRateLevel) {
        g.model.hangar.message = "Fire rate je na maximu.";
        return;
      }
      if (item.id === "magazine" && g.model.upgrades.magazineLevel >= g.config.hangar.maxMagazineLevel) {
        g.model.hangar.message = "Magazine je na maximu.";
        return;
      }

      g.model.credits -= item.cost;
      if (item.id === "repair") {
        if (
          g.model.ship &&
          (g.model.ship.hull < g.model.ship.hullMax || g.model.ship.shield < g.model.ship.shieldMax)
        ) {
          g.model.ship.hull = g.model.ship.hullMax;
          g.model.ship.shield = g.model.ship.shieldMax;
          g.model.hangar.message = "Hull i shield opraveny na maximum.";
          return;
        }
      }
      if (item.id === "fire_rate") g.model.upgrades.fireRateLevel += 1;
      if (item.id === "magazine") g.model.upgrades.magazineLevel += 1;

      g.model.hangar.message = `Nakoupeno: ${item.title}`;
    }

    cycleLoadoutSlot(slotName) {
      const g = this.game;
      const unlockedMap = g.model.unlocks[slotName];
      const currentIdKey = slotName === "secondary" ? "secondaryId" : "utilityId";
      const unlockedIds = Object.keys(unlockedMap).filter((id) => unlockedMap[id]);
      if (unlockedIds.length === 0) {
        g.model.hangar.message = "Neni odemcena zadna varianta.";
        return;
      }

      const current = g.model.loadout[currentIdKey];
      const idx = unlockedIds.indexOf(current);
      const next = unlockedIds[(idx + 1 + unlockedIds.length) % unlockedIds.length];
      g.model.loadout[currentIdKey] = next;
      g.syncLoadoutLabels();
      const label = slotName === "secondary" ? g.model.loadout.secondaryLabel : g.model.loadout.utilityLabel;
      g.model.hangar.message = `Aktivni ${slotName}: ${label}`;
    }

    unlockLoadout(slotName, loadoutId) {
      const g = this.game;
      const unlockSet = g.model.unlocks[slotName];
      if (!unlockSet || !(loadoutId in unlockSet)) return;

      if (unlockSet[loadoutId]) {
        g.model.hangar.message = "Uz odemceno.";
        return;
      }

      const cost = g.config.hangar.unlockCosts[loadoutId] ?? 0;
      if (g.model.credits < cost) {
        g.model.hangar.message = "Nedostatek credits pro unlock.";
        return;
      }

      g.model.credits -= cost;
      unlockSet[loadoutId] = true;

      if (slotName === "secondary") g.model.loadout.secondaryId = loadoutId;
      else g.model.loadout.utilityId = loadoutId;

      g.syncLoadoutLabels();
      const label =
        slotName === "secondary"
          ? g.config.loadout.secondary[loadoutId].label
          : g.config.loadout.utility[loadoutId].label;
      g.model.hangar.message = `Odemceno: ${label}`;
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.HangarSystem = HangarSystem;
})();
