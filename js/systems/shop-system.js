(() => {
  class ShopSystem {
    constructor(game) {
      this.game = game;
    }

    handleShopInput() {
      const g = this.game;
      if (g.input.wasPressed("Digit1")) this.purchaseShopItem(0);
      if (g.input.wasPressed("Digit2")) this.purchaseShopItem(1);
      if (g.input.wasPressed("Digit3")) this.purchaseShopItem(2);
      if (g.input.wasPressed("Digit4")) this.cycleLoadoutSlot("secondary");
      if (g.input.wasPressed("Digit5")) this.cycleLoadoutSlot("utility");
      if (g.input.wasPressed("Digit6")) this.unlockLoadout("secondary", "rail_shot");
      if (g.input.wasPressed("Digit7")) this.unlockLoadout("secondary", "cluster_rockets");
      if (g.input.wasPressed("Digit8")) this.unlockLoadout("utility", "emp_pulse");
      if (g.input.wasPressed("Digit9")) this.unlockLoadout("utility", "shield_dome");
      if (g.input.wasPressed("Enter")) this.beginNextWaveFromShop();
    }

    beginNextWaveFromShop() {
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
      g.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    enterShopPhase() {
      const g = this.game;
      g.model.gameState = window.Asteroids.GAME_STATE.SHOP;
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
      g.model.shop.message = "Shop: 1-3 upgrade, 4/5 swap, 6-9 unlock, Enter start.";
    }

    purchaseShopItem(index) {
      const g = this.game;
      const item = g.config.shop.items[index];
      if (!item) return;

      if (g.model.credits < item.cost) {
        g.model.shop.message = "Nedostatek credits.";
        return;
      }

      if (item.id === "repair") {
        const ship = g.model.ship;
        const canRepairHull = ship && ship.hull < ship.hullMax;
        const canAddLife = g.model.lives < g.config.shop.maxLives;
        if (!canRepairHull && !canAddLife) {
          g.model.shop.message = "Mas plny hull i zivoty.";
          return;
        }
      }
      if (item.id === "fire_rate" && g.model.upgrades.fireRateLevel >= g.config.shop.maxFireRateLevel) {
        g.model.shop.message = "Fire rate je na maximu.";
        return;
      }
      if (item.id === "magazine" && g.model.upgrades.magazineLevel >= g.config.shop.maxMagazineLevel) {
        g.model.shop.message = "Magazine je na maximu.";
        return;
      }

      g.model.credits -= item.cost;
      if (item.id === "repair") {
        if (g.model.ship && g.model.ship.hull < g.model.ship.hullMax) {
          g.model.ship.hull = g.model.ship.hullMax;
          g.model.ship.shield = g.model.ship.shieldMax;
          g.model.shop.message = "Hull opraven na maximum.";
          return;
        }
        g.model.lives += 1;
      }
      if (item.id === "fire_rate") g.model.upgrades.fireRateLevel += 1;
      if (item.id === "magazine") g.model.upgrades.magazineLevel += 1;

      g.model.shop.message = `Nakoupeno: ${item.title}`;
    }

    cycleLoadoutSlot(slotName) {
      const g = this.game;
      const unlockedMap = g.model.unlocks[slotName];
      const currentIdKey = slotName === "secondary" ? "secondaryId" : "utilityId";
      const unlockedIds = Object.keys(unlockedMap).filter((id) => unlockedMap[id]);
      if (unlockedIds.length === 0) {
        g.model.shop.message = "Neni odemcena zadna varianta.";
        return;
      }

      const current = g.model.loadout[currentIdKey];
      const idx = unlockedIds.indexOf(current);
      const next = unlockedIds[(idx + 1 + unlockedIds.length) % unlockedIds.length];
      g.model.loadout[currentIdKey] = next;
      g.syncLoadoutLabels();
      const label = slotName === "secondary" ? g.model.loadout.secondaryLabel : g.model.loadout.utilityLabel;
      g.model.shop.message = `Aktivni ${slotName}: ${label}`;
    }

    unlockLoadout(slotName, loadoutId) {
      const g = this.game;
      const unlockSet = g.model.unlocks[slotName];
      if (!unlockSet || !(loadoutId in unlockSet)) return;

      if (unlockSet[loadoutId]) {
        g.model.shop.message = "Uz odemceno.";
        return;
      }

      const cost = g.config.shop.unlockCosts[loadoutId] ?? 0;
      if (g.model.credits < cost) {
        g.model.shop.message = "Nedostatek credits pro unlock.";
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
      g.model.shop.message = `Odemceno: ${label}`;
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.ShopSystem = ShopSystem;
})();
