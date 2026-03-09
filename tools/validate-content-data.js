#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function loadScript(context, relPath) {
  const fullPath = path.join(ROOT, relPath);
  const code = fs.readFileSync(fullPath, "utf8");
  vm.runInContext(code, context, { filename: relPath });
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

function validateContentData(contentData, issues) {
  assert(contentData && typeof contentData === "object", "CONTENT_DATA must be an object", issues);
  if (!contentData || typeof contentData !== "object") return;

  const factionDefs = contentData.faction?.definitions;
  assert(Array.isArray(factionDefs) && factionDefs.length >= 2, "faction.definitions must contain at least 2 factions", issues);
  if (Array.isArray(factionDefs)) {
    for (const [index, faction] of factionDefs.entries()) {
      assert(typeof faction.id === "string" && faction.id.length > 0, `faction[${index}] id is required`, issues);
    }
  }
  const repMin = Number(contentData.faction?.repMin);
  const repMax = Number(contentData.faction?.repMax);
  assert(Number.isFinite(repMin) && Number.isFinite(repMax), "faction reputation bounds must be numeric", issues);
  if (Number.isFinite(repMin) && Number.isFinite(repMax)) {
    assert(repMin <= repMax, "faction repMin must be <= repMax", issues);
  }
  const rewardCreditsPerRep100 = Number(contentData.faction?.rewardCreditsPerRep100);
  const rewardSalvagePerRep100 = Number(contentData.faction?.rewardSalvagePerRep100);
  assert(
    Number.isFinite(rewardCreditsPerRep100) && rewardCreditsPerRep100 >= 0,
    "faction.rewardCreditsPerRep100 must be >= 0",
    issues
  );
  assert(
    Number.isFinite(rewardSalvagePerRep100) && rewardSalvagePerRep100 >= 0,
    "faction.rewardSalvagePerRep100 must be >= 0",
    issues
  );

  const missionOrder = contentData.mission?.order;
  const allowedMissions = new Set(["survive", "ufo_hunt", "asteroid_storm", "mini_boss"]);
  assert(Array.isArray(missionOrder) && missionOrder.length > 0, "mission.order must be a non-empty array", issues);
  if (Array.isArray(missionOrder)) {
    for (const missionId of missionOrder) {
      assert(allowedMissions.has(missionId), `mission.order contains unknown id: ${missionId}`, issues);
    }
  }

  const modeWeights = contentData.ufo?.modeWeights || {};
  const weightKeys = Object.keys(modeWeights);
  assert(weightKeys.length > 0, "ufo.modeWeights must contain at least one mode", issues);
  let totalWeight = 0;
  for (const key of weightKeys) {
    const value = Number(modeWeights[key]);
    assert(Number.isFinite(value) && value >= 0, `ufo.modeWeights.${key} must be >= 0`, issues);
    totalWeight += value;
  }
  assert(totalWeight > 0, "ufo.modeWeights total must be > 0", issues);

  const hpByMode = contentData.ufo?.hpByMode || {};
  for (const key of Object.keys(hpByMode)) {
    const hp = Number(hpByMode[key]);
    assert(Number.isFinite(hp) && hp >= 1, `ufo.hpByMode.${key} must be >= 1`, issues);
  }

  const dropChance = contentData.loot?.dropChance;
  assert(dropChance && typeof dropChance === "object", "loot.dropChance must be defined", issues);
  if (dropChance && typeof dropChance === "object") {
    const allEntries = [];
    if (dropChance.asteroid) {
      for (const size of Object.keys(dropChance.asteroid)) {
        allEntries.push({ key: `loot.dropChance.asteroid.${size}`, value: dropChance.asteroid[size] });
      }
    }
    if (dropChance.ufo) {
      for (const mode of Object.keys(dropChance.ufo)) {
        allEntries.push({ key: `loot.dropChance.ufo.${mode}`, value: dropChance.ufo[mode] });
      }
    }
    allEntries.push({ key: "loot.dropChance.miniBoss", value: dropChance.miniBoss });
    for (const entry of allEntries) {
      const value = Number(entry.value);
      assert(Number.isFinite(value) && value >= 0 && value <= 1, `${entry.key} must be in range <0,1>`, issues);
    }
  }

  const director = contentData.missionDirector;
  assert(director && typeof director === "object", "missionDirector must be defined", issues);
  if (director && typeof director === "object") {
    assert(
      Array.isArray(director.pacingBySector) && director.pacingBySector.length > 0,
      "missionDirector.pacingBySector must be non-empty",
      issues
    );
    for (const [index, entry] of (director.pacingBySector || []).entries()) {
      assert(
        Number.isFinite(entry.maxSector) && entry.maxSector >= 1,
        `missionDirector.pacingBySector[${index}].maxSector must be >= 1`,
        issues
      );
      assert(
        Number.isFinite(entry.difficulty) && entry.difficulty > 0,
        `missionDirector.pacingBySector[${index}].difficulty must be > 0`,
        issues
      );
    }
    assert(Array.isArray(director.biomes) && director.biomes.length > 0, "missionDirector.biomes must be non-empty", issues);
    for (const [index, biome] of (director.biomes || []).entries()) {
      assert(typeof biome.id === "string" && biome.id.length > 0, `biome[${index}] id is required`, issues);
      assert(typeof biome.label === "string" && biome.label.length > 0, `biome[${index}] label is required`, issues);
      assert(Number.isFinite(biome.weight) && biome.weight >= 0, `biome[${index}] weight must be >= 0`, issues);
      if (!biome.hazards) continue;
      const hazard = biome.hazards;
      assert(typeof hazard.type === "string" && hazard.type.length > 0, `biome[${index}] hazard type is required`, issues);
      assert(
        Number.isFinite(hazard.minCount) && Number.isFinite(hazard.maxCount) && hazard.maxCount >= hazard.minCount,
        `biome[${index}] hazard count range is invalid`,
        issues
      );
      assert(
        Number.isFinite(hazard.radiusMin) &&
          Number.isFinite(hazard.radiusMax) &&
          hazard.radiusMin > 0 &&
          hazard.radiusMax >= hazard.radiusMin,
        `biome[${index}] hazard radius range is invalid`,
        issues
      );
    }
    const modifiers = director.modifiers || {};
    assert(Object.keys(modifiers).length > 0, "missionDirector.modifiers must be non-empty", issues);
    for (const id of Object.keys(modifiers)) {
      const mod = modifiers[id];
      assert(typeof mod.label === "string" && mod.label.length > 0, `modifier ${id} must have label`, issues);
      assert(
        Number.isFinite(mod.weight) && mod.weight >= 0,
        `modifier ${id} weight must be >= 0`,
        issues
      );
      assert(
        Number.isFinite(mod.unlockSector) && mod.unlockSector >= 1,
        `modifier ${id} unlockSector must be >= 1`,
        issues
      );
    }
  }
}

