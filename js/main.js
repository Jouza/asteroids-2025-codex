(() => {
  const { AudioSystem, GAME_CONFIG, Game, Hud, InputController, Renderer } = window.Asteroids;
  const i18n = window.Asteroids.i18n;
  const tr = (key, params = {}) => (i18n?.t ? i18n.t(key, params) : key);

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const hud = new Hud();
  const input = new InputController();
  const audio = new AudioSystem();
  const AUDIO_SETTINGS_KEY = "starfang_audio_settings_v1";
  const renderer = new Renderer(canvas, ctx, GAME_CONFIG);
  const game = new Game(canvas, renderer, hud, input, GAME_CONFIG, audio);
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const ambientSlider = document.getElementById("ambientSlider");
  const ambientValue = document.getElementById("ambientValue");
  const audioStatus = document.getElementById("audioStatus");
  const audioQuickOpen = document.getElementById("audioQuickOpen");
  const pilotQuickOpen = document.getElementById("pilotQuickOpen");
  const audioModal = document.getElementById("audioModal");
  const audioModalClose = document.getElementById("audioModalClose");
  const audioModalBackdrop = audioModal ? audioModal.querySelector(".modal-backdrop") : null;
  const pilotModal = document.getElementById("pilotModal");
  const pilotModalClose = document.getElementById("pilotModalClose");
  const pilotModalBackdrop = pilotModal ? pilotModal.querySelector(".modal-backdrop") : null;
  const pilotModalHint = document.getElementById("pilotModalHint");
  const pilotModalContent = document.getElementById("pilotModalContent");

  let activeModal = null;

  function setActiveModal(modalId = null) {
    activeModal = modalId;
    const audioOpen = modalId === "audio";
    const pilotOpen = modalId === "pilot";
    if (audioModal) {
      audioModal.classList.toggle("hidden", !audioOpen);
      audioModal.setAttribute("aria-hidden", audioOpen ? "false" : "true");
    }
    if (pilotModal) {
      pilotModal.classList.toggle("hidden", !pilotOpen);
      pilotModal.setAttribute("aria-hidden", pilotOpen ? "false" : "true");
    }
    if (typeof game.setUiModal === "function") {
      game.setUiModal(modalId || null);
    }
    if (audioOpen) {
      input.reset();
      if (volumeSlider) volumeSlider.focus();
      return;
    }
    if (pilotOpen) {
      input.reset();
      renderPilotModal();
      if (pilotModalClose) pilotModalClose.focus();
    }
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
  }

  function createPilotPortraitSvg(pilotId = "buzz_calder") {
    const palettes = {
      buzz_calder: { ring: "#9be8ff", core: "#d8f5ff", accent: "#ffd79a" },
      neo_mercer: { ring: "#87f4c4", core: "#d8f5ff", accent: "#8ecbff" },
      boba_vane: { ring: "#ffd79a", core: "#f2fff8", accent: "#9be8ff" },
      luke_ryder: { ring: "#a8d7ff", core: "#e8f8ff", accent: "#ffe7a8" },
      marty_carter: { ring: "#b8f7ff", core: "#e8fcff", accent: "#ffcf8c" },
      max_steel: { ring: "#7fe4ff", core: "#d8f5ff", accent: "#ffb08a" }
    };
    const palette = palettes[pilotId] || palettes.buzz_calder;
    return `
      <svg viewBox="0 0 120 120" class="pilot-portrait-svg" aria-hidden="true">
        <defs>
          <radialGradient id="pilotGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stop-color="${palette.core}" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="${palette.ring}" stop-opacity="0.06"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="46" fill="url(#pilotGlow)" stroke="${palette.ring}" stroke-width="2"/>
        <path d="M60 20 L82 64 L60 54 L38 64 Z" fill="rgba(166,232,255,0.14)" stroke="${palette.core}" stroke-width="2" />
        <path d="M60 22 L60 54" stroke="${palette.core}" stroke-width="1.6" />
        <path d="M45 68 L33 84 M75 68 L87 84" stroke="${palette.accent}" stroke-width="2" stroke-linecap="round" />
        <circle cx="60" cy="56" r="3" fill="${palette.accent}" />
      </svg>
    `;
  }

  function renderPilotModal() {
    if (!pilotModalContent) return;
    const tr = (key, params = {}) => (i18n?.t ? i18n.t(key, params) : key);
    pilotModalContent.innerHTML = "";
    const isHangar = game.model.gameState === window.Asteroids.GAME_STATE.HANGAR;
    if (pilotModalHint) {
      pilotModalHint.textContent = isHangar ? tr("index.pilot_modal.hint") : tr("index.pilot_modal.outside_hangar");
    }

    const pilot = game.model.pilot || {};
    const attrs = pilot.attributes || {};
    const perks = game.getPilotPerkDefs();
    const unlocked = new Set(pilot.unlockedPerks || []);
    const selectedPilot = game.getSelectedIdentityPilot();
    const pilotId = selectedPilot?.id || "buzz_calder";
    const pilotName = selectedPilot
      ? (i18n?.t ? i18n.t(`identity.pilot.${selectedPilot.id}.callsign`) : selectedPilot.id)
      : "-";
    const pilotBio = tr(`help.pilot.${pilotId}.bio`);
    const level = Math.floor(pilot.level || 1);
    const xp = Math.floor(pilot.xp || 0);
    const xpToNext = Math.max(1, Math.floor(pilot.xpToNext || 1));
    const attrPoints = Math.floor(pilot.attributePoints || 0);
    const skillPoints = Math.floor(pilot.skillPoints || 0);

    const hero = createEl("section", "pilot-modal-card pilot-hero-card");
    const portraitWrap = createEl("div", "pilot-portrait-wrap");
    portraitWrap.innerHTML = createPilotPortraitSvg(pilotId);
    hero.appendChild(portraitWrap);

    const heroContent = createEl("div", "pilot-hero-content");
    heroContent.appendChild(createEl("p", "pilot-hero-name", pilotName));
    heroContent.appendChild(createEl("p", "pilot-hero-bio", pilotBio));
    const heroStats = createEl("div", "pilot-hero-stats");
    heroStats.appendChild(createEl("span", "pilot-chip", `${tr("index.pilot_modal.level_short")} ${level}`));
    heroStats.appendChild(createEl("span", "pilot-chip", `${tr("index.pilot_modal.attr_short")} ${attrPoints}`));
    heroStats.appendChild(createEl("span", "pilot-chip", `${tr("index.pilot_modal.skill_short")} ${skillPoints}`));
    heroContent.appendChild(heroStats);
    heroContent.appendChild(createEl("p", "pilot-hero-xp", `${tr("index.pilot_modal.xp_short")} ${xp}/${xpToNext}`));
    const xpTrack = createEl("div", "pilot-track");
    const xpFill = createEl("div", "pilot-track-fill");
    xpFill.style.width = `${Math.max(0, Math.min(100, (xp / xpToNext) * 100)).toFixed(1)}%`;
    xpTrack.appendChild(xpFill);
    heroContent.appendChild(xpTrack);
    hero.appendChild(heroContent);
    pilotModalContent.appendChild(hero);

    const summary = createEl("section", "pilot-modal-card");
    summary.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.summary_title")));
    summary.appendChild(createEl("div", "pilot-stat", tr("index.pilot_modal.level_line", { level, xp, next: xpToNext, attr: attrPoints, skill: skillPoints })));
    pilotModalContent.appendChild(summary);

    const attrsCard = createEl("section", "pilot-modal-card");
    attrsCard.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.attributes_title")));
    const attrGrid = createEl("div", "pilot-modal-grid");
    for (const key of game.getPilotAttributeOrder()) {
      const value = Math.floor(attrs[key] || 0);
      const cap = Math.max(1, Math.floor(game.config.pilot?.attributeCaps?.[key] || 10));
      const canUpgrade = isHangar && attrPoints > 0 && value < cap;
      const row = createEl("div", "pilot-attr-card");
      const head = createEl("div", "pilot-attr-head");
      head.appendChild(createEl("span", "pilot-attr-name", tr(`pilot.attribute.${key}.name`)));
      head.appendChild(createEl("span", "pilot-attr-value", `${value}/${cap}`));
      row.appendChild(head);
      const track = createEl("div", "pilot-track");
      const fill = createEl("div", "pilot-track-fill");
      fill.style.width = `${Math.max(0, Math.min(100, (value / cap) * 100)).toFixed(1)}%`;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(createEl("p", "pilot-attr-desc", tr(`pilot.attribute.${key}.desc`)));
      row.appendChild(createEl("p", "pilot-attr-effect", tr(`pilot.attribute.${key}.effect`)));
      const btn = createEl("button", "pilot-action-btn", tr("index.pilot_modal.upgrade"));
      btn.type = "button";
      btn.disabled = !canUpgrade;
      btn.addEventListener("click", () => {
        if (!canUpgrade) return;
        game.spendPilotAttributePoint(key);
        hud.sync(game.model);
        renderPilotModal();
      });
      row.appendChild(btn);
      attrGrid.appendChild(row);
    }
    attrsCard.appendChild(attrGrid);
    pilotModalContent.appendChild(attrsCard);

    const perksCard = createEl("section", "pilot-modal-card");
    perksCard.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.perks_title")));
    for (const perk of perks) {
      const row = createEl("div", "pilot-perk-card");
      const titleRow = createEl("div", "pilot-perk-head");
      titleRow.appendChild(createEl("span", "pilot-perk-name", `${perk.label} (${String(perk.branch || "").toUpperCase()})`));
      const unlockedNow = unlocked.has(perk.id);
      const canUnlock = isHangar && game.canUnlockPilotPerk(perk);
      const reqAttrKey = Object.keys(perk.requires || {})[0] || "reflex";
      const reqAttrValue = Math.floor(perk.requires?.[reqAttrKey] || 0);
      const currentAttr = Math.floor(attrs[reqAttrKey] || 0);
      const reqLevel = Math.floor(perk.levelReq || 1);
      const levelOk = level >= reqLevel;
      const attrOk = currentAttr >= reqAttrValue;
      let statusKey = "index.pilot_modal.status_missing";
      if (unlockedNow) statusKey = "index.pilot_modal.status_unlocked";
      else if (levelOk && attrOk && isHangar) statusKey = "index.pilot_modal.status_ready";
      titleRow.appendChild(createEl("span", `pilot-perk-status ${levelOk && attrOk ? "ok" : "warn"}`, tr(statusKey)));
      row.appendChild(titleRow);
      row.appendChild(createEl("p", "pilot-perk-desc", tr(`pilot.perk.${perk.id}.desc`)));

      const reqGrid = createEl("div", "pilot-perk-req-grid");
      reqGrid.appendChild(createEl("div", `pilot-perk-req ${levelOk ? "ok" : "warn"}`, `${tr("index.pilot_modal.required")}: ${tr("index.pilot_modal.req_level", { level: reqLevel })}`));
      reqGrid.appendChild(createEl("div", "pilot-perk-req", `${tr("index.pilot_modal.current")}: ${tr("index.pilot_modal.req_level", { level })}`));
      reqGrid.appendChild(
        createEl(
          "div",
          `pilot-perk-req ${attrOk ? "ok" : "warn"}`,
          `${tr("index.pilot_modal.required")}: ${tr("index.pilot_modal.req_attr", { attr: tr(`pilot.attribute.${reqAttrKey}.name`), value: reqAttrValue })}`
        )
      );
      reqGrid.appendChild(
        createEl(
          "div",
          "pilot-perk-req",
          `${tr("index.pilot_modal.current")}: ${tr("index.pilot_modal.req_attr", { attr: tr(`pilot.attribute.${reqAttrKey}.name`), value: currentAttr })}`
        )
      );
      row.appendChild(reqGrid);

      const btn = createEl(
        "button",
        "pilot-action-btn",
        unlockedNow ? tr("index.pilot_modal.unlocked") : tr("index.pilot_modal.unlock")
      );
      btn.type = "button";
      btn.disabled = unlockedNow || !canUnlock;
      btn.addEventListener("click", () => {
        if (!canUnlock) return;
        game.unlockPilotPerk(perk.id);
        hud.sync(game.model);
        renderPilotModal();
      });
      row.appendChild(btn);
      perksCard.appendChild(row);
    }
    pilotModalContent.appendChild(perksCard);
  }

  function loadAudioSettings() {
    try {
      const raw = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.volume === "number") audio.setVolume(parsed.volume);
      if (typeof parsed?.ambientVolume === "number") audio.setAmbientVolume(parsed.ambientVolume);
      if (typeof parsed?.muted === "boolean") audio.setMuted(parsed.muted);
    } catch (error) {
      // Ignore invalid persisted settings.
    }
  }

  function saveAudioSettings() {
    try {
      window.localStorage.setItem(
        AUDIO_SETTINGS_KEY,
        JSON.stringify({
          volume: audio.getVolume(),
          ambientVolume: audio.getAmbientVolume(),
          muted: audio.isMuted()
        })
      );
    } catch (error) {
      // Ignore storage write issues.
    }
  }

  function syncVolumeUi() {
    const sfxPercent = Math.round(audio.getVolume() * 100);
    const ambientPercent = Math.round(audio.getAmbientVolume() * 100);
    if (volumeSlider && volumeValue) {
      volumeSlider.value = String(sfxPercent);
      volumeValue.textContent = `${sfxPercent}%`;
    }
    if (ambientSlider && ambientValue) {
      ambientSlider.value = String(ambientPercent);
      ambientValue.textContent = `${ambientPercent}%`;
    }
    if (audioStatus) {
      audioStatus.textContent = audio.isMuted()
        ? tr("index.audio_summary_muted", { sfx: sfxPercent, ambient: ambientPercent })
        : tr("index.audio_summary", { sfx: sfxPercent, ambient: ambientPercent });
    }
  }

  const unlockAudio = () => {
    audio.unlock();
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("pointerdown", unlockAudio);
  };
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("pointerdown", unlockAudio);
  loadAudioSettings();
  if (i18n) i18n.applyTranslations(document);
  syncVolumeUi();
  let lastAudioState = `${audio.getVolume()}|${audio.getAmbientVolume()}|${audio.isMuted()}`;
  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      audio.setVolume(Number(volumeSlider.value) / 100);
      syncVolumeUi();
      saveAudioSettings();
      lastAudioState = `${audio.getVolume()}|${audio.getAmbientVolume()}|${audio.isMuted()}`;
    });
  }
  if (ambientSlider) {
    ambientSlider.addEventListener("input", () => {
      audio.setAmbientVolume(Number(ambientSlider.value) / 100);
      syncVolumeUi();
      saveAudioSettings();
      lastAudioState = `${audio.getVolume()}|${audio.getAmbientVolume()}|${audio.isMuted()}`;
    });
  }
  if (audioQuickOpen) {
    audioQuickOpen.addEventListener("click", () => setActiveModal("audio"));
  }
  if (pilotQuickOpen) {
    pilotQuickOpen.addEventListener("click", () => setActiveModal("pilot"));
  }
  if (audioModalClose) {
    audioModalClose.addEventListener("click", () => setActiveModal(null));
  }
  if (audioModalBackdrop) {
    audioModalBackdrop.addEventListener("click", () => setActiveModal(null));
  }
  if (pilotModalClose) {
    pilotModalClose.addEventListener("click", () => setActiveModal(null));
  }
  if (pilotModalBackdrop) {
    pilotModalBackdrop.addEventListener("click", () => setActiveModal(null));
  }
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.code === "KeyG") {
        setActiveModal(activeModal === "audio" ? null : "audio");
        event.preventDefault();
      } else if (event.code === "KeyJ") {
        setActiveModal(activeModal === "pilot" ? null : "pilot");
        event.preventDefault();
      } else if (event.code === "KeyH") {
        window.open("./help.html", "_blank", "noopener,noreferrer");
        event.preventDefault();
      } else if (event.code === "Escape" && activeModal) {
        setActiveModal(null);
        event.preventDefault();
      }
    },
    true
  );

  input.attach();
  game.initGame();

  let lastTimestamp = 0;
  let accumulator = 0;
  const nowMs = () => (typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now());

  function frame(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const rawDelta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    const frameDelta = game.applyFrameDelta(rawDelta);

    if (activeModal) {
      if (activeModal === "pilot") renderPilotModal();
      game.render();
      input.endFrame();
      requestAnimationFrame(frame);
      return;
    }
    game.handleMetaInput();
    const currentAudioState = `${audio.getVolume()}|${audio.getAmbientVolume()}|${audio.isMuted()}`;
    if (currentAudioState !== lastAudioState) {
      saveAudioSettings();
      syncVolumeUi();
      lastAudioState = currentAudioState;
    }
    accumulator += frameDelta;

    const fixedStep = GAME_CONFIG.simulation.fixedStepSeconds;
    let steps = 0;
    const updateStart = nowMs();

    while (
      accumulator >= fixedStep &&
      steps < GAME_CONFIG.simulation.maxStepCount
    ) {
      game.update(fixedStep);
      accumulator -= fixedStep;
      steps += 1;
    }
    const updateMs = nowMs() - updateStart;

    const renderStart = nowMs();
    game.render();
    const renderMs = nowMs() - renderStart;
    game.recordFramePerformance(rawDelta, steps, updateMs, renderMs);
    input.endFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
