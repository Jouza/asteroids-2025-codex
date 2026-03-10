# Hotove veci

- [x] Frakce a reputace (MVP) - komplet
  - [x] Dokonceny zaklad 2 frakci, reputacni persistence/migrace, gain/loss hooky a rival pressure
  - [x] Frakcni reward scaling + biasovana hangar shop nabidka/ceny podle reputace
  - [x] Hangar/UI reputace + harness coverage (persistence, clamp, gain/loss, shop rozdily)

- [x] Frakce a reputace (Phase 2) - faction intel volba pred misi
  - [x] Hangar `Run Intel` volba (Balanced / HELIX contract / DRIFT contract)
  - [x] Intel profil modifikuje mission pressure + reward tradeoff (credits/salvage)
  - [x] Intel contract aplikuje reputacni dopad na startu mise
  - [x] Harness testy pro intel action flow, reward dopad a pressure scaling

- [x] Frakce a reputace (Phase 2) - neutral/black-market vendor
  - [x] Hangar `Vendor` volba (Faction Market / Black Market)
  - [x] Black market pouziva samostatne naceneni offeru (`blackMarketPriceMul`) a odpojuje faction bias ordering
  - [x] Render + action mapovani aktualizovany o novou vendor vrstvu v SHOP & OPS
  - [x] Harness test overuje pricier black-market pricing oproti faction marketu

- [x] Frakce a reputace (Phase 2) - thresholdy + anti-snowball
  - [x] Reputation threshold tier efekty (`strained` / `trusted` / `ally`) napojene na reward/shop economy
  - [x] Hangar status zobrazuje aktivni threshold perk pro obe frakce
  - [x] Reputation gain anti-snowball: sector cap + diminishing returns pro pozitivni gain
  - [x] Harness coverage pro threshold reward dopad a sektorovy rep gain cap

- [x] Frakce a reputace (Phase 2) - contraband mechanika
  - [x] Black market oznacuje vybrane offery jako `contraband` (discount + reputacni riziko)
  - [x] Nakup contrabandu aplikuje reputacni penalizaci obou frakci a zveda `contrabandHeat`
  - [x] `contrabandHeat` zvysuje mission pressure a po mission complete se postupne snizuje
  - [x] Harness coverage pro contraband purchase penalizaci + heat-driven pressure

- [x] Frakce a reputace (Phase 2) - frakcni varianty mission cilu
  - [x] Faction directives napojene na `ufo_hunt`/`asteroid_storm` bez nove mission architektury
  - [x] HELIX vs DRIFT direktivy meni objective target i spawn pacing podle biome faction
  - [x] Mission context rozsireny o directive text (`Biome | Modifier | Directive`)
  - [x] Harness coverage pro smerove rozdily target/pacing mezi frakcemi

- [x] Frakce a reputace (Phase 2) - frakcni module sety a affix identity
  - [x] Frakcni loot identity profil (`affixWeights` + `setTagWeights`) pro HELIX/DRIFT
  - [x] Generator dropu pouziva faction-weighted vyber affixu pri zachovani rarity/slot logiky
  - [x] Bias set tagu: HELIX preferuje `corsair`, DRIFT preferuje `prospector`
  - [x] Harness coverage pro distribucni rozdily affix/set prevalence mezi frakcemi

- [x] Frakce a reputace (Phase 2) - end-of-run faction summary
  - [x] Runtime sbirany timeline reputacnich zmen behem runu (mission/intel/biome/contraband)
  - [x] Threshold unlock eventy (`strained/trusted/ally`) jsou logovane do run summary
  - [x] `Victory` i `Game Over` overlay ukazuji faction debrief (start/end/delta + unlocky + posledni eventy)
  - [x] Harness coverage pro timeline snapshot a game-over summary payload

- [x] Endgame / replayability - Bounty board (MVP) slice 1
  - [x] Data-driven `mission.bountyBoard` templates (target/reward scaling) v config/content vrstve
  - [x] Runtime bounty board model na sektor + auto generovani offeru
  - [x] Mission-complete hook pro progress kontraktu podle vysledku mise
  - [x] Hangar `TACTICAL STATUS` zobrazuje bounty board kontrakty a progress
  - [x] Harness coverage pro board generation + mission progress flow

- [x] Endgame / replayability - Bounty board (MVP) slice 2 (manual claim + reroll UX)
  - [x] Bounty completion uz nevyplaci reward automaticky; kontrakty cekaji na manual `Claim`
  - [x] Hangar action list rozsireny o `Claim completed` a `Reroll board`
  - [x] Reroll ma data-driven cenu + sektorovy limit (`maxRerollsPerSector`)
  - [x] Harness coverage pro manual claim flow, reroll cost gate a reroll limit

- [x] Endgame / replayability - Bounty board (MVP) slice 3 (faction + heat interactions)
  - [x] Faction profily biasuji typy bounty kontraktu (`templateWeightByKind`) podle dominantni frakce
  - [x] Faction profil modifikuje bounty reward ekonomiku (credits/salvage) a claim reputacni dopad
  - [x] `contrabandHeat` navazuje na bounty ekonomiku (vyssi reward multipliery + vyssi reroll cost)
  - [x] Harness coverage pro faction bias, heat reroll pressure a faction rep dopad claimu

- [x] Endgame / replayability - Mutatory (MVP) slice 1
  - [x] Run setup rozsireny o `Mutator` preset row (Start/Game Over/Victory) s persistentni volbou
  - [x] Data-driven `mission.mutators` katalog (STANDARD / VOLATILE SPACE / SCAVENGER CODE / BLACKOUT PROTOCOL)
  - [x] Mutator multiplikatory slouceny s obtiznosti pro pressure, incoming/outgoing damage, economy, loot a hazards
  - [x] Help/i18n/harness/validace pokryti pro mutator flow

