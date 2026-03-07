(() => {
  function toUint32(value) {
    return value >>> 0;
  }

  function createSeededRng(seed) {
    let state = toUint32(seed);

    return () => {
      state = toUint32(state + 0x6d2b79f5);
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomRange(rng, min, max) {
    return rng() * (max - min) + min;
  }

  function generateRunSeed() {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      return buffer[0] >>> 0;
    }

    return (Date.now() & 0xffffffff) >>> 0;
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.createSeededRng = createSeededRng;
  window.Asteroids.randomRange = randomRange;
  window.Asteroids.generateRunSeed = generateRunSeed;
})();