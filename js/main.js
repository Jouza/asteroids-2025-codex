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
    if (volumeSlider && volumeValue) {
      const percent = Math.round(audio.getVolume() * 100);
      volumeSlider.value = String(percent);
      volumeValue.textContent = `${percent}%`;
    }
    if (ambientSlider && ambientValue) {
      const percent = Math.round(audio.getAmbientVolume() * 100);
      ambientSlider.value = String(percent);
      ambientValue.textContent = `${percent}%`;
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
