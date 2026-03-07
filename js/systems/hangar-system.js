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
      if (g.input.wasPressed("Digit6")) this.changeSelection(-1);
      if (g.input.wasPressed("Digit7")) this.changeSelection(1);
      if (g.input.wasPressed("Digit8")) this.takeOrEquipSelected();
      if (g.input.wasPressed("Digit9")) this.sellSelected();
      if (g.input.wasPressed("Digit0")) this.salvageSelected();
      if (g.input.wasPressed("Enter")) this.beginNextSectorFromHangar();
    }

    beginNextSectorFromHangar() {
      const g = this.game;
      if (g.model.ship) {
        g.model.ship.shield = g.model.ship.shieldMax;
        g.model.ship.energy = g.model.ship.energyMax;
        g.model.ship.heat = 0;
      }
      g.model.sector += 1;
      g.model.sectorTimerMs = 0;
      g.model.sectorCompletionHandled = false;
      g.model.gameState = window.Asteroids.GAME_STATE.PLAYING;
      g.missionSystem.startMission(g.model.sector);
      g.model.hangar.message = "Hangar: 1-3 upgrade, 4/5 swap, 6/7 select, 8 take/equip, 9 sell, 0 salvage, Enter start.";
    }

    enterHangarPhase() {
      const g = this.game;
      g.model.gameState = window.Asteroids.GAME_STATE.HANGAR;
      g.model.sectorCompletionHandled = true;
      g.model.sectorTimerMs = 0;
      g.model.comboCount = 0;
      g.model.comboMultiplier = 1;
      g.model.comboTimer = 0;
      g.model.ufos = [];
      g.model.miniBoss = null;
      g.model.enemyBullets = [];
      g.model.bullets = [];
      g.model.utilityEffects = [];
      g.model.hangar.message = "Hangar: 1-3 upgrade, 4/5 swap, 6/7 select, 8 take/equip, 9 sell, 0 salvage, Enter start.";
      this.clampSelection();
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

    getSelectedEntry() {
      const g = this.game;
      const h = g.model.hangar;
      if (h.selectionSource === "inventory") {
        const item = g.model.inventory[h.selectionIndex];
        if (!item) return null;
        return { source: "inventory", item, index: h.selectionIndex };
      }
      const item = h.lootCrate[h.selectionIndex];
      if (!item) return null;
      return { source: "crate", item, index: h.selectionIndex };
    }

    clampSelection() {
      const g = this.game;
      const h = g.model.hangar;
      const crateLen = h.lootCrate.length;
      const invLen = g.model.inventory.length;

      if (h.selectionSource === "crate" && crateLen === 0 && invLen > 0) {
        h.selectionSource = "inventory";
        h.selectionIndex = 0;
      } else if (h.selectionSource === "inventory" && invLen === 0 && crateLen > 0) {
        h.selectionSource = "crate";
        h.selectionIndex = 0;
      }

      const len = h.selectionSource === "inventory" ? invLen : crateLen;
      if (len <= 0) {
        h.selectionIndex = 0;
        return;
      }
      if (h.selectionIndex < 0) h.selectionIndex = len - 1;
      if (h.selectionIndex >= len) h.selectionIndex = 0;
    }

    changeSelection(step) {
      const g = this.game;
      const h = g.model.hangar;
      const crateLen = h.lootCrate.length;
      const invLen = g.model.inventory.length;
      if (crateLen <= 0 && invLen <= 0) {
        g.model.hangar.message = "Neni co vybirat.";
        return;
      }

      const source = h.selectionSource;
      if (source === "crate" && crateLen > 0) {
        const nextIndex = h.selectionIndex + step;
        if (nextIndex >= crateLen && invLen > 0) {
          h.selectionSource = "inventory";
          h.selectionIndex = 0;
        } else if (nextIndex < 0 && invLen > 0) {
          h.selectionSource = "inventory";
          h.selectionIndex = invLen - 1;
        } else {
          h.selectionIndex = nextIndex;
        }
      } else if (source === "inventory" && invLen > 0) {
        const nextIndex = h.selectionIndex + step;
        if (nextIndex >= invLen && crateLen > 0) {
          h.selectionSource = "crate";
          h.selectionIndex = 0;
        } else if (nextIndex < 0 && crateLen > 0) {
          h.selectionSource = "crate";
          h.selectionIndex = crateLen - 1;
        } else {
          h.selectionIndex = nextIndex;
        }
      }

      this.clampSelection();
      const selected = this.getSelectedEntry();
      if (selected) {
        h.message = `${selected.source === "crate" ? "Crate" : "Inventory"}: ${selected.item.name}`;
      }
    }

    takeOrEquipSelected() {
      const g = this.game;
      const entry = this.getSelectedEntry();
      if (!entry) {
        g.model.hangar.message = "Neni vybrany modul.";
        return;
      }

      if (entry.source === "crate") {
        if (g.model.inventory.length >= g.config.loot.maxInventoryItems) {
          g.model.hangar.message = "Inventory je plny. Prodej nebo salvage.";
          return;
        }
        g.model.hangar.lootCrate.splice(entry.index, 1);
        g.model.inventory.push(entry.item);
        g.model.hangar.selectionSource = "inventory";
        g.model.hangar.selectionIndex = g.model.inventory.length - 1;
        this.clampSelection();
        g.model.hangar.message = `Vzato do inventory: ${entry.item.name}`;
        return;
      }

      const module = entry.item;
      const slot = module.slot;
      const previous = g.model.equipment[slot];
      g.model.equipment[slot] = module;
      g.model.inventory.splice(entry.index, 1);
      if (previous) g.model.inventory.push(previous);
      g.refreshSetState();
      g.initializeShipResources(g.model.ship);
      this.clampSelection();
      g.model.hangar.message = `Equip ${slot}: ${module.name}`;
    }

    removeEntry(entry) {
      const g = this.game;
      if (!entry) return null;
      if (entry.source === "crate") {
        return g.model.hangar.lootCrate.splice(entry.index, 1)[0] ?? null;
      }
      return g.model.inventory.splice(entry.index, 1)[0] ?? null;
    }

    sellSelected() {
      const g = this.game;
      const entry = this.getSelectedEntry();
      if (!entry) {
        g.model.hangar.message = "Neni vybrany modul.";
        return;
      }
      const removed = this.removeEntry(entry);
      if (!removed) return;
      const gain = removed.sellValue ?? 0;
      g.model.credits += gain;
      this.clampSelection();
      g.model.hangar.message = `Prodano: ${removed.name} (+${gain} cr)`;
    }

    salvageSelected() {
      const g = this.game;
      const entry = this.getSelectedEntry();
      if (!entry) {
        g.model.hangar.message = "Neni vybrany modul.";
        return;
      }
      const removed = this.removeEntry(entry);
      if (!removed) return;
      const modifiers = g.getModuleModifiers();
      const parts = Math.max(1, Math.round((removed.salvageValue ?? 0) * (1 + (modifiers.salvageYieldPct ?? 0))));
      g.model.salvageParts += parts;
      g.model.credits += parts * g.config.economy.salvageToCredits;
      this.clampSelection();
      g.model.hangar.message = `Rozebrano: ${removed.name} (+${parts} parts)`;
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

  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.HangarSystem = HangarSystem;
})();