function validateBalancePresets(presets, issues) {
  assert(presets && typeof presets === "object", "BALANCE_PRESET_DATA must be an object", issues);
  if (!presets || typeof presets !== "object") return;

  assert(presets.baseline, "BALANCE_PRESET_DATA must contain baseline preset", issues);
  for (const presetName of Object.keys(presets)) {
    const preset = presets[presetName];
    assert(preset && typeof preset === "object", `Preset ${presetName} must be an object`, issues);
    assert(typeof preset.label === "string" && preset.label.length > 0, `Preset ${presetName} must have label`, issues);
    assert(
      preset.overrides && typeof preset.overrides === "object",
      `Preset ${presetName} must have overrides object`,
      issues
    );
  }
}

function main() {
  const window = { Asteroids: {} };
  const context = vm.createContext({ window, console });
  loadScript(context, "js/content-data.js");
  loadScript(context, "js/balance-presets.js");

  const issues = [];
  validateContentData(window.Asteroids.CONTENT_DATA, issues);
  validateBalancePresets(window.Asteroids.BALANCE_PRESET_DATA, issues);

  if (issues.length > 0) {
    console.error("Content validation failed:");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }
  console.log("Content validation passed.");
}

try {
  main();
} catch (error) {
  console.error("Content validation crashed:", error.message);
  process.exit(1);
}
