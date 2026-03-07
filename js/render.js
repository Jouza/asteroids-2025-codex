(() => {
  const { GAME_STATE } = window.Asteroids;

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

      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);

      ctx.shadowColor = "rgba(170,247,255,0.9)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(126,206,255,0.22)";
      ctx.strokeStyle = "#d6f9ff";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(ship.radius, 0);
      ctx.lineTo(-ship.radius * 0.9, -ship.radius * 0.66);
      ctx.lineTo(-ship.radius * 0.54, 0);
      ctx.lineTo(-ship.radius * 0.9, ship.radius * 0.66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (ship.shield > 0) {
        const shieldRatio = ship.shield / ship.shieldMax;
        ctx.strokeStyle = `rgba(128,229,255,${0.22 + shieldRatio * 0.5})`;
        ctx.lineWidth = 1.2 + shieldRatio * 1.8;
        ctx.shadowColor = "rgba(128,229,255,0.75)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, ship.radius * 1.24, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (model.gameState === GAME_STATE.PLAYING && input.isDown("ArrowUp")) {
        const jetGradient = ctx.createLinearGradient(-ship.radius * 1.6, 0, -ship.radius * 0.8, 0);
        jetGradient.addColorStop(0, "rgba(255,120,86,0.9)");
        jetGradient.addColorStop(1, "rgba(255,234,133,0.9)");
        ctx.shadowColor = "rgba(255,165,95,0.9)";
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
        ctx.fillStyle = "rgba(255,198,120,0.95)";
        ctx.shadowColor = "rgba(255,176,104,0.9)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-ship.radius * 0.24, ship.radius * 0.38);
        ctx.lineTo(-ship.radius * 0.72, ship.radius * 0.58);
        ctx.lineTo(-ship.radius * 0.32, ship.radius * 0.08);
        ctx.closePath();
        ctx.fill();
      }

      if (model.gameState === GAME_STATE.PLAYING && input.isDown("ArrowRight")) {
        ctx.fillStyle = "rgba(255,198,120,0.95)";
        ctx.shadowColor = "rgba(255,176,104,0.9)";
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
      const weakpointColor = boss.weakpointOpen ? "rgba(138,240,255,0.98)" : "rgba(255,180,235,0.95)";
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.shadowColor = "rgba(255,120,210,0.85)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(174,72,145,0.42)";
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

      if (boss.phaseAnnounceTimer > 0) {
        ctx.textAlign = "center";
        ctx.font = "700 14px Trebuchet MS";
        ctx.fillStyle = "rgba(255,223,146,0.96)";
        ctx.fillText(`PHASE ${boss.phaseIndex + 1}`, 0, -boss.radius * 1.55);
      }

      const hpRatio = Math.max(0, boss.hp / boss.maxHp);
      const barWidth = boss.radius * 2.2;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-barWidth / 2, boss.radius + 10, barWidth, 7);
      ctx.fillStyle = "rgba(255,134,204,0.95)";
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
        ctx.fillStyle = "rgba(118,142,170,0.05)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
      } else if (mission.biomeId === "refinery") {
        ctx.fillStyle = "rgba(158,112,74,0.05)";
        ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);
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
          ctx.strokeStyle = "rgba(140,205,255,0.38)";
          ctx.fillStyle = "rgba(96,146,198,0.09)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (hazard.type === "plasma_vent") {
          const alpha = 0.38 + Math.sin((hazard.phase ?? 0) * 3.3) * 0.14;
          ctx.strokeStyle = `rgba(255,166,108,${alpha})`;
          ctx.fillStyle = `rgba(255,126,74,${Math.max(0.08, alpha * 0.3)})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      const warnings = [];
      if ((effects.shieldDrainPerSecond ?? 0) > 0) warnings.push("ION STORM");
      if (mission.gravityAnomaly) warnings.push("GRAVITY ANOMALY");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "debris_field")) warnings.push("DEBRIS FIELD");
      if (biomeHazards.some((hazard) => hazard.active && hazard.type === "plasma_vent")) warnings.push("PLASMA VENT");
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
      ctx.restore();
    }

    drawTelemetry(model) {
      if (!model.telemetry?.enabled) return;

      const { ctx, config } = this;
      const telemetry = model.telemetry;
      const panelX = 18;
      const panelY = 72;
      const panelW = 410;
      const panelH = 268;
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

    drawOverlay(model) {
      const { ctx, config } = this;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

      ctx.fillStyle = "#d8f5ff";
      ctx.textAlign = "center";
      ctx.font = "700 38px Trebuchet MS";

      if (model.gameState === GAME_STATE.START) {
        ctx.fillText("ASTEROIDS", config.canvas.width / 2, config.canvas.height / 2 - 36);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillText("Stiskni Enter pro start", config.canvas.width / 2, config.canvas.height / 2 + 6);
        ctx.fillText(`Seed runu: ${model.runSeed ?? "-"}`, config.canvas.width / 2, config.canvas.height / 2 + 40);
      }

      if (model.gameState === GAME_STATE.GAME_OVER) {
        ctx.fillText("GAME OVER", config.canvas.width / 2, config.canvas.height / 2 - 28);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillText(`Skore: ${model.score}`, config.canvas.width / 2, config.canvas.height / 2 + 8);
        if (model.comboScoringEnabled) {
          ctx.fillText(`Combo pri konci: x${model.comboMultiplier.toFixed(2)}`, config.canvas.width / 2, config.canvas.height / 2 + 42);
        } else {
          ctx.fillText(`Sektor dosazeny: ${model.sector}`, config.canvas.width / 2, config.canvas.height / 2 + 42);
        }
        ctx.fillText("Enter pro restart", config.canvas.width / 2, config.canvas.height / 2 + 76);
      }

      if (model.gameState === GAME_STATE.PAUSED) {
        ctx.fillText("PAUZA", config.canvas.width / 2, config.canvas.height / 2 - 16);
        ctx.font = "600 22px Trebuchet MS";
        ctx.fillText("Stiskni P pro pokracovani", config.canvas.width / 2, config.canvas.height / 2 + 22);
      }

      if (model.gameState === GAME_STATE.HANGAR) {
        const centerX = config.canvas.width / 2;
        const topY = 86;
        const panelY = 146;
        const panelH = 468;
        const panelGap = 14;
        const panelW = Math.floor((config.canvas.width - 92 * 2 - panelGap * 2) / 3);
        const panelX0 = 92;
        const panelX1 = panelX0 + panelW + panelGap;
        const panelX2 = panelX1 + panelW + panelGap;
        const hangar = model.hangar;
        const lootCrate = hangar.lootCrate || [];
        const inventory = model.inventory || [];
        const equipment = model.equipment || {};
        const selectedSource = hangar.selectionSource || "crate";
        const selectedIndex = hangar.selectionIndex || 0;
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

        const truncate = (value, maxLen = 36) => {
          if (!value) return "-";
          return value.length > maxLen ? `${value.slice(0, maxLen - 3)}...` : value;
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

        const drawPanel = (x, y, w, h, title) => {
          ctx.fillStyle = "rgba(4,12,24,0.78)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "rgba(63,207,255,0.55)";
          ctx.lineWidth = 1.1;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = "#99ebff";
          ctx.textAlign = "left";
          ctx.font = "700 16px Trebuchet MS";
          ctx.fillText(title, x + 12, y + 22);
          ctx.strokeStyle = "rgba(63,207,255,0.3)";
          ctx.beginPath();
          ctx.moveTo(x + 10, y + 30);
          ctx.lineTo(x + w - 10, y + 30);
          ctx.stroke();
        };

        const drawRow = (x, y, text, color = "#d8f5ff", font = "500 14px Trebuchet MS") => {
          ctx.fillStyle = color;
          ctx.font = font;
          ctx.textAlign = "left";
          ctx.fillText(text, x, y);
        };

        const drawSelectableRow = (x, y, w, text, selected, color = "#d8f5ff") => {
          if (selected) {
            ctx.fillStyle = "rgba(255,231,168,0.16)";
            ctx.fillRect(x - 4, y - 13, w, 18);
            ctx.strokeStyle = "rgba(255,231,168,0.7)";
            ctx.strokeRect(x - 4, y - 13, w, 18);
          }
          drawRow(x, y, selected ? `> ${text}` : text, selected ? "#ffe7a8" : color, "500 13px Trebuchet MS");
        };

        const getWindowStart = (len, selected, rows, centerOffset) =>
          Math.max(0, Math.min(selected - centerOffset, Math.max(0, len - rows)));

        const readMod = (module, key) => module?.modifiers?.[key] ?? 0;
        const formatPctDelta = (next, current, invert = false) => {
          const d = (next - current) * 100;
          const good = invert ? d < 0 : d > 0;
          const bad = invert ? d > 0 : d < 0;
          const color = good ? "#9bf5bb" : bad ? "#ff9ea5" : "rgba(216,245,255,0.72)";
          return { text: `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`, color };
        };

        ctx.textAlign = "center";
        ctx.fillStyle = "#d8f5ff";
        ctx.font = "700 46px Trebuchet MS";
        ctx.fillText("HANGAR", centerX, topY);
        ctx.font = "600 21px Trebuchet MS";
        const missionOrder = config.mission.order;
        const nextMissionType = missionOrder[model.sector % missionOrder.length];
        ctx.fillText(
          `Credits ${model.credits}  |  Salvage ${model.salvageParts}  |  Next ${nextMissionType.toUpperCase()}`,
          centerX,
          topY + 30
        );

        drawPanel(panelX0, panelY, panelW, panelH, "SHOP");
        drawPanel(panelX1, panelY, panelW, panelH, "LOADOUT");
        drawPanel(panelX2, panelY, panelW, panelH, "LOOT");

        const leftX = panelX0 + 12;
        let leftY = panelY + 54;
        for (let i = 0; i < config.hangar.items.length; i += 1) {
          const item = config.hangar.items[i];
          const canAfford = model.credits >= item.cost;
          drawRow(leftX, leftY, `${i + 1}. ${truncate(item.title, 23)} ${item.cost}cr`, canAfford ? "#d8f5ff" : "rgba(216,245,255,0.45)");
          leftY += 24;
        }
        leftY += 8;
        drawRow(leftX, leftY, `4. Primary: ${model.loadout.primaryLabel}`, "#ffd785");
        leftY += 22;
        drawRow(leftX, leftY, `5. Secondary: ${model.loadout.secondaryLabel}`, "#ffd785");
        leftY += 22;
        drawRow(leftX, leftY, `R. Utility: ${model.loadout.utilityLabel}`, "#ffd785");
        leftY += 28;
        drawRow(
          leftX,
          leftY,
          `Levels FR ${model.upgrades.fireRateLevel} | MAG ${model.upgrades.magazineLevel}`,
          "#9fe3ff"
        );

        const midX = panelX1 + 12;
        let midY = panelY + 54;
        drawRow(midX, midY, `P: ${activePrimary.label} (${activePrimary.role})`, "#a7f2ff");
        midY += 21;
        drawRow(midX, midY, `S: ${activeSecondary.label} (${activeSecondary.role})`, "#a7f2ff");
        midY += 21;
        drawRow(midX, midY, `U: ${activeUtility.label} (${activeUtility.role})`, "#a7f2ff");
        midY += 26;
        drawRow(midX, midY, `P CD ${activePrimary.cooldownSeconds.toFixed(2)}s  ${truncate(activePrimary.effectText, 24)}`, "#d8f5ff", "500 13px Trebuchet MS");
        midY += 20;
        drawRow(midX, midY, `S CD ${activeSecondary.cooldownSeconds.toFixed(1)}s  ${truncate(activeSecondary.effectText, 24)}`, "#d8f5ff", "500 13px Trebuchet MS");
        midY += 20;
        drawRow(midX, midY, `U CD ${activeUtility.cooldownSeconds.toFixed(1)}s  ${truncate(activeUtility.effectText, 24)}`, "#d8f5ff", "500 13px Trebuchet MS");
        midY += 28;

        drawRow(midX, midY, "Equipped", "#ffd785", "600 14px Trebuchet MS");
        midY += 20;
        for (const slot of Object.keys(slotLabels)) {
          drawRow(midX, midY, `${slotLabels[slot]}: ${truncate(equipment[slot]?.name || "-", 22)}`, "#d8f5ff", "500 13px Trebuchet MS");
          midY += 18;
        }
        midY += 6;
        const activeSets = model.activeSets || [];
        const setText = activeSets.length
          ? activeSets.map((entry) => `${entry.label} ${entry.count}/3`).join(" | ")
          : "No active set";
        drawRow(midX, midY, `Sets: ${truncate(setText, 30)}`, "#b8f6ff", "600 13px Trebuchet MS");
        midY += 24;

        const pilotLevel = pilot.level || 1;
        const pilotXp = Math.floor(pilot.xp || 0);
        const pilotXpToNext = Math.max(1, Math.floor(pilot.xpToNext || 1));
        drawRow(
          midX,
          midY,
          `Pilot L${pilotLevel}  XP ${pilotXp}/${pilotXpToNext}  A:${pilot.attributePoints || 0} S:${pilot.skillPoints || 0}`,
          "#ffd785",
          "600 13px Trebuchet MS"
        );
        midY += 19;
        for (let i = 0; i < pilotAttrOrder.length; i += 1) {
          const key = pilotAttrOrder[i];
          const selected = (hangar.pilotAttrIndex || 0) === i;
          const value = Math.floor(pilotAttrs[key] || 0);
          drawRow(
            midX + i * 68,
            midY,
            `${selected ? ">" : ""}${pilotAttrLabels[key]}:${value}`,
            selected ? "#ffe7a8" : "#d8f5ff",
            "500 12px Trebuchet MS"
          );
        }
        midY += 18;
        if (selectedPerk) {
          const perkUnlocked = unlockedPerkIds.has(selectedPerk.id);
          drawRow(
            midX,
            midY,
            `Perk ${selectedPerkIndex + 1}/${pilotPerks.length}: ${selectedPerk.label} (${selectedPerk.branch})`,
            perkUnlocked ? "#9bf5bb" : "#d8f5ff",
            "600 12px Trebuchet MS"
          );
          midY += 16;
          drawRow(
            midX,
            midY,
            `Req ${formatPerkRequirements(selectedPerk)}  [${perkUnlocked ? "Unlocked" : "Lock"}]`,
            perkUnlocked ? "#9bf5bb" : "rgba(216,245,255,0.78)",
            "500 12px Trebuchet MS"
          );
          midY += 18;
        }

        if (selectedModule) {
          const equippedSameSlot = equipment[selectedModule.slot] || null;
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
          drawRow(midX, midY, `Selected: ${truncate(selectedModule.name, 24)}`, "#d8f5ff", "600 13px Trebuchet MS");
          midY += 18;
          drawRow(midX, midY, `Hull ${dHull.text}`, dHull.color, "500 13px Trebuchet MS");
          drawRow(midX + 68, midY, `Shield ${dShield.text}`, dShield.color, "500 13px Trebuchet MS");
          drawRow(midX + 152, midY, `Dmg ${dDmg.text}`, dDmg.color, "500 13px Trebuchet MS");
          drawRow(midX + 218, midY, `CD ${dCd.text}`, dCd.color, "500 13px Trebuchet MS");
        }

        const rightX = panelX2 + 12;
        let rightY = panelY + 54;
        drawRow(rightX, rightY, "6/7 Select  8 Take/Equip", "#d8f5ff", "600 12px Trebuchet MS");
        rightY += 16;
        drawRow(rightX, rightY, "9 Sell  0 Salvage", "#d8f5ff", "600 12px Trebuchet MS");
        rightY += 24;
        drawRow(rightX, rightY, `Crate (${lootCrate.length})`, "#a7f2ff", "700 14px Trebuchet MS");
        rightY += 18;

        const crateRows = 5;
        const crateStart = selectedSource === "crate" ? getWindowStart(lootCrate.length, selectedIndex, crateRows, 2) : 0;
        for (let i = 0; i < crateRows; i += 1) {
          const itemIndex = crateStart + i;
          const module = lootCrate[itemIndex];
          if (!module) {
            drawSelectableRow(rightX, rightY, panelW - 22, "-", false, "rgba(216,245,255,0.38)");
          } else {
            const rarity = rarityById[module.rarity];
            drawSelectableRow(
              rightX,
              rightY,
              panelW - 22,
              formatModuleShort(module),
              selectedSource === "crate" && selectedIndex === itemIndex,
              rarity?.color || "#d8f5ff"
            );
          }
          rightY += 18;
        }

        rightY += 10;
        drawRow(rightX, rightY, `Inventory (${inventory.length}/${config.loot.maxInventoryItems})`, "#a7f2ff", "700 14px Trebuchet MS");
        rightY += 18;
        const invRows = 7;
        const invStart = selectedSource === "inventory" ? getWindowStart(inventory.length, selectedIndex, invRows, 3) : 0;
        for (let i = 0; i < invRows; i += 1) {
          const itemIndex = invStart + i;
          const module = inventory[itemIndex];
          if (!module) {
            drawSelectableRow(rightX, rightY, panelW - 22, "-", false, "rgba(216,245,255,0.38)");
          } else {
            const rarity = rarityById[module.rarity];
            drawSelectableRow(
              rightX,
              rightY,
              panelW - 22,
              formatModuleShort(module),
              selectedSource === "inventory" && selectedIndex === itemIndex,
              rarity?.color || "#d8f5ff"
            );
          }
          rightY += 18;
        }

        const actionBarY = panelY + panelH + 10;
        ctx.fillStyle = "rgba(4,12,24,0.88)";
        ctx.fillRect(panelX0, actionBarY, panelW * 3 + panelGap * 2, 24);
        ctx.strokeStyle = "rgba(63,207,255,0.45)";
        ctx.strokeRect(panelX0, actionBarY, panelW * 3 + panelGap * 2, 24);
        ctx.textAlign = "center";
        ctx.font = "600 13px Trebuchet MS";
        ctx.fillStyle = "#d8f5ff";
        ctx.fillText("6/7 Select | 8 Take/Equip | 9 Sell | 0 Salvage | T/Y/U attrs | I/O/K perks | Enter Start", centerX, actionBarY + 16);

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
