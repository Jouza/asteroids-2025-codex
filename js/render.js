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
      this.resetTouchUiZones(model);
      this.clear();
      this.drawStarfield();
      this.drawDeepSpaceBackdrop(model);
      this.drawAsteroids(model.asteroids);
      this.drawSentryRelays(model.sentryRelays, model.ship);
      this.drawSalvageDrifters(model.salvageDrifters);
      this.drawUfos(model.ufos);
      this.drawMiniBoss(model.miniBoss);
      this.drawBullets(model.bullets);
      this.drawEnemyBullets(model.enemyBullets);
      this.drawUtilityEffects(model.utilityEffects);
      this.drawParticles(model.particles);
      this.drawDamageNumbers(model.damageNumbers);
      this.drawForegroundDust(model);
      this.drawShip(model, input);
      this.drawIncomingHitCues(model);
      this.drawVignette();
      this.drawMissionEnvironment(model);
      this.drawMissionBeats(model);
      this.drawCinematicFlash(model);
      this.drawFlash(model.flashMs);
      this.drawOffscreenThreatIndicators(model);
      this.drawMissionStatus(model);
      this.drawTelemetry(model);
      this.drawPerformanceOverlay(model);

      if (model.gameState !== GAME_STATE.PLAYING) {
        this.drawOverlay(model);
      }
      this.drawMobileTopStrip(model);
      this.drawOverlayTouchActionCta(model);
      this.drawTouchControls(model, input);
      this.drawFullscreenPrompt(model);
      this.drawRotateOverlay(model);
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

      const touchLeft = model.touchControls?.leftStick;
      const touchModeActive = model.inputMode === "touch";
      const touchThrusting = touchModeActive && touchLeft?.active && touchLeft.mag >= 0.16;
      const touchTurningLeft = touchModeActive && touchLeft?.active && touchLeft.nx <= -0.22;
      const touchTurningRight = touchModeActive && touchLeft?.active && touchLeft.nx >= 0.22;

      if (model.gameState === GAME_STATE.PLAYING && (input.isDown("ArrowUp") || touchThrusting)) {
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

      if (model.gameState === GAME_STATE.PLAYING && (input.isDown("ArrowLeft") || touchTurningLeft)) {
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

      if (model.gameState === GAME_STATE.PLAYING && (input.isDown("ArrowRight") || touchTurningRight)) {
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
        } else if (asteroid.asteroidType === "drain_core") {
          ctx.shadowColor = "rgba(126,255,166,0.68)";
          ctx.fillStyle = "rgba(62,130,92,0.3)";
          ctx.strokeStyle = "rgba(162,255,196,0.98)";
        } else if (asteroid.asteroidType === "echo_shell") {
          ctx.shadowColor = "rgba(146,215,255,0.7)";
          ctx.fillStyle = "rgba(56,104,148,0.31)";
          ctx.strokeStyle = "rgba(178,237,255,0.98)";
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
        if (asteroid.asteroidType === "drain_core") {
          const pulse = 0.72 + Math.sin((asteroid.rotation ?? 0) * 4.2) * 0.2;
          ctx.strokeStyle = `rgba(170,255,206,${0.28 + pulse * 0.18})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, asteroid.radius * 1.55, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (asteroid.asteroidType === "echo_shell") {
          const pulse = 0.74 + Math.sin((asteroid.rotation ?? 0) * 5.3) * 0.18;
          ctx.strokeStyle = `rgba(190,242,255,${0.24 + pulse * 0.22})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, asteroid.radius * 1.45, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    drawSentryRelays(relays, ship) {
      if (!Array.isArray(relays) || relays.length === 0) return;
      const { ctx } = this;
      for (const relay of relays) {
        ctx.save();
        ctx.translate(relay.x, relay.y);
        ctx.shadowColor = "rgba(172,230,255,0.82)";
        ctx.shadowBlur = 14;
        ctx.fillStyle = "rgba(64,118,168,0.36)";
        ctx.strokeStyle = "rgba(188,237,255,0.97)";
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(0, 0, relay.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-relay.radius * 0.72, 0);
        ctx.lineTo(relay.radius * 0.72, 0);
        ctx.stroke();
        ctx.restore();

        if (relay.telegraphActive && ship) {
          const len = relay.beamRange ?? 1320;
          const ex = relay.x + Math.cos(relay.aimAngle) * len;
          const ey = relay.y + Math.sin(relay.aimAngle) * len;
          const ratio = Math.max(0, Math.min(1, (relay.telegraphTimer ?? 0) / Math.max(0.1, relay.telegraphSeconds ?? 0.8)));
          ctx.save();
          ctx.strokeStyle = `rgba(198,238,255,${0.25 + (1 - ratio) * 0.45})`;
          ctx.lineWidth = 1.8 + (1 - ratio) * 1.5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(relay.x, relay.y);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    drawSalvageDrifters(drifters) {
      if (!Array.isArray(drifters) || drifters.length === 0) return;
      const { ctx } = this;
      for (const drifter of drifters) {
        if (drifter.state !== "active") continue;
        ctx.save();
        ctx.translate(drifter.x, drifter.y);
        ctx.shadowColor = "rgba(166,255,204,0.88)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(78,156,114,0.34)";
        ctx.strokeStyle = "rgba(186,255,218,0.95)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, drifter.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const ringR = (drifter.captureRadius ?? 56) * (0.3 + (drifter.captureRatio ?? 0) * 0.7);
        ctx.strokeStyle = `rgba(176,255,208,${0.16 + (drifter.captureRatio ?? 0) * 0.32})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.stroke();
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

    drawDamageNumbers(damageNumbers) {
      if (!Array.isArray(damageNumbers) || damageNumbers.length === 0) return;
      const { ctx } = this;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 14px Trebuchet MS";
      for (const item of damageNumbers) {
        const maxTtl = Math.max(0.01, Number(item.maxTtl) || 0.65);
        const alpha = Math.max(0, Math.min(1, (Number(item.ttl) || 0) / maxTtl));
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,18,28,0.9)";
        ctx.fillStyle = `rgba(${item.color || "255,255,255"},1)`;
        ctx.strokeText(item.text || "", item.x, item.y);
        ctx.fillText(item.text || "", item.x, item.y);
      }
      ctx.restore();
    }

    resetTouchUiZones(model) {
      const ui = model?.touchControls?.ui;
      if (!ui) return;
      ui.overlayRows = [];
      ui.hangarLootRows = [];
      ui.hangarShopRows = [];
      ui.endSummaryTapZones = null;
      ui.overlayActionCtaZone = null;
      ui.fullscreenTapZone = null;
      ui.hangarBottomActions = null;
    }

    drawMobileTopStrip(model) {
      if (model.deviceMode !== "touch_mobile" || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      ctx.save();
      const stripH = 22;
      ctx.fillStyle = "rgba(2,10,20,0.76)";
      ctx.fillRect(0, 0, config.canvas.width, stripH);
      ctx.strokeStyle = "rgba(83,247,255,0.26)";
      ctx.beginPath();
      ctx.moveTo(0, stripH + 0.5);
      ctx.lineTo(config.canvas.width, stripH + 0.5);
      ctx.stroke();
      ctx.textAlign = "left";
      ctx.font = "600 11px Trebuchet MS";
      ctx.fillStyle = "rgba(192,236,255,0.94)";
      const setText = String(model.setStatusText || tr("hud.no_active_set"));
      ctx.fillText(`CR ${Math.floor(model.credits || 0)}  |  SC ${Math.floor(model.score || 0)}  |  ${setText}`, 8, 15);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(170,228,248,0.9)";
      const ident = String(model.identityStatusText || tr("hud.identity_unknown"));
      ctx.fillText(ident, config.canvas.width - 8, 15);
      ctx.restore();
    }

    drawTouchControls(model, input) {
      if (model.inputMode !== "touch") return;
      const touch = model.touchControls;
      const layout = touch?.layout;
      if (!touch || !layout || !layout.buttons) return;
      const { ctx } = this;
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      const showCombatControls = model.gameState === GAME_STATE.PLAYING;
      const showActionButton = model.gameState === GAME_STATE.HANGAR;
      const vis = model.mobileUi?.actionVisibility || {};
      const buttonDefs = [
        {
          key: "secondary",
          label: tr("touch.button.secondary"),
          down: touch.buttons?.secondary?.down,
          cooldown: model.secondaryCooldown,
          alpha: clamp(Number(vis.secondary?.alpha) || 0.9, 0.2, 1),
          scale: clamp(Number(vis.secondary?.scale) || 1, 0.85, 1.05)
        },
        {
          key: "utility",
          label: tr("touch.button.utility"),
          down: touch.buttons?.utility?.down,
          cooldown: model.utilityCooldown,
          alpha: clamp(Number(vis.utility?.alpha) || 0.9, 0.2, 1),
          scale: clamp(Number(vis.utility?.scale) || 1, 0.85, 1.05)
        },
        {
          key: "evade",
          label: tr("touch.button.evade"),
          down: touch.buttons?.evade?.down,
          cooldown: model.dashCooldown,
          alpha: clamp(Number(vis.evade?.alpha) || 0.95, 0.28, 1),
          scale: clamp(Number(vis.evade?.scale) || 1, 0.9, 1.08)
        }
      ];
      const drawStick = (stickLayout, stickState, tintRgb) => {
        ctx.save();
        ctx.strokeStyle = `rgba(${tintRgb},0.42)`;
        ctx.fillStyle = `rgba(${tintRgb},0.08)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(stickLayout.x, stickLayout.y, stickLayout.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const handleX = stickState?.active ? stickState.baseX + stickState.nx * stickLayout.radius * stickState.mag : stickLayout.x;
        const handleY = stickState?.active ? stickState.baseY + stickState.ny * stickLayout.radius * stickState.mag : stickLayout.y;
        ctx.fillStyle = `rgba(${tintRgb},0.18)`;
        ctx.strokeStyle = `rgba(${tintRgb},0.86)`;
        ctx.beginPath();
        ctx.arc(handleX, handleY, Math.max(16, stickLayout.radius * 0.34), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      const drawButton = (btnLayout, label, down, cooldown = 0, readyColor = "120,240,196", alphaMul = 1, scale = 1) => {
        const cd = Math.max(0, Number(cooldown) || 0);
        const ready = cd <= 0.001;
        ctx.save();
        ctx.translate(btnLayout.x, btnLayout.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = clamp(alphaMul, 0.2, 1);
        ctx.fillStyle = down ? "rgba(255,231,168,0.24)" : `rgba(${ready ? readyColor : "160,190,210"},0.12)`;
        ctx.strokeStyle = down ? "rgba(255,231,168,0.92)" : `rgba(${ready ? readyColor : "160,190,210"},0.72)`;
        ctx.lineWidth = down ? 2.1 : 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, btnLayout.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = "center";
        ctx.fillStyle = ready ? "#d8f5ff" : "rgba(200,220,232,0.9)";
        ctx.font = "700 11px Trebuchet MS";
        ctx.fillText(label, 0, 4);
        if (!ready) {
          ctx.font = "600 10px Trebuchet MS";
          ctx.fillStyle = "rgba(255,208,152,0.95)";
          ctx.fillText(cd.toFixed(1), 0, 17);
        }
        ctx.restore();
      };

      if (showCombatControls) {
        drawStick(layout.leftStick, touch.leftStick, "108,216,255");
        drawStick(layout.rightStick, touch.rightStick, "182,222,255");
        for (const def of buttonDefs) {
          drawButton(layout.buttons[def.key], def.label, def.down, def.cooldown, "120,240,196", def.alpha, def.scale);
        }
      }

      if (showActionButton) {
        const actionBtn = layout.buttons.action;
        drawButton(actionBtn, tr("touch.button.action.confirm"), false, 0, "255,214,140");
      }

      if (showCombatControls) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "500 11px Trebuchet MS";
        ctx.fillStyle = "rgba(192,228,245,0.82)";
        ctx.fillText(tr("touch.hud.hint"), this.config.canvas.width / 2, this.config.canvas.height - 10);
        ctx.restore();
      }
    }

    drawOverlayTouchActionCta(model) {
      if (model.inputMode !== "touch") return;
      const isOverlayState =
        model.gameState === GAME_STATE.START ||
        model.gameState === GAME_STATE.GAME_OVER ||
        model.gameState === GAME_STATE.VICTORY;
      if (!isOverlayState) return;
      const ui = model.touchControls?.ui;
      if (!ui) return;
      const { ctx, config } = this;
      const w = Math.max(220, Math.round(config.canvas.width * 0.28));
      const h = 52;
      const x = Math.round((config.canvas.width - w) / 2);
      const y = Math.max(16, config.canvas.height - 78);
      ui.overlayActionCtaZone = { x, y, w, h };
      const labelKey = model.gameState === GAME_STATE.START ? "touch.button.action.start" : "touch.button.action.new_run";

      ctx.save();
      ctx.fillStyle = "rgba(16,32,46,0.88)";
      ctx.strokeStyle = "rgba(142,240,255,0.88)";
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 18px Trebuchet MS";
      ctx.fillStyle = "#dcf7ff";
      ctx.fillText(tr(labelKey), x + w / 2, y + h / 2);
      ctx.restore();
    }

    drawFullscreenPrompt(model) {
      if (model.deviceMode !== "touch_mobile") return;
      const mobileUi = model.mobileUi || {};
      if (!mobileUi.fullscreenPromptVisible || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      const ui = model.touchControls?.ui;
      const w = 220;
      const h = 34;
      const x = config.canvas.width / 2 - w / 2;
      const y = config.canvas.height - 132;
      if (ui) {
        ui.fullscreenTapZone = { x, y, w, h };
      }
      ctx.save();
      ctx.fillStyle = "rgba(14,28,42,0.82)";
      ctx.strokeStyle = "rgba(144,237,255,0.78)";
      ctx.lineWidth = 1.5;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.textAlign = "center";
      ctx.font = "700 12px Trebuchet MS";
      ctx.fillStyle = "#c9f4ff";
      ctx.fillText(tr("touch.mobile.fullscreen_cta"), x + w / 2, y + 22);
      ctx.restore();
    }

    drawRotateOverlay(model) {
      if (model.deviceMode !== "touch_mobile" || !model.mobileUi?.orientationBlocked) return;
      const { ctx, config } = this;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      ctx.textAlign = "center";
      ctx.fillStyle = "#d8f5ff";
      ctx.font = "700 34px Trebuchet MS";
      ctx.fillText(tr("touch.mobile.rotate_title"), config.canvas.width / 2, config.canvas.height / 2 - 14);
      ctx.font = "600 18px Trebuchet MS";
      ctx.fillStyle = "rgba(186,232,255,0.94)";
      ctx.fillText(tr("touch.mobile.rotate_hint"), config.canvas.width / 2, config.canvas.height / 2 + 24);
      ctx.restore();
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

    getAtmospherePerfScale(model) {
      const avgFrameMs = Number(model?.performance?.avgFrameMs) || 0;
      if (avgFrameMs > 18) return 0.7;
      return 1;
    }

    getVisualFxPresetProfile(model) {
      const presets = this.config?.visualFxIntensityPresets || {};
      const defaultProfile = presets.default || {
        deepSpaceDensityMul: 1,
        deepSpaceAlphaMul: 1,
        warScarsDensityMul: 1,
        warScarsAlphaMul: 1,
        foregroundDustDensityMul: 1,
        foregroundDustAlphaMul: 1,
        overlayAlphaCap: 1
      };
      const key = model?.mobileUi?.ambientFxPreset;
      if (key === "low" && presets.low) return presets.low;
      if (key === "high" && presets.high) return presets.high;
      return defaultProfile;
    }

    applyVisualFxPresetMultipliers(value, presetMul = 1, min = -Infinity, max = Infinity) {
      const next = Number(value) * (Number.isFinite(Number(presetMul)) ? Number(presetMul) : 1);
      return Math.max(min, Math.min(max, next));
    }

    drawDeepSpaceBackdrop(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const deepSpace = visual.deepSpace || {};
      const visualFx = mission.visualFx || {};
      const missionTime = Math.max(0, Number(visualFx.time) || 0);
      const seed = Number(visualFx.layerSeedA ?? visualFx.seed) || 0;
      const preset = this.getVisualFxPresetProfile(model);
      const perfScale = this.getAtmospherePerfScale(model);
      const beatPulse = Math.max(0, Number(visualFx.beatIntensity) || 0) * (Math.max(0, Number(visualFx.beatTtl) || 0) > 0 ? 1 : 0);
      const fract = (value) => value - Math.floor(value);
      const nebulaBands = Math.max(1, Math.min(6, Math.floor(Number(deepSpace.nebulaBands) || 2)));
      const nebulaAlpha = Math.max(0.02, Math.min(0.3, Number(deepSpace.nebulaAlpha) || 0.09));
      const dustBands = Math.max(1, Math.min(4, Math.floor(Number(deepSpace.dustBands) || 2)));
      const deepDensityMul = this.applyVisualFxPresetMultipliers(1, preset.deepSpaceDensityMul, 0.45, 1.5);
      const deepAlphaMul = this.applyVisualFxPresetMultipliers(1, preset.deepSpaceAlphaMul, 0.55, 1.35);
      const dustCount = Math.min(80, Math.max(18, Math.round(18 * dustBands * deepDensityMul * perfScale)));

      ctx.save();
      for (let i = 0; i < nebulaBands; i += 1) {
        const basis = seed * 0.000001 + i * 0.761;
        const centerX = fract(basis * 7.31 + missionTime * 0.01 * (0.4 + i * 0.16)) * config.canvas.width;
        const centerY = fract(basis * 9.53 + missionTime * 0.007 * (0.36 + i * 0.12)) * config.canvas.height;
        const radius = config.canvas.height * (0.24 + i * 0.08);
        const tintShift = 8 + i * 10;
        const alpha = Math.min(0.22, nebulaAlpha * (0.72 + i * 0.14) * (1 + beatPulse * 0.08) * deepAlphaMul);
        const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.12, centerX, centerY, radius);
        glow.addColorStop(0, `rgba(${96 + tintShift},${128 + tintShift},${188 + tintShift},${alpha})`);
        glow.addColorStop(1, "rgba(8,12,24,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      }

      ctx.fillStyle = "rgba(174,210,242,0.08)";
      for (let i = 0; i < dustCount; i += 1) {
        const basis = seed * 0.000001 + i * 0.193;
        const x = fract(basis * 17.39 + missionTime * 0.01 * (0.24 + (i % 4) * 0.08)) * config.canvas.width;
        const y = fract(basis * 23.41 + missionTime * 0.008 * (0.2 + (i % 3) * 0.06)) * config.canvas.height;
        const r = 0.7 + (i % 3) * 0.5;
        ctx.fillRect(x, y, r, r);
      }
      ctx.restore();

      this.drawWarScars(mission, missionTime, model, preset);
    }

    drawWarScars(mission, missionTime, model, presetProfile = null) {
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const scars = visual.warScars || {};
      const visualFx = mission.visualFx || {};
      const preset = presetProfile || this.getVisualFxPresetProfile(model);
      const perfScale = this.getAtmospherePerfScale(model);
      const beatBoost = 1 + Math.max(0, Number(visualFx.beatIntensity) || 0) * (Number(visualFx.beatTtl) > 0 ? 0.14 : 0);
      const density = Math.max(0.2, Math.min(2.2, Number(scars.density) || 1));
      const lenMin = Math.max(8, Number(scars.streakLenMin) || 18);
      const lenMax = Math.max(lenMin, Number(scars.streakLenMax) || 44);
      const flickerCadence = Math.max(0.2, Number(scars.flickerCadence) || 1);
      const silhouetteChance = Math.max(0, Math.min(0.95, Number(scars.silhouetteChance) || 0.16));
      const seed = Number(visualFx.layerSeedA ?? visualFx.seed) || 0;
      const scarsDensityMul = this.applyVisualFxPresetMultipliers(1, preset.warScarsDensityMul, 0.45, 1.45);
      const scarsAlphaMul = this.applyVisualFxPresetMultipliers(1, preset.warScarsAlphaMul, 0.55, 1.3);
      const count = Math.min(36, Math.max(6, Math.round(14 * density * scarsDensityMul * perfScale)));
      const fract = (value) => value - Math.floor(value);

      ctx.save();
      for (let i = 0; i < count; i += 1) {
        const basis = seed * 0.000001 + i * 0.419;
        const x = fract(basis * 13.17 + missionTime * 0.02) * config.canvas.width;
        const y = fract(basis * 7.91 + missionTime * 0.015) * config.canvas.height;
        const phase = missionTime * flickerCadence + i * 0.67;
        const alpha = Math.max(0.04, 0.15 + Math.sin(phase) * 0.06) * beatBoost * scarsAlphaMul;
        const len = lenMin + fract(basis * 29.11) * (lenMax - lenMin);
        const angle = (-0.45 + fract(basis * 19.37) * 0.9) * Math.PI;
        const dx = Math.cos(angle) * len;
        const dy = Math.sin(angle) * len;
        ctx.strokeStyle = `rgba(164,198,228,${Math.min(0.32, alpha)})`;
        ctx.lineWidth = 1.05 + fract(basis * 37.3) * 0.9;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();

        if (fract(basis * 43.9) < silhouetteChance) {
          const sw = 8 + fract(basis * 11.9) * 20;
          const sh = 3 + fract(basis * 17.7) * 10;
          ctx.fillStyle = `rgba(18,24,38,${Math.min(0.3, alpha * 0.9)})`;
          ctx.fillRect(x - sw * 0.5, y - sh * 0.5, sw, sh);
        }
      }
      ctx.restore();
    }

    drawForegroundDust(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const dust = visual.foregroundDust || {};
      const visualFx = mission.visualFx || {};
      const missionTime = Math.max(0, Number(visualFx.time) || 0);
      const seed = Number(visualFx.layerSeedB ?? visualFx.seed) || 0;
      const preset = this.getVisualFxPresetProfile(model);
      const perfScale = this.getAtmospherePerfScale(model);
      const density = Math.max(0.2, Math.min(2.5, Number(dust.density) || 1));
      const speedMul = Math.max(0.2, Math.min(2.8, Number(dust.speedMul) || 1));
      const alphaBase = Math.max(0.04, Math.min(0.5, Number(dust.alpha) || 0.22));
      const sizeMin = Math.max(0.2, Number(dust.sizeMin) || 0.8);
      const sizeMax = Math.max(sizeMin, Number(dust.sizeMax) || 2.2);
      const fgDensityMul = this.applyVisualFxPresetMultipliers(1, preset.foregroundDustDensityMul, 0.45, 1.5);
      const fgAlphaMul = this.applyVisualFxPresetMultipliers(1, preset.foregroundDustAlphaMul, 0.55, 1.35);
      const count = Math.min(90, Math.max(16, Math.round(32 * density * fgDensityMul * perfScale)));
      const fract = (value) => value - Math.floor(value);

      ctx.save();
      for (let i = 0; i < count; i += 1) {
        const basis = seed * 0.000001 + i * 0.251;
        const speed = (0.34 + fract(basis * 11.1) * 0.96) * speedMul;
        const x = fract(basis * 31.37 + missionTime * speed * 0.03) * (config.canvas.width + 24) - 12;
        const y = fract(basis * 17.91 + missionTime * speed * 0.024) * (config.canvas.height + 24) - 12;
        const size = sizeMin + fract(basis * 23.41) * (sizeMax - sizeMin);
        const alpha = Math.min(0.46, alphaBase * (0.72 + fract(basis * 29.7) * 0.42) * fgAlphaMul);
        ctx.fillStyle = `rgba(182,212,236,${alpha})`;
        ctx.fillRect(x, y, size, size);
      }
      ctx.restore();
    }

    drawBiomeParallaxBackdrop(mission, missionTime) {
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const layers = Array.isArray(visual.parallaxLayers) ? visual.parallaxLayers : [];
      const density = Math.max(0.2, Math.min(2.2, Number(visual.debrisDensity) || 1));
      const seed = mission.visualFx?.seed ?? 0;
      if (!layers.length) return;
      const fract = (value) => value - Math.floor(value);
      ctx.save();
      for (let li = 0; li < layers.length; li += 1) {
        const layer = layers[li];
        const speed = Math.max(0.05, Number(layer.speed) || 0.18);
        const alpha = Math.max(0.03, Math.min(0.22, Number(layer.alpha) || 0.08));
        const size = Math.max(0.8, Number(layer.size) || 1.6);
        const driftX = Number(layer.driftX) || 1;
        const driftY = Number(layer.driftY) || 0.35;
        const count = Math.max(8, Math.round((14 + li * 6) * density));
        ctx.fillStyle = `rgba(170,214,244,${alpha})`;
        for (let i = 0; i < count; i += 1) {
          const basis = seed * 0.000001 + i * 0.137 + li * 0.619;
          const x = fract(basis * 31.71 + missionTime * speed * driftX * 0.08) * (config.canvas.width + 18) - 9;
          const y = fract(basis * 53.17 + missionTime * speed * driftY * 0.06) * (config.canvas.height + 18) - 9;
          ctx.fillRect(x, y, size, size);
        }
      }
      ctx.restore();
    }

    drawMissionBeats(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const beatTtl = Number(mission.visualFx?.beatTtl) || 0;
      if (beatTtl <= 0) return;
      const beatMaxTtl = Math.max(0.01, Number(mission.visualFx?.beatMaxTtl) || beatTtl);
      const beatIntensity = Math.max(0.1, Number(mission.visualFx?.beatIntensity) || 0.7);
      const beatKind = mission.visualFx?.beatKind || "mission";
      const progress = Math.max(0, Math.min(1, beatTtl / beatMaxTtl));
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const preset = this.getVisualFxPresetProfile(model);
      const baseColor = typeof visual.beatColor === "string" ? visual.beatColor : "176,222,255";
      const colorByKind = {
        mission_start: baseColor,
        biome_event: "196,255,188",
        hunt_finale: "255,188,132",
        survive_cleanup: "188,232,255",
        storm_cleanup: "255,214,154",
        boss_phase: "255,148,216"
      };
      const pulseColor = colorByKind[beatKind] || baseColor;
      const overlayCap = this.applyVisualFxPresetMultipliers(1, preset.overlayAlphaCap, 0.6, 1.25);
      const alpha = Math.max(0.05, Math.min(0.45, progress * 0.32 * beatIntensity * overlayCap));
      ctx.save();
      const fog = ctx.createRadialGradient(
        config.canvas.width * 0.5,
        config.canvas.height * 0.5,
        config.canvas.height * 0.08,
        config.canvas.width * 0.5,
        config.canvas.height * 0.5,
        config.canvas.height * 0.78
      );
      fog.addColorStop(0, `rgba(${pulseColor},${alpha * 0.3})`);
      fog.addColorStop(0.55, `rgba(${pulseColor},${alpha * 0.16})`);
      fog.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      const ringRadius = (config.canvas.height * 0.24 + (1 - progress) * config.canvas.height * 0.1) * (0.92 + beatIntensity * 0.08);
      ctx.strokeStyle = `rgba(${pulseColor},${alpha * 0.9})`;
      ctx.lineWidth = 1.6 + (1 - progress) * 1.4;
      ctx.beginPath();
      ctx.arc(config.canvas.width * 0.5, config.canvas.height * 0.5, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawCinematicFlash(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const visualFx = mission.visualFx || {};
      const flashTtl = Number(visualFx.flashTtl) || 0;
      if (flashTtl <= 0) return;
      const flashMaxTtl = Math.max(0.01, Number(visualFx.flashMaxTtl) || flashTtl);
      const flashIntensity = Math.max(0.08, Number(visualFx.flashIntensity) || 0.2);
      const flashColor = typeof visualFx.flashColor === "string" && visualFx.flashColor.length > 0
        ? visualFx.flashColor
        : "176,222,255";
      const preset = this.getVisualFxPresetProfile(model);
      const perfScale = this.getAtmospherePerfScale(model);
      const perfAlphaMul = perfScale < 1 ? 0.75 : 1;
      const overlayCap = this.applyVisualFxPresetMultipliers(1, preset.overlayAlphaCap, 0.6, 1.25);
      const ratio = Math.max(0, Math.min(1, flashTtl / flashMaxTtl));
      const alpha = Math.max(0.03, Math.min(0.34, ratio * flashIntensity * 0.42 * overlayCap)) * perfAlphaMul;
      const { ctx, config } = this;
      ctx.save();
      ctx.fillStyle = `rgba(${flashColor},${alpha})`;
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      const bandA = ctx.createLinearGradient(0, config.canvas.height * 0.24, 0, config.canvas.height * 0.4);
      bandA.addColorStop(0, "rgba(0,0,0,0)");
      bandA.addColorStop(0.5, `rgba(${flashColor},${alpha * 0.8})`);
      bandA.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bandA;
      ctx.fillRect(0, config.canvas.height * 0.2, config.canvas.width, config.canvas.height * 0.24);
      const bandB = ctx.createLinearGradient(0, config.canvas.height * 0.62, 0, config.canvas.height * 0.82);
      bandB.addColorStop(0, "rgba(0,0,0,0)");
      bandB.addColorStop(0.5, `rgba(${flashColor},${alpha * 0.58})`);
      bandB.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bandB;
      ctx.fillRect(0, config.canvas.height * 0.6, config.canvas.width, config.canvas.height * 0.24);
      ctx.restore();
    }

    drawIncomingHitCues(model) {
      if (model.gameState !== GAME_STATE.PLAYING) return;
      const ship = model.ship;
      const cues = model.incomingHitCues;
      if (!ship || !Array.isArray(cues) || cues.length === 0) return;
      const { ctx, config } = this;
      const palette = {
        kinetic: "255,220,170",
        collision: "255,182,126",
        explosive: "255,154,126",
        plasma: "192,255,182",
        dot_thermal: "255,138,114",
        emp_jam_pressure: "178,160,255"
      };
      ctx.save();
      for (const cue of cues) {
        const ttl = Math.max(0, Number(cue.ttl) || 0);
        const maxTtl = Math.max(0.01, Number(cue.maxTtl) || ttl || 0.45);
        const ratio = Math.max(0, Math.min(1, ttl / maxTtl));
        const severity = Math.max(0.18, Math.min(1, (Number(cue.shieldAbsorb) || 0) * 0.02 + (Number(cue.hullDamage) || 0) * 0.04));
        const cueKind = typeof cue.kind === "string" ? cue.kind : cue.damageType;
        const color = palette[cueKind] || palette[cue.damageType] || "212,228,255";
        const alpha = Math.max(0.05, Math.min(0.4, ratio * severity * (cue.isCrit ? 0.56 : 0.38)));
        const isEmpJam = cueKind === "emp_jam_pressure";
        const radius = ship.radius + 16 + (1 - ratio) * 26;
        ctx.strokeStyle = `rgba(${color},${alpha})`;
        ctx.lineWidth = cue.isCrit ? 3 : 2;
        ctx.beginPath();
        if (isEmpJam) {
          ctx.arc(ship.x, ship.y, radius, -Math.PI * 0.42, Math.PI * 0.72);
        } else {
          ctx.arc(ship.x, ship.y, radius, -Math.PI * 0.2, Math.PI * 1.2);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(${color},${alpha * (isEmpJam ? 0.24 : 0.32)})`;
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.radius + 7 + (1 - ratio) * (isEmpJam ? 7 : 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${color},${alpha * (isEmpJam ? 0.12 : 0.22)})`;
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      }
      ctx.restore();
    }

    collectOffscreenThreats(model) {
      const mission = model.currentMission;
      if (!mission) return [];
      const threats = [];
      const addThreat = (id, x, y, color, priority) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        threats.push({ id, x, y, color, priority });
      };
      if (model.miniBoss) addThreat("boss", model.miniBoss.x, model.miniBoss.y, "255,148,216", 100);
      for (const relay of model.sentryRelays || []) {
        addThreat(`sentry:${relay.id || "relay"}`, relay.x, relay.y, "166,226,255", relay.telegraphActive ? 92 : 76);
      }
      if (mission.gravityAnomaly) {
        addThreat("gravity", mission.gravityAnomaly.x, mission.gravityAnomaly.y, "146,186,255", 90);
      }
      for (const hazard of mission.biomeHazards || []) {
        if (!hazard.telegraphActive) continue;
        const priority = Math.max(1, Math.floor(hazard.telegraphProfile?.warningPriority || 2));
        addThreat(`hazard:${hazard.type}`, hazard.x, hazard.y, hazard.telegraphProfile?.pulseColor || "255,204,148", 40 + priority * 10);
      }
      threats.sort((a, b) => b.priority - a.priority);
      const seen = new Set();
      const unique = [];
      for (const threat of threats) {
        if (seen.has(threat.id)) continue;
        seen.add(threat.id);
        unique.push(threat);
      }
      return unique.slice(0, 4);
    }

    drawOffscreenThreatIndicators(model) {
      if (model.gameState !== GAME_STATE.PLAYING) return;
      const ship = model.ship;
      if (!ship) return;
      const { ctx, config } = this;
      const margin = 24;
      const threats = this.collectOffscreenThreats(model);
      if (!threats.length) return;
      ctx.save();
      for (const threat of threats) {
        const onScreen =
          threat.x >= margin &&
          threat.x <= config.canvas.width - margin &&
          threat.y >= margin &&
          threat.y <= config.canvas.height - margin;
        if (onScreen) continue;
        const dx = threat.x - ship.x;
        const dy = threat.y - ship.y;
        const angle = Math.atan2(dy, dx);
        const rayX = Math.cos(angle);
        const rayY = Math.sin(angle);
        const halfW = config.canvas.width * 0.5 - margin;
        const halfH = config.canvas.height * 0.5 - margin;
        const tx = Math.abs(rayX) < 0.0001 ? Number.POSITIVE_INFINITY : halfW / Math.abs(rayX);
        const ty = Math.abs(rayY) < 0.0001 ? Number.POSITIVE_INFINITY : halfH / Math.abs(rayY);
        const t = Math.min(tx, ty);
        const centerX = config.canvas.width * 0.5;
        const centerY = config.canvas.height * 0.5;
        const px = centerX + rayX * t;
        const py = centerY + rayY * t;
        const dist = Math.hypot(dx, dy);
        const alpha = Math.max(0.3, Math.min(0.88, 1 - dist / 1800));
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(${threat.color},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-8, -7);
        ctx.lineTo(-8, 7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = `rgba(${threat.color},${Math.min(1, alpha + 0.15)})`;
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-20, -5, 8, 10);
        ctx.rotate(-angle);
        ctx.translate(-px, -py);
      }
      ctx.restore();
    }

    drawMissionEnvironment(model) {
      const mission = model.currentMission;
      if (!mission || model.gameState !== GAME_STATE.PLAYING) return;
      const { ctx, config } = this;
      const visual = mission.biomeVisualProfile || {};
      const visualFx = mission.visualFx || {};
      const cadenceMul = Math.max(0.35, Number(visual.ambientCadence) || Number(visualFx.cadence) || 1);
      const missionTime = Math.max(0, Number(visualFx.time) || 0);
      const debrisDensity = Math.max(0.2, Math.min(2.2, Number(visual.debrisDensity) || 1));
      const beatTtl = Math.max(0, Number(visualFx.beatTtl) || 0);
      const beatMaxTtl = Math.max(0.01, Number(visualFx.beatMaxTtl) || 1);
      const beatRatio = beatTtl > 0 ? Math.max(0, Math.min(1, beatTtl / beatMaxTtl)) : 0;
      const beatIntensity = Math.max(0, Number(visualFx.beatIntensity) || 0);
      const beatPulse = beatRatio * beatIntensity;
      this.drawBiomeParallaxBackdrop(mission, missionTime);
      const effects = mission.modifierEffects || {};
      if (mission.biomeId === "graveyard") {
        ctx.fillStyle = "rgba(118,142,170,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        ctx.strokeStyle = "rgba(132,168,212,0.22)";
        ctx.lineWidth = 1.1;
        for (let i = 0; i < Math.max(4, Math.round(6 * debrisDensity)); i += 1) {
          const drift = Math.sin(missionTime * 0.6 * cadenceMul + i * 0.9) * 12;
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
        for (let i = 0; i < Math.max(3, Math.round(4 * debrisDensity)); i += 1) {
          const y = 120 + i * 140 + Math.sin(missionTime * 1.2 * cadenceMul + i) * 6;
          const heatLine = ctx.createLinearGradient(0, y, config.canvas.width, y + 22);
          heatLine.addColorStop(0, "rgba(255,172,108,0)");
          heatLine.addColorStop(0.5, "rgba(255,172,108,0.18)");
          heatLine.addColorStop(1, "rgba(255,172,108,0)");
          ctx.fillStyle = heatLine;
          ctx.fillRect(0, y, config.canvas.width, 22);
        }
        ctx.fillStyle = "rgba(255,201,142,0.12)";
        for (let i = 0; i < Math.max(4, Math.round(5 * debrisDensity)); i += 1) {
          const x = 96 + i * 180;
          ctx.fillRect(x, 36, 4, config.canvas.height - 72);
        }
        ctx.restore();
      } else if (mission.biomeId === "belt") {
        ctx.fillStyle = "rgba(132,164,188,0.07)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < Math.max(4, Math.round(6 * debrisDensity)); i += 1) {
          const y = 84 + i * 104 + Math.sin(missionTime * 0.9 * cadenceMul + i * 0.8) * 8;
          const beltLine = ctx.createLinearGradient(0, y, config.canvas.width, y + 18);
          beltLine.addColorStop(0, "rgba(172,214,238,0)");
          beltLine.addColorStop(0.5, "rgba(172,214,238,0.15)");
          beltLine.addColorStop(1, "rgba(172,214,238,0)");
          ctx.fillStyle = beltLine;
          ctx.fillRect(0, y, config.canvas.width, 18);
        }
        ctx.fillStyle = "rgba(188,228,245,0.26)";
        for (let i = 0; i < Math.max(10, Math.round(18 * debrisDensity)); i += 1) {
          const t = missionTime * 0.15 * cadenceMul + i * 0.31;
          const x = (t * config.canvas.width * 0.35 + i * 72) % (config.canvas.width + 24) - 12;
          const y = 70 + (i % 6) * 110 + Math.sin(t * 7 + i) * 11;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.restore();
      } else if (mission.biomeId === "ion_field") {
        ctx.fillStyle = "rgba(98,132,204,0.08)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < Math.max(3, Math.round(4 * debrisDensity)); i += 1) {
          const y = 92 + i * 150;
          const alpha = 0.16 + Math.sin(missionTime * 1.8 * cadenceMul + i * 1.4) * 0.06;
          ctx.strokeStyle = `rgba(166,196,255,${Math.max(0.06, alpha)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let x = 0; x <= config.canvas.width; x += 48) {
              const waveY = y + Math.sin(x * 0.018 + missionTime * 3 * cadenceMul + i) * 8;
            ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
        for (let i = 0; i < Math.max(6, Math.round(10 * debrisDensity)); i += 1) {
          const pulse = 0.2 + Math.sin(missionTime * 2.2 * cadenceMul + i * 0.7) * 0.1;
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
        for (let i = 0; i < Math.max(4, Math.round(6 * debrisDensity)); i += 1) {
          const pulse = 0.2 + Math.sin(missionTime * 2.2 * cadenceMul + i * 0.7) * 0.14;
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
        for (let i = 0; i < Math.max(3, Math.round(5 * debrisDensity)); i += 1) {
          const y = 86 + i * 126 + Math.sin(missionTime * 1.3 * cadenceMul + i) * 7;
          const line = ctx.createLinearGradient(0, y, config.canvas.width, y + 18);
          line.addColorStop(0, "rgba(196,236,255,0)");
          line.addColorStop(0.5, "rgba(196,236,255,0.16)");
          line.addColorStop(1, "rgba(196,236,255,0)");
          ctx.fillStyle = line;
          ctx.fillRect(0, y, config.canvas.width, 18);
        }
        ctx.restore();
      } else if (mission.biomeId === "neon_nebula") {
        ctx.fillStyle = "rgba(114,76,172,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < Math.max(3, Math.round(5 * debrisDensity)); i += 1) {
          const y = 86 + i * 124;
          const alpha = 0.18 + Math.sin(missionTime * 2.4 * cadenceMul + i * 1.2) * 0.08;
          ctx.strokeStyle = `rgba(208,168,255,${Math.max(0.08, alpha)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let x = 0; x <= config.canvas.width; x += 42) {
            const ny = y + Math.sin(x * 0.018 + missionTime * 3.6 * cadenceMul + i) * 9;
            if (x === 0) ctx.moveTo(x, ny);
            else ctx.lineTo(x, ny);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (mission.biomeId === "dust_expanse") {
        ctx.fillStyle = "rgba(136,108,74,0.09)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
        ctx.save();
        for (let i = 0; i < Math.max(4, Math.round(6 * debrisDensity)); i += 1) {
          const y = 94 + i * 106 + Math.sin(missionTime * 1.1 * cadenceMul + i) * 6;
          const band = ctx.createLinearGradient(0, y, config.canvas.width, y + 20);
          band.addColorStop(0, "rgba(236,198,142,0)");
          band.addColorStop(0.5, "rgba(236,198,142,0.15)");
          band.addColorStop(1, "rgba(236,198,142,0)");
          ctx.fillStyle = band;
          ctx.fillRect(0, y, config.canvas.width, 20);
        }
        ctx.restore();
      }

      if ((effects.fogAlpha ?? 0) > 0) {
        const fogPulse = 1 + Math.sin(missionTime * 1.6 * cadenceMul) * Math.max(0, Math.min(0.35, Number(visual.fogPulse) || 0));
        const alpha = Math.min(0.58, effects.fogAlpha * fogPulse * (1 + beatPulse * 0.2));
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
        const hazardBeatBoost = 1 + beatPulse * 0.16;
        const telegraphVisualMul = Math.max(0.65, Math.min(1.7, Number(hazard.telegraphVisualMul) || 1));
        const telegraphRatio = Math.max(0, Math.min(1, Number(hazard.telegraphRatio) || 0));
        const telegraphPulse = hazard.telegraphActive ? (0.45 + telegraphRatio * 0.55) * telegraphVisualMul : 0;
        const telegraphCfg = hazard.telegraphProfile || {};
        const telegraphColor =
          typeof telegraphCfg.pulseColor === "string" && telegraphCfg.pulseColor.length > 0
            ? telegraphCfg.pulseColor
            : "255,204,148";
        const ringBoost = Math.max(0, Number(telegraphCfg.ringBoost) || 0) * telegraphVisualMul;
        const lineBoost = Math.max(0, Number(telegraphCfg.lineBoost) || 0) * telegraphVisualMul;
        const pulseRadius =
          hazard.type === "plasma_vent"
            ? hazard.radius * (0.84 + Math.sin((hazard.phase ?? 0) * 2.8) * 0.16) * hazardBeatBoost * (1 + telegraphPulse * ringBoost)
            : hazard.type === "dust_squall"
              ? hazard.radius * (0.9 + Math.sin((hazard.phase ?? 0) * 2.1) * 0.1) * hazardBeatBoost
            : hazard.radius * hazardBeatBoost;
        ctx.save();
        if (hazard.type === "debris_field") {
          const ringPulse = 0.9 + Math.sin((hazard.phase ?? 0) * 3.6) * 0.1;
          ctx.strokeStyle = "rgba(140,205,255,0.55)";
          ctx.fillStyle = "rgba(96,146,198,0.09)";
          ctx.lineWidth = (1.4 + ringPulse * 0.4) * hazardBeatBoost;
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
          const alpha = (0.38 + Math.sin((hazard.phase ?? 0) * 3.3) * 0.14) * (1 + beatPulse * 0.15);
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
        } else if (hazard.type === "neon_arc_field") {
          const arcPulse = 0.2 + Math.sin((hazard.phase ?? 0) * 3.4) * 0.12;
          ctx.strokeStyle = `rgba(206,166,255,${Math.max(0.1, 0.26 + arcPulse)})`;
          ctx.fillStyle = `rgba(138,92,232,${Math.max(0.08, 0.12 + arcPulse * 0.3)})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "rgba(230,198,255,0.52)";
          for (let i = 0; i < 4; i += 1) {
            const angleA = (i / 4) * Math.PI * 2 + (hazard.phase ?? 0) * 1.6;
            const angleB = angleA + 0.46 + Math.sin((hazard.phase ?? 0) * 2.2 + i) * 0.14;
            const r = pulseRadius * (0.36 + i * 0.12);
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, r, angleA, angleB);
            ctx.stroke();
          }
        } else if (hazard.type === "dust_squall") {
          const dustPulse = 0.18 + Math.sin((hazard.phase ?? 0) * 2.6) * 0.08;
          ctx.strokeStyle = `rgba(226,194,142,${Math.max(0.1, 0.24 + dustPulse)})`;
          ctx.fillStyle = `rgba(140,112,78,${Math.max(0.06, 0.12 + dustPulse * 0.2)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = "rgba(244,214,166,0.32)";
          for (let i = 0; i < 5; i += 1) {
            const swirl = (hazard.phase ?? 0) * 1.3 + i * 1.1;
            const sx = hazard.x + Math.cos(swirl) * pulseRadius * (0.28 + i * 0.1);
            const sy = hazard.y + Math.sin(swirl) * pulseRadius * (0.28 + i * 0.1);
            ctx.beginPath();
            ctx.arc(sx, sy, 4 + i * 1.2, swirl, swirl + Math.PI * 0.66);
            ctx.stroke();
          }
        }
        if (hazard.telegraphActive) {
          const teleAlpha = Math.max(
            0.12,
            Math.min(0.7, (Number(telegraphCfg.pulseAlpha) || 0.22) * telegraphVisualMul * (0.58 + telegraphPulse * 0.86))
          );
          ctx.strokeStyle = `rgba(${telegraphColor},${teleAlpha})`;
          ctx.lineWidth = 1.4 + telegraphPulse * (2.2 + lineBoost * 2.5);
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius * (1 + 0.06 * telegraphPulse), 0, Math.PI * 2);
          ctx.stroke();
          const halo = ctx.createRadialGradient(hazard.x, hazard.y, pulseRadius * 0.22, hazard.x, hazard.y, pulseRadius * 1.2);
          halo.addColorStop(0, `rgba(${telegraphColor},${teleAlpha * 0.28})`);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = halo;
          ctx.fillRect(hazard.x - pulseRadius * 1.3, hazard.y - pulseRadius * 1.3, pulseRadius * 2.6, pulseRadius * 2.6);
          const streakLen = pulseRadius * (0.2 + telegraphPulse * (0.45 + lineBoost));
          for (let i = 0; i < 4; i += 1) {
            const angle = (i / 4) * Math.PI * 2 + (hazard.phase ?? 0) * 0.8;
            const sx = hazard.x + Math.cos(angle) * pulseRadius * 0.82;
            const sy = hazard.y + Math.sin(angle) * pulseRadius * 0.82;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(angle) * streakLen, sy + Math.sin(angle) * streakLen);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      const warnings = [];
      const telegraphWarnings = [];
      const hazardWarningLabel = (type) =>
        type === "debris_field"
          ? "DEBRIS FIELD"
          : type === "plasma_vent"
            ? "PLASMA VENT"
            : type === "relay_jammer_burst"
              ? "RELAY JAMMER"
              : type === "cryo_shear_zone"
                ? "CRYO SHEAR"
                : type === "neon_arc_field"
                  ? "NEON ARC"
                  : type === "dust_squall"
                    ? "DUST SQUALL"
                : "HAZARD";
      for (const hazard of biomeHazards) {
        if (!hazard.telegraphActive) continue;
        telegraphWarnings.push({
          priority: Math.max(1, Math.floor(hazard.telegraphProfile?.warningPriority || 2)),
          label: `${hazardWarningLabel(hazard.type)} INCOMING`
        });
      }
      telegraphWarnings.sort((a, b) => b.priority - a.priority);
      for (const warning of telegraphWarnings.slice(0, 2)) warnings.push(warning.label);
      if ((effects.shieldDrainPerSecond ?? 0) > 0) warnings.push("ION STORM");
      if (mission.gravityAnomaly) warnings.push("GRAVITY ANOMALY");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "debris_field")) warnings.push("DEBRIS FIELD");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "plasma_vent")) warnings.push("PLASMA VENT");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "relay_jammer_burst" && hazard.pulseActive)) {
        warnings.push("RELAY JAMMER");
      }
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "cryo_shear_zone")) warnings.push("CRYO SHEAR");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "neon_arc_field")) warnings.push("NEON ARC");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "dust_squall")) warnings.push("DUST SQUALL");
      if ((model.sentryRelays || []).some((relay) => relay.telegraphActive)) warnings.push(tr("warning.sentry_lock"));
      if ((mission.bossRushPressure?.active || mission.bossRushPressure?.pulseTtl > 0) && model.runMode === "boss_rush") {
        warnings.push(tr("warning.boss_rush_pressure"));
      }
      if (model.miniBoss?.phaseAnnounceTimer > 0) warnings.push(`BOSS PHASE ${model.miniBoss.phaseIndex + 1}`);
      if (model.uiAlerts?.lowHull) warnings.push("HULL CRITICAL");
      if (model.uiAlerts?.highHeat) warnings.push("HEAT CRITICAL");
      if (!warnings.length) return;

      const warningText = [...new Set(warnings)].join(" | ");
      const alpha = 0.58 + Math.sin(missionTime * 8.3) * 0.22;
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
                : type === "neon_arc_field"
                  ? "Neon Arc"
                  : type === "dust_squall"
                    ? "Dust Squall"
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
      if (model.currentMission.drifterStatus && model.currentMission.drifterStatus !== "none") {
        ctx.font = "600 12px Trebuchet MS";
        ctx.fillStyle =
          model.currentMission.drifterStatus === "captured"
            ? "rgba(168,255,198,0.94)"
            : model.currentMission.drifterStatus === "lost"
              ? "rgba(255,198,158,0.9)"
              : "rgba(186,236,255,0.92)";
        const status = tr(`mission.drifter.${model.currentMission.drifterStatus}`);
        ctx.fillText(tr("mission.drifter.status", { status }), config.canvas.width / 2, 116);
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

    drawShipIdentityIcon(centerX, centerY, shipId) {
      const { ctx } = this;
      const profiles = {
        viper_mk2: {
          stroke: "#d9faff",
          fill: "rgba(112,214,255,0.22)",
          points: [
            [1.05, 0],
            [-0.94, -0.58],
            [-0.42, -0.08],
            [-0.58, 0],
            [-0.42, 0.08],
            [-0.94, 0.58]
          ]
        },
        bastion_frame: {
          stroke: "#e2fbff",
          fill: "rgba(132,207,255,0.24)",
          points: [
            [0.96, 0],
            [-1.08, -0.76],
            [-0.58, -0.2],
            [-0.74, 0],
            [-0.58, 0.2],
            [-1.08, 0.76]
          ]
        },
        revenant_frame: {
          stroke: "#e4f0ff",
          fill: "rgba(146,194,255,0.24)",
          points: [
            [1.0, 0],
            [-0.92, -0.66],
            [-0.3, -0.1],
            [-0.72, 0],
            [-0.3, 0.1],
            [-0.92, 0.66]
          ]
        },
        helix_frame: {
          stroke: "#d8fff0",
          fill: "rgba(121,232,198,0.22)",
          points: [
            [0.98, 0],
            [-0.96, -0.62],
            [-0.56, -0.12],
            [-0.72, 0],
            [-0.56, 0.12],
            [-0.96, 0.62]
          ]
        }
      };
      const profile = profiles[shipId] || profiles.viper_mk2;
      const r = 10;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.shadowColor = profile.stroke;
      ctx.shadowBlur = 8;
      ctx.fillStyle = profile.fill;
      ctx.strokeStyle = profile.stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r * profile.points[0][0], r * profile.points[0][1]);
      for (let i = 1; i < profile.points.length; i += 1) {
        ctx.lineTo(r * profile.points[i][0], r * profile.points[i][1]);
      }
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

    formatSignedInteger(value) {
      const number = Math.floor(Number(value) || 0);
      return number > 0 ? `+${number}` : String(number);
    }

    drawFactionEndSummary(centerX, startY, factionSummary) {
      const { ctx } = this;
      if (!factionSummary || !Array.isArray(factionSummary.byFaction) || factionSummary.byFaction.length === 0) {
        return startY;
      }
      let y = startY;
      ctx.textAlign = "center";
      ctx.font = "600 15px Trebuchet MS";
      ctx.fillStyle = "rgba(196,238,255,0.9)";
      ctx.fillText(tr("overlay.faction_summary.title"), centerX, y);
      y += 20;
      ctx.font = "500 13px Trebuchet MS";
      ctx.fillStyle = "rgba(216,245,255,0.9)";
      for (const faction of factionSummary.byFaction) {
        ctx.fillText(
          tr("overlay.faction_summary.row", {
            faction: tr(`game.faction.${faction.factionId}`),
            start: faction.startRep,
            end: faction.endRep,
            delta: this.formatSignedInteger(faction.deltaRep)
          }),
          centerX,
          y
        );
        y += 18;
      }
      const unlockRows = [];
      for (const faction of factionSummary.byFaction) {
        const unlocked = Array.isArray(faction.unlockedThresholdIds) ? faction.unlockedThresholdIds : [];
        if (!unlocked.length) continue;
        unlockRows.push(
          tr("overlay.faction_summary.unlock_row", {
            faction: tr(`game.faction.${faction.factionId}`),
            unlocks: unlocked.map((id) => tr(`game.faction.threshold.${id}`)).join(", ")
          })
        );
      }
      if (unlockRows.length > 0) {
        ctx.fillStyle = "rgba(255,223,164,0.92)";
        for (const row of unlockRows) y = this.drawWrappedText(row, centerX, y, 760, 16, 2) + 18;
      }
      const timeline = Array.isArray(factionSummary.timeline) ? factionSummary.timeline.slice(-2) : [];
      if (timeline.length > 0) {
        ctx.fillStyle = "rgba(186,226,248,0.86)";
        for (const event of timeline) {
          const factionName = tr(`game.faction.${event.factionId}`);
          const text =
            event.type === "threshold_unlock"
              ? tr("overlay.faction_summary.timeline_unlock", {
                  sector: event.sector,
                  faction: factionName,
                  threshold: tr(`game.faction.threshold.${event.thresholdId}`)
                })
              : tr("overlay.faction_summary.timeline_delta", {
                  sector: event.sector,
                  faction: factionName,
                  delta: this.formatSignedInteger(event.delta),
                  reason: tr(event.reasonKey || "game.faction.reason.mission_start")
                });
          y = this.drawWrappedText(text, centerX, y, 760, 16, 2) + 14;
        }
      }
      return y;
    }

    getEndSummaryPages() {
      return [
        { id: "overview", labelKey: "overlay.end_summary.tab.overview" },
        { id: "drops_damage", labelKey: "overlay.end_summary.tab.drops_damage" },
        { id: "timeline_faction", labelKey: "overlay.end_summary.tab.timeline_faction" }
      ];
    }

    getEndSummaryPageIndex(pageId) {
      const pages = this.getEndSummaryPages();
      const index = pages.findIndex((entry) => entry.id === pageId);
      return index >= 0 ? index : 0;
    }

    drawEndSummaryHeader(centerX, y, pageId) {
      const { ctx } = this;
      const pages = this.getEndSummaryPages();
      const index = this.getEndSummaryPageIndex(pageId);
      const active = pages[index];
      ctx.textAlign = "center";
      ctx.font = "600 15px Trebuchet MS";
      ctx.fillStyle = "rgba(190,236,255,0.92)";
      ctx.fillText(tr(active.labelKey), centerX, y);
      ctx.font = "500 12px Trebuchet MS";
      ctx.fillStyle = "rgba(170,218,242,0.85)";
      ctx.fillText(
        tr("overlay.end_summary.page_indicator", { current: index + 1, total: pages.length }),
        centerX,
        y + 16
      );
    }

    getEndSummarySourceLabel(sourceId) {
      const key = `overlay.end_summary.source.${sourceId}`;
      const resolved = tr(key);
      if (resolved === key) return String(sourceId || "unknown").toUpperCase();
      return resolved;
    }

    drawEndSummaryOverviewPage(summary, centerX, startY, isVictory = false) {
      const { ctx } = this;
      let y = startY;
      ctx.font = "600 20px Trebuchet MS";
      ctx.fillStyle = "#d8f5ff";
      ctx.fillText(tr("overlay.score", { score: summary.score ?? 0 }), centerX, y);
      y += 28;
      ctx.font = "500 15px Trebuchet MS";
      ctx.fillStyle = "rgba(206,238,255,0.95)";
      ctx.fillText(tr("overlay.sector_cleared", { sector: summary.sector ?? 1 }), centerX, y);
      y += 24;
      y = this.drawWrappedText(
        tr("overlay.identity_status", {
          pilot: summary.identity?.pilot || "-",
          ship: summary.identity?.ship || "-"
        }),
        centerX,
        y,
        660,
        22,
        2
      );
      y += 24;
      y = this.drawWrappedText(
        tr("overlay.build", {
          primary: summary.loadout?.primary || "-",
          secondary: summary.loadout?.secondary || "-",
          utility: summary.loadout?.utility || "-"
        }),
        centerX,
        y,
        660,
        22,
        2
      );
      y += 26;
      ctx.fillText(
        tr("overlay.runtime", { seconds: (summary.runtimeSeconds ?? 0).toFixed(1) }),
        centerX,
        y
      );
      y += 24;
      ctx.fillText(
        tr("overlay.end_summary.overview_progress", {
          missions: Math.max(0, Number(summary.missionsCompleted) || 0),
          bosses: Math.max(0, Number(summary.miniBossKills) || 0),
          salvage: Math.max(0, Number(summary.salvageParts) || 0)
        }),
        centerX,
        y
      );
      if (isVictory) {
        y += 28;
        const statusKey = summary.statusKey || "overlay.campaign_complete";
        ctx.fillStyle = "rgba(255,231,168,0.95)";
        ctx.fillText(tr(statusKey), centerX, y);
        const finalRewards = summary.finalClearRewards;
        if (finalRewards) {
          y += 28;
          ctx.fillStyle = "rgba(194,237,255,0.95)";
          ctx.font = "600 16px Trebuchet MS";
          ctx.fillText(tr("overlay.end_summary.final_rewards_title"), centerX, y);
          y += 19;
          ctx.font = "500 13px Trebuchet MS";
          ctx.fillStyle = "rgba(216,245,255,0.95)";
          ctx.fillText(
            tr("overlay.end_summary.final_rewards_mode", {
              mode: finalRewards.mode === "boss_rush" ? tr("game.run_mode.boss_rush") : tr("game.run_mode.campaign")
            }),
            centerX,
            y
          );
          y += 17;
          ctx.fillText(
            tr("overlay.end_summary.final_rewards_values", {
              credits: Math.max(0, Math.floor(Number(finalRewards.credits) || 0)),
              salvage: Math.max(0, Math.floor(Number(finalRewards.salvage) || 0)),
              score: Math.max(0, Math.floor(Number(finalRewards.score) || 0)),
              drops: Math.max(0, Math.floor(Number(finalRewards.dropsCount) || 0))
            }),
            centerX,
            y
          );
        }
      }
      return y;
    }

    drawEndSummaryDropsDamagePage(summary, centerX, startY) {
      const { ctx } = this;
      let y = startY;
      const totals = summary.runSummary?.damageTakenTotal || {};
      const shieldAbsorb = Math.max(0, Number(totals.shieldAbsorb) || 0);
      const hullDamage = Math.max(0, Number(totals.hullDamage) || 0);
      ctx.textAlign = "center";
      ctx.font = "600 16px Trebuchet MS";
      ctx.fillStyle = "rgba(194,237,255,0.95)";
      ctx.fillText(tr("overlay.end_summary.damage_title"), centerX, y);
      y += 22;
      ctx.font = "500 14px Trebuchet MS";
      ctx.fillStyle = "rgba(216,245,255,0.95)";
      ctx.fillText(tr("overlay.end_summary.damage_shield", { value: shieldAbsorb.toFixed(1) }), centerX, y);
      y += 18;
      ctx.fillText(tr("overlay.end_summary.damage_hull", { value: hullDamage.toFixed(1) }), centerX, y);
      y += 30;
      ctx.font = "600 16px Trebuchet MS";
      ctx.fillStyle = "rgba(194,237,255,0.95)";
      ctx.fillText(tr("overlay.end_summary.drop_title"), centerX, y);
      y += 22;
      const topDrops = Array.isArray(summary.runSummary?.topDrops) ? summary.runSummary.topDrops : [];
      ctx.font = "500 13px Trebuchet MS";
      if (!topDrops.length) {
        ctx.fillStyle = "rgba(170,214,236,0.86)";
        ctx.fillText(tr("overlay.end_summary.no_drops"), centerX, y);
        return y;
      }
      for (const drop of topDrops.slice(0, 6)) {
        ctx.fillStyle = "rgba(216,245,255,0.95)";
        const line = tr("overlay.end_summary.drop_row", {
          rarity: drop.rarityLabel || "Common",
          name: drop.name || "-",
          slot: String(drop.slot || "-").toUpperCase(),
          source: this.getEndSummarySourceLabel(drop.source || "unknown"),
          sector: Math.max(1, Math.floor(Number(drop.sector) || 1))
        });
        y = this.drawWrappedText(line, centerX, y, 660, 16, 2) + 14;
      }
      return y;
    }

    drawEndSummaryTimelineFactionPage(summary, centerX, startY) {
      const { ctx } = this;
      let y = startY;
      const missionTimeline = Array.isArray(summary.runSummary?.missionTimeline) ? summary.runSummary.missionTimeline : [];
      ctx.textAlign = "center";
      ctx.font = "600 16px Trebuchet MS";
      ctx.fillStyle = "rgba(194,237,255,0.95)";
      ctx.fillText(tr("overlay.end_summary.timeline_title"), centerX, y);
      y += 20;
      ctx.font = "500 12px Trebuchet MS";
      if (!missionTimeline.length) {
        ctx.fillStyle = "rgba(170,214,236,0.86)";
        ctx.fillText(tr("overlay.end_summary.no_timeline"), centerX, y);
        y += 20;
      } else {
        ctx.fillStyle = "rgba(216,245,255,0.95)";
        for (const entry of missionTimeline.slice(-6)) {
          const line = tr("overlay.end_summary.timeline_row", {
            sector: Math.max(1, Math.floor(Number(entry.sector) || 1)),
            label: entry.label || String(entry.type || "MISSION").toUpperCase(),
            score: Math.floor(Number(entry.scoreGained) || 0),
            credits: Math.floor(Number(entry.creditsGained) || 0),
            hits: Math.max(0, Math.floor(Number(entry.playerHitsTaken) || 0)),
            sh: Math.max(0, Number(entry.shieldDamageTaken) || 0).toFixed(1),
            hu: Math.max(0, Number(entry.hullDamageTaken) || 0).toFixed(1)
          });
          y = this.drawWrappedText(line, centerX, y, 660, 15, 2) + 10;
        }
      }

      const factionSummary = summary.factionSummary;
      if (factionSummary && Array.isArray(factionSummary.byFaction) && factionSummary.byFaction.length > 0) {
        y += 8;
        ctx.font = "600 15px Trebuchet MS";
        ctx.fillStyle = "rgba(196,238,255,0.9)";
        ctx.fillText(tr("overlay.faction_summary.title"), centerX, y);
        y += 18;
        ctx.font = "500 12px Trebuchet MS";
        ctx.fillStyle = "rgba(216,245,255,0.9)";
        for (const faction of factionSummary.byFaction) {
          const line = tr("overlay.faction_summary.row", {
            faction: tr(`game.faction.${faction.factionId}`),
            start: faction.startRep,
            end: faction.endRep,
            delta: this.formatSignedInteger(faction.deltaRep)
          });
          ctx.fillText(line, centerX, y);
          y += 15;
        }
      }
      return y;
    }

    drawEndRunOverlay(model, summary, titleKey, isVictory = false) {
      const { ctx, config } = this;
      const cx = config.canvas.width / 2;
      const cy = config.canvas.height / 2;
      const touchUi = model.touchControls?.ui;
      this.drawOverlayBlock(cx, cy + 42, 730, 430);
      ctx.textAlign = "center";
      ctx.fillStyle = "#d8f5ff";
      ctx.font = "700 38px Trebuchet MS";
      ctx.fillText(tr(titleKey), cx, cy - 142);

      const pageId = model.overlayEndSummaryPage || "overview";
      this.drawEndSummaryHeader(cx, cy - 110, pageId);
      const contentTop = cy - 72;
      if (pageId === "drops_damage") this.drawEndSummaryDropsDamagePage(summary, cx, contentTop);
      else if (pageId === "timeline_faction") this.drawEndSummaryTimelineFactionPage(summary, cx, contentTop);
      else this.drawEndSummaryOverviewPage(summary, cx, contentTop, isVictory);

      ctx.font = "500 12px Trebuchet MS";
      ctx.fillStyle = "rgba(180,223,244,0.9)";
      ctx.fillText(tr("overlay.end_summary.switch_hint"), cx, cy + 224);
      if (touchUi) {
        const zoneW = 220;
        const zoneH = 44;
        touchUi.endSummaryTapZones = {
          left: { x: cx - 300, y: cy + 200, w: zoneW, h: zoneH },
          right: { x: cx + 80, y: cy + 200, w: zoneW, h: zoneH }
        };
      }
      ctx.font = "600 17px Trebuchet MS";
      ctx.fillStyle = "rgba(255,231,168,0.95)";
      ctx.fillText(tr("overlay.enter_new_run"), cx, cy + 248);
    }

    getRunSettingsRows(model) {
      const difficultyId = model.runDifficultyId || "normal";
      const mutatorId = model.runMutatorId || "standard";
      return [
        {
          id: "mode",
          label: tr("overlay.settings_mode"),
          value: tr(`game.run_mode.${model.runMode || "campaign"}`)
        },
        {
          id: "difficulty",
          label: tr("overlay.settings_difficulty"),
          value: tr(`game.difficulty.${difficultyId}`)
        },
        {
          id: "mutator",
          label: tr("overlay.settings_mutator"),
          value: tr(`game.mutator.${mutatorId}`)
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
        },
        {
          id: "flight",
          label: tr("overlay.settings_flight"),
          value: model.flightModel === "sim_lite" ? tr("hud.flight_sim_lite") : tr("hud.flight_arcade")
        }
      ];
    }

    drawRunSettingsList(model, centerY) {
      const { ctx, config } = this;
      const centerX = config.canvas.width / 2;
      const pilotId = model.identity?.pilotId;
      const pilotReference = tr(`identity.pilot.${pilotId}.reference`);
      const rows = this.getRunSettingsRows(model);
      const selected = Math.max(0, Math.min(rows.length - 1, model.overlaySettingsRow ?? 0));
      const rowW = 382;
      const rowH = 30;
      const gap = 8;
      const topY = centerY;
      const pointer = model.pointer || { inside: false, x: 0, y: 0 };
      const touchUi = model.touchControls?.ui;
      if (touchUi) touchUi.overlayRows = [];
      let showPilotReference = false;
      ctx.textAlign = "center";
      ctx.font = "600 16px Trebuchet MS";
      ctx.fillStyle = "#bfeeff";
      ctx.fillText(tr("overlay.settings_title"), centerX, topY - 16);

      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const y = topY + i * (rowH + gap);
        const active = i === selected;
        if (touchUi) {
          const sideW = Math.max(38, Math.round(rowW * 0.2));
          touchUi.overlayRows.push({
            id: row.id,
            x: centerX - rowW / 2,
            y,
            w: rowW,
            h: rowH,
            leftX: centerX - rowW / 2,
            rightX: centerX + rowW / 2 - sideW,
            sideW
          });
        }
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
        // Responsive vertical stack to keep clear spacing on small/large displays.
        const canvasHeight = config.canvas.height;
        const compact = canvasHeight < 780;
        const large = canvasHeight > 980;
        const logoRadius = 34;
        const logoToTitle = compact ? 80 : large ? 90 : 86;
        const titleToPress = compact ? 46 : large ? 56 : 52;
        const pressToSeed = compact ? 30 : large ? 36 : 34;
        const seedToOnboarding = compact ? 24 : large ? 32 : 28;
        const onboardingRowGap = compact ? 16 : large ? 20 : 18;
        const onboardingToSetup = compact ? 30 : large ? 38 : 34;
        const setupRows = this.getRunSettingsRows(model).length;
        const setupPanelHeightBase = compact ? 206 : large ? 224 : 214;
        const setupPanelHeight = setupPanelHeightBase + Math.max(0, setupRows - 4) * 38;
        const edgeMargin = 26;
        const extraBottomReserve = model.endlessUnlocked ? 8 : 36;

        const relativeStackHeight =
          logoRadius +
          logoToTitle +
          titleToPress +
          pressToSeed +
          seedToOnboarding +
          onboardingRowGap * 3 +
          onboardingToSetup +
          setupPanelHeight +
          extraBottomReserve;

        let stackTop = centerY - relativeStackHeight / 2;
        const maxTop = canvasHeight - edgeMargin - relativeStackHeight;
        if (maxTop <= edgeMargin) {
          stackTop = Math.max(8, maxTop);
        } else {
          stackTop = Math.min(Math.max(stackTop, edgeMargin), maxTop);
        }

        const logoY = stackTop + logoRadius;
        const titleY = logoY + logoToTitle;
        const infoPressY = titleY + titleToPress;
        const infoSeedY = infoPressY + pressToSeed;
        const onboardingY = infoSeedY + seedToOnboarding;
        const onboardingBottomY = onboardingY + onboardingRowGap * 3;
        const setupTopY = onboardingBottomY + onboardingToSetup;
        const setupCenterY = setupTopY + setupPanelHeight / 2;

        this.drawStartLogo(centerX, logoY);
        this.drawStartTitleWithShipAs(tr("render.start.title"), centerX, titleY);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillStyle = "#d8f5ff";
        ctx.fillText(tr("overlay.press_enter_start"), centerX, infoPressY);
        ctx.fillStyle = "rgba(210,239,255,0.94)";
        ctx.fillText(tr("overlay.seed", { seed: model.runSeed ?? "-" }), centerX, infoSeedY);
        ctx.font = "600 14px Trebuchet MS";
        ctx.fillStyle = "rgba(174,238,209,0.94)";
        ctx.fillText(tr("overlay.onboarding_title"), centerX, onboardingY);
        ctx.font = "500 13px Trebuchet MS";
        ctx.fillStyle = "rgba(196,233,248,0.92)";
        ctx.fillText(tr("overlay.onboarding_line1"), centerX, onboardingY + onboardingRowGap);
        ctx.fillText(tr("overlay.onboarding_line2"), centerX, onboardingY + onboardingRowGap * 2);
        ctx.fillText(tr("overlay.onboarding_line3"), centerX, onboardingY + onboardingRowGap * 3);

        this.drawOverlayBlock(centerX, setupCenterY, 430, setupPanelHeight);
        const modeBottomY = this.drawRunSettingsList(model, setupTopY + 34);
        if (!model.endlessUnlocked) {
          ctx.font = "500 15px Trebuchet MS";
          ctx.fillText(tr("overlay.endless_unlock_hint"), centerX, modeBottomY + 24);
        }
      }

      if (model.gameState === GAME_STATE.GAME_OVER) {
        const summary = model.gameOverSummary || model.victorySummary || {};
        this.drawEndRunOverlay(model, summary, "overlay.game_over", false);
      }

      if (model.gameState === GAME_STATE.VICTORY) {
        const summary = model.victorySummary || {};
        this.drawEndRunOverlay(model, summary, "overlay.victory", true);
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
        const availableRowsH = Math.max(360, config.canvas.height - topRowY - 64);
        const idealBottomRowH = Math.floor(availableRowsH * 0.45);
        const bottomRowH = Math.max(170, Math.min(220, idealBottomRowH));
        const topRowH = Math.max(200, availableRowsH - panelGap - bottomRowH);
        const bottomRowY = topRowY + topRowH + panelGap;
        const bottomRowSplit = 0.44;
        const totalGap = panelGap * 2;
        const colW0 = Math.floor((layoutW - totalGap) * 0.34);
        const colW1 = Math.floor((layoutW - totalGap) * 0.34);
        const colW2 = layoutW - colW0 - colW1 - totalGap;
        const colX0 = layoutX;
        const colX1 = colX0 + colW0 + panelGap;
        const colX2 = colX1 + colW1 + panelGap;
        const bottomColW0 = Math.floor((layoutW - panelGap) * bottomRowSplit);
        const bottomColW1 = layoutW - bottomColW0 - panelGap;
        const bottomColX0 = layoutX;
        const bottomColX1 = bottomColX0 + bottomColW0 + panelGap;
        const hangar = model.hangar;
        const touchUi = model.touchControls?.ui;
        const lootCrate = hangar.lootCrate || [];
        const inventory = model.inventory || [];
        const equipment = model.equipment || {};
        const selectedSource = hangar.selectionSource || "crate";
        const selectedIndex = hangar.selectionIndex || 0;
        const navSection = hangar.navSection || "shop";
        const shopIndex = hangar.shopIndex || 0;
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
        const pilotPerks = config.pilot?.perks || [];
        const unlockedPerkIds = new Set(pilot.unlockedPerks || []);
        const selectedPilotCallsign = tr(`identity.pilot.${model.identity?.pilotId}.callsign`);
        const selectedShipId = model.identity?.shipId || "viper_mk2";
        const formatSigned = (value) => {
          const num = Math.floor(Number(value) || 0);
          if (num > 0) return `+${num}`;
          return String(num);
        };
        const formatBountyRow = (offer) => {
          if (!offer) return "-";
          const label = offer.label || tr(`game.bounty.kind.${offer.kind}`);
          const progress = Math.max(0, Math.floor(Number(offer.progress) || 0));
          const target = Math.max(1, Math.floor(Number(offer.target) || 1));
          const credits = Math.max(0, Math.floor(Number(offer.rewardCredits) || 0));
          const salvage = Math.max(0, Math.floor(Number(offer.rewardSalvage) || 0));
          return tr("render.hangar.bounty_row", { label, progress, target, credits, salvage });
        };
        const resolveThresholdId = (repValue) => {
          const thresholds = Array.isArray(config.faction?.repThresholds) ? config.faction.repThresholds : [];
          const sorted = thresholds
            .filter((entry) => entry && Number.isFinite(Number(entry.minRep)) && typeof entry.id === "string")
            .map((entry) => ({
              id: entry.id,
              minRep: Math.floor(Number(entry.minRep)),
              maxRep: Number.isFinite(Number(entry.maxRep)) ? Math.floor(Number(entry.maxRep)) : null
            }))
            .sort((a, b) => a.minRep - b.minRep);
          let active = null;
          for (const tier of sorted) {
            if (repValue < tier.minRep) continue;
            if (Number.isFinite(tier.maxRep) && repValue > tier.maxRep) continue;
            active = tier.id;
          }
          return active;
        };
        const factionRep = model.factions || {};
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
          return `${truncate(getModuleDisplayName(module), 22)} | ${slotLabels[module.slot] || module.slot} | ${module.sellValue}cr`;
        };

        const getModuleDisplayName = (module) => {
          if (!module) return "-";
          if (module.baseName) return module.baseName;
          const rawName = String(module.name || "-");
          const rarityLabel = String(module.rarityLabel || "").trim();
          if (rarityLabel && rawName.startsWith(`${rarityLabel} `)) {
            return rawName.slice(rarityLabel.length + 1);
          }
          return rawName;
        };

        const getModuleRarityColor = (module) => {
          if (!module) return "#d8f5ff";
          return module.color || rarityById[module.rarity]?.color || "#d8f5ff";
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

        ctx.fillStyle = "#d8f5ff";
        ctx.textAlign = "left";
        ctx.font = "700 42px Trebuchet MS";
        ctx.fillText("HANGAR", layoutX, topY);
        const identityFont = "700 28px Trebuchet MS";
        const identityMaxW = 640;
        const iconRightPadding = 2;
        const iconSlotW = 26;
        const textRightX = layoutX + layoutW - iconSlotW - iconRightPadding;
        const identityText = fitText(`${selectedPilotCallsign}  |`, identityFont, identityMaxW - iconSlotW);
        ctx.textAlign = "right";
        ctx.font = identityFont;
        ctx.fillStyle = "rgba(216,245,255,0.94)";
        ctx.fillText(identityText, textRightX, topY);
        this.drawShipIdentityIcon(layoutX + layoutW - iconSlotW / 2 - iconRightPadding, topY - 8, selectedShipId);

        ctx.textAlign = "center";
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
        drawPanel(bottomColX0, bottomRowY, bottomColW0, bottomRowH, "SHOP & OPS", navSection === "shop");
        drawPanel(bottomColX1, bottomRowY, bottomColW1, bottomRowH, "TACTICAL STATUS");

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
        const listRows = Math.max(7, Math.min(10, Math.floor((topRowH - 92) / 17)));
        const listStart = getWindowStart(merged.length, mergedIndex, listRows, 4);
        const listTopY = selY - 13;
        const rowHeight = 17;
        const listHeight = rowHeight * listRows;
        const listBarX = colX0 + colW0 - 11;
        for (let i = 0; i < listRows; i += 1) {
          const item = merged[listStart + i];
          const rowY = selY - 13;
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
            if (touchUi) {
              touchUi.hangarLootRows.push({
                source: item.source,
                index: item.idx,
                x: selX - 4,
                y: rowY,
                w: colW0 - 22,
                h: 18
              });
            }
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
          drawRow(
            detailX,
            detailY,
            getModuleDisplayName(selectedModule),
            getModuleRarityColor(selectedModule),
            "700 14px Trebuchet MS",
            colW1 - 24
          );
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
          const module = equipment[slot];
          drawRow(
            buildX,
            buildY,
            `${slotLabels[slot]}: ${getModuleDisplayName(module)}`,
            getModuleRarityColor(module),
            "500 12px Trebuchet MS",
            colW2 - 24
          );
          buildY += 16;
        }
        buildY += 4;
        const activeSets = model.activeSets || [];
        const setText = activeSets.length ? activeSets.map((entry) => `${entry.label} ${entry.count}/3`).join(" | ") : "No active set";
        drawRow(buildX, buildY, `Set: ${setText}`, "#b8f6ff", "600 12px Trebuchet MS", colW2 - 24);

        const actX = bottomColX0 + 12;
        const actionRows = [];
        const pushHeader = (label) => actionRows.push({ type: "header", label });
        const pushAction = (label, color, actionIndex) => actionRows.push({ type: "action", label, color, actionIndex });
        const shopItems =
          Array.isArray(hangar.shopItems) && hangar.shopItems.length > 0 ? hangar.shopItems : config.hangar.items;
        pushHeader(tr("render.hangar.shop_group_sustain"));
        for (let i = 0; i < shopItems.length; i += 1) {
          const item = shopItems[i];
          const itemCost = item.resolvedCost ?? item.cost;
          const canAfford = model.credits >= itemCost;
          const contrabandPrefix = item.isContraband ? `${tr("render.hangar.contraband_tag")} ` : "";
          let label = `${contrabandPrefix}${item.title} ${itemCost}cr`;
          if (item.id === "fire_rate") {
            label = `${contrabandPrefix}${item.title} [Lv ${fireRateLevel}/${fireRateMax}] ${itemCost}cr`;
          } else if (item.id === "magazine") {
            label = `${contrabandPrefix}${item.title} [Lv ${magazineLevel}/${magazineMax}] ${itemCost}cr`;
          }
          pushAction(label, canAfford ? "#d8f5ff" : "rgba(216,245,255,0.45)", i);
          if (item.id === "repair") pushHeader(tr("render.hangar.shop_group_progression"));
        }
        pushHeader(tr("render.hangar.shop_group_loadout"));
        const loadoutBaseIndex = shopItems.length;
        pushAction(`Primary: ${model.loadout.primaryLabel}`, "#ffd785", loadoutBaseIndex);
        pushAction(`Secondary: ${model.loadout.secondaryLabel}`, "#ffd785", loadoutBaseIndex + 1);
        pushAction(`Utility: ${model.loadout.utilityLabel}`, "#ffd785", loadoutBaseIndex + 2);
        pushHeader(tr("render.hangar.shop_group_vendor"));
        const vendorId = hangar.shopVendorId || "faction";
        pushAction(tr("render.hangar.vendor_choice", { vendor: tr(`game.hangar.vendor.${vendorId}`) }), "#ffd785", loadoutBaseIndex + 3);
        pushHeader(tr("render.hangar.shop_group_intel"));
        const intelId = hangar.factionIntelId || "balanced";
        pushAction(
          tr("render.hangar.intel_choice", { intel: tr(`game.faction.intel.${intelId}`) }),
          "#ffd785",
          loadoutBaseIndex + 4
        );
        pushHeader(tr("render.hangar.shop_group_inventory"));
        pushAction(
          `Sell selected (+${selectedModule?.sellValue ?? 0}cr)`,
          selectedModule ? "#d8f5ff" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 5
        );
        pushAction(
          `Salvage selected (+${selectedModule?.salvageValue ?? 0} parts)`,
          selectedModule ? "#d8f5ff" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 6
        );
        pushHeader(tr("render.hangar.shop_group_bounty"));
        const bountyBoardForActions = model.bountyBoard || {};
        const bountyOffersForActions = Array.isArray(bountyBoardForActions.offers) ? bountyBoardForActions.offers : [];
        const claimableCount = bountyOffersForActions.filter((offer) => offer && offer.completed && !offer.claimed).length;
        const bountyRerollMax = Math.max(0, Math.floor(Number(config.mission?.bountyBoard?.maxRerollsPerSector) || 0));
        const bountyRerollUsed = Math.max(0, Math.floor(Number(bountyBoardForActions.rerollsUsed) || 0));
        const bountyRerollCost =
          typeof model.sector === "number"
            ? Math.max(
                0,
                Math.floor(Number(config.mission?.bountyBoard?.rerollCreditsBase) || 0) +
                  Math.max(0, model.sector - 1) * Math.max(0, Math.floor(Number(config.mission?.bountyBoard?.rerollCreditsStep) || 0))
              )
            : 0;
        const bountyHeatRerollMul = Math.max(
          1,
          1 +
            Math.max(0, Math.floor(Number(model.contrabandHeat) || 0)) *
              Math.max(0, Number(config.mission?.bountyBoard?.heatRerollCostPerStack) || 0)
        );
        const bountyRerollCostFinal = Math.max(0, Math.floor(bountyRerollCost * bountyHeatRerollMul));
        pushAction(
          tr("render.hangar.bounty_claim_action", { count: claimableCount }),
          claimableCount > 0 ? "#9bf5bb" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 7
        );
        pushAction(
          tr("render.hangar.bounty_reroll_action", { cost: bountyRerollCostFinal, used: bountyRerollUsed, max: bountyRerollMax }),
          bountyRerollUsed < bountyRerollMax && model.credits >= bountyRerollCostFinal ? "#ffd785" : "rgba(216,245,255,0.45)",
          loadoutBaseIndex + 8
        );
        const actionContentTop = bottomRowY + 52;
        const actionContentHeight = Math.max(70, bottomRowH - 64);
        const rowHeights = actionRows.map((row) => (row.type === "header" ? 16 : 14));
        const selectedActionRowIndex = actionRows.findIndex((row) => row.type === "action" && row.actionIndex === shopIndex);
        let actionStart = 0;
        if (selectedActionRowIndex >= 0) {
          let span = 0;
          for (let i = actionStart; i <= selectedActionRowIndex; i += 1) span += rowHeights[i];
          while (span > actionContentHeight && actionStart < selectedActionRowIndex) {
            span -= rowHeights[actionStart];
            actionStart += 1;
          }
        }
        let actY = actionContentTop;
        let actionUsed = 0;
        for (let i = actionStart; i < actionRows.length; i += 1) {
          const row = actionRows[i];
          const rowHeight = rowHeights[i];
          if (actionUsed + rowHeight > actionContentHeight) break;
          if (row.type === "header") {
            drawSectionHeader(actX, actY, row.label, bottomColW0 - 24);
            actY += rowHeight;
            actionUsed += rowHeight;
            continue;
          }
          drawSelectableRow(
            actX,
            actY,
            bottomColW0 - 22,
            row.label,
            navSection === "shop" && shopIndex === row.actionIndex,
            row.color
          );
          if (touchUi) {
            touchUi.hangarShopRows.push({
              actionIndex: row.actionIndex,
              x: actX - 4,
              y: actY - 13,
              w: bottomColW0 - 22,
              h: 18
            });
          }
          actY += rowHeight;
          actionUsed += rowHeight;
        }
        const totalActionHeight = rowHeights.reduce((sum, h) => sum + h, 0);
        if (totalActionHeight > actionContentHeight) {
          const barX = bottomColX0 + bottomColW0 - 11;
          ctx.fillStyle = "rgba(63,207,255,0.2)";
          ctx.fillRect(barX, actionContentTop - 12, 4, actionContentHeight);
          const hiddenBefore = rowHeights.slice(0, actionStart).reduce((sum, h) => sum + h, 0);
          const thumbHeight = Math.max(10, (actionContentHeight / totalActionHeight) * actionContentHeight);
          const thumbTravel = Math.max(0, actionContentHeight - thumbHeight);
          const scrollRatio = Math.max(0, Math.min(1, hiddenBefore / Math.max(1, totalActionHeight - actionContentHeight)));
          const thumbY = actionContentTop - 12 + thumbTravel * scrollRatio;
          ctx.fillStyle = "rgba(255,231,168,0.82)";
          ctx.fillRect(barX, thumbY, 4, thumbHeight);
        }

        const statusX = bottomColX1 + 12;
        const statusTopY = bottomRowY + 52;
        const statusInnerW = bottomColW1 - 24;
        const statusGap = Math.max(12, Math.min(16, Math.floor((bottomRowH - 66) / 11)));
        const statusColGap = 18;
        const statusColW = Math.floor((statusInnerW - statusColGap) / 2);
        const statusLeftX = statusX;
        const statusRightX = statusX + statusColW + statusColGap;

        let statusLeftY = statusTopY;
        drawRow(statusLeftX, statusLeftY, `Mission: ${model.currentMission?.label || nextMissionType.toUpperCase()}`, "#d8f5ff", "600 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, `Sector ${model.sector} | Cr ${model.credits}`, "#d8f5ff", "500 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, `Score ${model.score} | Salv ${model.salvageParts}`, "#d8f5ff", "500 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, `Set: ${truncate(model.setStatusText || "No active set", 24)}`, "#b8f6ff", "500 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, `Flight: ${model.flightModel === "sim_lite" ? "SIM LITE" : "ARCADE"}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.difficulty", { difficulty: tr(`game.difficulty.${model.runDifficultyId || "normal"}`) }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.mutator", { mutator: tr(`game.mutator.${model.runMutatorId || "standard"}`) }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.faction_rep", {
            faction: tr("game.faction.helix_union"),
            rep: formatSigned(factionRep.helix_union)
          }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.faction_rep", {
            faction: tr("game.faction.drift_cartel"),
            rep: formatSigned(factionRep.drift_cartel)
          }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        const helixThresholdId = resolveThresholdId(Math.floor(Number(factionRep.helix_union) || 0));
        const driftThresholdId = resolveThresholdId(Math.floor(Number(factionRep.drift_cartel) || 0));
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.faction_perk", {
            faction: tr("game.faction.helix_union"),
            perk: helixThresholdId ? tr(`game.faction.threshold.${helixThresholdId}`) : tr("hud.status.faction_perk.none")
          }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        drawRow(
          statusLeftX,
          statusLeftY,
          tr("hud.status.faction_perk", {
            faction: tr("game.faction.drift_cartel"),
            perk: driftThresholdId ? tr(`game.faction.threshold.${driftThresholdId}`) : tr("hud.status.faction_perk.none")
          }),
          "#9fe3ff",
          "500 12px Trebuchet MS",
          statusColW
        );
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, `Pilot L${pilot.level || 1} | Perks ${unlockedPerkIds.size}/${pilotPerks.length}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusLeftY += statusGap;
        drawRow(statusLeftX, statusLeftY, "J: Pilot Console", "#9fe3ff", "600 12px Trebuchet MS", statusColW);

        const shared = config.ship.sharedPool || {};
        const pDrain = (activePrimary.energyCost || 0) * (shared.primaryShieldCostFactor ?? 0);
        const sDrain = (activeSecondary.energyCost || 0) * (shared.secondaryShieldCostFactor ?? 0);
        const uDrain = (activeUtility.energyCost || 0) * (shared.utilityShieldCostFactor ?? 0);

        let statusRightY = statusTopY;
        drawRow(statusRightX, statusRightY, `P CD ${formatSeconds(activePrimary.cooldownSeconds * tuningMultiplier)}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        drawRow(statusRightX, statusRightY, `S CD ${formatSeconds(activeSecondary.cooldownSeconds)}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        drawRow(statusRightX, statusRightY, `U CD ${formatSeconds(activeUtility.cooldownSeconds)}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        drawRow(statusRightX, statusRightY, `Drain P/S/U ${pDrain.toFixed(1)}/${sDrain.toFixed(1)}/${uDrain.toFixed(1)}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        drawRow(statusRightX, statusRightY, `Tuning x${tuningMultiplier.toFixed(2)} | Shots ${maxShots}`, "#9fe3ff", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        drawRow(statusRightX, statusRightY, tr("hud.status.contraband_heat", { heat: Math.floor(Number(model.contrabandHeat) || 0) }), "#ffb58f", "500 12px Trebuchet MS", statusColW);
        statusRightY += statusGap;
        const bountyBoard = model.bountyBoard || {};
        const bountySector = Math.max(1, Math.floor(Number(bountyBoard.sector) || model.sector));
        const bountyFactionLabel = bountyBoard.factionId ? tr(`game.faction.${bountyBoard.factionId}`) : tr("hud.unknown");
        const bountyRerollUsedStatus = Math.max(0, Math.floor(Number(bountyBoard.rerollsUsed) || 0));
        const bountyRerollMaxStatus = Math.max(0, Math.floor(Number(config.mission?.bountyBoard?.maxRerollsPerSector) || 0));
        drawRow(
          statusRightX,
          statusRightY,
          tr("render.hangar.bounty_title", {
            sector: bountySector,
            faction: bountyFactionLabel,
            used: bountyRerollUsedStatus,
            max: bountyRerollMaxStatus
          }),
          "#ffd785",
          "700 12px Trebuchet MS",
          statusColW
        );
        statusRightY += 14;
        const bountyOffers = Array.isArray(bountyBoard.offers) ? bountyBoard.offers : [];
        if (!bountyOffers.length) {
          drawRow(statusRightX, statusRightY, tr("render.hangar.bounty_none"), "rgba(216,245,255,0.7)", "500 12px Trebuchet MS", statusColW);
        } else {
          for (const offer of bountyOffers.slice(0, 3)) {
            const rowColor = offer.claimed || offer.completed ? "#9bf5bb" : "#d8f5ff";
            drawRow(statusRightX, statusRightY, formatBountyRow(offer), rowColor, "500 11px Trebuchet MS", statusColW);
            statusRightY += 14;
          }
        }

        const actionBarY = bottomRowY + bottomRowH + 8;
        ctx.fillStyle = "rgba(4,12,24,0.88)";
        ctx.fillRect(layoutX, actionBarY, layoutW, 24);
        ctx.strokeStyle = "rgba(63,207,255,0.45)";
        ctx.strokeRect(layoutX, actionBarY, layoutW, 24);
        ctx.textAlign = "center";
        ctx.font = "600 13px Trebuchet MS";
        ctx.fillStyle = "#d8f5ff";
        const sectionHintById = {
          loot: tr("render.hangar.context_hint_loot"),
          shop: tr("render.hangar.context_hint_shop")
        };
        ctx.fillText(sectionHintById[navSection] || tr("render.hangar.action_hint"), centerX, actionBarY + 16);

        ctx.font = "600 14px Trebuchet MS";
        ctx.fillStyle = "#b9f8c3";
        ctx.fillText(hangar.message, centerX, Math.min(config.canvas.height - 8, actionBarY + 42));

        if (model.deviceMode === "touch_mobile") {
          const barY = Math.min(config.canvas.height - 42, actionBarY + 48);
          const barH = 28;
          const gap = 10;
          const colW = Math.floor((layoutW - gap * 2) / 3);
          const leftX = layoutX;
          const middleX = leftX + colW + gap;
          const rightX = middleX + colW + gap;
          const drawTouchBarBtn = (x, label, active = false) => {
            ctx.fillStyle = active ? "rgba(255,231,168,0.2)" : "rgba(7,16,28,0.86)";
            ctx.strokeStyle = active ? "rgba(255,231,168,0.8)" : "rgba(83,247,255,0.42)";
            ctx.lineWidth = 1.2;
            ctx.fillRect(x, barY, colW, barH);
            ctx.strokeRect(x, barY, colW, barH);
            ctx.fillStyle = active ? "#ffe7a8" : "#d8f5ff";
            ctx.textAlign = "center";
            ctx.font = "700 12px Trebuchet MS";
            ctx.fillText(label, x + colW / 2, barY + 18);
          };
          drawTouchBarBtn(leftX, tr("touch.mobile.hangar.back"), navSection !== "shop");
          drawTouchBarBtn(middleX, tr("touch.mobile.hangar.action"), true);
          drawTouchBarBtn(rightX, tr("touch.mobile.hangar.launch"), false);
          if (touchUi) {
            touchUi.hangarBottomActions = {
              back: { x: leftX, y: barY, w: colW, h: barH },
              action: { x: middleX, y: barY, w: colW, h: barH },
              launch: { x: rightX, y: barY, w: colW, h: barH }
            };
          }
        }
      }

      ctx.restore();
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Renderer = Renderer;
})();
