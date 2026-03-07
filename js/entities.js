(() => {
  const { randomRange } = window.Asteroids;

  function wrapPosition(entity, width, height) {
    if (entity.x < -entity.radius) entity.x = width + entity.radius;
    if (entity.x > width + entity.radius) entity.x = -entity.radius;
    if (entity.y < -entity.radius) entity.y = height + entity.radius;
    if (entity.y > height + entity.radius) entity.y = -entity.radius;
  }

  function circleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const r = a.radius + b.radius;
    return dx * dx + dy * dy <= r * r;
  }

  function createShip(config) {
    return {
      x: config.canvas.width * 0.5,
      y: config.canvas.height * 0.5,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      angle: -Math.PI / 2,
      radius: config.ship.radius,
      invulnMs: config.ship.invulnerabilityMs
    };
  }

  function createBullet(ship, config) {
    const dirX = Math.cos(ship.angle);
    const dirY = Math.sin(ship.angle);

    return {
      x: ship.x + dirX * (ship.radius + 8),
      y: ship.y + dirY * (ship.radius + 8),
      vx: ship.vx * config.bullet.inheritVelocityFactor + dirX * config.bullet.speed,
      vy: ship.vy * config.bullet.inheritVelocityFactor + dirY * config.bullet.speed,
      radius: config.bullet.radius,
      ttl: config.bullet.ttlSeconds
    };
  }

  function createEnemyBullet(x, y, angle, config) {
    return {
      x,
      y,
      vx: Math.cos(angle) * config.enemyBullet.speed,
      vy: Math.sin(angle) * config.enemyBullet.speed,
      radius: config.enemyBullet.radius,
      ttl: config.enemyBullet.ttlSeconds
    };
  }

  function makeAsteroidShape(rng, config) {
    const points = [];
    for (let i = 0; i < config.asteroid.shapeVertices; i += 1) {
      points.push(
        randomRange(rng, config.asteroid.shapeVarianceMin, config.asteroid.shapeVarianceMax)
      );
    }
    return points;
  }

  function createAsteroid(size, x, y, speedScale, rng, config, asteroidDefs, asteroidType = "normal") {
    const definition = asteroidDefs[size];
    const speed = randomRange(rng, config.asteroid.speedMin, config.asteroid.speedMax) * speedScale;
    const angle = randomRange(rng, 0, Math.PI * 2);

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: definition.radius,
      size,
      asteroidType,
      shape: makeAsteroidShape(rng, config),
      spin: randomRange(rng, config.asteroid.spinMin, config.asteroid.spinMax),
      rotation: randomRange(rng, 0, Math.PI * 2),
      nearMissCooldown: 0
    };
  }

  function spawnAsteroidAwayFromShip(
    size,
    speedScale,
    asteroidType,
    model,
    rng,
    config,
    asteroidDefs
  ) {
    const margin = config.asteroid.spawnMargin;
    const minDistance = config.asteroid.minDistanceFromShip;
    let x = 0;
    let y = 0;
    let tries = 0;

    do {
      const fromHorizontalEdge = rng() < 0.5;
      if (fromHorizontalEdge) {
        x = rng() < 0.5 ? -margin : config.canvas.width + margin;
        y = randomRange(rng, -margin, config.canvas.height + margin);
      } else {
        x = randomRange(rng, -margin, config.canvas.width + margin);
        y = rng() < 0.5 ? -margin : config.canvas.height + margin;
      }
      tries += 1;
    } while (
      model.ship &&
      Math.hypot(x - model.ship.x, y - model.ship.y) < minDistance &&
      tries < config.asteroid.maxSpawnRetries
    );

    return createAsteroid(size, x, y, speedScale, rng, config, asteroidDefs, asteroidType);
  }

  function createUfo(mode, x, y, config) {
    const hp = config.ufo.hpByMode?.[mode] ?? 40;
    return {
      mode,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: config.ufo.radius,
      hp,
      maxHp: hp,
      shootTimer: 0,
      disabledTimer: 0,
      supportHealTimer: config.ufo.supportHealIntervalSeconds,
      mineDeployTimer: config.ufo.mineDeployIntervalSeconds,
      elitePrefix: null,
      eliteStats: null
    };
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.wrapPosition = wrapPosition;
  window.Asteroids.circleCollision = circleCollision;
  window.Asteroids.createShip = createShip;
  window.Asteroids.createBullet = createBullet;
  window.Asteroids.createEnemyBullet = createEnemyBullet;
  window.Asteroids.createAsteroid = createAsteroid;
  window.Asteroids.spawnAsteroidAwayFromShip = spawnAsteroidAwayFromShip;
  window.Asteroids.createUfo = createUfo;
})();
