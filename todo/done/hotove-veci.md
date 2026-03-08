# Hotove veci

- [x] HUD/panel clarity refactor (Phase 1+2)
  - [x] Right panel declutter: odstraneny trvale audio slidery z HUD, nahrazeny kompaktnim audio summary radkem
  - [x] Help footer vpravo zkracen na compact controls hint (bez dlouheho odstavce)
  - [x] Audio settings modal: otevreni klavesou `G` nebo klikem, zavreni `G`/`Esc`/backdrop
  - [x] Modal flow je focus-safe: pri otevrenem modalu se nepropisuje gameplay input a nastaveni se dale persistuje do localStorage

- [x] Hangar pilot flow refactor (Phase 3)
  - [x] Pilot upgrade/unlock flow presunut do samostatneho `Pilot Console` modalu (`J`)
  - [x] Hangar pilot panel odlehceny na summary + jasny hint pro otevreni modalu
  - [x] Hangar nav sekce zjednodusena na `shop/loot` (pilot uz neni treti sipkova sekce)
  - [x] Legacy pilot fallback klavesy (`T/Y/U`, `I/O/K`) zachovany pro kompatibilitu

- [x] HUD/panel clarity refactor (Phase 4 polish)
  - [x] Quick shortcut `H` otevre `help.html` v nove zalozce
  - [x] Compact controls hint a help texty sjednoceny s aktualnimi modal shortcuty (`G/J/H`)
  - [x] TODO cleanup: kompletni phased item presunut z backlogu do done

- [x] Frontend bootstrap hardening (post-incident)
  - [x] Opraven parser break v `js/i18n.js` (chybici carka v dictionary key listu)
  - [x] `tools/combat-harness.js` nacita i `js/i18n.js`, takze parse chyby i18n shodi gate
  - [x] Pridan `tools/validate-runtime-syntax.js` pro syntax-check vsech runtime `js/*.js` souboru

- [x] Hangar layout variant B (identity-first)
  - [x] Spodni radek hangaru zjednodusen na 2 panely (`SHOP & OPS` + `TACTICAL STATUS`)
  - [x] Pilot/Ship identita presunuta do hlavicky hangaru jako trvale viditelny kontext
  - [x] Pilot summary panel odstraneny; pilot info je v `TACTICAL STATUS` + `Pilot Console (J)`

- [x] Onboarding + action gate feedback (MVP)
  - [x] Start overlay obsahuje kratky Quick Start onboarding pro shared pool economy
  - [x] Start overlay ma responzivni vertikalni stack (compact/normal/large) s garantovanym spacingem mezi bloky
  - [x] Runtime contextual hint pri blokaci akce (energy/shield/heat/cooldown/magazine)
  - [x] Telemetry panel rozsireny o action-block counters a power-audit breakdown (gear/pilot/identity/biome)

- [x] Biome expansion pass (2 nove biomy)
  - [x] Pridany biomy `Shattered Relay` a `Cryo Ring` do mission directoru
  - [x] Nove biome hazardy `relay_jammer_burst` a `cryo_shear_zone` s odlisnym gameplay dopadem
  - [x] Doplneny render telegraphy + mission status/warning labely + help karty/i18n coverage

- [x] Biome identity 2.0 (audio + rewards)
  - [x] Hybrid audio rezim bez kontinuálního podkresu (biome stinger cue + biome warning variace)
  - [x] Samostatny `Ambient cue volume` slider s persistenci nastaveni
  - [x] Biome-specific warning SFX varianta pro critical alerts (low hull/high heat/shield break)
  - [x] Biome mini reward/event hooky pri startu mise (credits/salvage/resource/cooldown bonus podle biome)

- [x] Help content generator (data-driven)
  - [x] `help.html` sekce/karty uz nejsou rucni staticky HTML obsah
  - [x] Mission/Biome/UFO/Asteroid/Hazard karty se skladaji z `GAME_CONFIG`/`ASTEROID_TYPES`
  - [x] Weapon sekce zustava data-driven z loadout dat a sdili jednotny render pipeline
  - [x] i18n texty jsou pouzite pres key-based lookup pri runtime renderu

- [x] Hangar UX 2.0 readability pass
  - [x] Pilot panel pouziva jmeno/callsign pilota jako hlavni titul
  - [x] Shop & Ops sekce seskupena na Sustain / Weapon Progression / Loadout / Inventory Ops
  - [x] Weapon Progression zobrazuje aktualni `Cooldown Lv` a `Magazine Lv` (X/Y)
  - [x] Horni run souhrn doplnen o progression line + max shots
  - [x] Spodni hint je kontextovy podle aktivni sekce (loot/shop/pilot)

