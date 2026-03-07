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
        const isHunter = ufo.mode === "hunter";
        const bodyColor = isHunter ? "rgba(208,109,255,0.36)" : "rgba(255,92,183,0.34)";
        const lineColor = isHunter ? "rgba(240,177,255,0.95)" : "rgba(255,167,220,0.95)";

        ctx.save();
        ctx.translate(ufo.x, ufo.y);
        ctx.shadowColor = isHunter ? "rgba(215,132,255,0.7)" : "rgba(255,120,203,0.7)";
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

        ctx.restore();
      }
    }

    drawMiniBoss(boss) {
      if (!boss) return;
      const { ctx } = this;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      ctx.shadowColor = "rgba(255,120,210,0.85)";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "rgba(174,72,145,0.42)";
      ctx.strokeStyle = "rgba(255,180,235,0.95)";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(0, 0, boss.radius * 1.35, boss.radius * 0.74, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, -boss.radius * 0.38, boss.radius * 0.72, boss.radius * 0.35, 0, Math.PI, 0);
      ctx.stroke();

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
        const startY = config.canvas.height / 2 - 250;
        const hangar = model.hangar;
        const lootCrate = hangar.lootCrate || [];
        const inventory = model.inventory || [];
        const equipment = model.equipment || {};
        const selectedSource = hangar.selectionSource || "crate";
        const selectedIndex = hangar.selectionIndex || 0;
        const rarityById = {};
        for (const rarity of config.loot.rarities) rarityById[rarity.id] = rarity;
        const slotLabels = {
          hull: "Hull",
          shield: "Shield",
          generator: "Generator",
          engine: "Engine",
          chipset: "Chipset"
        };
        const formatModule = (module) => {
          if (!module) return "-";
          const affixCount = module.affixes?.length ?? 0;
          return `${module.name} [${slotLabels[module.slot] || module.slot}] Afx:${affixCount} Sell:${module.sellValue}`;
        };
        const drawListItem = (text, y, isSelected, color) => {
          ctx.fillStyle = isSelected ? "#ffe7a8" : color;
          ctx.fillText(isSelected ? `> ${text}` : text, centerX, y);
        };
        const selectedModule =
          selectedSource === "crate" ? lootCrate[selectedIndex] ?? null : inventory[selectedIndex] ?? null;
        const formatDelta = (nextValue, currentValue, unit = "", invert = false) => {
          const delta = nextValue - currentValue;
          const abs = Math.abs(delta);
          const displayAbs = unit === "%" ? abs * 100 : abs;
          const valueText = `${delta > 0 ? "+" : delta < 0 ? "-" : ""}${displayAbs.toFixed(displayAbs < 10 ? 1 : 0)}${unit}`;
          const good = invert ? delta < 0 : delta > 0;
          const bad = invert ? delta > 0 : delta < 0;
          return {
            text: valueText,
            color: good ? "#9bf5bb" : bad ? "#ff9ea5" : "rgba(216,245,255,0.7)"
          };
        };
        const readMod = (module, key) => module?.modifiers?.[key] ?? 0;

        ctx.fillText("HANGAR", centerX, startY);
        ctx.font = "600 20px Trebuchet MS";
        ctx.fillText(`Credits: ${model.credits} | Salvage parts: ${model.salvageParts}`, centerX, startY + 34);
        const missionOrder = config.mission.order;
        const nextMissionType = missionOrder[model.sector % missionOrder.length];
        ctx.fillText(`Next sector mission: ${nextMissionType.toUpperCase()}`, centerX, startY + 58);

        const items = config.hangar.items;
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          const y = startY + 102 + i * 38;
          const canAfford = model.credits >= item.cost;
          ctx.fillStyle = canAfford ? "#d8f5ff" : "rgba(216,245,255,0.45)";
          ctx.fillText(`${i + 1}. ${item.title} - ${item.cost} cr`, centerX, y);
        }

        const primaryDefs = config.loadout.primary;
        const secondaryDefs = config.loadout.secondary;
        const utilityDefs = config.loadout.utility;
        const primaryLineY = startY + 220;
        const secondaryLineY = startY + 244;
        const utilityLineY = startY + 268;

        ctx.fillStyle = "#ffd785";
        ctx.fillText(
          `4. Primary swap (${model.loadout.primaryLabel})`,
          centerX,
          primaryLineY
        );
        ctx.fillText(
          `5. Secondary swap (${model.loadout.secondaryLabel})`,
          centerX,
          secondaryLineY
        );
        ctx.fillText(
          `R. Utility swap (${model.loadout.utilityLabel})`,
          centerX,
          utilityLineY
        );
        ctx.fillStyle = "#d8f5ff";
        ctx.font = "500 16px Trebuchet MS";
        ctx.fillText("6/7 Select item | 8 Take/Equip | 9 Sell | 0 Salvage", centerX, startY + 296);

        ctx.fillStyle = "#a7f2ff";
        ctx.font = "600 18px Trebuchet MS";
        ctx.fillText(`Salvage Crate (${lootCrate.length})`, centerX, startY + 324);
        ctx.font = "500 15px Trebuchet MS";
        const crateRows = 4;
        const crateStart =
          selectedSource === "crate" ? Math.max(0, Math.min(selectedIndex - 2, Math.max(0, lootCrate.length - crateRows))) : 0;
        for (let i = 0; i < crateRows; i += 1) {
          const itemIndex = crateStart + i;
          const module = lootCrate[itemIndex];
          const y = startY + 346 + i * 20;
          if (!module) {
            drawListItem("-", y, false, "rgba(216,245,255,0.4)");
            continue;
          }
          const rarity = rarityById[module.rarity];
          drawListItem(
            formatModule(module),
            y,
            selectedSource === "crate" && selectedIndex === itemIndex,
            rarity?.color || "#d8f5ff"
          );
        }

        ctx.fillStyle = "#a7f2ff";
        ctx.font = "600 18px Trebuchet MS";
        ctx.fillText(`Inventory (${inventory.length}/${config.loot.maxInventoryItems})`, centerX, startY + 396);
        ctx.font = "500 15px Trebuchet MS";
        const invRows = 6;
        const invStart =
          selectedSource === "inventory" ? Math.max(0, Math.min(selectedIndex - 3, Math.max(0, inventory.length - invRows))) : 0;
        for (let i = 0; i < invRows; i += 1) {
          const itemIndex = invStart + i;
          const module = inventory[itemIndex];
          const y = startY + 418 + i * 20;
          if (!module) {
            drawListItem("-", y, false, "rgba(216,245,255,0.4)");
            continue;
          }
          const rarity = rarityById[module.rarity];
          drawListItem(
            formatModule(module),
            y,
            selectedSource === "inventory" && selectedIndex === itemIndex,
            rarity?.color || "#d8f5ff"
          );
        }

        const equippedRows = Object.keys(slotLabels).map((slot) => {
          const module = equipment[slot];
          return `${slotLabels[slot]}: ${module ? module.name : "-"}`;
        });
        ctx.fillStyle = "#ffd785";
        ctx.font = "600 16px Trebuchet MS";
        ctx.fillText(`Equipped: ${equippedRows.join(" | ")}`, centerX, startY + 390);

        const activeSets = model.activeSets || [];
        const setText = activeSets.length
          ? activeSets.map((set) => `${set.label} ${set.count}/3 T${set.tier}`).join(" | ")
          : "No active set";
        ctx.fillStyle = "#b8f6ff";
        ctx.font = "600 15px Trebuchet MS";
        ctx.fillText(`Set bonuses: ${setText}`, centerX, startY + 410);

        if (selectedModule) {
          const equippedSameSlot = equipment[selectedModule.slot] || null;
          const deltaHull = formatDelta(readMod(selectedModule, "hullPct"), readMod(equippedSameSlot, "hullPct"), "%");
          const deltaShield = formatDelta(readMod(selectedModule, "shieldPct"), readMod(equippedSameSlot, "shieldPct"), "%");
          const deltaDmg = formatDelta(
            readMod(selectedModule, "primaryDamagePct"),
            readMod(equippedSameSlot, "primaryDamagePct"),
            "%"
          );
          const deltaCd = formatDelta(
            readMod(selectedModule, "primaryCooldownPct"),
            readMod(equippedSameSlot, "primaryCooldownPct"),
            "%",
            true
          );
          const deltaSet = selectedModule.setTag
            ? `Set tag: ${selectedModule.setTag.toUpperCase()}`
            : "Set tag: -";

          ctx.font = "500 14px Trebuchet MS";
          ctx.fillStyle = "#d8f5ff";
          ctx.fillText(
            `Selected ${selectedModule.name} vs equipped ${equippedSameSlot?.name || "-"}`,
            centerX,
            startY + 430
          );
          ctx.fillStyle = deltaHull.color;
          ctx.fillText(`Hull ${deltaHull.text}`, centerX - 300, startY + 450);
          ctx.fillStyle = deltaShield.color;
          ctx.fillText(`Shield ${deltaShield.text}`, centerX - 120, startY + 450);
          ctx.fillStyle = deltaDmg.color;
          ctx.fillText(`Damage ${deltaDmg.text}`, centerX + 80, startY + 450);
          ctx.fillStyle = deltaCd.color;
          ctx.fillText(`CD ${deltaCd.text}`, centerX + 255, startY + 450);
          ctx.fillStyle = "#ffd9a7";
          ctx.fillText(deltaSet, centerX, startY + 470);
        }

        const activePrimary = primaryDefs[model.loadout.primaryId];
        const activeSecondary = secondaryDefs[model.loadout.secondaryId];
        const activeUtility = utilityDefs[model.loadout.utilityId];
        ctx.fillStyle = "#a7f2ff";
        ctx.font = "600 17px Trebuchet MS";
        ctx.fillText("Active Weapon Stats", centerX, startY + 500);
        ctx.font = "500 15px Trebuchet MS";
        ctx.fillText(
          `Primary (${activePrimary.label}) | CD ${activePrimary.cooldownSeconds.toFixed(2)}s | ${activePrimary.role} | ${activePrimary.effectText}`,
          centerX,
          startY + 520
        );
        ctx.fillText(
          `Secondary (${activeSecondary.label}) | CD ${activeSecondary.cooldownSeconds.toFixed(1)}s | ${activeSecondary.role} | ${activeSecondary.effectText}`,
          centerX,
          startY + 538
        );
        ctx.fillText(
          `Utility (${activeUtility.label}) | CD ${activeUtility.cooldownSeconds.toFixed(1)}s | ${activeUtility.role} | ${activeUtility.effectText}`,
          centerX,
          startY + 556
        );

        ctx.fillStyle = "#ffd785";
        ctx.font = "500 16px Trebuchet MS";
        ctx.fillText(
          `Levels: FireRate ${model.upgrades.fireRateLevel} | Magazine ${model.upgrades.magazineLevel}`,
          centerX,
          startY + 574
        );

        ctx.fillStyle = "#b9f8c3";
        ctx.fillText(model.hangar.message, centerX, startY + 592);

        ctx.fillStyle = "#d8f5ff";
        ctx.fillText("Enter = start dalsi sektor", centerX, startY + 610);
      }

      ctx.restore();
    }
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.Renderer = Renderer;
})();
