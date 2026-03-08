(() => {
  const LANG_KEY = "starfang_lang_v1";

  const dictionaries = {
    en: {
      "state.start": "START",
      "state.playing": "PLAYING",
      "state.hangar": "HANGAR",
      "state.paused": "PAUSED",
      "state.game_over": "GAME OVER",
      "state.victory": "VICTORY",
      "overlay.press_enter_start": "Press Enter to start",
      "overlay.seed": "Run seed: {seed}",
      "overlay.mode": "Mode: {mode}  (E toggle)",
      "overlay.endless_unlock_hint": "Endless unlock: clear campaign once",
      "overlay.game_over": "GAME OVER",
      "overlay.score": "Score: {score}",
      "overlay.sector_reached": "Sector reached: {sector}",
      "overlay.enter_restart": "Press Enter to restart",
      "overlay.pause": "PAUSED",
      "overlay.press_p_resume": "Press P to resume",
      "overlay.victory": "VICTORY",
      "overlay.sector_cleared": "Sector cleared: {sector}",
      "overlay.build": "Build: {primary} / {secondary} / {utility}",
      "overlay.runtime": "Runtime: {seconds}s",
      "overlay.endless_unlocked": "Endless mode unlocked. Press E to switch mode.",
      "overlay.campaign_complete": "Campaign complete.",
      "overlay.enter_new_run": "Press Enter for a new run",
      "game.run_mode.locked": "Endless mode is locked. Clear campaign once to unlock.",
      "game.run_mode.changed": "Run mode: {mode}",
      "game.run_mode.campaign": "CAMPAIGN",
      "game.run_mode.endless": "ENDLESS",
      "game.hangar.controls":
        "Hangar: Left/Right section, Up/Down selection, Space action, Enter start. Legacy: 1-3/4/5/R/6/7/8/9/0/T/Y/U/I/O/K",
      "game.audio.muted": "Audio: muted (M to unmute).",
      "game.audio.enabled": "Audio: enabled (M to mute).",
      "game.unlock.endless": "Campaign cleared. Endless mode unlocked.",
      "game.boss.down": "Boss down: +{credits} credits, {drops} guaranteed module",
      "game.boss.final_down": "Final boss down: +{credits} credits, {drops} guaranteed module",
      "hangar.section": "Section: {section} | Up/Down select | Space action",
      "hangar.shop.choice": "Shop option {index}/{total} | Space action",
      "hangar.pilot.attr": "Pilot attr: {attr} | Space upgrade",
      "hangar.pilot.perk": "Pilot perk: {perk} | Space next perk",
      "hangar.pilot.unlock": "Pilot unlock: {perk} | Space unlock",
      "hangar.no_credits": "Not enough credits.",
      "hangar.full_hull_shield": "Hull and shield are full.",
      "hangar.fire_rate_max": "Fire rate is at max.",
      "hangar.magazine_max": "Magazine is at max.",
      "hangar.repaired": "Hull and shield restored to maximum.",
      "hangar.purchased": "Purchased: {title}",
      "hangar.nothing_to_select": "Nothing to select.",
      "hangar.selected": "{source}: {name}",
      "hangar.no_selected_module": "No module selected.",
      "hangar.inventory_full": "Inventory is full. Sell or salvage first.",
      "hangar.taken": "Moved to inventory: {name}",
      "hangar.equipped": "Equipped {slot}: {name}",
      "hangar.sold": "Sold: {name} (+{credits} cr)",
      "hangar.salvaged": "Salvaged: {name} (+{parts} parts)",
      "hangar.no_variant_unlocked": "No variant is unlocked.",
      "hangar.active_slot": "Active {slot}: {label}",
      "hangar.pilot.selected_attr": "Pilot attr selected: {attr} ({value})",
      "hangar.pilot.cannot_upgrade": "Cannot upgrade {attr} (need attr point or cap reached).",
      "hangar.pilot.selected_perk": "Perk selected: {label} ({branch})",
      "hangar.pilot.cannot_unlock": "Cannot unlock perk: {label}",
      "render.start.title": "ASTEROIDS",
      "render.pause.title": "PAUSED",
      "render.hangar.no_selection": "No item selected.",
      "render.hangar.action_hint": "Left/Right section | Up/Down select | Space action | Enter start | Legacy fallback: 9/0",
      "mission.clear_remaining": "Clear remaining threats: {count}",
      "mission.destroy_boss": "Destroy boss ({hp} HP)",
      "mission.destroy_final_boss": "Destroy final boss ({hp} HP)",
      "index.help_link": "HELP: objects and hazards reference",
      "index.controls":
        "Controls: Left/Right rotate, Up thrust, Space fire, Shift boost, V dash, F switch flight model, X secondary, C utility, E toggle campaign/endless (after unlock), M mute, P pause, Enter start/restart. Hangar: Left/Right section, Up/Down select, Space action, Enter continue. In Immediate Actions, Space also supports Sell/Salvage selected. Legacy fallback: 1/2/3, 4/5/R, 6/7/8/9/0, T/Y/U/I/O/K.",
      "help.title": "STARFANG Help"
    },
    cs: {}
  };

  function format(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
  }

  function getStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored && dictionaries[stored]) return stored;
    } catch (error) {
      // ignore storage errors
    }
    return "en";
  }

  function t(key, params = {}) {
    const lang = window.Asteroids?.lang || "en";
    const dict = dictionaries[lang] || dictionaries.en;
    const fallback = dictionaries.en[key];
    const template = dict[key] ?? fallback ?? key;
    return format(template, params);
  }

  function applyTranslations(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      node.textContent = t(key);
    });
    root.querySelectorAll("[data-i18n-title]").forEach((node) => {
      const key = node.getAttribute("data-i18n-title");
      if (!key) return;
      node.setAttribute("title", t(key));
    });
    root.querySelectorAll("[data-i18n-tip]").forEach((node) => {
      const key = node.getAttribute("data-i18n-tip");
      if (!key) return;
      node.setAttribute("data-tip", t(key));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      const key = node.getAttribute("data-i18n-aria-label");
      if (!key) return;
      node.setAttribute("aria-label", t(key));
    });
  }

  function setLanguage(lang) {
    const normalized = dictionaries[lang] ? lang : "en";
    window.Asteroids.lang = normalized;
    try {
      window.localStorage.setItem(LANG_KEY, normalized);
    } catch (error) {
      // ignore storage errors
    }
    if (typeof document !== "undefined") applyTranslations(document);
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.i18n = {
    dictionaries,
    t,
    setLanguage,
    getLanguage: () => window.Asteroids.lang || "en",
    applyTranslations
  };
  window.Asteroids.t = t;
  window.Asteroids.lang = getStoredLanguage();
})();
