(() => {
  const LANG_KEY = "starfang_lang_v1";

  const dictionaries = {
    en: {
      "state.start": "START",
      "state.playing": "PLAYING",
      "state.mission_complete": "MISSION COMPLETE",
      "state.hangar": "HANGAR",
      "state.paused": "PAUSED",
      "state.game_over": "GAME OVER",
      "state.victory": "VICTORY",
      "overlay.press_enter_start": "Press Enter to start",
      "overlay.seed": "Run seed: {seed}",
      "overlay.mode": "Mode: {mode}  (E toggle)",
      "overlay.mode_locked": "Locked",
      "overlay.settings_title": "Run setup",
      "overlay.settings_mode": "Mode",
      "overlay.settings_pilot": "Pilot",
      "overlay.settings_ship": "Ship",
      "overlay.settings_hint": "Up/Down row, Left/Right change value, Enter start/restart",
      "overlay.pilot_reference": "Reference: {reference}",
      "overlay.identity_status": "Pilot: {pilot} // Ship: {ship}",
      "overlay.endless_unlock_hint": "Endless unlock: clear campaign once",
      "overlay.game_over": "GAME OVER",
      "overlay.score": "Score: {score}",
      "overlay.sector_reached": "Sector reached: {sector}",
      "overlay.enter_restart": "Press Enter to restart",
      "overlay.pause": "PAUSED",
      "overlay.press_p_resume": "Press P to resume",
      "overlay.mission_complete": "OBJECTIVE COMPLETE",
      "overlay.mission_complete_congrats": "Great flying, {pilot}.",
      "overlay.mission_complete_sector": "Sector {sector} cleared.",
      "overlay.mission_complete_next": "Press Enter to enter hangar",
      "overlay.victory": "VICTORY",
      "overlay.sector_cleared": "Sector cleared: {sector}",
      "overlay.build": "Build: {primary} / {secondary} / {utility}",
      "overlay.runtime": "Runtime: {seconds}s",
      "overlay.endless_unlocked": "Endless mode unlocked. Press E to switch mode.",
      "overlay.campaign_complete": "Campaign complete.",
      "overlay.enter_new_run": "Press Enter for a new run",
      "game.run_mode.locked": "Endless mode is locked. Clear campaign once to unlock.",
      "game.run_mode.changed": "Run mode: {mode}",
      "game.run_mode.campaign": "CAMPAIGN",
      "game.run_mode.endless": "ENDLESS",
      "game.identity.pilot_changed": "Pilot selected: {pilot}",
      "game.identity.ship_changed": "Ship selected: {ship}",
      "game.identity.migrated_default": "Legacy identity reset to a supported pilot/ship. Review Run setup.",
      "game.hangar.controls":
        "Hangar: Left/Right section, Up/Down selection, Space action, Enter start. Legacy: 1-3/4/5/R/6/7/8/9/0/T/Y/U/I/O/K",
      "game.audio.muted": "Audio: muted (M to unmute).",
      "game.audio.enabled": "Audio: enabled (M to mute).",
      "game.perf.snapshot_dumped": "Perf snapshot dumped to console (N).",
      "game.unlock.endless": "Campaign cleared. Endless mode unlocked.",
      "game.boss.down": "Boss down: +{credits} credits, {drops} guaranteed module",
      "game.boss.final_down": "Final boss down: +{credits} credits, {drops} guaranteed module",
      "hangar.section": "Section: {section} | Up/Down select | Space action",
      "hangar.shop.choice": "Shop option {index}/{total} | Space action",
      "hangar.pilot.attr": "Pilot attr: {attr} | Space upgrade",
      "hangar.pilot.perk": "Pilot perk: {perk} | Space next perk",
      "hangar.pilot.unlock": "Pilot unlock: {perk} | Space unlock",
      "hangar.no_credits": "Not enough credits.",
      "hangar.full_hull_shield": "Hull and shield are full.",
      "hangar.fire_rate_max": "Fire rate is at max.",
      "hangar.magazine_max": "Magazine is at max.",
      "hangar.repaired": "Hull and shield restored to maximum.",
      "hangar.purchased": "Purchased: {title}",
      "hangar.nothing_to_select": "Nothing to select.",
      "hangar.selected": "{source}: {name}",
      "hangar.no_selected_module": "No module selected.",
      "hangar.inventory_full": "Inventory is full. Sell or salvage first.",
      "hangar.taken": "Moved to inventory: {name}",
      "hangar.equipped": "Equipped {slot}: {name}",
      "hangar.sold": "Sold: {name} (+{credits} cr)",
      "hangar.salvaged": "Salvaged: {name} (+{parts} parts)",
      "hangar.no_variant_unlocked": "No variant is unlocked.",
      "hangar.active_slot": "Active {slot}: {label}",
      "hangar.pilot.selected_attr": "Pilot attr selected: {attr} ({value})",
      "hangar.pilot.cannot_upgrade": "Cannot upgrade {attr} (need attr point or cap reached).",
      "hangar.pilot.selected_perk": "Perk selected: {label} ({branch})",
      "hangar.pilot.cannot_unlock": "Cannot unlock perk: {label}",
      "hangar.source.crate": "Crate",
      "hangar.source.inventory": "Inventory",
      "render.start.title": "STARFANG",
      "render.pause.title": "PAUSED",
      "render.hangar.no_selection": "No item selected.",
      "render.hangar.empty_selection": "Inventory and crate are empty. Press Enter to launch next sector.",
      "render.hangar.progress_line": "Cooldown Lv {cooldown}/{cooldownMax} | Magazine Lv {mag}/{magMax} | Max shots {shots}",
      "render.hangar.shop_group_sustain": "Ship Sustain",
      "render.hangar.shop_group_progression": "Weapon Progression",
      "render.hangar.shop_group_loadout": "Loadout",
      "render.hangar.shop_group_inventory": "Inventory Ops",
      "render.hangar.pilot_hint": "Space: upgrade/unlock",
      "render.hangar.net.gain": "Net gain if equipped",
      "render.hangar.net.sidegrade": "Net neutral trade",
      "render.hangar.net.loss": "Net loss if equipped",
      "render.hangar.net.score": "Net score: {score}",
      "render.hangar.metric_primary_cd": "Primary CD: {seconds}",
      "render.hangar.metric_secondary_cd": "Secondary CD: {seconds}",
      "render.hangar.metric_utility_cd": "Utility CD: {seconds}",
      "render.hangar.metric_shared_drain": "Shield drain P/S/U: {primary}/{secondary}/{utility}",
      "render.hangar.metric_tuning": "Tuning x{tuning} | Max shots {shots}",
      "render.hangar.action_hint": "Left/Right section | Up/Down select | Space action | Enter start | Legacy fallback: 9/0",
      "render.hangar.context_hint_loot": "LOOT: Up/Down select item | Space take/equip | Left/Right switch section",
      "render.hangar.context_hint_shop": "SHOP & OPS: Up/Down select action | Space confirm | Left/Right switch section",
      "render.hangar.context_hint_pilot": "PILOT: Up/Down attr/perk | Space upgrade/unlock | Left/Right switch section",
      "hud.ready": "Ready",
      "hud.no_active_set": "No active set",
      "hud.identity_unknown": "-",
      "hud.identity_status": "{pilot} // {ship}",
      "hud.flight_sim_lite": "SIM LITE",
      "hud.flight_arcade": "ARCADE",
      "hud.unknown": "UNKNOWN",
      "mission.clear_remaining": "Clear remaining threats: {count}",
      "mission.hold_for": "Hold for {seconds}s",
      "mission.destroy_ufos": "Destroy UFOs: {kills}/{target}",
      "mission.break_asteroids": "Break asteroids: {kills}/{target}",
      "mission.target_reached_clear": "Target reached. Clear remaining threats: {count}",
      "mission.destroy_boss": "Destroy boss ({hp} HP)",
      "mission.destroy_final_boss": "Destroy final boss ({hp} HP)",
      "mission.destroy_boss_plain": "Destroy boss",
      "mission.weakpoint_open": "Weakpoint OPEN {seconds}s",
      "mission.weakpoint_in": "Weakpoint in {seconds}s",
      "mission.phase_status": "Phase {phase} | HP {hp}/{maxHp} | {weakpoint}",
      "mission.context": "{biome} | {modifier}",
      "mission.event.triggered": "{event}: {bonus}",
      "mission.event.prospector_ping": "Prospector Ping",
      "mission.event.scrap_cache": "Scrap Cache",
      "mission.event.coolant_cache": "Coolant Cache",
      "mission.event.capacitor_surge": "Capacitor Surge",
      "mission.event.relay_hack": "Relay Hack",
      "mission.event.cryo_focus": "Cryo Focus",
      "mission.event.bonus.credits": "+{value} cr",
      "mission.event.bonus.salvage": "+{value} salvage",
      "mission.event.bonus.energy": "{value} energy",
      "mission.event.bonus.shield": "{value} shield",
      "mission.event.bonus.heat": "{value} heat",
      "mission.event.bonus.cooldown": "-{value}s cooldown",
      "mission.outer_void": "Outer Void",
      "mission.clear_skies": "Clear Skies",
      "mission.clear_skies_desc": "No global mission hazard.",
      "mission.label.survive": "SURVIVE",
      "mission.label.ufo_hunt": "UFO HUNT",
      "mission.label.asteroid_storm": "ASTEROID STORM",
      "mission.label.mini_boss": "MINI BOSS",
      "mission.label.final_boss": "FINAL BOSS",
      "index.canvas_aria": "STARFANG game",
      "index.volume_aria": "Audio volume",
      "index.ambient_volume_aria": "Ambient cue volume",
      "index.label.hull": "Hull",
      "index.label.shield": "Shield",
      "index.label.energy": "Energy",
      "index.label.heat": "Heat",
      "index.tip.hull": "Hull: base ship durability. At zero, the run ends.",
      "index.tip.shield": "Shield: regenerating layer. In shared-pool model, firing also drains shield.",
      "index.tip.energy": "Energy: resource for weapons and abilities.",
      "index.tip.heat": "Heat: overheating. High heat slows fire rate and limits actions.",
      "index.tip.primary": "Primary: each shot consumes both energy and shield.",
      "index.tip.secondary": "Secondary: higher shield/energy drain than primary.",
      "index.tip.utility": "Utility: strongest effect, highest shield/energy cost.",
      "index.tip.mission": "Mission: current sector objective.",
      "index.tip.sector": "Sector: current run level.",
      "index.tip.credits": "Credits: currency for hangar purchases.",
      "index.tip.score": "Score: points earned this run.",
      "index.tip.set_status": "Set status: active equipment set bonuses.",
      "index.tip.identity": "Selected pilot and ship frame identity.",
      "index.tip.audio_volume": "SFX volume.",
      "index.tip.ambient_volume": "Ambient cue volume (biome stingers).",
      "index.tip.flight_mode": "Flight mode: Arcade or Sim Lite.",
      "index.tip.game_state": "Game state.",
      "index.tip.build_version": "Build version.",
      "index.icon.hull.title": "Hull",
      "index.icon.hull.aria": "Hull",
      "index.icon.shield.title": "Shield",
      "index.icon.shield.aria": "Shield",
      "index.icon.energy.title": "Energy",
      "index.icon.energy.aria": "Energy",
      "index.icon.heat.title": "Heat",
      "index.icon.heat.aria": "Heat",
      "index.icon.primary.title": "Primary weapon and dash cooldown status.",
      "index.icon.primary.aria": "Primary Weapon",
      "index.icon.secondary.title": "Secondary ability (X).",
      "index.icon.secondary.aria": "Secondary Ability",
      "index.icon.utility.title": "Utility ability (C).",
      "index.icon.utility.aria": "Utility Ability",
      "index.icon.mission.title": "Mission: current objective.",
      "index.icon.mission.aria": "Mission",
      "index.icon.sector.title": "Sector index.",
      "index.icon.sector.aria": "Sector",
      "index.icon.credits.title": "Credits for hangar shop.",
      "index.icon.credits.aria": "Credits",
      "index.icon.score.title": "Current run score.",
      "index.icon.score.aria": "Score",
      "index.icon.set_status.title": "Active set bonuses.",
      "index.icon.set_status.aria": "Set Status",
      "index.icon.identity.title": "Selected pilot and ship frame.",
      "index.icon.identity.aria": "Identity",
      "index.icon.audio.title": "Audio volume.",
      "index.icon.audio.aria": "Audio Volume",
      "index.icon.ambient.title": "Ambient cue volume.",
      "index.icon.ambient.aria": "Ambient Cue Volume",
      "index.icon.flight_mode.title": "Flight mode: Arcade or Sim Lite.",
      "index.icon.flight_mode.aria": "Flight Mode",
      "index.help_link": "HELP: objects and hazards reference",
      "index.controls_html":
        "<strong>Controls:</strong> <strong>Left/Right</strong> rotate, <strong>Up</strong> thrust, <strong>Space</strong> fire, <strong>Shift</strong> boost, <strong>V</strong> dash, <strong>F</strong> switch flight model, <strong>X</strong> secondary, <strong>C</strong> utility, <strong>M</strong> mute, <strong>P</strong> pause, <strong>Enter</strong> start/restart. <strong>Run setup (Start/Game Over/Victory):</strong> <strong>Up/Down</strong> select row (Mode/Pilot/Ship), <strong>Left/Right</strong> change value, <strong>E</strong> quick mode toggle. <strong>Objective complete:</strong> confirm sector clear with <strong>Enter</strong> to enter hangar. <strong>Dev perf:</strong> <strong>B</strong> overlay, <strong>N</strong> snapshot to console. <strong>Hangar:</strong> <strong>Left/Right</strong> section, <strong>Up/Down</strong> select, <strong>Space</strong> action, <strong>Enter</strong> continue. Shop &amp; Ops shows grouped actions (Sustain/Progression/Loadout/Inventory), and Weapon Progression displays <strong>Cooldown Lv</strong> and <strong>Magazine Lv</strong>. <strong>Legacy fallback:</strong> <strong>1/2/3</strong>, <strong>4/5/R</strong>, <strong>6/7/8/9/0</strong>, <strong>T/Y/U/I/O/K</strong>.",
      "help.document_title": "STARFANG - Help",
      "help.title": "STARFANG Help",
      "help.page_title": "STARFANG - Object Help",
      "help.back_to_game": "Back to game",
      "help.page_hint": "Quick overview of what you see on screen. Each card includes icon, name, behavior, and gameplay impact.",
      "help.section.combat_economy": "Combat Economy (Shared Pool)",
      "help.section.weapons": "Weapons and Shots",
      "help.section.weapons_hint":
        "Data is loaded directly from game configuration. Values match the current build balance.<br>Note: \"DMG\" is base hit value (before crit/resist modifiers), \"Range\" is approximate projectile travel.",
      "help.section.mission_types": "Mission Types",
      "help.section.mission_types_hint":
        "Mission order cycles as <strong>survive -> ufo_hunt -> asteroid_storm -> mini_boss</strong>. In campaign mode, mini_boss in the final sector becomes <strong>FINAL BOSS</strong> (distinct moveset and phases), and clearing it ends the run with VICTORY.",
      "help.section.mission_endless_hint":
        "Endless mode unlocks after your first campaign clear. On start/game over/victory overlays, pick mode explicitly with <strong>Left/Right</strong> (or quick toggle by <strong>E</strong>).",
      "help.section.biomes": "Biomes",
      "help.section.biomes_hint":
        "Each sector rolls a biome. Biome defines arena atmosphere, biome-specific ambient/warning SFX flavor, and may add specific hazard zones.",
      "help.section.pilot_rpg": "Pilot RPG (MVP)",
      "help.section.pilot_identity": "Pilot Identity and Ship Frames",
      "help.section.pilot_identity_hint":
        "In start/game over/victory overlays, use unified Run setup: <strong>Up/Down</strong> select row (Mode/Pilot/Ship), <strong>Left/Right</strong> change value. Hover pilot name for reference tooltip. Identity adds small stat flavor bonuses.",
      "help.section.asteroids": "Asteroids",
      "help.section.ufo_types": "UFO Types",
      "help.section.hazards": "Hazard Zones",
      "help.section.dev_profiling": "Dev Profiling Controls",
      "help.section.dev_profiling_hint":
        "For runtime performance diagnostics during manual QA, use <strong>B</strong> to toggle the perf overlay and <strong>N</strong> to dump a profiling snapshot to the browser console.",
      "help.card.shared_pool.name": "Shared Shield + Energy",
      "help.card.shared_pool.tag": "Core system",
      "help.card.shared_pool.line": "Firing and active abilities consume both energy and a portion of shield.",
      "help.card.shared_pool.impact": "<strong>Impact:</strong> the more you fire, the lower your defense goes. Actions are blocked at zero shield.",
      "help.card.drain_factors.name": "Different Drain Factors",
      "help.card.drain_factors.tag": "Balancing",
      "help.card.drain_factors.line": "Primary has the lowest drain, secondary/utility are higher, dash is mid.",
      "help.card.drain_factors.impact": "<strong>Impact:</strong> weapon identity stays clear, with explicit risk/reward tradeoff.",
      "help.card.mission_survive.name": "SURVIVE",
      "help.card.mission_survive.tag": "Hold timer + cleanup",
      "help.card.mission_survive.line": "Survive the time limit. After timer expires, objective switches to clearing remaining threats.",
      "help.card.mission_survive.impact": "<strong>Impact:</strong> tempo management, space control, and stable resource economy.",
      "help.card.mission_ufo_hunt.name": "UFO HUNT",
      "help.card.mission_ufo_hunt.tag": "Kill quota",
      "help.card.mission_ufo_hunt.line": "Complete UFO kill quota. Spawn tempo and parallel pressure increase by sector.",
      "help.card.mission_ufo_hunt.impact":
        "<strong>Impact:</strong> target-priority execution and reading enemy roles (support/sniper/kamikaze).",
      "help.card.mission_asteroid_storm.name": "ASTEROID STORM",
      "help.card.mission_asteroid_storm.tag": "Break quota",
      "help.card.mission_asteroid_storm.line":
        "Break target number of asteroids. After quota, cleanup of remaining threats still applies.",
      "help.card.mission_asteroid_storm.impact": "<strong>Impact:</strong> arena overflow risk; chain/AOE loadouts are efficient.",
      "help.card.mission_mini_boss.name": "MINI BOSS",
      "help.card.mission_mini_boss.tag": "Phase + weakpoint",
      "help.card.mission_mini_boss.line":
        "Boss fight with phases, weakpoint windows, and phase events. Kill boss, then finish cleanup.",
      "help.card.mission_mini_boss.impact":
        "<strong>Impact:</strong> burst-window discipline vs survival, with correct utility/dash timing.",
      "help.card.biome_belt_fringe.name": "Belt Fringe",
      "help.card.biome_belt_fringe.tag": "Biome",
      "help.card.biome_belt_fringe.line": "Standard asteroid belt edge. Mini event: <strong>Prospector Ping</strong> grants bonus credits on sector start.",
      "help.card.biome_belt_fringe.impact": "<strong>Impact:</strong> clean baseline with a small economy push.",
      "help.card.biome_wreck_graveyard.name": "Wreck Graveyard",
      "help.card.biome_wreck_graveyard.tag": "Biome",
      "help.card.biome_wreck_graveyard.line":
        "Wreck zone filled with debris. Typically adds <strong>Debris Field</strong>. Mini event: <strong>Scrap Cache</strong> grants salvage.",
      "help.card.biome_wreck_graveyard.impact": "<strong>Impact:</strong> reduced mobility, higher collision risk, and chip damage.",
      "help.card.biome_refinery.name": "Refinery Complex",
      "help.card.biome_refinery.tag": "Biome",
      "help.card.biome_refinery.line":
        "Industrial refinery zone with thermal vents. Typically adds <strong>Plasma Vent</strong>. Mini event: <strong>Coolant Cache</strong> lowers heat and tops shield.",
      "help.card.biome_refinery.impact": "<strong>Impact:</strong> rapid heat gain and high positioning pressure.",
      "help.card.biome_ion_field.name": "Ion Field",
      "help.card.biome_ion_field.tag": "Biome",
      "help.card.biome_ion_field.line":
        "Charged ionized area. Mini event: <strong>Capacitor Surge</strong> grants energy/shield burst. Often paired with global modifiers.",
      "help.card.biome_ion_field.impact":
        "<strong>Impact:</strong> visual/atmospheric pressure; combined with <strong>Ion Storm</strong> it increases resource stress.",
      "help.card.biome_shattered_relay.name": "Shattered Relay",
      "help.card.biome_shattered_relay.tag": "Biome",
      "help.card.biome_shattered_relay.line":
        "Fractured relay network with interference bursts. Usually includes <strong>Relay Jammer</strong>. Mini event: <strong>Relay Hack</strong> reduces cooldowns.",
      "help.card.biome_shattered_relay.impact":
        "<strong>Impact:</strong> burst windows become less stable; cooldown timing discipline matters more.",
      "help.card.biome_cryo_ring.name": "Cryo Ring",
      "help.card.biome_cryo_ring.tag": "Biome",
      "help.card.biome_cryo_ring.line":
        "Frozen ring with shear currents. Usually includes <strong>Cryo Shear</strong>. Mini event: <strong>Cryo Focus</strong> drops heat and eases cooldowns.",
      "help.card.biome_cryo_ring.impact":
        "<strong>Impact:</strong> mobility and turning are softer in-zone, but heat pressure is lower.",
      "help.card.pilot_xp.name": "XP and Level",
      "help.card.pilot_xp.tag": "Pilot progression",
      "help.card.pilot_xp.line":
        "You gain XP from score and mission completion. Level-ups grant attribute points and every two levels also a skill point.",
      "help.card.pilot_xp.impact": "<strong>Impact:</strong> long-term progression between sectors, not only immediate loot spikes.",
      "help.card.pilot_attributes.name": "Attributes",
      "help.card.pilot_attributes.tag": "Reflex / Systems / Grit / Instinct",
      "help.card.pilot_attributes.line":
        "Reflex improves handling and cadence, Systems improves regen/cooldowns, Grit improves toughness, Instinct improves crit and damage economy.",
      "help.card.pilot_attributes.impact": "<strong>Impact:</strong> clear build identity from early game onward.",
      "help.card.pilot_perk_unlock.name": "Perk unlock",
      "help.card.pilot_perk_unlock.tag": "Hangar controls",
      "help.card.pilot_perk_unlock.line":
        "In hangar, use Left/Right for sections, Up/Down for selection, and Space for action. Shop & Ops groups actions into Sustain/Progression/Loadout/Inventory and shows Cooldown Lv + Magazine Lv directly in Weapon Progression.",
      "help.card.pilot_perk_unlock.impact": "<strong>Impact:</strong> controlled specialization without chaotic random buffing.",
      "help.card.identity_pilots.name": "Pilot Roster (6)",
      "help.card.identity_pilots.tag": "Identity layer",
      "help.card.identity_pilots.line":
        "Buzz Calder, Neo Mercer, Boba Vane, Luke Ryder, Marty Carter, Max Steel.",
      "help.card.identity_pilots.impact":
        "<strong>Impact:</strong> clear playstyle fantasy without replacing loadout/build decisions.",
      "help.card.identity_references.name": "Pilot References",
      "help.card.identity_references.tag": "Pop-culture anchors",
      "help.card.identity_references.line":
        "Buzz \"Not A Toy\" Calder -> Buzz Lightyear. Neo \"Wrong Pill\" Mercer -> The Matrix. Boba \"Invoice\" Vane -> Boba Fett. Luke \"Almost Bullseye\" Ryder -> Luke Skywalker trench run. Marty \"Flux\" Carter -> Marty McFly + Flux Capacitor. Max \"Mad Orbit\" Steel -> Mad Max-inspired space persona.",
      "help.card.identity_references.impact":
        "<strong>Impact:</strong> faster emotional connection to pilot identity and easier memory anchors for roleplay choices.",
      "help.card.identity_ships.name": "Ship Frames (4)",
      "help.card.identity_ships.tag": "Identity layer",
      "help.card.identity_ships.line":
        "Viper MK-II (speed), Bastion Frame (durability), Revenant Frame (damage pressure), Helix Frame (systems/regen).",
      "help.card.identity_ships.impact":
        "<strong>Impact:</strong> players can self-identify with a frame archetype while keeping balancing in a safe 5-10% range.",
      "identity.pilot.buzz_calder.callsign": "Buzz \"Not A Toy\" Calder",
      "identity.pilot.buzz_calder.reference": "Reference to Buzz Lightyear from Toy Story.",
      "identity.pilot.neo_mercer.callsign": "Neo \"Wrong Pill\" Mercer",
      "identity.pilot.neo_mercer.reference": "From Neo in The Matrix; twists red/blue pill into a joke.",
      "identity.pilot.boba_vane.callsign": "Boba \"Invoice\" Vane",
      "identity.pilot.boba_vane.reference": "Based on Boba Fett from Star Wars; bounty-for-money joke.",
      "identity.pilot.luke_ryder.callsign": "Luke \"Almost Bullseye\" Ryder",
      "identity.pilot.luke_ryder.reference": "Refers to Luke Skywalker and the Death Star trench run.",
      "identity.pilot.marty_carter.callsign": "Marty \"Flux\" Carter",
      "identity.pilot.marty_carter.reference": "From Marty McFly; \"Flux\" points to Flux Capacitor.",
      "identity.pilot.max_steel.callsign": "Max \"Mad Orbit\" Steel",
      "identity.pilot.max_steel.reference": "Inspired by Mad Max, adapted into a space-pilot nickname.",
      "identity.ship.viper_mk2.name": "Viper MK-II",
      "identity.ship.bastion_frame.name": "Bastion Frame",
      "identity.ship.revenant_frame.name": "Revenant Frame",
      "identity.ship.helix_frame.name": "Helix Frame",
      "help.card.asteroid_normal.name": "Normal Asteroid",
      "help.card.asteroid_normal.tag": "Object",
      "help.card.asteroid_normal.line": "Classic asteroid. Splits into smaller parts on hit.",
      "help.card.asteroid_normal.impact": "<strong>Impact:</strong> neutral threat, <span class=\"ok\">good source of score/loot</span>.",
      "help.card.asteroid_magnetic.name": "Magnetic Asteroid",
      "help.card.asteroid_magnetic.tag": "Object",
      "help.card.asteroid_magnetic.line": "Pulls the ship in close radius and distorts trajectory.",
      "help.card.asteroid_magnetic.impact":
        "<strong>Impact:</strong> weaker maneuvering and <span class=\"bad\">higher collision risk</span>.",
      "help.card.asteroid_volatile.name": "Volatile Asteroid",
      "help.card.asteroid_volatile.tag": "Object",
      "help.card.asteroid_volatile.line": "On destruction, triggers a blast that can chain additional hits.",
      "help.card.asteroid_volatile.impact":
        "<strong>Impact:</strong> AOE hazard, but also <span class=\"ok\">a tactical weapon against packs</span>.",
      "help.card.ufo_hunter.name": "Hunter",
      "help.card.ufo_hunter.tag": "Enemy",
      "help.card.ufo_hunter.line": "Close- to mid-range pressure.",
      "help.card.ufo_hunter.impact": "<strong>Impact:</strong> stable DPS threat.",
      "help.card.ufo_sniper.name": "Sniper",
      "help.card.ufo_sniper.tag": "Enemy",
      "help.card.ufo_sniper.line": "Keeps distance and fires precise shots.",
      "help.card.ufo_sniper.impact": "<strong>Impact:</strong> punishes static positioning.",
      "help.card.ufo_swarm.name": "Swarm",
      "help.card.ufo_swarm.tag": "Enemy",
      "help.card.ufo_swarm.line": "Fast orbit and circular pressure.",
      "help.card.ufo_swarm.impact": "<strong>Impact:</strong> can overwhelm weak aim tracking.",
      "help.card.ufo_kamikaze.name": "Kamikaze",
      "help.card.ufo_kamikaze.tag": "Enemy",
      "help.card.ufo_kamikaze.line": "Attempts collision and detonates on contact.",
      "help.card.ufo_kamikaze.impact": "<strong>Impact:</strong> melee burst damage.",
      "help.card.ufo_support.name": "Support",
      "help.card.ufo_support.tag": "Enemy",
      "help.card.ufo_support.line": "Heals nearby UFO units.",
      "help.card.ufo_support.impact": "<strong>Impact:</strong> extends fights, high focus-target priority.",
      "help.card.ufo_mine_layer.name": "Mine Layer",
      "help.card.ufo_mine_layer.tag": "Enemy",
      "help.card.ufo_mine_layer.line": "Deploys mines and controls space.",
      "help.card.ufo_mine_layer.impact": "<strong>Impact:</strong> zoning pressure, forces repositioning.",
      "help.card.hazard_debris_field.name": "Debris Field",
      "help.card.hazard_debris_field.tag": "Biome Hazard (Wreck Graveyard)",
      "help.card.hazard_debris_field.line": "Debris sphere. Slows the ship inside and applies periodic damage.",
      "help.card.hazard_debris_field.impact": "<strong>Impact:</strong> <span class=\"bad\">mobility loss</span> + chip damage.",
      "help.card.hazard_plasma_vent.name": "Plasma Vent",
      "help.card.hazard_plasma_vent.tag": "Biome Hazard (Refinery Complex)",
      "help.card.hazard_plasma_vent.line": "Pulsing thermal zone. Increases heat and applies thermal tick damage.",
      "help.card.hazard_plasma_vent.impact": "<strong>Impact:</strong> rapid overheat and action limitations.",
      "help.card.hazard_gravity_anomaly.name": "Gravity Anomaly",
      "help.card.hazard_gravity_anomaly.tag": "Mission Modifier",
      "help.card.hazard_gravity_anomaly.line":
        "Pulls ship and asteroids toward anomaly center. Pull is softened in the core to avoid hard-lock behavior.",
      "help.card.hazard_gravity_anomaly.impact":
        "<strong>Impact:</strong> trajectory distortion and collision setups; escape by holding <strong>thrust</strong> (ArrowUp) or <strong>boost</strong> (Shift) outward from the core.",
      "help.card.hazard_ion_storm.name": "Ion Storm",
      "help.card.hazard_ion_storm.tag": "Mission Modifier",
      "help.card.hazard_ion_storm.line": "Reduces shield regen and slowly drains shield.",
      "help.card.hazard_ion_storm.impact": "<strong>Impact:</strong> weaker sustain and higher dodge pressure.",
      "help.card.hazard_relay_jammer_burst.name": "Relay Jammer Burst",
      "help.card.hazard_relay_jammer_burst.tag": "Biome Hazard (Shattered Relay)",
      "help.card.hazard_relay_jammer_burst.line":
        "Interference field pulses periodically. During active pulse, weapon/ability cooldown pressure increases.",
      "help.card.hazard_relay_jammer_burst.impact":
        "<strong>Impact:</strong> weaker burst uptime and noisier control windows; timing around pulse cycles is key.",
      "help.card.hazard_cryo_shear_zone.name": "Cryo Shear Zone",
      "help.card.hazard_cryo_shear_zone.tag": "Biome Hazard (Cryo Ring)",
      "help.card.hazard_cryo_shear_zone.line":
        "Cold shear field that slows motion response and makes dash recovery slightly longer, while cooling heat.",
      "help.card.hazard_cryo_shear_zone.impact":
        "<strong>Impact:</strong> lower mobility but improved thermal management for sustained firing.",
      "help.weapon.slot.primary": "Primary",
      "help.weapon.slot.secondary": "Secondary",
      "help.weapon.slot.utility": "Utility",
      "help.weapon.stat.id": "ID",
      "help.weapon.stat.cooldown": "CD",
      "help.weapon.stat.energy": "Energy",
      "help.weapon.stat.shield_drain": "Shield drain",
      "help.weapon.stat.heat": "Heat",
      "help.weapon.stat.dmg": "DMG",
      "help.weapon.stat.shots_per_trigger": "Shots/trigger",
      "help.weapon.stat.burst_dmg": "Burst DMG",
      "help.weapon.stat.proj_speed": "Proj speed",
      "help.weapon.stat.ttl": "TTL",
      "help.weapon.stat.range": "Range",
      "help.weapon.stat.radius": "Radius",
      "help.weapon.stat.pierce": "Pierce",
      "help.weapon.stat.chain_targets": "Chain targets",
      "help.weapon.stat.aoe_radius": "AOE radius",
      "help.weapon.stat.disable": "Disable",
      "help.weapon.stat.invuln": "Invuln"
    },
    cs: {}
  };

  function format(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => (params[key] != null ? String(params[key]) : `{${key}}`));
  }

  function getStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored && dictionaries[stored]) return stored;
    } catch (error) {
      // ignore storage errors
    }
    return "en";
  }

  function t(key, params = {}) {
    const lang = window.Asteroids?.lang || "en";
    const dict = dictionaries[lang] || dictionaries.en;
    const fallback = dictionaries.en[key];
    const template = dict[key] ?? fallback ?? key;
    return format(template, params);
  }

  function sanitizeRichText(input) {
    const html = String(input ?? "");
    if (typeof document === "undefined") return html;

    const allowedTags = new Set(["STRONG", "EM", "B", "I", "BR", "SPAN", "CODE"]);
    const allowedSpanClasses = new Set(["ok", "bad"]);
    const template = document.createElement("template");
    template.innerHTML = html;

    const sanitizeNodeInto = (source, targetParent) => {
      const nodes = Array.from(source.childNodes || []);
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          targetParent.appendChild(document.createTextNode(node.textContent || ""));
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const tag = String(node.nodeName || "").toUpperCase();
        if (!allowedTags.has(tag)) {
          sanitizeNodeInto(node, targetParent);
          continue;
        }

        const clean = document.createElement(tag.toLowerCase());
        if (tag === "SPAN") {
          const classAttr = (node.getAttribute("class") || "").trim();
          if (classAttr) {
            const safeClasses = classAttr
              .split(/\s+/)
              .filter((name) => allowedSpanClasses.has(name));
            if (safeClasses.length) clean.className = safeClasses.join(" ");
          }
        }
        sanitizeNodeInto(node, clean);
        targetParent.appendChild(clean);
      }
    };

    const out = document.createElement("div");
    sanitizeNodeInto(template.content, out);
    return out.innerHTML;
  }

  function setRichText(node, input) {
    if (!node) return;
    node.innerHTML = sanitizeRichText(input);
  }

  function applyTranslations(root = document) {
    if (!root || typeof root.querySelectorAll !== "function") return;
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (!key) return;
      node.textContent = t(key);
    });
    root.querySelectorAll("[data-i18n-html]").forEach((node) => {
      const key = node.getAttribute("data-i18n-html");
      if (!key) return;
      setRichText(node, t(key));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((node) => {
      const key = node.getAttribute("data-i18n-title");
      if (!key) return;
      node.setAttribute("title", t(key));
    });
    root.querySelectorAll("[data-i18n-tip]").forEach((node) => {
      const key = node.getAttribute("data-i18n-tip");
      if (!key) return;
      node.setAttribute("data-tip", t(key));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      const key = node.getAttribute("data-i18n-aria-label");
      if (!key) return;
      node.setAttribute("aria-label", t(key));
    });
  }

  function setLanguage(lang) {
    const normalized = dictionaries[lang] ? lang : "en";
    window.Asteroids.lang = normalized;
    try {
      window.localStorage.setItem(LANG_KEY, normalized);
    } catch (error) {
      // ignore storage errors
    }
    if (typeof document !== "undefined") applyTranslations(document);
  }

  window.Asteroids = window.Asteroids || {};
  window.Asteroids.i18n = {
    dictionaries,
    t,
    setLanguage,
    getLanguage: () => window.Asteroids.lang || "en",
    applyTranslations,
    sanitizeRichText,
    setRichText
  };
  window.Asteroids.t = t;
  window.Asteroids.lang = getStoredLanguage();
})();
