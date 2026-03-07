(() => {
  class InputController {
    constructor() {
      this.keysDown = new Set();
      this.pressedThisFrame = new Set();
      this.boundKeyDown = this.onKeyDown.bind(this);
      this.boundKeyUp = this.onKeyUp.bind(this);
      this.boundBlur = this.reset.bind(this);
    }

    attach() {
      window.addEventListener("keydown", this.boundKeyDown, { passive: false });
      window.addEventListener("keyup", this.boundKeyUp, { passive: false });
      window.addEventListener("blur", this.boundBlur);
    }

    reset() {
      this.keysDown.clear();
      this.pressedThisFrame.clear();
    }

    onKeyDown(event) {
      const tracked =
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight" ||
        event.code === "ArrowUp" ||
        event.code === "Space" ||
        event.code === "KeyX" ||
        event.code === "KeyC" ||
        event.code === "Enter" ||
        event.code === "Digit1" ||
        event.code === "Digit2" ||
        event.code === "Digit3" ||
        event.code === "Digit4" ||
        event.code === "Digit5" ||
        event.code === "Digit6" ||
        event.code === "Digit7" ||
        event.code === "Digit8" ||
        event.code === "Digit9" ||
        event.code === "Digit0" ||
        event.code === "KeyR" ||
        event.code === "KeyP" ||
        event.code === "F3" ||
        event.code === "KeyF" ||
        event.code === "KeyV" ||
        event.code === "ShiftLeft" ||
        event.code === "ShiftRight";

      if (!tracked) {
        return;
      }

      if (!event.repeat) {
        this.pressedThisFrame.add(event.code);
      }

      this.keysDown.add(event.code);
      event.preventDefault();
    }

    onKeyUp(event) {
      if (this.keysDown.has(event.code)) {
        this.keysDown.delete(event.code);
        event.preventDefault();
      }
    }

    isDown(code) {
      return this.keysDown.has(code);
    }

    wasPressed(code) {
      return this.pressedThisFrame.has(code);
    }

    endFrame() {
      this.pressedThisFrame.clear();
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.InputController = InputController;
})();