- [x] Frakce a reputace (MVP) - slice 4 (UI status + clamp coverage)
  - [x] Hangar tactical status zobrazuje reputaci obou frakci (i18n `hud.status.faction_rep`)
  - [x] Doplnen harness test na clamp reputace pri loadu profilu

- [x] Frakce a reputace (MVP) - slice 3 (rewardy + shop)
  - [x] Reward ekonomika navazana na reputaci aktivni frakce (mission credits, biome event credits/salvage, mini-boss credits)
  - [x] Hangar shop nabidka je biasovana podle dominantni frakce (poradi sustain/progression voleb)
  - [x] Hangar shop ceny jsou reputacne modulovane per item (`resolvedCost`)
  - [x] Harness coverage pro reward scaling podle reputace + shop order/cost rozdily

- [x] Frakce a reputace (MVP) - slice 1+2
  - [x] Pridane 2 vychozi frakce (`helix_union`, `drift_cartel`) do content/config vrstvy
  - [x] Profil rozsireny o persistovanou reputaci frakci (`progression.factions`) + migrace starsich save
  - [x] Reputation gain/loss hooky napojeny na mission start, mission complete a biome mini event
  - [x] Rival-loss pravidlo: gain u aktivni frakce snizuje reputaci konkurence
  - [x] Harness testy doplneny pro reputation persistence a mission gain flow

- [x] Difficulty follow-up: i18n + harness runtime coverage
  - [x] HUD status radek pro obtiznost presunut z hardcoded textu na i18n key (`hud.status.difficulty`)
  - [x] Harness doplnen o runtime testy dopadu obtiznosti (hazard shield drain, salvage yield, loot drop threshold)
  - [x] Overeno gate: `validate-runtime-syntax`, `combat-harness`, `validate-content-data`

- [x] Dev / testing workflow
  - [x] Preset `dev_fasttrack` pro rychly pruchod hrou

- [x] Start run difficulty presets (Rookie/Normal/Veteran/Ace)
  - [x] Nova `Difficulty` volba v unified `Run setup` (Mode/Difficulty/Pilot/Ship/Flight)
  - [x] Persist vybrane obtiznosti do profilu + aplikace na startu runu
  - [x] Multipliery obtiznosti napojeny na pressure/spawn pacing, incoming/outgoing damage, economy, drop chance a hazard intensity
  - [x] Help doplnen o sekci vysvetlujici rozdily obtiznosti
  - [x] Harness testy: run-setup diff row + persistence + sanity monotonicity multipliers

- [x] Hangar selection list equip flow bugfix
  - [x] `Space` na crate item v `Selection List` ted equipuje okamzite (bez mezikroku "presun do inventory")
  - [x] Pri swapu equip slotu se predchozi modul presune do inventory (pokud je misto), jinak akce bezpecne blokovana
  - [x] Pridan harness test pro tento flow, aby se bug nevracel

- [x] Endless pacing pass po unlocku
  - [x] Endless tuning vrstva od sektoru 5: vyssi difficulty, rychlejsi spawn intervaly, vyssi objective pressure
  - [x] Anti-snowball ekonomika v endless: kreditovy damping pro kill rewards, biome event credits a mini-boss credits
  - [x] Harness coverage pro endless pacing/economy (budget/interval/concurrency/credits multiplier)

- [x] Pilot Console UX overhaul (hero + RPG readability)
  - [x] Rozsireny modal layout (sirsi panel) s hero hlavickou: velke jmeno pilota, portrait slot, bio, XP progress
  - [x] Attributes prevedeny na karty s progress bary, popisem vyznamu a dopadu levelovani
  - [x] Perky prepracovany na karty s popisem benefitu, `Required vs Current` metrikami a stavovym indikatoru
  - [x] Opraven hint text: upgrade se ridi pres Pilot Console (v hangar fazi), ne textem zavadejicim flow
  - [x] Texty a popisy sdileny pres i18n keys a znovu pouzity i v help sekcich (attributes/perks reference)

- [x] Roguelike fresh-run reset policy
  - [x] Kazdy novy run zacina od nuly v progresi (pilot XP/atributy/perky, salvage, equipment/inventory, weapon progression, loadout)
  - [x] Zachovana identita vybrana v Run setup (pilot + ship), flight model a rezimove unlocky
  - [x] Reset je navazan na `Start` runu, ne na prechod mezi sektory

- [x] Overlay flow consistency pass (Game Over -> Victory-style)
  - [x] `GAME OVER` overlay sjednocen na modal summary layout (bez inline Run setup listu)
  - [x] `Enter` na `GAME OVER` uz neprovadi okamzity restart, ale vraci na `START` stejne jako `VICTORY`
  - [x] Run setup editace (Arrow/E) je omezena na `START` overlay pro konzistentni flow

- [x] Help identity + salvage clarity pass
  - [x] Doplnena explicitni karta `Salvage Loop` (salvage parts + credit konverze 1 part = 9 cr)
  - [x] Pridana samostatna data-driven sekce `Pilots (Roster)` s callsigny, referencemi a kratkymi bio popisy
  - [x] Pridana samostatna data-driven sekce `Ship Frames (Visual + Role)` s vizualni siluetou kazde lodi a flavor bonusy
  - [x] Nove help texty pokryte pres i18n keys (bez hardcoded UI stringu)

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
