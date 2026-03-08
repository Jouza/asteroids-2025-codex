(() => {
  const { AudioSystem, GAME_CONFIG, Game, Hud, InputController, Renderer } = window.Asteroids;
  const i18n = window.Asteroids.i18n;

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

  function formatReqLine(perk) {
    if (!perk) return "-";
    const parts = [`L${perk.levelReq ?? 1}`];
    const req = perk.requires || {};
    for (const key of Object.keys(req)) parts.push(`${key.toUpperCase()}:${req[key]}`);
    return parts.join(" ");
  }

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = String(text);
    return el;
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
    const pilotName = selectedPilot
      ? (i18n?.t ? i18n.t(`identity.pilot.${selectedPilot.id}.callsign`) : selectedPilot.id)
      : "-";

    const summary = createEl("section", "pilot-modal-card");
    summary.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.summary_title")));
    summary.appendChild(
      createEl(
        "div",
        "pilot-stat",
        `${pilotName} | ${tr("index.pilot_modal.level_line", {
          level: pilot.level || 1,
          xp: Math.floor(pilot.xp || 0),
          next: Math.floor(pilot.xpToNext || 1),
          attr: pilot.attributePoints || 0,
          skill: pilot.skillPoints || 0
        })}`
      )
    );
    pilotModalContent.appendChild(summary);

    const attrsCard = createEl("section", "pilot-modal-card");
    attrsCard.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.attributes_title")));
    const attrGrid = createEl("div", "pilot-modal-grid");
    for (const key of game.getPilotAttributeOrder()) {
      const row = createEl("div", "pilot-action-row");
      const label = createEl("span", "", `${key.toUpperCase()} ${Math.floor(attrs[key] || 0)}`);
      const btn = createEl("button", "pilot-action-btn", tr("index.pilot_modal.upgrade"));
      btn.type = "button";
      btn.disabled = !isHangar;
      btn.addEventListener("click", () => {
        if (!isHangar) return;
        game.spendPilotAttributePoint(key);
        hud.sync(game.model);
        renderPilotModal();
      });
      row.appendChild(label);
      row.appendChild(btn);
      row.appendChild(createEl("span", "", ""));
      attrGrid.appendChild(row);
    }
    attrsCard.appendChild(attrGrid);
    pilotModalContent.appendChild(attrsCard);

    const perksCard = createEl("section", "pilot-modal-card");
    perksCard.appendChild(createEl("h3", "pilot-modal-title", tr("index.pilot_modal.perks_title")));
    for (const perk of perks) {
      const row = createEl("div", "pilot-action-row");
      const reqLine = `${tr("index.pilot_modal.req_prefix")} ${formatReqLine(perk)}`;
      const label = createEl("span", "", `${perk.label} (${perk.branch}) | ${reqLine}`);
      const unlockedNow = unlocked.has(perk.id);
      const canUnlock = isHangar && game.canUnlockPilotPerk(perk);
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
      row.appendChild(label);
      row.appendChild(btn);
      row.appendChild(createEl("span", "", ""));
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
        ? i18n.t("index.audio_summary_muted", { sfx: sfxPercent, ambient: ambientPercent })
        : i18n.t("index.audio_summary", { sfx: sfxPercent, ambient: ambientPercent });
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
