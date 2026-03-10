(() => {
  function tr(key, params = {}) {
    if (typeof window.Asteroids?.t === "function") return window.Asteroids.t(key, params);
    const dict = window.Asteroids?.i18n?.dictionaries?.en || {};
    const template = dict[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, p) => (params[p] != null ? String(params[p]) : `{${p}}`));
  }

  class HangarSystem {
    constructor(game) {
      this.game = game;
      this.navSections = ["shop", "loot"];
    }

    getShopItems() {
      const g = this.game;
      const fallback = Array.isArray(g.config.hangar.items) ? g.config.hangar.items : [];
      if (typeof g.getHangarShopItems === "function") {
        const resolved = g.getHangarShopItems();
        if (Array.isArray(resolved) && resolved.length > 0) return resolved;
      }
      return fallback;
    }

    refreshShopOffers() {
      const g = this.game;
      g.model.hangar.shopItems = this.getShopItems().map((item) => ({
        id: item.id,
        title: item.title,
        cost: item.cost,
        resolvedCost: item.resolvedCost ?? item.cost,
        isContraband: Boolean(item.isContraband)
      }));
    }

    getShopActionCount() {
      const offers = this.game.model.hangar.shopItems;
      const offerCount = Array.isArray(offers) && offers.length > 0 ? offers.length : this.getShopItems().length;
      return offerCount + 9;
    }

    handleHangarInput() {
      const g = this.game;
      this.ensureNavState();
      if (g.input.wasPressed("ArrowLeft")) this.changeNavSection(-1);
      if (g.input.wasPressed("ArrowRight")) this.changeNavSection(1);
      if (g.input.wasPressed("ArrowUp")) this.moveNavCursor(-1);
      if (g.input.wasPressed("ArrowDown")) this.moveNavCursor(1);
      if (g.input.wasPressed("Space")) this.activateNavSelection();
      if (g.input.wasPressed("Digit1")) this.purchaseHangarItem(0);
      if (g.input.wasPressed("Digit2")) this.purchaseHangarItem(1);
      if (g.input.wasPressed("Digit3")) this.purchaseHangarItem(2);
      if (g.input.wasPressed("Digit4")) this.cycleLoadoutSlot("primary");
      if (g.input.wasPressed("Digit5")) this.cycleLoadoutSlot("secondary");
      if (g.input.wasPressed("KeyR")) this.cycleLoadoutSlot("utility");
      if (g.input.wasPressed("Digit6")) this.changeSelection(-1);
      if (g.input.wasPressed("Digit7")) this.changeSelection(1);
      if (g.input.wasPressed("Digit8")) this.takeOrEquipSelected();
      if (g.input.wasPressed("Digit9")) this.sellSelected();
      if (g.input.wasPressed("Digit0")) this.salvageSelected();
      if (g.input.wasPressed("KeyT")) this.changePilotAttributeSelection(-1);
      if (g.input.wasPressed("KeyY")) this.changePilotAttributeSelection(1);
      if (g.input.wasPressed("KeyU")) this.spendSelectedPilotAttribute();
      if (g.input.wasPressed("KeyI")) this.changePilotPerkSelection(-1);
      if (g.input.wasPressed("KeyO")) this.changePilotPerkSelection(1);
      if (g.input.wasPressed("KeyK")) this.unlockSelectedPilotPerk();
      if (g.input.wasPressed("Enter")) this.beginNextSectorFromHangar();
    }

    ensureNavState() {
      const h = this.game.model.hangar;
      if (!Array.isArray(h.shopItems) || h.shopItems.length === 0) this.refreshShopOffers();
      if (!h.navSection || !this.navSections.includes(h.navSection)) h.navSection = "shop";
      if (!Number.isInteger(h.shopIndex)) h.shopIndex = 0;
      const shopSize = this.getShopActionCount();
      if (h.shopIndex < 0 || h.shopIndex >= shopSize) h.shopIndex = 0;
      if (!Number.isInteger(h.pilotCursor)) h.pilotCursor = 0;
    }

    changeNavSection(step) {
      const g = this.game;
      const h = g.model.hangar;
      const idx = this.navSections.indexOf(h.navSection);
      const next = (idx + step + this.navSections.length) % this.navSections.length;
      h.navSection = this.navSections[next];
      g.model.hangar.message = tr("hangar.section", { section: h.navSection.toUpperCase() });
    }

    moveNavCursor(step) {
      const g = this.game;
      const h = g.model.hangar;
      if (h.navSection === "shop") {
        const size = this.getShopActionCount();
        h.shopIndex = (h.shopIndex + step + size) % size;
        g.model.hangar.message = tr("hangar.shop.choice", { index: h.shopIndex + 1, total: size });
        return;
      }
      if (h.navSection === "loot") {
        this.changeSelection(step);
        return;
      }
    }

    activateNavSelection() {
      const g = this.game;
      const h = g.model.hangar;
      if (h.navSection === "shop") {
        const offers = Array.isArray(g.model.hangar.shopItems) && g.model.hangar.shopItems.length > 0
          ? g.model.hangar.shopItems
          : this.getShopItems();
        const hangarItemsCount = offers.length;
        if (h.shopIndex < hangarItemsCount) {
          this.purchaseHangarItem(h.shopIndex);
          return;
        }
        const actionIndex = h.shopIndex - hangarItemsCount;
        if (actionIndex === 0) this.cycleLoadoutSlot("primary");
        else if (actionIndex === 1) this.cycleLoadoutSlot("secondary");
        else if (actionIndex === 2) this.cycleLoadoutSlot("utility");
        else if (actionIndex === 3) this.cycleShopVendorSelection(1);
        else if (actionIndex === 4) this.cycleFactionIntelSelection(1);
        else if (actionIndex === 5) this.sellSelected();
        else if (actionIndex === 6) this.salvageSelected();
        else if (actionIndex === 7) this.claimCompletedBounties();
        else if (actionIndex === 8) this.rerollBountyBoard();
        return;
      }
      if (h.navSection === "loot") {
        this.takeOrEquipSelected();
        return;
      }
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
      g.model.hangar.message =
        tr("game.hangar.controls");
      g.saveProfile("sector_start");
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
      g.model.hangar.message =
        tr("game.hangar.controls");
      g.model.hangar.navSection = "shop";
      g.model.hangar.shopIndex = 0;
      g.model.hangar.pilotCursor = 0;
      this.refreshShopOffers();
      this.clampSelection();
      g.saveProfile("sector_complete");
    }

    purchaseHangarItem(index) {
      const g = this.game;
      const offers = Array.isArray(g.model.hangar.shopItems) && g.model.hangar.shopItems.length > 0
        ? g.model.hangar.shopItems
        : this.getShopItems();
      const item = offers[index];
      if (!item) return;
      const resolvedCost = Math.max(0, Math.floor(Number(item.resolvedCost ?? item.cost) || 0));

      if (g.model.credits < resolvedCost) {
        g.model.hangar.message = tr("hangar.no_credits");
        return;
      }

      if (item.id === "repair") {
        const ship = g.model.ship;
        const canRepairHullShield = ship && (ship.hull < ship.hullMax || ship.shield < ship.shieldMax);
        if (!canRepairHullShield) {
          g.model.hangar.message = tr("hangar.full_hull_shield");
          return;
        }
      }
      if (item.id === "fire_rate" && g.model.upgrades.fireRateLevel >= g.config.hangar.maxFireRateLevel) {
        g.model.hangar.message = tr("hangar.fire_rate_max");
        return;
      }
      if (item.id === "magazine" && g.model.upgrades.magazineLevel >= g.config.hangar.maxMagazineLevel) {
        g.model.hangar.message = tr("hangar.magazine_max");
        return;
      }

      g.model.credits -= resolvedCost;
      if (item.id === "repair") {
        if (
          g.model.ship &&
          (g.model.ship.hull < g.model.ship.hullMax || g.model.ship.shield < g.model.ship.shieldMax)
        ) {
          g.model.ship.hull = g.model.ship.hullMax;
          g.model.ship.shield = g.model.ship.shieldMax;
          g.model.hangar.message = tr("hangar.repaired");
          return;
        }
      }
      if (item.id === "fire_rate") g.model.upgrades.fireRateLevel += 1;
      if (item.id === "magazine") g.model.upgrades.magazineLevel += 1;

      const contrabandApplied =
        item.isContraband && typeof g.applyContrabandPurchaseEffects === "function"
          ? g.applyContrabandPurchaseEffects(item.id)
          : false;
      g.model.hangar.message = tr("hangar.purchased", { title: item.title });
      if (contrabandApplied) {
        g.model.hangar.message = tr("game.contraband.purchase_notice", { title: item.title, heat: g.getContrabandHeat?.() ?? 0 });
      }
      g.saveProfile("hangar_purchase");
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
        g.model.hangar.message = tr("hangar.nothing_to_select");
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
        g.model.hangar.message = tr("hangar.selected", {
          source: selected.source === "crate" ? tr("hangar.source.crate") : tr("hangar.source.inventory"),
          name: selected.item.name
        });
      }
    }

    takeOrEquipSelected() {
      const g = this.game;
      const entry = this.getSelectedEntry();
      if (!entry) {
        g.model.hangar.message = tr("hangar.no_selected_module");
        return;
      }

      if (entry.source === "crate") {
        const module = entry.item;
        const slot = module.slot;
        const previous = g.model.equipment[slot];
        const needsInventorySlot = Boolean(previous);
        if (needsInventorySlot && g.model.inventory.length >= g.config.loot.maxInventoryItems) {
          g.model.hangar.message = tr("hangar.inventory_full");
          return;
        }
        g.model.hangar.lootCrate.splice(entry.index, 1);
        g.model.equipment[slot] = module;
        if (previous) {
          g.model.inventory.push(previous);
          g.model.hangar.selectionSource = "inventory";
          g.model.hangar.selectionIndex = g.model.inventory.length - 1;
        } else {
          g.model.hangar.selectionSource = "crate";
        }
        g.refreshSetState();
        g.initializeShipResources(g.model.ship);
        this.clampSelection();
        g.model.hangar.message = tr("hangar.equipped", { slot, name: module.name });
        g.saveProfile("hangar_equip_from_crate");
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
      g.model.hangar.message = tr("hangar.equipped", { slot, name: module.name });
      g.saveProfile("hangar_equip");
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
        g.model.hangar.message = tr("hangar.no_selected_module");
        return;
      }
      const removed = this.removeEntry(entry);
      if (!removed) return;
      const gain = removed.sellValue ?? 0;
      g.model.credits += gain;
      this.clampSelection();
      g.model.hangar.message = tr("hangar.sold", { name: removed.name, credits: gain });
      g.saveProfile("hangar_sell");
    }

    salvageSelected() {
      const g = this.game;
      const entry = this.getSelectedEntry();
      if (!entry) {
        g.model.hangar.message = tr("hangar.no_selected_module");
        return;
      }
      const removed = this.removeEntry(entry);
      if (!removed) return;
      const modifiers = g.getModuleModifiers();
      const diffMul = typeof g.getRunDifficultyMultipliers === "function" ? g.getRunDifficultyMultipliers().economySalvageMul ?? 1 : 1;
      const factionMul =
        typeof g.getFactionRewardMultipliers === "function" ? g.getFactionRewardMultipliers(g.getDominantFactionState()?.id).salvageMul : 1;
      const parts = Math.max(
        1,
        Math.round((removed.salvageValue ?? 0) * (1 + (modifiers.salvageYieldPct ?? 0)) * diffMul * factionMul)
      );
      g.model.salvageParts += parts;
      g.model.credits += parts * g.config.economy.salvageToCredits;
      this.clampSelection();
      g.model.hangar.message = tr("hangar.salvaged", { name: removed.name, parts });
      g.saveProfile("hangar_salvage");
    }

    cycleLoadoutSlot(slotName) {
      const g = this.game;
      const unlockedMap = g.model.unlocks[slotName];
      const currentIdKey =
        slotName === "primary" ? "primaryId" : slotName === "secondary" ? "secondaryId" : "utilityId";
      const unlockedIds = Object.keys(unlockedMap).filter((id) => unlockedMap[id]);
      if (unlockedIds.length === 0) {
        g.model.hangar.message = tr("hangar.no_variant_unlocked");
        return;
      }

      const current = g.model.loadout[currentIdKey];
      const idx = unlockedIds.indexOf(current);
      const next = unlockedIds[(idx + 1 + unlockedIds.length) % unlockedIds.length];
      g.model.loadout[currentIdKey] = next;
      g.syncLoadoutLabels();
      const label =
        slotName === "primary"
          ? g.model.loadout.primaryLabel
          : slotName === "secondary"
            ? g.model.loadout.secondaryLabel
            : g.model.loadout.utilityLabel;
      g.model.hangar.message = tr("hangar.active_slot", { slot: slotName, label });
      g.saveProfile("hangar_loadout");
    }

    cycleFactionIntelSelection(step = 1) {
      const g = this.game;
      if (typeof g.cycleFactionIntel !== "function") return;
      g.cycleFactionIntel(step);
    }

    cycleShopVendorSelection(step = 1) {
      const g = this.game;
      if (typeof g.cycleHangarVendor !== "function") return;
      g.cycleHangarVendor(step);
      this.refreshShopOffers();
      this.ensureNavState();
    }

    claimCompletedBounties() {
      const g = this.game;
      if (typeof g.claimCompletedBounties !== "function") return;
      g.claimCompletedBounties();
    }

    rerollBountyBoard() {
      const g = this.game;
      if (typeof g.rerollBountyBoard !== "function") return;
      g.rerollBountyBoard();
    }

    changePilotAttributeSelection(step) {
      const g = this.game;
      const order = g.getPilotAttributeOrder();
      const size = order.length;
      if (!size) return;
      const next = (g.model.hangar.pilotAttrIndex + step + size) % size;
      g.model.hangar.pilotAttrIndex = next;
      const key = order[next];
      const value = g.model.pilot.attributes[key] ?? 0;
      g.model.hangar.message = tr("hangar.pilot.selected_attr", { attr: key.toUpperCase(), value });
    }

    spendSelectedPilotAttribute() {
      const g = this.game;
      const order = g.getPilotAttributeOrder();
      const key = order[g.model.hangar.pilotAttrIndex] ?? "reflex";
      const ok = g.spendPilotAttributePoint(key);
      if (!ok) {
        g.model.hangar.message = tr("hangar.pilot.cannot_upgrade", { attr: key.toUpperCase() });
      }
    }

    changePilotPerkSelection(step) {
      const g = this.game;
      const perks = g.getPilotPerkDefs();
      if (!perks.length) return;
      const size = perks.length;
      const next = (g.model.hangar.pilotPerkIndex + step + size) % size;
      g.model.hangar.pilotPerkIndex = next;
      const perk = perks[next];
      g.model.hangar.message = tr("hangar.pilot.selected_perk", { label: perk.label, branch: perk.branch });
    }

    unlockSelectedPilotPerk() {
      const g = this.game;
      const perk = g.getPilotSelectedPerk();
      if (!perk) return;
      const ok = g.unlockPilotPerk(perk.id);
      if (!ok) g.model.hangar.message = tr("hangar.pilot.cannot_unlock", { label: perk.label });
    }

  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.HangarSystem = HangarSystem;
})();