- [x] Runtime/UI cleanup follow-up
  - [x] Odstranen mrtvy start-overlay renderer kod (`drawIdentitySelector`, `drawModeSelector`)
  - [x] Vycišteny stale i18n klice po sjednoceni Run setup UI
  - [x] Doplnena migrační hlaska pri fallbacku nevalidni pilot/ship identity z profilu
  - [x] Pridany obecny wrap helper pro overlay text; mission-complete gratulace je zalamovana

- [x] Ship visual identity pass (MVP)
  - [x] 4 lodni framy maji odlisnou siluetu trupu (pri zachovani stejneho hitboxu/fyziky)
  - [x] 4 lodni framy maji odlisny thrust color/plume styl
  - [x] Jemny vnitrni detail trupu podle frame archetypu pro rychlou vizualni identifikaci

- [x] Pilot identity reference pass
  - [x] Pilot roster rozsireny na 6 pop-culture callsignu
  - [x] Reference texty dostupne na help strance
  - [x] Reference tooltip zobrazen pri hoveru nad jmenem pilota v Run setup overlayi

- [x] Pilot/Ship identity layer (MVP 4+4)
  - [x] 4 kultovni piloti s lehkymi stat bonusy (5-10%) a persistent vyberem v profilu
  - [x] 4 lodni framy s lehkymi stat bonusy (5-10%) a persistent vyberem v profilu
  - [x] Start overlay vyber identity (pilot + lod) + ovladani Up/Down a A/D
  - [x] HUD + Victory summary zobrazuji vybranou identitu (Pilot // Ship)
  - [x] Help sekce doplnena o prehled pilotu a lodi

- [x] Mode select UX clarification
  - [x] Campaign/Endless explicit selector v overlayi (Start/Game Over/Victory)
  - [x] Run setup doplnen o explicitni volbu Flight model (ARCADE/SIM LITE) pres Left/Right
  - [x] Left/Right pro prime vyber modu + `E` jako fallback quick toggle
  - [x] UI/help texty aktualizovane na novy mode-select flow

- [x] Performance tooling baseline (dev)
  - [x] Frame-time/perf overlay toggle (`B`) s FPS/ms/step metrikami + snapshot dump (`N`)
  - [x] Runtime frame/object telemetry (particles/bullets/utility/asteroids/UFO) pro rychly profiling vstup
  - [x] Adaptive FX quality (high/medium/low) s auto downshift/upshift podle frame-time
  - [x] Runtime guardy proti memory growth (hard caps + central push helpers pro bullets/enemy bullets/utility + particle cap enforcement)
  - [x] Profiling pass baseline: update/render avg/p95/max + hotspot sekce v dev overlayi a snapshot dumpu

- [x] Static UI/help i18n coverage pass
  - [x] `index.html` HUD/help footer text presunuty na `data-i18n`/`data-i18n-html`
  - [x] `help.html` staticky obsah sekci/karet napojen na translation keys
  - [x] `js/i18n.js` rozsireno o `data-i18n-html` a doplneny EN keys pro index/help

- [x] Localization hardening follow-up
  - [x] Runtime gameplay/HUD/mission/hangar text paths dovedeny na i18n keys
  - [x] Doplnen EN key coverage v `js/i18n.js` pro mission/HUD/hangar statusy
  - [x] Safe EN fallback formatovani pro runtime text i bez plneho i18n bootstrapu (harness kompatibilita)

- [x] Dev / testing protocol baseline
  - [x] Kratky "dev test protocol" doplnen do `docs/regression-checklist.md`
  - [x] Smoke scenar "Campaign to Victory + Endless Unlock" doplnen pro manualni QA

- [x] Localization baseline (P0)
  - [x] Runtime UI switched to English
  - [x] Help page switched to English
  - [x] i18n dictionary layer added (`js/i18n.js`) for future language packs

- [x] Run completion / win-state milestone
  - [x] Final encounter: final boss varianta na campaign final sektoru + jasna podminka "run dokoncen"
  - [x] Victory flow: obrazovka dokonceni runu + summary buildu/progrese
  - [x] Odemknuti Endless modu po prvnim uspesnem dojeti runu

- [x] UI / HUD polish
  - [x] Dvousloupcovy layout (hra vlevo, status panel vpravo) bez horizontal scrollu
  - [x] Prioritizace panelu podle gameplaye (combat -> ekonomika -> nastaveni)
  - [x] Emoji ikonky + tooltipy na ikony (vyznam a popis)
  - [x] Hangar ovladani sjednoceno na sipky + Space (legacy zkratky jako fallback)
  - [x] Hangar matrix readability pass (spacing/font density/truncation pro 1366x768 a 1920x1080)
  - [x] Full inventory flow: Sell/Salvage dostupne i pres Arrow+Space (Immediate Actions), ne jen pres legacy 9/0
  - [x] Selection list orientace: Item X/Y + scroll indikator pri dlouhem seznamu
  - [x] Jemne doladeni Immediate Actions na 1366x768 (nizsi hustota + skupinove oddeleni voleb)

- [x] Manualni UX QA pass hangaru (crate+inventory stress)
  - [x] P1: Pri plnem inventory byl flow blokovany bez legacy 9/0; doplneno Sell/Salvage do Arrow+Space Immediate Actions
  - [x] P2: V Selection listu doplnena orientace (Item X/Y + scroll indikator) pro 30+ polozek
  - [x] P3: Immediate Actions panel dostal vic vertikalniho prostoru + oddeleni skupin (shop/loadout/loot)

- [x] Ekonomika a loot 2.0
  - [x] Dropy modulu (rarity + affixy)
  - [x] Inventory/equip flow v hangaru
  - [x] Salvage rozhodovani (vzit/prodat/rozebrat)

- [x] Ship buildcraft (modularni lod)
  - [x] Sloty trupu/motoru/generatoru/stitu/chipsetu
  - [x] Stat dopady modulu na flight/combat
  - [x] Set bonusy/synergie (Prospector/Corsair/Warden)

- [x] Zbrane s jasnou identitou (dalsi tier)
  - [x] Nove primary archetypy (spread/rail/chain)
  - [x] Sekundarky + utility s vyraznou roli
  - [x] Lepsi telegraphy efektu

- [x] Tech zaklad pro skalovani
  - [x] Save/load profilu a progrese
  - [x] Data-driven balancing tabulky
  - [x] Combat tuning harness + regression checklist

- [x] Content pipeline a tooling (nove)
  - [x] Mise/nepratele/moduly definovane data-driven (JSON-like konfigurace)
  - [x] Validacni skript pro herni data (schema + sanity check)
  - [x] Balancing presety a rychly tuning workflow

- [x] Enemy roster a AI rozsirovani
  - [x] Nove archetypy (swarm/kamikaze/support/mine-layer)
  - [x] Elite prefix system (Phase/Berserker/Armored/Volatile)
  - [x] Lepsi behavior model (distance/flank/pressure windows)

- [x] Boss framework
  - [x] 1 plnohodnotny boss encounter (faze + weakpointy + zmena areny)
  - [x] Warning + phase transitions + reward table

- [x] Mission director 2.0
  - [x] Mission modifikatory (ion storm/low visibility/gravity anomaly)
  - [x] Kombinace cil + modifikator + biome
  - [x] Lepsi pacing krivka mezi sektory

- [x] Game feel / juice / UX
  - [x] Lepsi hit feedback + exploze + debris + warning cues
  - [x] Citelnejsi HUD (resource stress, cooldown urgency, mission risk)
  - [x] Audio vrstva (zakladni SFX + mix priority)

- [x] Content a biomy
  - [x] Min. 2 nove areny (vrakoviste/tezebni komplex)
  - [x] Hazardy prostredi jako gameplay prvek
  - [x] Biome readability pass: intro banner + trvale vizualni signatury graveyard/refinery/belt/ion_field
  - [x] Vazba biome/hazard v mission statusu (ACTIVE/Potential hazard)
  - [x] Odlisene hazard telegraphy (debris_field vs plasma_vent)

- [x] Shared energy economy (MVP)
  - [x] Strelba spotrebovava energy i shield pool
  - [x] Ruzne tridy akci maji odlisny shield drain factor (primary/secondary/utility/dash)
  - [x] Resource gate: bez stitu nelze strilet

- [x] Combat economy tuning
  - [x] MVP: sdileny zdroj energie (strelba/ability snizuje i stit)
  - [x] Balancing pass drain hodnot pro primary/secondary/utility/dash
