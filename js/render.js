(() => {
  const { GAME_STATE } = window.Asteroids;
  const tr = (key, params = {}) => (typeof window.Asteroids?.t === "function" ? window.Asteroids.t(key, params) : key);

  class Renderer {
    constructor(canvas, ctx, config) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.config = config;
      this.starfield = this.createStarfield(120);
    }

    render(model, input) {
      this.clear();
      this.drawStarfield();
      this.drawAsteroids(model.asteroids);
      this.drawUfos(model.ufos);
      this.drawMiniBoss(model.miniBoss);
      this.drawBullets(model.bullets);
      this.drawEnemyBullets(model.enemyBullets);
      this.drawUtilityEffects(model.utilityEffects);
      this.drawParticles(model.particles);
      this.drawShip(model, input);
      this.drawVignette();
      this.drawMissionEnvironment(model);
      this.drawFlash(model.flashMs);
      this.drawMissionStatus(model);
      this.drawTelemetry(model);
      this.drawPerformanceOverlay(model);

      if (model.gameState !== GAME_STATE.PLAYING) {
        this.drawOverlay(model);
      }
    }

    clear() {
      const { ctx, config } = this;
      ctx.clearRect(0, 0, config.canvas.width, config.canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, config.canvas.height);
      gradient.addColorStop(0, "#070c1e");
      gradient.addColorStop(1, "#03050b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
    }

    createStarfield(count) {
      const stars = [];
      for (let i = 0; i < count; i += 1) {
        stars.push({
          x: Math.random() * this.config.canvas.width,
          y: Math.random() * this.config.canvas.height,
          r: Math.random() * 1.8 + 0.2,
          a: Math.random() * 0.6 + 0.15
        });
      }
      return stars;
    }

    drawStarfield() {
      const { ctx } = this;
      ctx.save();
      for (const s of this.starfield) {
        ctx.fillStyle = `rgba(194,221,255,${s.a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawShip(model, input) {
      const { ctx } = this;
      const ship = model.ship;
      if (!ship) return;

      const blink = ship.invulnMs > 0 && Math.floor(ship.invulnMs / 100) % 2 === 0;
      if (blink) return;

      const shipVisualProfiles = {
        viper_mk2: {
          fill: "rgba(112,214,255,0.2)",
          stroke: "#d9faff",
          shieldColor: "120,232,255",
          thrustInner: "rgba(152,248,255,0.96)",
          thrustOuter: "rgba(80,197,255,0.92)",
          sideFlame: "rgba(152,248,255,0.95)",
          points: [
            [1.05, 0],
            [-0.94, -0.58],
            [-0.42, -0.08],
            [-0.58, 0],
            [-0.42, 0.08],
            [-0.94, 0.58]
          ],
          detail: "spine"
        },
        bastion_frame: {
          fill: "rgba(132,207,255,0.22)",
          stroke: "#e2fbff",
          shieldColor: "255,206,132",
          thrustInner: "rgba(255,208,132,0.96)",
          thrustOuter: "rgba(255,133,96,0.9)",
          sideFlame: "rgba(255,203,132,0.95)",
          points: [
            [0.96, 0],
            [-1.08, -0.76],
            [-0.58, -0.2],
            [-0.74, 0],
            [-0.58, 0.2],
            [-1.08, 0.76]
          ],
          detail: "core"
        },
        revenant_frame: {
          fill: "rgba(146,194,255,0.2)",
          stroke: "#e4f0ff",
          shieldColor: "204,166,255",
          thrustInner: "rgba(221,178,255,0.95)",
          thrustOuter: "rgba(136,112,255,0.9)",
          sideFlame: "rgba(203,176,255,0.95)",
          points: [
            [1.0, 0],
            [-0.92, -0.66],
            [-0.3, -0.1],
            [-0.72, 0],
            [-0.3, 0.1],
            [-0.92, 0.66]
          ],
          detail: "fang"
        },
        helix_frame: {
          fill: "rgba(121,232,198,0.18)",
          stroke: "#d8fff0",
          shieldColor: "157,255,209",
          thrustInner: "rgba(176,255,214,0.95)",
          thrustOuter: "rgba(102,231,196,0.88)",
          sideFlame: "rgba(176,255,214,0.92)",
          points: [
            [0.98, 0],
            [-0.96, -0.62],
            [-0.56, -0.12],
            [-0.72, 0],
            [-0.56, 0.12],
            [-0.96, 0.62]
          ],
          detail: "orb"
        }
      };
      const shipStyle = shipVisualProfiles[model.identity?.shipId] || shipVisualProfiles.viper_mk2;

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      ctx.shadowColor = "rgba(170,247,255,0.9)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = shipStyle.fill;
      ctx.strokeStyle = shipStyle.stroke;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      const hullPoints = shipStyle.points;
      ctx.moveTo(ship.radius * hullPoints[0][0], ship.radius * hullPoints[0][1]);
      for (let i = 1; i < hullPoints.length; i += 1) {
        ctx.lineTo(ship.radius * hullPoints[i][0], ship.radius * hullPoints[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (shipStyle.detail === "spine") {
        ctx.strokeStyle = "rgba(182,245,255,0.8)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(ship.radius * 0.35, 0);
        ctx.lineTo(-ship.radius * 0.54, 0);
        ctx.stroke();
      } else if (shipStyle.detail === "core") {
        ctx.strokeStyle = "rgba(233,245,255,0.8)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(-ship.radius * 0.2, 0, ship.radius * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shipStyle.detail === "fang") {
        ctx.strokeStyle = "rgba(226,214,255,0.82)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(ship.radius * 0.2, 0);
        ctx.lineTo(-ship.radius * 0.18, -ship.radius * 0.18);
        ctx.moveTo(ship.radius * 0.2, 0);
        ctx.lineTo(-ship.radius * 0.18, ship.radius * 0.18);
        ctx.stroke();
      } else if (shipStyle.detail === "orb") {
        ctx.strokeStyle = "rgba(189,255,226,0.82)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.arc(-ship.radius * 0.26, 0, ship.radius * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (ship.shield > 0) {
        const shieldRatio = ship.shield / ship.shieldMax;
        const shieldColor = shipStyle.shieldColor || "128,229,255";
        ctx.strokeStyle = `rgba(${shieldColor},${0.22 + shieldRatio * 0.5})`;
        ctx.lineWidth = 1.2 + shieldRatio * 1.8;
        ctx.shadowColor = `rgba(${shieldColor},0.75)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, ship.radius * 1.24, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (model.gameState === GAME_STATE.PLAYING && input.isDown("ArrowUp")) {
        const jetGradient = ctx.createLinearGradient(-ship.radius * 1.6, 0, -ship.radius * 0.8, 0);
        jetGradient.addColorStop(0, shipStyle.thrustOuter);
        jetGradient.addColorStop(1, shipStyle.thrustInner);
        ctx.shadowColor = shipStyle.thrustOuter;
        ctx.shadowBlur = 16;
        ctx.fillStyle = jetGradient;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.95, -ship.radius * 0.35);
        ctx.lineTo(-ship.radius * 1.45, 0);
        ctx.lineTo(-ship.radius * 0.95, ship.radius * 0.35);
        ctx.closePath();
        ctx.fill();
      }

      if (model.gameState === GAME_STATE.PLAYING && input.isDown("ArrowLeft")) {
        ctx.fillStyle = shipStyle.sideFlame;
        ctx.shadowColor = shipStyle.sideFlame;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.24, ship.radius * 0.38);
        ctx.lineTo(-ship.radius * 0.72, ship.radius * 0.58);
        ctx.lineTo(-ship.radius * 0.32, ship.radius * 0.08);
        ctx.closePath();
        ctx.fill();
      }

      if (model.gameState === GAME_STATE.PLAYING && input.isDown("ArrowRight")) {
        ctx.fillStyle = shipStyle.sideFlame;
        ctx.shadowColor = shipStyle.sideFlame;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.24, -ship.radius * 0.38);
        ctx.lineTo(-ship.radius * 0.72, -ship.radius * 0.58);
        ctx.lineTo(-ship.radius * 0.32, -ship.radius * 0.08);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    drawBullets(bullets) {
      const { ctx } = this;
      for (const bullet of bullets) {
        const isSecondary = bullet.kind && bullet.kind.startsWith("secondary");
        const isPrimaryRail = bullet.kind === "primary_rail";
        const isPrimarySpread = bullet.kind === "primary_spread";
        const isPrimaryChain = bullet.kind === "primary_chain";
        let coreColor = "#f5ffff";
        let glowInner = "rgba(255,255,255,0.9)";
        let glowOuter = "rgba(110,220,255,0)";
        if (isSecondary) {
          coreColor = "#ffe8bf";
          glowInner = "rgba(255,214,140,0.95)";
          glowOuter = "rgba(255,182,104,0)";
        } else if (isPrimaryRail) {
          coreColor = "#f4dcff";
          glowInner = "rgba(232,186,255,0.95)";
          glowOuter = "rgba(186,116,255,0)";
        } else if (isPrimarySpread) {
          coreColor = "#d4fff1";
          glowInner = "rgba(156,255,214,0.92)";
          glowOuter = "rgba(91,222,170,0)";
        } else if (isPrimaryChain) {
          coreColor = "#e7fbff";
          glowInner = "rgba(167,240,255,0.96)";
          glowOuter = "rgba(109,196,255,0)";
        }

        const trail = ctx.createRadialGradient(
          bullet.x,
          bullet.y,
          0,
          bullet.x,
          bullet.y,
          bullet.radius * (isSecondary ? 7 : 5.5)
        );
        trail.addColorStop(0, glowInner);
        trail.addColorStop(1, glowOuter);
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius * (isSecondary ? 7 : 5.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = isSecondary
          ? "rgba(255,202,120,0.95)"
          : isPrimaryRail
            ? "rgba(229,160,255,0.95)"
            : isPrimaryChain
              ? "rgba(145,220,255,0.95)"
              : "rgba(170,245,255,0.9)";
        ctx.shadowBlur = isSecondary || isPrimaryRail ? 18 : 14;
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        if (isPrimaryChain) {
          ctx.strokeStyle = "rgba(145,224,255,0.7)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(bullet.x - bullet.radius * 3, bullet.y);
          ctx.lineTo(bullet.x + bullet.radius * 3, bullet.y);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
    }

    drawUtilityEffects(effects) {
      const { ctx } = this;
      for (const effect of effects) {
        const alpha = Math.max(0, effect.life / effect.ttl);
        const strokeColor =
          effect.type === "emp"
            ? `rgba(189,124,255,${alpha * 0.9})`
            : effect.type === "shield"
              ? `rgba(123,255,183,${alpha * 0.85})`
              : `rgba(138,234,255,${alpha * 0.9})`;
        const glowColor =
          effect.type === "emp"
            ? `rgba(189,124,255,${alpha})`
            : effect.type === "shield"
              ? `rgba(123,255,183,${alpha})`
              : `rgba(125,232,255,${alpha})`;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3 + alpha * 4;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    drawEnemyBullets(bullets) {
      const { ctx } = this;
      for (const bullet of bullets) {
        if (bullet.isMine) {
          const pulse = 0.55 + Math.sin((bullet.ttl ?? 0) * 10) * 0.18;
          const glow = ctx.createRadialGradient(
            bullet.x,
            bullet.y,
            0,
            bullet.x,
            bullet.y,
            bullet.radius * 7
          );
          glow.addColorStop(0, `rgba(255,188,118,${0.85 * pulse})`);
          glow.addColorStop(1, "rgba(255,188,118,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, bullet.radius * 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffe3c6";
          ctx.beginPath();
          ctx.arc(bullet.x, bullet.y, bullet.radius * 0.95, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        const glow = ctx.createRadialGradient(
          bullet.x,
          bullet.y,
          0,
          bullet.x,
          bullet.y,
          bullet.radius * 6
        );
        glow.addColorStop(0, "rgba(255,130,212,0.9)");
        glow.addColorStop(1, "rgba(255,130,212,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffd3f2";
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawAsteroids(asteroids) {
      const { ctx } = this;

      for (const asteroid of asteroids) {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);

        if (asteroid.asteroidType === "magnetic") {
          ctx.shadowColor = "rgba(109,161,255,0.6)";
          ctx.fillStyle = "rgba(57,84,140,0.34)";
          ctx.strokeStyle = "rgba(152,199,255,0.95)";
        } else if (asteroid.asteroidType === "volatile") {
          ctx.shadowColor = "rgba(255,141,103,0.65)";
          ctx.fillStyle = "rgba(126,65,49,0.33)";
          ctx.strokeStyle = "rgba(255,181,142,0.98)";
        } else {
          ctx.shadowColor = "rgba(90,193,255,0.5)";
          ctx.fillStyle = "rgba(56,88,123,0.30)";
          ctx.strokeStyle = "rgba(142,224,255,0.95)";
        }

        ctx.shadowBlur = 10;
        ctx.lineWidth = 1.8;

        ctx.beginPath();
        for (let i = 0; i < asteroid.shape.length; i += 1) {
          const angle = (i / asteroid.shape.length) * Math.PI * 2;
          const radius = asteroid.radius * asteroid.shape[i];
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (asteroid.asteroidType === "magnetic") {
          ctx.strokeStyle = "rgba(137,187,255,0.38)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, asteroid.radius * 1.25, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (asteroid.asteroidType === "volatile") {
          ctx.fillStyle = "rgba(255,124,88,0.35)";
          ctx.beginPath();
          ctx.arc(0, 0, asteroid.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    drawUfos(ufos) {
      const { ctx } = this;
      for (const ufo of ufos) {
        const paletteByMode = {
          hunter: { body: "rgba(208,109,255,0.36)", line: "rgba(240,177,255,0.95)", glow: "rgba(215,132,255,0.7)" },
          sniper: { body: "rgba(255,92,183,0.34)", line: "rgba(255,167,220,0.95)", glow: "rgba(255,120,203,0.7)" },
          swarm: { body: "rgba(118,232,255,0.33)", line: "rgba(178,244,255,0.96)", glow: "rgba(124,228,255,0.74)" },
          kamikaze: { body: "rgba(255,116,116,0.36)", line: "rgba(255,183,183,0.97)", glow: "rgba(255,128,128,0.78)" },
          support: { body: "rgba(124,255,180,0.32)", line: "rgba(188,255,217,0.95)", glow: "rgba(143,255,200,0.75)" },
          mine_layer: { body: "rgba(255,194,118,0.33)", line: "rgba(255,226,176,0.97)", glow: "rgba(255,210,145,0.75)" }
        };
        const palette = paletteByMode[ufo.mode] || paletteByMode.hunter;
        const bodyColor = palette.body;
        const lineColor = palette.line;

        ctx.save();
        ctx.translate(ufo.x, ufo.y);
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 16;

        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.ellipse(0, 2, ufo.radius, ufo.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(0, -4, ufo.radius * 0.48, ufo.radius * 0.28, 0, Math.PI, 0);
        ctx.stroke();

        if (ufo.disabledTimer > 0) {
          ctx.strokeStyle = "rgba(123,230,255,0.95)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, ufo.radius * 1.26, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (ufo.elitePrefix) {
          ctx.strokeStyle = "rgba(255,228,160,0.95)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, ufo.radius * 1.42, 0, Math.PI * 2);
          ctx.stroke();
        }

        const hpRatio = Math.max(0, Math.min(1, (ufo.hp ?? 1) / (ufo.maxHp ?? 1)));
        const barWidth = ufo.radius * 1.8;
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(-barWidth / 2, ufo.radius + 8, barWidth, 4);
        ctx.fillStyle = "rgba(178,255,213,0.95)";
        ctx.fillRect(-barWidth / 2, ufo.radius + 8, barWidth * hpRatio, 4);

        ctx.restore();
      }
    }

    drawMiniBoss(boss) {
      if (!boss) return;
      const { ctx } = this;
      const isFinalBoss = Boolean(boss.isFinalBoss);
      const weakpointColor = boss.weakpointOpen
        ? isFinalBoss
          ? "rgba(158,242,255,0.99)"
          : "rgba(138,240,255,0.98)"
        : isFinalBoss
          ? "rgba(255,214,150,0.96)"
          : "rgba(255,180,235,0.95)";
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.shadowColor = isFinalBoss ? "rgba(255,188,124,0.88)" : "rgba(255,120,210,0.85)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = isFinalBoss ? "rgba(196,108,54,0.44)" : "rgba(174,72,145,0.42)";
      ctx.strokeStyle = weakpointColor;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(0, 0, boss.radius * 1.35, boss.radius * 0.74, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, -boss.radius * 0.38, boss.radius * 0.72, boss.radius * 0.35, 0, Math.PI, 0);
      ctx.stroke();

      const weakpointPulse = boss.weakpointOpen
        ? 0.75 + Math.sin((boss.phase ?? 0) * 8) * 0.25
        : 0.4 + Math.sin((boss.phase ?? 0) * 4) * 0.1;
      ctx.fillStyle = boss.weakpointOpen
        ? `rgba(142,243,255,${weakpointPulse})`
        : "rgba(255,166,219,0.52)";
      ctx.beginPath();
      ctx.arc(0, -boss.radius * 0.16, boss.radius * 0.23, 0, Math.PI * 2);
      ctx.fill();

      if (isFinalBoss) {
        ctx.strokeStyle = "rgba(255,226,168,0.9)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius * 1.58 + Math.sin((boss.phase ?? 0) * 2.6) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (boss.phaseAnnounceTimer > 0) {
        ctx.textAlign = "center";
        ctx.font = "700 14px Trebuchet MS";
        ctx.fillStyle = isFinalBoss ? "rgba(255,238,176,0.98)" : "rgba(255,223,146,0.96)";
        ctx.fillText(`${isFinalBoss ? "FINAL " : ""}PHASE ${boss.phaseIndex + 1}`, 0, -boss.radius * 1.55);
      }

      const hpRatio = Math.max(0, boss.hp / boss.maxHp);
      const barWidth = boss.radius * 2.2;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-barWidth / 2, boss.radius + 10, barWidth, 7);
      ctx.fillStyle = isFinalBoss ? "rgba(255,184,108,0.96)" : "rgba(255,134,204,0.95)";
      ctx.fillRect(-barWidth / 2, boss.radius + 10, barWidth * hpRatio, 7);
      ctx.restore();
    }

    drawParticles(particles) {
      const { ctx } = this;
      for (const p of particles) {
        const alpha = Math.max(0, p.life / p.ttl);
        if (p.kind === "ring") {
          ctx.strokeStyle = `rgba(${p.color},${alpha * 0.85})`;
          ctx.lineWidth = Math.max(1, p.radius * 0.07);
          ctx.shadowColor = `rgba(${p.color},${Math.min(1, alpha)})`;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }
        if (p.kind === "debris") {
          ctx.fillStyle = `rgba(${p.color},${alpha})`;
          ctx.shadowColor = `rgba(${p.color},${Math.min(1, alpha + 0.12)})`;
          ctx.shadowBlur = 6;
          const size = p.radius * (0.42 + alpha * 0.65);
          ctx.fillRect(p.x - size * 0.5, p.y - size * 0.5, size, size);
          continue;
        }
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        ctx.shadowColor = `rgba(${p.color},${Math.min(1, alpha + 0.2)})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (0.4 + alpha * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    drawVignette() {
      const { ctx, config } = this;
      const gradient = ctx.createRadialGradient(
        config.canvas.width * 0.5,
        config.canvas.height * 0.5,
        config.canvas.height * 0.22,
        config.canvas.width * 0.5,
        config.canvas.height * 0.5,
        config.canvas.height * 0.7
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
    }

    drawFlash(flashMs) {
      if (flashMs <= 0) return;
      const { ctx, config } = this;
      const alpha = Math.min(0.25, flashMs / 480);
      ctx.fillStyle = `rgba(180,246,255,${alpha})`;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
    }

    drawMissionEnvironment(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      const effects = mission.modifierEffects || {};
      if (mission.biomeId === "graveyard") {
        ctx.fillStyle = "rgba(118,142,170,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        ctx.strokeStyle = "rgba(132,168,212,0.22)";
        ctx.lineWidth = 1.1;
        for (let i = 0; i < 6; i += 1) {
          const drift = Math.sin(performance.now() * 0.0006 + i * 0.9) * 12;
          const x = 120 + i * 150 + drift;
          const y = 90 + (i % 2) * 120;
          ctx.strokeRect(x, y, 58, 20);
          ctx.beginPath();
          ctx.moveTo(x - 14, y + 10);
          ctx.lineTo(x + 72, y + 10);
          ctx.stroke();
        }
        ctx.restore();
      } else if (mission.biomeId === "refinery") {
        ctx.fillStyle = "rgba(158,112,74,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < 4; i += 1) {
          const y = 120 + i * 140 + Math.sin(performance.now() * 0.0012 + i) * 6;
          const heatLine = ctx.createLinearGradient(0, y, config.canvas.width, y + 22);
          heatLine.addColorStop(0, "rgba(255,172,108,0)");
          heatLine.addColorStop(0.5, "rgba(255,172,108,0.18)");
          heatLine.addColorStop(1, "rgba(255,172,108,0)");
          ctx.fillStyle = heatLine;
          ctx.fillRect(0, y, config.canvas.width, 22);
        }
        ctx.fillStyle = "rgba(255,201,142,0.12)";
        for (let i = 0; i < 5; i += 1) {
          const x = 96 + i * 180;
          ctx.fillRect(x, 36, 4, config.canvas.height - 72);
        }
        ctx.restore();
      } else if (mission.biomeId === "belt") {
        ctx.fillStyle = "rgba(132,164,188,0.07)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < 6; i += 1) {
          const y = 84 + i * 104 + Math.sin(performance.now() * 0.0009 + i * 0.8) * 8;
          const beltLine = ctx.createLinearGradient(0, y, config.canvas.width, y + 18);
          beltLine.addColorStop(0, "rgba(172,214,238,0)");
          beltLine.addColorStop(0.5, "rgba(172,214,238,0.15)");
          beltLine.addColorStop(1, "rgba(172,214,238,0)");
          ctx.fillStyle = beltLine;
          ctx.fillRect(0, y, config.canvas.width, 18);
        }
        ctx.fillStyle = "rgba(188,228,245,0.26)";
        for (let i = 0; i < 18; i += 1) {
          const t = performance.now() * 0.00015 + i * 0.31;
          const x = (t * config.canvas.width * 0.35 + i * 72) % (config.canvas.width + 24) - 12;
          const y = 70 + (i % 6) * 110 + Math.sin(t * 7 + i) * 11;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.restore();
      } else if (mission.biomeId === "ion_field") {
        ctx.fillStyle = "rgba(98,132,204,0.08)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < 4; i += 1) {
          const y = 92 + i * 150;
          const alpha = 0.16 + Math.sin(performance.now() * 0.0018 + i * 1.4) * 0.06;
          ctx.strokeStyle = `rgba(166,196,255,${Math.max(0.06, alpha)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= config.canvas.width; x += 48) {
            const waveY = y + Math.sin(x * 0.018 + performance.now() * 0.003 + i) * 8;
            ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
        for (let i = 0; i < 10; i += 1) {
          const pulse = 0.2 + Math.sin(performance.now() * 0.0022 + i * 0.7) * 0.1;
          const x = 72 + i * 92;
          const y = 64 + (i % 5) * 118;
          ctx.strokeStyle = `rgba(184,206,255,${Math.max(0.08, pulse)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 18 + i % 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (mission.biomeId === "shattered_relay") {
        ctx.fillStyle = "rgba(126,138,170,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < 6; i += 1) {
          const pulse = 0.2 + Math.sin(performance.now() * 0.0022 + i * 0.7) * 0.14;
          const x = 88 + i * 146;
          const y = 74 + (i % 3) * 186;
          ctx.strokeStyle = `rgba(192,206,255,${Math.max(0.08, pulse)})`;
          ctx.lineWidth = 1.1;
          ctx.strokeRect(x, y, 42, 16);
          ctx.beginPath();
          ctx.moveTo(x + 42, y + 8);
          ctx.lineTo(x + 58, y + 8);
          ctx.stroke();
        }
        ctx.restore();
      } else if (mission.biomeId === "cryo_ring") {
        ctx.fillStyle = "rgba(126,188,218,0.08)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < 5; i += 1) {
          const y = 86 + i * 126 + Math.sin(performance.now() * 0.0013 + i) * 7;
          const line = ctx.createLinearGradient(0, y, config.canvas.width, y + 18);
          line.addColorStop(0, "rgba(196,236,255,0)");
          line.addColorStop(0.5, "rgba(196,236,255,0.16)");
          line.addColorStop(1, "rgba(196,236,255,0)");
          ctx.fillStyle = line;
          ctx.fillRect(0, y, config.canvas.width, 18);
        }
        ctx.restore();
      }

      if ((effects.fogAlpha ?? 0) > 0) {
        const alpha = Math.min(0.5, effects.fogAlpha);
        const fog = ctx.createRadialGradient(
          config.canvas.width * 0.5,
          config.canvas.height * 0.5,
          config.canvas.height * 0.1,
          config.canvas.width * 0.5,
          config.canvas.height * 0.5,
          config.canvas.height * 0.75
        );
        fog.addColorStop(0, `rgba(28,44,82,${alpha * 0.25})`);
        fog.addColorStop(1, `rgba(10,16,30,${alpha})`);
        ctx.fillStyle = fog;
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      }

      if (mission.gravityAnomaly) {
        const anomaly = mission.gravityAnomaly;
        ctx.save();
        ctx.strokeStyle = "rgba(146,186,255,0.38)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(anomaly.x, anomaly.y, anomaly.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(132,174,255,0.12)";
        ctx.beginPath();
        ctx.arc(anomaly.x, anomaly.y, anomaly.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const biomeHazards = mission.biomeHazards || [];
      for (const hazard of biomeHazards) {
        const pulseRadius =
          hazard.type === "plasma_vent"
            ? hazard.radius * (0.84 + Math.sin((hazard.phase ?? 0) * 2.8) * 0.16)
            : hazard.radius;
        ctx.save();
        if (hazard.type === "debris_field") {
          const ringPulse = 0.9 + Math.sin((hazard.phase ?? 0) * 3.6) * 0.1;
          ctx.strokeStyle = "rgba(140,205,255,0.55)";
          ctx.fillStyle = "rgba(96,146,198,0.09)";
          ctx.lineWidth = 1.4 + ringPulse * 0.4;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(186,224,255,0.62)";
          for (let i = 0; i < 8; i += 1) {
            const orbit = (i / 8) * Math.PI * 2 + (hazard.phase ?? 0) * 1.4;
            const ox = hazard.x + Math.cos(orbit) * pulseRadius * 0.78;
            const oy = hazard.y + Math.sin(orbit) * pulseRadius * 0.78;
            ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
          }
        } else if (hazard.type === "plasma_vent") {
          const alpha = 0.38 + Math.sin((hazard.phase ?? 0) * 3.3) * 0.14;
          ctx.strokeStyle = `rgba(255,166,108,${alpha})`;
          ctx.fillStyle = `rgba(255,126,74,${Math.max(0.08, alpha * 0.3)})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = `rgba(255,214,148,${Math.min(0.7, alpha + 0.2)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius * 0.58, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(255,221,146,0.34)";
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (hazard.type === "relay_jammer_burst") {
          const cycle = Math.max(0.2, hazard.pulseCycleSeconds || 2.6);
          const windowSeconds = Math.max(0.08, Math.min(cycle, hazard.pulseWindowSeconds || 0.7));
          const pulsePhase = (hazard.phase ?? 0) % cycle;
          const pulseActive = pulsePhase <= windowSeconds;
          const alpha = pulseActive ? 0.52 : 0.26;
          ctx.strokeStyle = `rgba(194,204,255,${alpha})`;
          ctx.fillStyle = `rgba(122,140,194,${pulseActive ? 0.18 : 0.09})`;
          ctx.lineWidth = pulseActive ? 2 : 1.2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          if (pulseActive) {
            for (let i = 0; i < 3; i += 1) {
              const r = pulseRadius * (0.34 + i * 0.22);
              ctx.strokeStyle = `rgba(216,224,255,${0.3 - i * 0.08})`;
              ctx.beginPath();
              ctx.arc(hazard.x, hazard.y, r, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        } else if (hazard.type === "cryo_shear_zone") {
          const chill = 0.24 + Math.sin((hazard.phase ?? 0) * 2.1) * 0.08;
          ctx.strokeStyle = `rgba(176,236,255,${Math.max(0.12, chill + 0.18)})`;
          ctx.fillStyle = `rgba(132,212,248,${Math.max(0.06, chill * 0.32)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "rgba(214,246,255,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hazard.x - pulseRadius * 0.6, hazard.y);
          ctx.lineTo(hazard.x + pulseRadius * 0.6, hazard.y);
          ctx.moveTo(hazard.x, hazard.y - pulseRadius * 0.6);
          ctx.lineTo(hazard.x, hazard.y + pulseRadius * 0.6);
          ctx.stroke();
        }
        ctx.restore();
      }

      const warnings = [];
      if ((effects.shieldDrainPerSecond ?? 0) > 0) warnings.push("ION STORM");
      if (mission.gravityAnomaly) warnings.push("GRAVITY ANOMALY");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "debris_field")) warnings.push("DEBRIS FIELD");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "plasma_vent")) warnings.push("PLASMA VENT");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "relay_jammer_burst" && hazard.pulseActive)) {
        warnings.push("RELAY JAMMER");
      }
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "cryo_shear_zone")) warnings.push("CRYO SHEAR");
      if (model.miniBoss?.phaseAnnounceTimer > 0) warnings.push(`BOSS PHASE ${model.miniBoss.phaseIndex + 1}`);
      if (model.uiAlerts?.lowHull) warnings.push("HULL CRITICAL");
      if (model.uiAlerts?.highHeat) warnings.push("HEAT CRITICAL");
      if (!warnings.length) return;

      const warningText = warnings.join(" | ");
      const alpha = 0.58 + Math.sin(performance.now() / 120) * 0.22;
      ctx.save();
      ctx.textAlign = "right";
      ctx.font = "700 14px Trebuchet MS";
      ctx.fillStyle = `rgba(255,188,116,${Math.max(0.28, alpha)})`;
      ctx.fillText(warningText, config.canvas.width - 16, config.canvas.height - 16);
      ctx.restore();
    }

    drawMissionStatus(model) {
      if (model.gameState !== GAME_STATE.PLAYING || !model.currentMission) return;
      const { ctx, config } = this;
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(215,246,255,0.95)";
      ctx.font = "600 18px Trebuchet MS";
      ctx.fillText(`Sector ${model.sector}: ${model.currentMission.label}`, config.canvas.width / 2, 28);
      ctx.font = "500 16px Trebuchet MS";
      ctx.fillStyle = "rgba(186,232,255,0.92)";
      ctx.fillText(model.currentMission.objectiveText || "", config.canvas.width / 2, 50);
      if (model.currentMission.contextText) {
        ctx.font = "500 13px Trebuchet MS";
        ctx.fillStyle = "rgba(160,236,202,0.92)";
        ctx.fillText(model.currentMission.contextText, config.canvas.width / 2, 68);
      }
      const biomeName = model.currentMission.biomeLabel || "Outer Void";
      const activeHazards = (model.currentMission.biomeHazards || []).filter((hazard) => hazard.active);
      const hazardLabel = (type) =>
        type === "debris_field"
          ? "Debris Field"
          : type === "plasma_vent"
            ? "Plasma Vent"
            : type === "relay_jammer_burst"
              ? "Relay Jammer"
              : type === "cryo_shear_zone"
                ? "Cryo Shear"
                : type;
      const activeHazardText = activeHazards.length
        ? activeHazards.map((hazard) => hazardLabel(hazard.type)).join(", ")
        : "None";
      const potentialHazard = (model.currentMission.biomeHazards || [])[0];
      const potentialText = potentialHazard ? hazardLabel(potentialHazard.type) : "None";
      ctx.font = "500 12px Trebuchet MS";
      ctx.fillStyle = "rgba(178,236,255,0.9)";
      ctx.fillText(
        `Biome: ${biomeName} | Hazard: ${activeHazards.length ? `ACTIVE ${activeHazardText}` : `Potential ${potentialText}`}`,
        config.canvas.width / 2,
        84
      );
      if (model.currentMission.biomeEventText) {
        ctx.font = "600 12px Trebuchet MS";
        ctx.fillStyle = "rgba(255,224,162,0.94)";
        ctx.fillText(model.currentMission.biomeEventText, config.canvas.width / 2, 100);
      }
      if ((model.currentMission.biomeIntroTimer ?? 0) > 0) {
        const ratio = Math.min(1, model.currentMission.biomeIntroTimer / 1.9);
        const alpha = Math.max(0, Math.min(0.9, ratio * 0.9));
        const width = 380;
        const x = config.canvas.width / 2 - width / 2;
        ctx.fillStyle = `rgba(3,12,24,${alpha * 0.78})`;
        ctx.fillRect(x, 110, width, 42);
        ctx.strokeStyle = `rgba(105,224,255,${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.strokeRect(x, 110, width, 42);
        ctx.font = "700 14px Trebuchet MS";
        ctx.fillStyle = `rgba(214,244,255,${alpha})`;
        ctx.fillText(`ENTERING BIOME: ${biomeName.toUpperCase()}`, config.canvas.width / 2, 136);
      }
      if (model.actionHint?.timer > 0 && model.actionHint.text) {
        const alpha = Math.max(0.25, Math.min(1, model.actionHint.timer / 1.1));
        ctx.font = "600 13px Trebuchet MS";
        ctx.fillStyle = `rgba(255,214,154,${alpha})`;
        ctx.fillText(model.actionHint.text, config.canvas.width / 2, config.canvas.height - 34);
      }
      ctx.restore();
    }

    drawTelemetry(model) {
      if (!model.telemetry?.enabled) return;

      const { ctx, config } = this;
      const telemetry = model.telemetry;
      const panelX = 18;
      const panelY = 72;
      const panelW = 410;
      const panelH = 312;
      const lineStep = 18;
      let lineY = panelY + 26;

      const drawLine = (text, color = "rgba(216,245,255,0.95)") => {
        ctx.fillStyle = color;
        ctx.fillText(text, panelX + 14, lineY);
        lineY += lineStep;
      };

      ctx.save();
      ctx.fillStyle = "rgba(4,12,22,0.78)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "rgba(132,220,255,0.55)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(panelX, panelY, panelW, panelH);
      ctx.textAlign = "left";
      ctx.font = "600 14px Trebuchet MS";

      drawLine(
        `TELEMETRY [F3]  State:${model.gameState.toUpperCase()}  Run:${telemetry.runTimeSeconds.toFixed(1)}s`,
        "rgba(162,233,255,1)"
      );
      drawLine(
        `Score:${telemetry.scoreEarned}  Credits:${telemetry.creditsEarned}  Missions:${telemetry.completedMissions}`
      );
      drawLine(
        `Kills A:${telemetry.kills.asteroids}  U:${telemetry.kills.ufos}  B:${telemetry.kills.miniBosses}  Hits:${telemetry.playerHitsTaken}`
      );
      drawLine(
        `Shots P:${telemetry.shots.primary}  S:${telemetry.shots.secondary}  U:${telemetry.shots.utility}  Enemy:${telemetry.shots.enemy}`
      );
      if (telemetry.powerAudit) {
        const p = telemetry.powerAudit;
        drawLine(
          `Power G:${p.gear.toFixed(1)} P:${p.pilot.toFixed(1)} I:${p.identity.toFixed(1)} B:${p.biomeEvent.toFixed(1)} T:${p.total.toFixed(1)}`,
          "rgba(176,240,210,0.95)"
        );
      }
      const blocks = telemetry.actionBlocks || {};
      drawLine(
        `Blocks E:${blocks.energy ?? 0} S:${blocks.shield ?? 0} H:${blocks.heat ?? 0} C:${blocks.cooldown ?? 0} M:${blocks.magazine ?? 0}`,
        "rgba(255,218,172,0.92)"
      );
      const ship = model.ship;
      if (ship) {
        drawLine(
          `Flight:${model.flightModel.toUpperCase()}  Hull:${Math.ceil(ship.hull)}/${ship.hullMax} Shield:${Math.ceil(ship.shield)}/${ship.shieldMax}`,
          "rgba(170,214,255,0.92)"
        );
        drawLine(
          `Energy:${Math.ceil(ship.energy)}/${ship.energyMax} Heat:${Math.ceil(ship.heat)}/${ship.heatMax} Dash:${model.dashCooldown.toFixed(1)}s`,
          "rgba(170,214,255,0.92)"
        );
      }

      const currentMission = model.currentMission;
      if (currentMission) {
        drawLine(
          `Sector ${model.sector}: ${currentMission.label} (${currentMission.type})`,
          "rgba(189,255,208,0.96)"
        );
        drawLine(currentMission.objectiveText || "-", "rgba(189,255,208,0.9)");
      } else {
        drawLine("Mission: -", "rgba(189,255,208,0.9)");
      }

      const last = telemetry.lastMission;
      if (last) {
        drawLine(
          `Last Sector ${last.sector} ${last.label}: +${last.scoreGained} score, +${last.creditsGained} cr, ${last.durationSeconds.toFixed(1)}s`,
          "rgba(255,224,170,0.96)"
        );
        drawLine(
          `Last Kills A:${last.asteroidKills} U:${last.ufoKills} B:${last.miniBossKills} | Uses S:${last.secondaryUses} U:${last.utilityUses}`,
          "rgba(255,224,170,0.9)"
        );
      } else {
        drawLine("Last mission summary: -", "rgba(255,224,170,0.9)");
      }

      drawLine(
        `Objects Ast:${model.asteroids.length} UFO:${model.ufos.length} Bullets:${model.bullets.length}/${model.enemyBullets.length} Part:${model.particles.length}`,
        "rgba(170,214,255,0.9)"
      );

      ctx.font = "500 12px Trebuchet MS";
      ctx.fillStyle = "rgba(183,221,247,0.85)";
      ctx.fillText(`Canvas ${config.canvas.width}x${config.canvas.height}`, panelX + 14, panelY + panelH - 12);
      ctx.restore();
    }

    drawPerformanceOverlay(model) {
      if (!model.performance?.enabled) return;

      const { ctx, config } = this;
      const perf = model.performance;
      const panelW = 286;
      const panelH = 216;
      const panelX = config.canvas.width - panelW - 16;
      const panelY = 16;

      const drawLine = (text, y, color = "rgba(216,245,255,0.95)") => {
        ctx.fillStyle = color;
        ctx.fillText(text, panelX + 10, y);
      };

      ctx.save();
      ctx.fillStyle = "rgba(5,14,26,0.82)";
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = "rgba(126,228,255,0.58)";
      ctx.lineWidth = 1.1;
      ctx.strokeRect(panelX, panelY, panelW, panelH);
      ctx.textAlign = "left";
      ctx.font = "600 12px Trebuchet MS";

      drawLine("PERF OVERLAY [B] SNAPSHOT [N]", panelY + 18, "rgba(178,239,255,1)");
      drawLine(
        `Frame ${perf.frameMs.toFixed(2)} ms | FPS ${perf.fps.toFixed(1)}`,
        panelY + 38
      );
      drawLine(
        `Avg ${perf.avgFrameMs.toFixed(2)} ms | Avg FPS ${perf.avgFps.toFixed(1)}`,
        panelY + 56
      );
      const updateTiming = perf.timings?.updateMs;
      const renderTiming = perf.timings?.renderMs;
      drawLine(
        `Update avg/p95 ${updateTiming?.avg?.toFixed(2) ?? "0.00"}/${updateTiming?.p95?.toFixed(2) ?? "0.00"} ms`,
        panelY + 74,
        "rgba(188,230,255,0.93)"
      );
      drawLine(
        `Render avg/p95 ${renderTiming?.avg?.toFixed(2) ?? "0.00"}/${renderTiming?.p95?.toFixed(2) ?? "0.00"} ms`,
        panelY + 92,
        "rgba(188,230,255,0.93)"
      );
      drawLine(
        `Worst ${perf.maxFrameMs.toFixed(2)} ms | Steps ${perf.stepsLastFrame} (${perf.avgSteps.toFixed(2)} avg)`,
        panelY + 110,
        "rgba(196,231,255,0.92)"
      );
      drawLine(
        `Obj P:${perf.objects.particles} B:${perf.objects.bullets}/${perf.objects.enemyBullets}`,
        panelY + 128,
        "rgba(176,226,255,0.92)"
      );
      drawLine(
        `Obj U:${perf.objects.utilityEffects} A:${perf.objects.asteroids} UFO:${perf.objects.ufos}`,
        panelY + 146,
        "rgba(176,226,255,0.92)"
      );
      const topSections = Object.entries(perf.timings?.sections || {})
        .sort((a, b) => (b[1]?.avg ?? 0) - (a[1]?.avg ?? 0))
        .slice(0, 2);
      drawLine(
        `Hot: ${(topSections[0]?.[0] || "-")} ${(topSections[0]?.[1]?.avg ?? 0).toFixed(2)} ms`,
        panelY + 164,
        "rgba(182,220,245,0.9)"
      );
      drawLine(
        `Dropped P:${perf.dropped?.particles ?? 0} B:${perf.dropped?.bullets ?? 0} E:${perf.dropped?.enemyBullets ?? 0} U:${perf.dropped?.utilityEffects ?? 0}`,
        panelY + 182,
        "rgba(176,215,242,0.88)"
      );
      drawLine(
        `Quality ${String(perf.qualityLevel || "high").toUpperCase()} | Frames ${perf.frameCount}`,
        panelY + 198,
        "rgba(156,209,236,0.88)"
      );

      ctx.restore();
    }

    drawStartLogo(centerX, centerY) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(centerX, centerY);

      const ring = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
      ring.addColorStop(0, "rgba(98,216,255,0.2)");
      ring.addColorStop(1, "rgba(98,216,255,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(106,220,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();

      // Same ship glyph is reused in title letters for visual consistency.
      this.drawBrandShipGlyph(0, 10, 28, 26, {
        shadowColor: "rgba(146,225,255,0.92)",
        shadowBlur: 10,
        fillStyle: "rgba(126,206,255,0.2)",
        strokeStyle: "#d6f9ff",
        lineWidth: 1.8
      });

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(6,18,34,0.85)";
      ctx.strokeStyle = "rgba(255,229,161,0.95)";
      ctx.lineWidth = 1.2;
      ctx.fillRect(6, 10, 20, 12);
      ctx.strokeRect(6, 10, 20, 12);
      ctx.fillStyle = "#ffe5a1";
      ctx.font = "700 10px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText("JH", 16, 19);

      ctx.restore();
    }

    drawBrandShipGlyph(centerX, bottomY, width, height, style) {
      const { ctx } = this;
      const topY = bottomY - height;
      const mapX = (originalX) => {
        const normalized = (originalX + 14) / 28;
        return centerX - width / 2 + normalized * width;
      };
      const mapY = (originalY) => {
        const normalized = (originalY + 16) / 26;
        return topY + normalized * height;
      };
      ctx.save();
      ctx.shadowColor = style.shadowColor;
      ctx.shadowBlur = style.shadowBlur;
      ctx.fillStyle = style.fillStyle;
      ctx.strokeStyle = style.strokeStyle;
      ctx.lineWidth = style.lineWidth;
      ctx.beginPath();
      ctx.moveTo(mapX(0), mapY(-16));
      ctx.lineTo(mapX(-14), mapY(10));
      ctx.lineTo(mapX(-7), mapY(4));
      ctx.lineTo(mapX(0), mapY(8));
      ctx.lineTo(mapX(7), mapY(4));
      ctx.lineTo(mapX(14), mapY(10));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    drawStartTitleWithShipAs(title, centerX, baselineY) {
      const { ctx } = this;
      ctx.save();
      ctx.font = "700 54px Trebuchet MS";
      ctx.fillStyle = "#d8f5ff";
      ctx.textAlign = "left";
      const chars = Array.from(title);
      const rightPaddingAfterShip = 5;
      const shipCount = chars.reduce((acc, ch) => acc + (ch === "A" ? 1 : 0), 0);
      const totalWidth = ctx.measureText(title).width + shipCount * rightPaddingAfterShip;
      const startX = centerX - totalWidth / 2;
      const measuredAscent = ctx.measureText("A").actualBoundingBoxAscent || 36;
      const logoAspect = 28 / 26;
      let shipsBefore = 0;

      for (let i = 0; i < chars.length; i += 1) {
        const ch = chars[i];
        const prefix = title.slice(0, i);
        const prefixWithChar = title.slice(0, i + 1);
        const baseX = ctx.measureText(prefix).width;
        const baseNextX = ctx.measureText(prefixWithChar).width;
        const x = startX + baseX + shipsBefore * rightPaddingAfterShip;
        const nextX = startX + baseNextX + shipsBefore * rightPaddingAfterShip;
        const charWidth = Math.max(1, nextX - x);
        if (ch === "A") {
          const shipWidth = Math.min(charWidth * 1.08, charWidth + 4);
          const shipHeight = Math.min(shipWidth / logoAspect, measuredAscent);
          this.drawBrandShipGlyph(x + charWidth / 2, baselineY - 2, shipWidth, shipHeight, {
            shadowColor: "rgba(146,225,255,0.92)",
            shadowBlur: 8.6,
            fillStyle: "rgba(126,206,255,0.2)",
            strokeStyle: "#d6f9ff",
            lineWidth: 1.8
          });
          shipsBefore += 1;
        } else {
          ctx.fillText(ch, x, baselineY);
        }
      }
      ctx.restore();
    }

    drawOverlayBlock(centerX, centerY, width, height) {
      const { ctx } = this;
      ctx.fillStyle = "rgba(4, 13, 24, 0.62)";
      ctx.fillRect(centerX - width / 2, centerY - height / 2, width, height);
      ctx.strokeStyle = "rgba(83, 215, 255, 0.36)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(centerX - width / 2, centerY - height / 2, width, height);
    }

    drawWrappedText(text, centerX, startY, maxWidth, lineHeight, maxLines = 2) {
      const { ctx } = this;
      const value = String(text || "").trim();
      if (!value) return startY;
      const words = value.split(/\s+/).filter(Boolean);
      if (!words.length) return startY;
      const lines = [];
      let current = words[0];
      for (let i = 1; i < words.length; i += 1) {
        const candidate = `${current} ${words[i]}`;
        if (ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
          continue;
        }
        lines.push(current);
        current = words[i];
      }
      lines.push(current);

      if (lines.length > maxLines) {
        lines.length = maxLines;
        let lastLine = lines[maxLines - 1];
        while (lastLine.length > 0 && ctx.measureText(`${lastLine}...`).width > maxWidth) {
          lastLine = lastLine.slice(0, -1).trimEnd();
        }
        lines[maxLines - 1] = `${lastLine}...`;
      }

      for (let i = 0; i < lines.length; i += 1) {
        ctx.fillText(lines[i], centerX, startY + i * lineHeight);
      }
      return startY + (lines.length - 1) * lineHeight;
    }

    drawRunSettingsList(model, centerY) {
      const { ctx, config } = this;
      const centerX = config.canvas.width / 2;
      const pilotId = model.identity?.pilotId;
      const pilotReference = tr(`identity.pilot.${pilotId}.reference`);
      const rows = [
        {
          id: "mode",
          label: tr("overlay.settings_mode"),
          value: model.runMode === "campaign" ? tr("game.run_mode.campaign") : tr("game.run_mode.endless")
        },
        {
          id: "pilot",
          label: tr("overlay.settings_pilot"),
          value: tr(`identity.pilot.${model.identity?.pilotId}.callsign`)
        },
        {
          id: "ship",
          label: tr("overlay.settings_ship"),
          value: tr(`identity.ship.${model.identity?.shipId}.name`)
        }
      ];
      const selected = Math.max(0, Math.min(rows.length - 1, model.overlaySettingsRow ?? 0));
      const rowW = 382;
      const rowH = 30;
      const gap = 8;
      const topY = centerY;
      const pointer = model.pointer || { inside: false, x: 0, y: 0 };
      let showPilotReference = false;
      ctx.textAlign = "center";
      ctx.font = "600 16px Trebuchet MS";
      ctx.fillStyle = "#bfeeff";
      ctx.fillText(tr("overlay.settings_title"), centerX, topY - 16);

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const y = topY + i * (rowH + gap);
        const active = i === selected;
        ctx.fillStyle = active ? "rgba(255,231,168,0.16)" : "rgba(6,18,34,0.7)";
        ctx.fillRect(centerX - rowW / 2, y, rowW, rowH);
        ctx.strokeStyle = active ? "rgba(255,231,168,0.9)" : "rgba(108,216,255,0.46)";
        ctx.lineWidth = active ? 1.7 : 1.1;
        ctx.strokeRect(centerX - rowW / 2, y, rowW, rowH);
        ctx.textAlign = "left";
        ctx.font = "600 14px Trebuchet MS";
        ctx.fillStyle = "rgba(186,226,248,0.92)";
        ctx.fillText(row.label, centerX - rowW / 2 + 10, y + 20);
        ctx.textAlign = "right";
        ctx.fillStyle = "#d8f5ff";
        ctx.fillText(row.value, centerX + rowW / 2 - 10, y + 20);

        if (row.id === "pilot") {
          const valueLeftX = centerX + 34;
          const valueRightX = centerX + rowW / 2 - 8;
          const hovered =
            pointer.inside &&
            pointer.x >= valueLeftX &&
            pointer.x <= valueRightX &&
            pointer.y >= y &&
            pointer.y <= y + rowH;
          if (hovered || active) showPilotReference = true;
        }
      }

      ctx.textAlign = "center";
      ctx.font = "500 13px Trebuchet MS";
      ctx.fillStyle = "rgba(186,226,248,0.86)";
      const hintY = topY + rows.length * (rowH + gap) + 10;
      ctx.fillText(tr("overlay.settings_hint"), centerX, hintY);

      if (showPilotReference) {
        ctx.font = "500 12px Trebuchet MS";
        ctx.fillStyle = "rgba(210,238,252,0.84)";
        ctx.fillText(tr("overlay.pilot_reference", { reference: pilotReference }), centerX, hintY + 18);
        return hintY + 18;
      }

      return hintY;
    }

    drawOverlay(model) {
      const { ctx, config } = this;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

      ctx.fillStyle = "#d8f5ff";
      ctx.textAlign = "center";
      ctx.font = "700 38px Trebuchet MS";

      if (model.gameState === GAME_STATE.START) {
        const centerX = config.canvas.width / 2;
        const centerY = config.canvas.height / 2;
        // Vertically center the whole stack (logo -> info -> setup) as one unit.
        const stackCenterY = centerY - 58;
        const logoY = stackCenterY - 112;
        const titleY = stackCenterY - 28;
        const infoPressY = stackCenterY + 18;
        const infoSeedY = stackCenterY + 50;
        const setupTopY = stackCenterY + 96;
        const setupPanelHeight = 176;
        const setupCenterY = setupTopY + setupPanelHeight / 2;

        this.drawStartLogo(centerX, logoY);
        this.drawStartTitleWithShipAs(tr("render.start.title"), centerX, titleY);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillStyle = "#d8f5ff";
        ctx.fillText(tr("overlay.press_enter_start"), centerX, infoPressY);
        ctx.fillStyle = "rgba(210,239,255,0.94)";
        ctx.fillText(tr("overlay.seed", { seed: model.runSeed ?? "-" }), centerX, infoSeedY);
        if ((model.profile?.stats?.runsPlayed ?? 0) <= 0) {
          const onboardingY = infoSeedY + 24;
          ctx.font = "600 14px Trebuchet MS";
          ctx.fillStyle = "rgba(174,238,209,0.94)";
          ctx.fillText(tr("overlay.onboarding_title"), centerX, onboardingY);
          ctx.font = "500 13px Trebuchet MS";
          ctx.fillStyle = "rgba(196,233,248,0.92)";
          ctx.fillText(tr("overlay.onboarding_line1"), centerX, onboardingY + 18);
          ctx.fillText(tr("overlay.onboarding_line2"), centerX, onboardingY + 34);
          ctx.fillText(tr("overlay.onboarding_line3"), centerX, onboardingY + 50);
        }

        this.drawOverlayBlock(centerX, setupCenterY, 430, setupPanelHeight);
        const modeBottomY = this.drawRunSettingsList(model, setupTopY + 34);
        if (!model.endlessUnlocked) {
          ctx.font = "500 15px Trebuchet MS";
          ctx.fillText(tr("overlay.endless_unlock_hint"), centerX, modeBottomY + 24);
        }
      }

      if (model.gameState === GAME_STATE.GAME_OVER) {
        ctx.fillText(tr("overlay.game_over"), config.canvas.width / 2, config.canvas.height / 2 - 28);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillText(tr("overlay.score", { score: model.score }), config.canvas.width / 2, config.canvas.height / 2 + 8);
        if (model.comboScoringEnabled) {
          ctx.fillText(`End combo: x${model.comboMultiplier.toFixed(2)}`, config.canvas.width / 2, config.canvas.height / 2 + 42);
        } else {
          ctx.fillText(tr("overlay.sector_reached", { sector: model.sector }), config.canvas.width / 2, config.canvas.height / 2 + 42);
        }
        ctx.fillText(tr("overlay.enter_restart"), config.canvas.width / 2, config.canvas.height / 2 + 76);
        this.drawRunSettingsList(model, config.canvas.height / 2 + 102);
      }

      if (model.gameState === GAME_STATE.VICTORY) {
        const summary = model.victorySummary || {};
        const cx = config.canvas.width / 2;
        const cy = config.canvas.height / 2;
        this.drawOverlayBlock(cx, cy + 24, 560, 248);
        ctx.fillStyle = "#d8f5ff";
        ctx.textAlign = "center";
        ctx.font = "700 38px Trebuchet MS";
        ctx.fillText(tr("overlay.victory"), cx, cy - 54);
        ctx.font = "600 20px Trebuchet MS";
        ctx.fillText(tr("overlay.score", { score: summary.score ?? model.score }), cx, cy - 18);
        ctx.fillText(tr("overlay.sector_cleared", { sector: summary.sector ?? model.sector }), cx, cy + 10);
        const identityBottomY = this.drawWrappedText(
          tr("overlay.identity_status", {
            pilot: summary.identity?.pilot || "-",
            ship: summary.identity?.ship || "-"
          }),
          cx,
          cy + 40,
          760,
          26,
          2
        );
        const buildBottomY = this.drawWrappedText(
          tr("overlay.build", {
            primary: summary.loadout?.primary || "-",
            secondary: summary.loadout?.secondary || "-",
            utility: summary.loadout?.utility || "-"
          }),
          cx,
          identityBottomY + 30,
          760,
          24,
          2
        );
        ctx.font = "600 17px Trebuchet MS";
        ctx.fillText(
          tr("overlay.runtime", { seconds: (summary.runtimeSeconds ?? model.runtimeSeconds).toFixed(1) }),
          cx,
          buildBottomY + 30
        );
        const unlockY = buildBottomY + 58;
        ctx.fillText(
          model.endlessUnlocked
            ? tr("overlay.endless_unlocked")
            : tr("overlay.campaign_complete"),
          cx,
          unlockY
        );
        ctx.fillStyle = "rgba(255,231,168,0.95)";
        ctx.fillText(tr("overlay.enter_new_run"), cx, unlockY + 32);
      }

      if (model.gameState === GAME_STATE.PAUSED) {
        ctx.fillText(tr("overlay.pause"), config.canvas.width / 2, config.canvas.height / 2 - 16);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillText(tr("overlay.press_p_resume"), config.canvas.width / 2, config.canvas.height / 2 + 22);
      }

      if (model.gameState === GAME_STATE.MISSION_COMPLETE) {
        const summary = model.missionCompleteSummary || {};
        const cx = config.canvas.width / 2;
        const cy = config.canvas.height / 2;
        this.drawOverlayBlock(cx, cy + 24, 560, 228);
        ctx.fillStyle = "#d8f5ff";
        ctx.font = "700 38px Trebuchet MS";
        ctx.fillText(tr("overlay.mission_complete"), cx, cy - 26);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillStyle = "rgba(216,245,255,0.96)";
        const messageBottomY = this.drawWrappedText(
          tr("overlay.mission_complete_congrats", {
            pilot: summary.pilot || "-"
          }),
          cx,
          cy + 12,
          500,
          30,
          2
        );
        const sectorY = messageBottomY + 30;
        const scoreY = sectorY + 32;
        const nextY = scoreY + 32;
        ctx.fillText(tr("overlay.mission_complete_sector", { sector: summary.sector ?? model.sector }), cx, sectorY);
        ctx.fillText(tr("overlay.score", { score: summary.score ?? model.score }), cx, scoreY);
        ctx.fillStyle = "rgba(255,231,168,0.95)";
        ctx.fillText(tr("overlay.mission_complete_next"), cx, nextY);
      }

      if (model.gameState === GAME_STATE.HANGAR) {
        const centerX = config.canvas.width / 2;
        const topY = 84;
        const panelGap = 12;
        const layoutX = 68;
        const layoutW = config.canvas.width - layoutX * 2;
        const topRowY = 150;
        const topRowH = 250;
        const bottomRowY = topRowY + topRowH + panelGap;
        const bottomRowH = 220;
        const totalGap = panelGap * 2;
        const colW0 = Math.floor((layoutW - totalGap) * 0.34);
        const colW1 = Math.floor((layoutW - totalGap) * 0.34);
        const colW2 = layoutW - colW0 - colW1 - totalGap;
        const colX0 = layoutX;
        const colX1 = colX0 + colW0 + panelGap;
        const colX2 = colX1 + colW1 + panelGap;
        const hangar = model.hangar;
        const lootCrate = hangar.lootCrate || [];
        const inventory = model.inventory || [];
        const equipment = model.equipment || {};
        const selectedSource = hangar.selectionSource || "crate";
        const selectedIndex = hangar.selectionIndex || 0;
        const navSection = hangar.navSection || "shop";
        const shopIndex = hangar.shopIndex || 0;
        const pilotCursor = hangar.pilotCursor || 0;
        const primaryDefs = config.loadout.primary;
        const secondaryDefs = config.loadout.secondary;
        const utilityDefs = config.loadout.utility;
        const activePrimary = primaryDefs[model.loadout.primaryId];
        const activeSecondary = secondaryDefs[model.loadout.secondaryId];
        const activeUtility = utilityDefs[model.loadout.utilityId];
        const rarityById = {};
        for (const rarity of config.loot.rarities) rarityById[rarity.id] = rarity;

        const slotLabels = {
          hull: "Hull",
          shield: "Shield",
          generator: "Generator",
          engine: "Engine",
          chipset: "Chipset"
        };

        const selectedModule =
          selectedSource === "crate" ? lootCrate[selectedIndex] ?? null : inventory[selectedIndex] ?? null;
        const pilot = model.pilot || {};
        const pilotAttrs = pilot.attributes || {};
        const pilotAttrOrder = ["reflex", "systems", "grit", "instinct"];
        const pilotAttrLabels = {
          reflex: "Reflex",
          systems: "Systems",
          grit: "Grit",
          instinct: "Instinct"
        };
        const pilotPerks = config.pilot?.perks || [];
        const selectedPerkIndex =
          pilotPerks.length > 0 ? Math.max(0, Math.min(hangar.pilotPerkIndex || 0, pilotPerks.length - 1)) : 0;
        const selectedPerk = pilotPerks[selectedPerkIndex] || null;
        const unlockedPerkIds = new Set(pilot.unlockedPerks || []);
        const selectedPilotCallsign = tr(`identity.pilot.${model.identity?.pilotId}.callsign`);
        const fireRateLevel = Math.max(0, Math.floor(model.upgrades?.fireRateLevel || 0));
        const magazineLevel = Math.max(0, Math.floor(model.upgrades?.magazineLevel || 0));
        const fireRateMax = Math.max(1, Math.floor(config.hangar.maxFireRateLevel || 1));
        const magazineMax = Math.max(1, Math.floor(config.hangar.maxMagazineLevel || 1));
        const tuningMultiplier = Math.pow(config.hangar.fireRateFactorPerLevel, fireRateLevel);
        const sectorBonus = Math.min(
          config.bullet.sectorBonusMax,
          Math.floor((model.sector - 1) / config.bullet.sectorBonusEverySectors)
        );
        const maxShots = config.bullet.maxActive + magazineLevel + sectorBonus;

        const truncate = (value, maxLen = 38) => {
          if (!value) return "-";
          return value.length > maxLen ? `${value.slice(0, maxLen - 3)}...` : value;
        };

        const fitText = (text, font, maxWidth) => {
          if (!Number.isFinite(maxWidth) || maxWidth <= 0) return text;
          const source = String(text ?? "-");
          ctx.save();
          ctx.font = font;
          if (ctx.measureText(source).width <= maxWidth) {
            ctx.restore();
            return source;
          }
          const ellipsis = "...";
          let low = 0;
          let high = source.length;
          while (low < high) {
            const mid = Math.ceil((low + high) / 2);
            const candidate = `${source.slice(0, mid)}${ellipsis}`;
            if (ctx.measureText(candidate).width <= maxWidth) low = mid;
            else high = mid - 1;
          }
          const clipped = `${source.slice(0, Math.max(0, low))}${ellipsis}`;
          ctx.restore();
          return clipped;
        };

        const formatModuleShort = (module) => {
          if (!module) return "-";
          return `${truncate(module.name, 22)} | ${slotLabels[module.slot] || module.slot} | ${module.sellValue}cr`;
        };

        const formatPerkRequirements = (perk) => {
          if (!perk) return "-";
          const req = [];
          req.push(`L${perk.levelReq ?? 1}`);
          if (perk.requires) {
            for (const key of Object.keys(perk.requires)) {
              req.push(`${pilotAttrLabels[key] || key}:${perk.requires[key]}`);
            }
          }
          return req.join(" ");
        };

        const drawPanel = (x, y, w, h, title, active = false) => {
          ctx.fillStyle = "rgba(4,12,24,0.78)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = active ? "rgba(255,231,168,0.88)" : "rgba(63,207,255,0.55)";
          ctx.lineWidth = active ? 1.6 : 1.1;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = active ? "#ffe7a8" : "#99ebff";
          ctx.textAlign = "left";
          ctx.font = "700 16px Trebuchet MS";
          ctx.fillText(title, x + 12, y + 22);
          ctx.strokeStyle = "rgba(63,207,255,0.3)";
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 30);
          ctx.lineTo(x + w - 10, y + 30);
          ctx.stroke();
        };

        const drawRow = (x, y, text, color = "#d8f5ff", font = "500 14px Trebuchet MS", maxWidth = 0) => {
          ctx.fillStyle = color;
          ctx.font = font;
          ctx.textAlign = "left";
          const rendered = fitText(text, font, maxWidth);
          ctx.fillText(rendered, x, y);
        };

        const drawSelectableRow = (x, y, w, text, selected, color = "#d8f5ff") => {
          if (selected) {
            ctx.fillStyle = "rgba(255,231,168,0.16)";
            ctx.fillRect(x - 4, y - 13, w, 18);
            ctx.strokeStyle = "rgba(255,231,168,0.7)";
            ctx.strokeRect(x - 4, y - 13, w, 18);
          }
          drawRow(
            x,
            y,
            selected ? `> ${text}` : text,
            selected ? "#ffe7a8" : color,
            "500 13px Trebuchet MS",
            w - 8
          );
        };

        const drawSectionHeader = (x, y, text, maxWidth) => {
          drawRow(x, y, text, "#ffd785", "700 12px Trebuchet MS", maxWidth);
          ctx.strokeStyle = "rgba(63,207,255,0.24)";
          ctx.beginPath();
          ctx.moveTo(x, y + 4);
          ctx.lineTo(x + maxWidth, y + 4);
          ctx.stroke();
        };

        const getWindowStart = (len, selected, rows, centerOffset) =>
          Math.max(0, Math.min(selected - centerOffset, Math.max(0, len - rows)));

        const readMod = (module, key) => module?.modifiers?.[key] ?? 0;
        const formatSeconds = (value) => `${Number(value).toFixed(2)}s`;
        const formatPctDelta = (next, current, invert = false) => {
          const d = (next - current) * 100;
          const good = invert ? d < 0 : d > 0;
          const bad = invert ? d > 0 : d < 0;
          const color = good ? "#9bf5bb" : bad ? "#ff9ea5" : "rgba(216,245,255,0.72)";
          return { text: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`, color };
        };

        ctx.textAlign = "center";
        ctx.fillStyle = "#d8f5ff";
        ctx.font = "700 42px Trebuchet MS";
        ctx.fillText("HANGAR", centerX, topY);
        ctx.font = "600 19px Trebuchet MS";
        const missionOrder = config.mission.order;
        const nextMissionType = missionOrder[model.sector % missionOrder.length];
        ctx.fillText(
          `Credits ${model.credits}  |  Salvage ${model.salvageParts}  |  Next ${nextMissionType.toUpperCase()}`,
          centerX,
          topY + 30
        );
        ctx.font = "600 15px Trebuchet MS";
        ctx.fillStyle = "#9fe3ff";
        ctx.fillText(
          tr("render.hangar.progress_line", {
            cooldown: fireRateLevel,
            cooldownMax: fireRateMax,
            mag: magazineLevel,
            magMax: magazineMax,
            shots: maxShots
          }),
          centerX,
          topY + 52
        );

        drawPanel(colX0, topRowY, colW0, topRowH, "SELECTION LIST", navSection === "loot");
        drawPanel(colX1, topRowY, colW1, topRowH, "SELECTED DETAIL", navSection === "loot");
        drawPanel(colX2, topRowY, colW2, topRowH, "BUILD SNAPSHOT");
        drawPanel(colX0, bottomRowY, colW0, bottomRowH, "SHOP & OPS", navSection === "shop");
        drawPanel(colX1, bottomRowY, colW1, bottomRowH, truncate(selectedPilotCallsign.toUpperCase(), 32), navSection === "pilot");
        drawPanel(colX2, bottomRowY, colW2, bottomRowH, "RUN/STATUS");

        const selX = colX0 + 12;
        let selY = topRowY + 52;
        drawRow(
          selX,
          selY,
          `Source: ${selectedSource.toUpperCase()}  (Crate ${lootCrate.length} | Inv ${inventory.length})`,
          "#9fe3ff",
          "600 12px Trebuchet MS",
          colW0 - 24
        );
        selY += 20;
        const merged = [
          ...lootCrate.map((entry, idx) => ({ source: "crate", entry, idx })),
          ...inventory.map((entry, idx) => ({ source: "inventory", entry, idx }))
        ];
        const mergedIndex = selectedSource === "crate" ? selectedIndex : lootCrate.length + selectedIndex;
        const selectionPos = merged.length > 0 ? Math.max(0, Math.min(merged.length - 1, mergedIndex)) + 1 : 0;
        drawRow(
          selX,
          selY,
          `Up/Down select | Space take/equip | Item ${selectionPos}/${merged.length}`,
          "#d8f5ff",
          "600 12px Trebuchet MS",
          colW0 - 24
        );
        selY += 20;
        const listRows = 10;
        const listStart = getWindowStart(merged.length, mergedIndex, listRows, 4);
        const listTopY = selY - 13;
        const rowHeight = 17;
        const listHeight = rowHeight * listRows;
        const listBarX = colX0 + colW0 - 11;
        for (let i = 0; i < listRows; i += 1) {
          const item = merged[listStart + i];
          if (!item && merged.length === 0 && i === 0) {
            drawSelectableRow(selX, selY, colW0 - 22, tr("render.hangar.empty_selection"), false, "rgba(216,245,255,0.7)");
          } else if (!item) {
            drawSelectableRow(selX, selY, colW0 - 22, "-", false, "rgba(216,245,255,0.38)");
          } else {
            const rarity = rarityById[item.entry.rarity];
            const prefix = item.source === "crate" ? "C" : "I";
            const selected = selectedSource === item.source && selectedIndex === item.idx;
            drawSelectableRow(
              selX,
              selY,
              colW0 - 22,
              `[${prefix}] ${formatModuleShort(item.entry)}`,
              selected,
              rarity?.color || "#d8f5ff"
            );
          }
          selY += 17;
        }
        ctx.fillStyle = "rgba(63,207,255,0.2)";
        ctx.fillRect(listBarX, listTopY, 4, listHeight);
        if (merged.length > 0) {
          const visibleRows = Math.min(listRows, merged.length);
          const thumbHeight = Math.max(10, (visibleRows / merged.length) * listHeight);
          const maxStart = Math.max(1, merged.length - listRows);
          const scrollRatio = Math.max(0, Math.min(1, listStart / maxStart));
          const thumbY = listTopY + (listHeight - thumbHeight) * scrollRatio;
          ctx.fillStyle = "rgba(255,231,168,0.82)";
          ctx.fillRect(listBarX, thumbY, 4, thumbHeight);
        }

        const detailX = colX1 + 12;
        let detailY = topRowY + 52;
        if (selectedModule) {
          const equippedSameSlot = equipment[selectedModule.slot] || null;
          const deltaHull = (readMod(selectedModule, "hullPct") - readMod(equippedSameSlot, "hullPct")) * 100;
          const deltaShield = (readMod(selectedModule, "shieldPct") - readMod(equippedSameSlot, "shieldPct")) * 100;
          const deltaDmg =
            (readMod(selectedModule, "primaryDamagePct") - readMod(equippedSameSlot, "primaryDamagePct")) * 100;
          const deltaCd =
            (readMod(selectedModule, "primaryCooldownPct") - readMod(equippedSameSlot, "primaryCooldownPct")) * 100;
          const dHull = formatPctDelta(readMod(selectedModule, "hullPct"), readMod(equippedSameSlot, "hullPct"));
          const dShield = formatPctDelta(readMod(selectedModule, "shieldPct"), readMod(equippedSameSlot, "shieldPct"));
          const dDmg = formatPctDelta(
            readMod(selectedModule, "primaryDamagePct"),
            readMod(equippedSameSlot, "primaryDamagePct")
          );
          const dCd = formatPctDelta(
            readMod(selectedModule, "primaryCooldownPct"),
            readMod(equippedSameSlot, "primaryCooldownPct"),
            true
          );
          const netScore = deltaHull * 0.55 + deltaShield * 0.55 + deltaDmg * 1.1 - deltaCd * 1.0;
          let decisionKey = "render.hangar.net.sidegrade";
          let decisionColor = "#d8f5ff";
          if (netScore >= 1.0) {
            decisionKey = "render.hangar.net.gain";
            decisionColor = "#9bf5bb";
          } else if (netScore <= -1.0) {
            decisionKey = "render.hangar.net.loss";
            decisionColor = "#ff9ea5";
          }
          drawRow(detailX, detailY, selectedModule.name, "#ffd785", "700 14px Trebuchet MS", colW1 - 24);
          detailY += 18;
          drawRow(
            detailX,
            detailY,
            `Slot ${slotLabels[selectedModule.slot] || selectedModule.slot} | ${selectedModule.rarityLabel}`,
            "#9fe3ff",
            "500 12px Trebuchet MS",
            colW1 - 24
          );
          detailY += 18;
          drawRow(detailX, detailY, "Current -> New", "#d8f5ff", "600 12px Trebuchet MS");
          detailY += 18;
          drawRow(detailX, detailY, `Hull ${dHull.text}`, dHull.color, "500 13px Trebuchet MS");
          drawRow(detailX + 84, detailY, `Shield ${dShield.text}`, dShield.color, "500 13px Trebuchet MS");
          detailY += 18;
          drawRow(detailX, detailY, `Damage ${dDmg.text}`, dDmg.color, "500 13px Trebuchet MS");
          drawRow(detailX + 112, detailY, `Cooldown ${dCd.text}`, dCd.color, "500 13px Trebuchet MS");
          detailY += 20;
          if (selectedModule.affixes?.length) {
            drawRow(detailX, detailY, `Affix: ${truncate(selectedModule.affixes[0].name, 28)}`, "#b8f6ff", "500 12px Trebuchet MS");
            detailY += 16;
          }
          drawRow(detailX, detailY, tr(decisionKey), decisionColor, "700 12px Trebuchet MS", colW1 - 24);
          detailY += 16;
          drawRow(
            detailX,
            detailY,
            tr("render.hangar.net.score", { score: netScore.toFixed(1) }),
            "rgba(216,245,255,0.85)",
            "500 12px Trebuchet MS",
            colW1 - 24
          );
          detailY += 16;
          drawRow(
            detailX,
            detailY,
            `Sell ${selectedModule.sellValue}cr | Salvage ${selectedModule.salvageValue}`,
            "#d8f5ff",
            "500 12px Trebuchet MS",
            colW1 - 24
          );
        } else {
          drawRow(detailX, detailY, tr("render.hangar.no_selection"), "rgba(216,245,255,0.72)", "600 13px Trebuchet MS", colW1 - 24);
        }

        const buildX = colX2 + 12;
        let buildY = topRowY + 52;
        drawRow(buildX, buildY, `P: ${activePrimary.label} (${activePrimary.role})`, "#a7f2ff", "600 13px Trebuchet MS", colW2 - 24);
        buildY += 18;
        drawRow(buildX, buildY, `S: ${activeSecondary.label} (${activeSecondary.role})`, "#a7f2ff", "600 13px Trebuchet MS", colW2 - 24);
        buildY += 18;
        drawRow(buildX, buildY, `U: ${activeUtility.label} (${activeUtility.role})`, "#a7f2ff", "600 13px Trebuchet MS", colW2 - 24);
        buildY += 22;
        drawRow(buildX, buildY, "Equipped", "#ffd785", "700 13px Trebuchet MS");
        buildY += 18;
        for (const slot of Object.keys(slotLabels)) {
          drawRow(buildX, buildY, `${slotLabels[slot]}: ${equipment[slot]?.name || "-"}`, "#d8f5ff", "500 12px Trebuchet MS", colW2 - 24);
          buildY += 16;
        }
        buildY += 4;
        const activeSets = model.activeSets || [];
        const setText = activeSets.length ? activeSets.map((entry) => `${entry.label} ${entry.count}/3`).join(" | ") : "No active set";
        drawRow(buildX, buildY, `Set: ${setText}`, "#b8f6ff", "600 12px Trebuchet MS", colW2 - 24);

        const actX = colX0 + 12;
        let actY = bottomRowY + 52;
        const actionRows = [];
        const pushHeader = (label) => actionRows.push({ type: "header", label });
        const pushAction = (label, color, actionIndex) => actionRows.push({ type: "action", label, color, actionIndex });
        pushHeader(tr("render.hangar.shop_group_sustain"));
        for (let i = 0; i < config.hangar.items.length; i += 1) {
          const item = config.hangar.items[i];
          const canAfford = model.credits >= item.cost;
          let label = `${item.title} ${item.cost}cr`;
          if (item.id === "fire_rate") {
            label = `${item.title} [Lv ${fireRateLevel}/${fireRateMax}] ${item.cost}cr`;
          } else if (item.id === "magazine") {
            label = `${item.title} [Lv ${magazineLevel}/${magazineMax}] ${item.cost}cr`;
          }
          pushAction(label, canAfford ? "#d8f5ff" : "rgba(216,245,255,0.45)", i);
          if (item.id === "repair") pushHeader(tr("render.hangar.shop_group_progression"));
        }
        pushHeader(tr("render.hangar.shop_group_loadout"));
        const loadoutBaseIndex = config.hangar.items.length;
        pushAction(`Primary: ${model.loadout.primaryLabel}`, "#ffd785", loadoutBaseIndex);
        pushAction(`Secondary: ${model.loadout.secondaryLabel}`, "#ffd785", loadoutBaseIndex + 1);
        pushAction(`Utility: ${model.loadout.utilityLabel}`, "#ffd785", loadoutBaseIndex + 2);
        pushHeader(tr("render.hangar.shop_group_inventory"));
        pushAction(
          `Sell selected (+${selectedModule?.sellValue ?? 0}cr)`,
          selectedModule ? "#d8f5ff" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 3
        );
        pushAction(
          `Salvage selected (+${selectedModule?.salvageValue ?? 0} parts)`,
          selectedModule ? "#d8f5ff" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 4
        );
        const rowStep = 14;
        for (let i = 0; i < actionRows.length; i += 1) {
          const row = actionRows[i];
          if (row.type === "header") {
            drawSectionHeader(actX, actY, row.label, colW0 - 24);
            actY += 16;
            continue;
          }
          drawSelectableRow(
            actX,
            actY,
            colW0 - 22,
            row.label,
            navSection === "shop" && shopIndex === row.actionIndex,
            row.color
          );
          actY += rowStep;
        }

        const pilotX = colX1 + 12;
        let pilotY = bottomRowY + 52;
        drawRow(
          pilotX,
          pilotY,
          `L${pilot.level || 1} XP ${Math.floor(pilot.xp || 0)}/${Math.floor(pilot.xpToNext || 1)}  A:${pilot.attributePoints || 0} S:${pilot.skillPoints || 0}`,
          "#ffd785",
          "600 12px Trebuchet MS",
          colW1 - 24
        );
        pilotY += 18;
        for (let i = 0; i < pilotAttrOrder.length; i += 1) {
          const key = pilotAttrOrder[i];
          const selected = (hangar.pilotAttrIndex || 0) === i;
          const navSelected = navSection === "pilot" && pilotCursor === i;
          const value = Math.floor(pilotAttrs[key] || 0);
          drawRow(
            pilotX + i * 70,
            pilotY,
            `${navSelected ? ">" : selected ? "*" : ""}${pilotAttrLabels[key]}:${value}`,
            navSelected ? "#ffe7a8" : selected ? "#b8f6ff" : "#d8f5ff",
            "500 11px Trebuchet MS"
          );
        }
        pilotY += 18;
        if (selectedPerk) {
          const perkUnlocked = unlockedPerkIds.has(selectedPerk.id);
          drawRow(
            pilotX,
            pilotY,
            `${navSection === "pilot" && pilotCursor === 4 ? ">" : ""}Perk ${selectedPerkIndex + 1}/${pilotPerks.length}: ${selectedPerk.label} (${selectedPerk.branch})`,
            navSection === "pilot" && pilotCursor === 4 ? "#ffe7a8" : perkUnlocked ? "#9bf5bb" : "#d8f5ff",
            "600 11px Trebuchet MS"
          );
          pilotY += 14;
          drawRow(
            pilotX,
            pilotY,
            `${navSection === "pilot" && pilotCursor === 5 ? ">" : ""}Req ${formatPerkRequirements(selectedPerk)}  [${perkUnlocked ? "Unlocked" : "Lock"}]`,
            navSection === "pilot" && pilotCursor === 5
              ? "#ffe7a8"
              : perkUnlocked
                ? "#9bf5bb"
                : "rgba(216,245,255,0.78)",
            "500 11px Trebuchet MS"
          );
          pilotY += 14;
        }
        drawRow(pilotX, pilotY + 6, tr("render.hangar.pilot_hint"), "#9fe3ff", "500 11px Trebuchet MS", colW1 - 24);

        const statusX = colX2 + 12;
        let statusY = bottomRowY + 52;
        drawRow(statusX, statusY, `Mission: ${model.currentMission?.label || nextMissionType.toUpperCase()}`, "#d8f5ff", "600 12px Trebuchet MS", colW2 - 24);
        statusY += 16;
        drawRow(statusX, statusY, `Sector: ${model.sector}  |  Credits: ${model.credits}`, "#d8f5ff", "500 12px Trebuchet MS", colW2 - 24);
        statusY += 16;
        drawRow(statusX, statusY, `Score: ${model.score}  |  Salvage: ${model.salvageParts}`, "#d8f5ff", "500 12px Trebuchet MS", colW2 - 24);
        statusY += 16;
        drawRow(statusX, statusY, `Set: ${model.setStatusText || "No active set"}`, "#b8f6ff", "500 12px Trebuchet MS", colW2 - 24);
        statusY += 16;
        drawRow(statusX, statusY, `Flight: ${model.flightModel === "sim_lite" ? "SIM LITE" : "ARCADE"}`, "#9fe3ff", "500 12px Trebuchet MS", colW2 - 24);
        statusY += 16;
        drawRow(
          statusX,
          statusY,
          tr("render.hangar.metric_primary_cd", { seconds: formatSeconds(activePrimary.cooldownSeconds * tuningMultiplier) }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          colW2 - 24
        );
        statusY += 16;
        drawRow(
          statusX,
          statusY,
          tr("render.hangar.metric_secondary_cd", { seconds: formatSeconds(activeSecondary.cooldownSeconds) }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          colW2 - 24
        );
        statusY += 16;
        drawRow(
          statusX,
          statusY,
          tr("render.hangar.metric_utility_cd", { seconds: formatSeconds(activeUtility.cooldownSeconds) }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          colW2 - 24
        );
        statusY += 16;
        const shared = config.ship.sharedPool || {};
        const pDrain = (activePrimary.energyCost || 0) * (shared.primaryShieldCostFactor ?? 0);
        const sDrain = (activeSecondary.energyCost || 0) * (shared.secondaryShieldCostFactor ?? 0);
        const uDrain = (activeUtility.energyCost || 0) * (shared.utilityShieldCostFactor ?? 0);
        drawRow(
          statusX,
          statusY,
          tr("render.hangar.metric_shared_drain", {
            primary: pDrain.toFixed(1),
            secondary: sDrain.toFixed(1),
            utility: uDrain.toFixed(1)
          }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          colW2 - 24
        );
        statusY += 16;
        drawRow(
          statusX,
          statusY,
          tr("render.hangar.metric_tuning", { tuning: tuningMultiplier.toFixed(2), shots: maxShots }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          colW2 - 24
        );
        statusY += 16;
        drawRow(statusX, statusY, `Active section: ${navSection.toUpperCase()}`, "#ffd785", "600 12px Trebuchet MS", colW2 - 24);

        const actionBarY = bottomRowY + bottomRowH + 10;
        ctx.fillStyle = "rgba(4,12,24,0.88)";
        ctx.fillRect(layoutX, actionBarY, layoutW, 24);
        ctx.strokeStyle = "rgba(63,207,255,0.45)";
        ctx.strokeRect(layoutX, actionBarY, layoutW, 24);
        ctx.textAlign = "center";
        ctx.font = "600 13px Trebuchet MS";
        ctx.fillStyle = "#d8f5ff";
        const sectionHintById = {
          loot: tr("render.hangar.context_hint_loot"),
          shop: tr("render.hangar.context_hint_shop"),
          pilot: tr("render.hangar.context_hint_pilot")
        };
        ctx.fillText(sectionHintById[navSection] || tr("render.hangar.action_hint"), centerX, actionBarY + 16);

        ctx.font = "600 14px Trebuchet MS";
        ctx.fillStyle = "#b9f8c3";
        ctx.fillText(hangar.message, centerX, actionBarY + 42);
      }

      ctx.restore();
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Renderer = Renderer;
})();
