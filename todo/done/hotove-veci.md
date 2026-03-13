# Hotove veci

- [x] iOS rotation black-screen guard (landscape)
  - [x] `getViewportInfo` ted vybira nejstabilnejsi viewport candidate (`visualViewport/inner/outer`) podle plochy
  - [x] `updateAdaptiveViewport` ignoruje nesmyslne male `getBoundingClientRect` hodnoty pri rotaci
  - [x] Pri podezrelych rect hodnotach se fallbackne na viewport dims, aby canvas nespadl na mini plochu/black screen

- [x] iPhone 16 Pro overlay fit fix (START + VICTORY/GAME OVER)
  - [x] Pridan jednotny `overlayFitProfile` engine (`tiny/compact/normal`) pro texty, spacing a velikost panelu
  - [x] START overlay prepnut na fit-first stack s clampem onboarding linek (`3/2/1`) a responsivnim setup panelem
  - [x] End-run overlay prepocitan na fit profil (panel/content/footer) se stabilnimi touch paging zonami v bounds
  - [x] Defenzivni text clipping (`fitTextToWidth`) pro dlouhe radky v overlay debriefu a run setupu
  - [x] Overlay vykresleni bere final `worldBounds` z viewport runtime po syncu (odolnejsi po rotaci)
  - [x] Harness coverage doplnena pro overlay fit profile a end-summary tap-zony v low-height viewportu

- [x] iPhone viewport fit hotfix (safe-area + real canvas bounds)
  - [x] Adaptivni viewport bere realne vykreslenou velikost canvasu (`getBoundingClientRect`) misto jen `innerWidth/innerHeight`
  - [x] Odstraneno inline prepisovani canvas CSS rozmeru z JS, aby se nerozjizdel CSS safe-area layout
  - [x] `touch-mobile-ui` shell/layout/canvas prepnute na 100% v safe-area kontejneru (bez pretahovani mimo viditelnou plochu)

- [x] Mobile touch UX hotfix: text selection block + compact low-height overlays
  - [x] V `touch-mobile-ui` vypnute nechtene oznacovani textu a iOS touch-callout/highlight
  - [x] Start overlay dostal ultra-compact variantu pro nizkou vysku (mensi fonty, kratsi onboarding, mensi setup panel)
  - [x] End-run overlay je responsivni podle vysky/sirky canvasu (panel + footer + tap zony bez prekryvu)
  - [x] Hangar panel layout ma compact fallback pro nizke landscape vysky, aby se panely nepretikaly

- [x] Mobile full-space adaptation (no-crop) MVP
  - [x] Pridany adaptivni viewport runtime (`renderViewport`, `worldBounds`, `balanceViewport`) s dynamickym canvas resize
  - [x] iOS/mobile bere viewport z `visualViewport` a pointer/touch mapovani je vazane na aktualni world bounds
  - [x] Mission pressure skaluje spawn tempo/cile podle pomeru `worldBounds` vs `balanceViewport` (anti-exploit ultra-wide)
  - [x] DPR cap pro touch/mobile rendering navazany na existujici quality level
  - [x] Touch/mobile modal layout respektuje safe-area insety (`env(safe-area-inset-*)`)
  - [x] Harness pokryva adaptive viewport update a viewport pressure multiplier

- [x] Touch controls v3: digitalni tlacitka (thrust + trysky + utoky 2/3)
  - [x] Touch combat input prepnut na button-first schema: `THRUST`, `TURN L`, `TURN R`, `SECONDARY`, `UTILITY`
  - [x] `PRIMARY` je na touch navazany na drzeni `THRUST` (autofire), bez joystick/aim routingu
  - [x] Touch `EVADE/DASH` odstraneno z UI i input flow; touch nequeueuje dash ani boost
  - [x] Render touch HUD prekreslen na obdelnikova digitalni tlacitka bez sticku
  - [x] i18n/help texty aktualizovany na nove touch mapovani
  - [x] Harness coverage prepsana na digitalni touch scenare (`THRUST` fire, `TURN L/R`, `SECONDARY/UTILITY`, no-dash/no-boost)

- [x] Touch control layout pass: rectangular pads (throttle/turn + fire)
  - [x] Kruhove touch joysticky nahrazeny obdelnikovymi pady s posuvnou packou
  - [x] Levy pad: nahoru/dolu plyn, doleva/doprava trysky na otaceni
  - [x] Pravy pad: primary fire trigger pad (bez turn komponenty)
  - [x] Touch HUD hinty/labely aktualizovany na `THROTTLE/TURN` a `FIRE`
  - [x] Harness coverage upravena na levy turn intent + right-pad non-move + fire flow

- [x] Touch control rework v2 (throttle-left + right turn/autofire)
  - [x] Levy stick je pouze progresivni plyn (linear), bez touch turn komponenty
  - [x] Pravy stick ridi relativni otaceni (`-1..1` z `rightStick.nx`) + autofire
  - [x] `EVADE` je v touch rezimu dash-only (tap i hold queue dash), touch boost je vypnuty
  - [x] HUD touch labely/hinty aktualizovany na `MOVE` + `TURN/FIRE` + dash-only popis
  - [x] Touch settings schovava/disable aim-assist prvky, ktere novy rezim nepouziva
  - [x] Harness coverage doplnena pro throttle-only left, right turn sign a EVADE hold->dash behavior

- [x] iOS touch coordinate mapping fix for contain canvas
  - [x] `mapPointerToCanvas` mapuje pointer na aktivni obsahovou oblast canvasu pri `object-fit: contain`
  - [x] Dotyky v letterbox okrajich se ignoruji misto chybneho prepoctu do herni plochy
  - [x] Harness coverage doplnena o contain-mapping center + outside-letterbox scenar

- [x] iOS touch input conflict hotfix (left-stick dead vs right aim/fire)
  - [x] Touch routing v combatu prepnut na zonove prirazeni (`x <= splitX` left stick, `x > splitX` right stick)
  - [x] Pridana explicitni `pointerRoles` mapa, ktera stabilizuje vlastnictvi pointeru po celou dobu drzeni
  - [x] `onTouchPointerMove` routuje podle role pointeru; odstraneno nejednoznacne fallback update poradim
  - [x] `fireActive` je navazany jen na validni pravy stick role state (bez kolizi z jinych pointer stavu)
  - [x] Touch HUD doplnen o popisky `MOVE` a `AIM/FIRE` pro vyssi citelnost
  - [x] Harness coverage doplnena o left/right zony, role stabilitu, role cleanup a anti-fire pro left stick

- [x] iOS mobile viewport white-side-bars hotfix
  - [x] `index.html` viewport doplnen o `viewport-fit=cover` pro iOS landscape safe-area
  - [x] Touch-mobile layout prepnuty na `dvw/dvh` (s `vw/vh` fallback) pro stabilni fullscreen sizing
  - [x] `html/body/layout/play-column/canvas` maji explicitni tmave pozadi, aby nevznikaly bile okraje

- [x] iOS install hint input-block hotfix (START-only)
  - [x] `iosInstallHint` viditelny pouze na `START` (iOS Safari, non-standalone, non-dismissed)
  - [x] Pri prechodu `START -> PLAYING` se hint skryje, aby neblokoval touch ovladani v boji
  - [x] CSS safety: `.install-hint { pointer-events: none; }` + `.install-hint-btn { pointer-events: auto; }`
  - [x] i18n/help wording upresnen na START-only install onboarding

- [x] iOS Add-to-Home MVP (icon + install hint)
  - [x] Doplneny iOS web-app head metadata (`apple-mobile-web-app-*`, `theme-color`) + `manifest.webmanifest`
  - [x] Pridany app ikony lodi (`180`, `192`, `512`) pro home screen/install branding
  - [x] Pridany iOS Safari install hint panel (`Share -> Add to Home Screen`) s `Don't show again` persistenci
  - [x] Help/i18n coverage doplnena o iOS install flow a rozdil oproti nativnimu install promptu

- [x] Atmosphere follow-up (MVP slice 1): ambient VFX intensity preset
  - [x] Data-driven `visualFxIntensityPresets` (`low/default/high`) pro deep-space/scars/dust + overlay alpha cap
  - [x] Runtime/UI preference `mobileUi.ambientFxPreset` s persistenci v local UI settings (invalid -> `default`)
  - [x] Render pipeline skaluje ambient vrstvy pres preset pred perf guard redukci (bez gameplay dopadu)
  - [x] Audio/Touch settings rozsireny o `Ambient VFX intensity` selector + i18n/help coverage
  - [x] Backlog sync: dokonceny podbod presunut z aktivni fronty do done

- [x] Mobile optimization phase 2 (input latency + light aim assist)
  - [x] Data-driven touch aim tuning (`deadzone`, response curve, smoothing) napojene na right-stick aim intent
  - [x] Light cone aim assist pro `touch_mobile`/`PLAYING` s jemnou limitovanou korekci (UFO + boss priorita)
  - [x] Audio/touch settings rozsirene o `Aim Assist` toggle, `Aim Assist Strength` a `Aim Smoothing`
  - [x] Touch preference persistence doplnena o aim assist hodnoty bez zmeny save/profile formatu
  - [x] Harness coverage pro deadzone/smoothing, assist cone clamp, boss priority a OFF/desktop fallback

- [x] Touch overlay hotfix + audio settings XL
  - [x] Combat touch prvky se uz nekresli na `START/GAME OVER/VICTORY`, aby neprekryvaly setup/start obsah
  - [x] Pridano samostatne overlay CTA tlacitko (`START` / `NEW RUN`) s vlastni tap zonou mimo combat action bublinu
  - [x] Tap handling priorita upravena: fullscreen CTA -> overlay CTA -> setup/hangar/end-summary interakce
  - [x] Touch-mobile `Audio Settings` modal zvetsen (panel, typografie, radky, close hitbox, slider thumb)

- [x] Mobile/Tablet UX pass (landscape-first + smart fullscreen + adaptive touch)
  - [x] Runtime `deviceMode` + `mobileUi` stav pro touch/mobile flow
  - [x] Landscape gate pro touch mobile: portrait zobrazi rotate overlay a pozastavi gameplay update bez resetu runu
  - [x] Smart fullscreen prompt v combatu (`Tap for Fullscreen`) s gesture-only request flow a fallbackem pri deny
  - [x] Mobile layout branch: skryti desktop sidebaru, canvas full viewport, kompakni in-canvas top strip
  - [x] Adaptive visibility pro `SECONDARY/UTILITY` podle ready/threat kontextu pri zachovani stejne mechaniky akci
  - [x] Touch hangar flow rozsireny o sticky bottom bar (`Back / Action / Launch`) + vetsi touch hitboxy v run setup
  - [x] Help/i18n pokryti pro mobile landscape/fullscreen flow

- [x] Touch Controls MVP (combat + overlay/hangar tap flow)
  - [x] Pridana touch input vrstva (`inputMode`, sticks/buttons/pointers, touch action queue) nad existujici combat intenty
  - [x] Combat integrace: left stick = turn/thrust, right stick = aim + primary auto-fire, `EVADE` tap = dash, hold = boost
  - [x] Touch action queue je napojena na stejne flow jako klavesy (`secondary`/`utility`/`dash`) bez zmeny economy/damage/cooldown pravidel
  - [x] Render touch HUD overlay: levy/pravy stick + tlacitka `SECONDARY`/`UTILITY`/`EVADE` + `ACTION` se stavy ready/cooldown
  - [x] Touch tap navigace pro Start/Game Over/Victory (run setup rows, end-summary page switch) a Hangar (loot/shop selection + action)
  - [x] Help/i18n coverage doplnena o kartu `Touch Controls (MVP)` a touch label/hint texty
  - [x] Harness coverage doplnena pro touch mode activation, EVADE tap/hold, aim->auto-fire a secondary/utility touch action routing

- [x] Combat readability follow-up (post Telegraph 2.0)
  - [x] Pridano data-driven `missionDirector.hazardTelegraphScaling` (difficulty + mutator class) pro jemne vizualni skaly telegraph vrstvy
  - [x] Mission runtime doplnuje `hazard.telegraphVisualMul` bez zasahu do hazard timing/damage logiky
  - [x] Incoming hit cue pipeline rozsirena o `kind: emp_jam_pressure` pro jammer/EMP tlak odliseny od cisteho damage typu
  - [x] Render hit-cue pass ma novou EMP/JAM barevnou a tvarovou signaturu (interference arc) oddelenou od standardnich damage cue
  - [x] Relay/neon hazard pressure hooky emituji EMP/JAM cue i pro systemovy tlak (cooldown/energy), tick damage drzi stejny gameplay
  - [x] Help/i18n karta `Hazard Readability 2.0` aktualizovana o risk-profile telegraph scaling + EMP/JAM cue vysvetleni
  - [x] Harness coverage doplnena pro telegraph scaling (difficulty/mutator) a `emp_jam_pressure` cue flow

- [x] Endgame / replayability - Boss Rush depth pass (MVP slice 1)
  - [x] Pridany data-driven `run.bossRush.depthTemplates` (sektory 1-4) s `bossTuning`, `arenaPressure` a `phaseBeatIntensityMul`
  - [x] Boss Rush `mini_boss` mise nahrava template do `currentMission.bossRushDepth` + `bossRushPressure` runtime state
  - [x] Boss spawn pouziva sektorovy tuning (shoot cooldown, movement/orbit, weakpoint cycle/window)
  - [x] Lehke pressure windows spawnuji capovane addy (1-2 UFO) s readability guardem podle bullet loadu
  - [x] Mission context doplnen o depth label; warning row doplnen o `BOSS RUSH PRESSURE`
  - [x] Phase beat intenzita je v Boss Rush modulovana podle template
  - [x] Help/i18n karta `BOSS RUSH` aktualizovana na sektorove variace
  - [x] Harness coverage doplnena pro template loading/tuning, pressure cap/readability guard a campaign isolation

- [x] Endgame / replayability - final clear reward table (campaign + boss rush)
  - [x] Data-driven `run.finalClearRewards` profily pro `campaign` a `boss_rush` v config/content override
  - [x] Final clear payout je aplikovan jednorazove pri `VICTORY` (`credits/salvage/score` + guaranteed drops)
  - [x] Guaranteed drops z final reward tabulky se loguji do runSummary drop highlights (`source: finalClear`)
  - [x] `Victory Summary 2.0` overview doplnen o dedikovany blok `Final Clear Reward Table`
  - [x] Harness coverage doplnena pro campaign/boss-rush payout a anti-double-claim guard

- [x] Endgame / replayability - Victory summary 2.0
  - [x] End-run debrief sjednocen pro `VICTORY` i `GAME OVER` do 3-tab overlaye (`Overview`, `Drops+Damage`, `Timeline+Faction`) bez overflow
  - [x] Runtime `runSummary` trackuje cely run: mission timeline, drop highlights a total incoming damage (`shieldAbsorb`/`hullDamage`)
  - [x] Drop highlights berou top 6 dropu z celeho runu (rarity desc + recency), nezavisle na finalnim stavu crate/inventory
  - [x] Timeline/faction stranka kombinuje posledni mise s kompaktnim faction debriefem
  - [x] i18n/help coverage doplnena o Summary 2.0 texty a kartu v `Mission Types`
  - [x] Harness coverage doplnena pro runSummary payload, damage/drop tracking, timeline cap a end-summary page cycling

- [x] Mechanics pack: drain_core + echo_shell + sentry_relay + salvage_drifter
  - [x] Pridany asteroid typy `drain_core` a `echo_shell` (score bonus + runtime chovani)
  - [x] `drain_core` aura drainuje energii a pridava heat podle vzdalenosti
  - [x] `echo_shell` pri zasahu spousti pulse, ktery odklani blizke projektily
  - [x] Pridana mission entita `sentry_relay` se zamerenym telegraph beam shotem
  - [x] Pridana neutral objective entita `salvage_drifter` s capture rewardem (fail = pouze ztrata bonusu)
  - [x] Mission integrace pres data-driven `missionDirector.entityProfiles` + `chanceByMission`/`biomeChanceMul`
  - [x] Render/HUD doplnen o entity vykresleni, warning lock cue a drifter status row
  - [x] Help/i18n coverage doplnena o nove asteroid/entity karty a status texty
  - [x] Harness coverage doplnena pro drain/echo/sentry/drifter scenare

- [x] Enemy projectile vs asteroid collision rework (UFO + Boss)
  - [x] Enemy strely maji runtime `asteroidCollisionMode` (`break`/`block`) mapovany podle `damageProfile` (`plasma => block`, ostatni => break)
  - [x] Pridany kolizni pass `handleEnemyBulletAsteroidCollisions()` pred `handleShipThreatCollisions()`
  - [x] `break` rezim pro enemy strely pouziva stejnou split/blast mechaniku asteroidu jako hrac
  - [x] Enemy-caused asteroid destruction nedava hraci rewardy (score/telemetry kill/mission asteroid kill/loot)
  - [x] Harness testy doplneny pro `break`/`block`, no-reward pravidla a kolizni poradi v ramci frame

- [x] Campaign flow rework na 8 kol (unikatni biome + boss jen v 8. kole)
  - [x] `run.finalSector` zvednut na 8 v configu i content override
  - [x] Campaign pouziva seeded `campaignBiomeOrder` bez opakovani biomu v ramci runu
  - [x] Mission flow pro campaign: kola 1-7 rotace bez bossu, kolo 8 `mini_boss`/`FINAL BOSS`
  - [x] Boss Rush zustava samostatny 4-kolovy rezim
  - [x] Help/i18n texty upraveny na novy campaign flow
  - [x] Harness coverage doplnena o determinismus biome poradi a mission type schedule 1..8

- [x] Biome expansion to 8 (Neon + Dust)
  - [x] Pridany biomy `neon_nebula` a `dust_expanse` do mission directoru, vcetne vyvazeni biome weightu na soucet 1.0
  - [x] Oba biomy maji plny pack: mini-event, audio warning/stinger profil a visual profil (`biomeVisuals`)
  - [x] Nove biome hazardy `neon_arc_field` a `dust_squall` s vlastnim mission runtime chovanim
  - [x] Render pass doplnen o hazard vizualy/warning labely/status labely pro nove hazard typy
  - [x] Help/i18n coverage doplnena o nove biome/hazard karty a mini-event nazvy
  - [x] Harness testy doplneny pro nove biome IDs a hazard behavior/telegraph scenare

- [x] Combat Readability / Telegraph 2.0 (plny balik)
  - [x] Data-driven `missionDirector.hazardTelegraphs` profil (pre-tick window, pulse color/alpha, ring/line boost, priority)
  - [x] Hazard runtime telegraph metadata (`telegraphActive`, `telegraphRatio`, `telegraphKind`, `lastTickAt`) v mission update loopu
  - [x] Render hazard pass doplnen o pre-tick pulse/halo/streak telegraph vrstvu + prioritni warning text
  - [x] Off-screen edge indikatory pro mini-bosse, aktivni telegraph hazardy a gravity anomaly centrum
  - [x] Incoming damage hit-type cues (`incomingHitCues`) s TTL, ring/arc + slabym screen tint feedbackem
  - [x] Help/i18n aktualizace pro hazard readability vrstvu
  - [x] Harness coverage: telegraph pre-tick/pulse-window, incoming cue creation, cue TTL expiry

- [x] Raw Space Combat Pack v1 (vizualni atmosfera)
  - [x] Rozsirene `missionDirector.biomeVisuals` o `deepSpace`, `warScars`, `foregroundDust`, `cinematicFlashes` pro vsechny biomy
  - [x] `currentMission.visualFx` rozsireno o flash lifecycle (`flashTtl/intensity/color`) + oddelene layer seedy
  - [x] Mission runtime doplnen o `triggerMissionFlash(...)` a data-driven cinematic flash roll podle biome profilu
  - [x] Render pipeline doplnena o `drawDeepSpaceBackdrop`, `drawWarScars`, `drawForegroundDust`, `drawCinematicFlash`
  - [x] Perf guardrails: pri `avgFrameMs > 18` snizeni density/alpha (foreground/scars/flashes) bez zasahu do gameplay logiky
  - [x] Help aktualizace: nova karta `Raw Space Atmosphere` + rozsireny biome hint
  - [x] Harness coverage: mission flash init, boss phase flash trigger, flash TTL lifecycle reset

- [x] Biome atmosphere pass 2.0 (MVP)
  - [x] Data-driven `missionDirector.biomeVisuals` profil (parallax/debris/cadence/fogPulse/beatColor) pro vsechny biomy
  - [x] `currentMission.visualFx` runtime state + central `triggerMissionBeat(...)` dispatcher
  - [x] Event beats napojeny na mission start, biome mini event, survive cleanup, ufo_hunt finale a boss phase transition
  - [x] Render pass rozsireny o cadence-driven parallax vrstvu a `drawMissionBeats` overlay
  - [x] Help/i18n texty aktualizovany na novou biome atmosphere + phase beat logiku
  - [x] Harness coverage doplnena pro `visualFx` init + survive/hunt/boss beat trigger scenare

- [x] Mission flow: UFO Hunt staged finale pass
  - [x] `ufo_hunt` prepnuto na staged flow: 1-3 prelude UFO (sekvencne po smrti) + finale 2 UFO soubezne
  - [x] Objective/status text doplnen o fazovy progress (`Hunt ... | Final wave ...`)
  - [x] Harness coverage upravena pro staged hunt a finale spawn behavior
  - [x] Help text pro kartu `UFO HUNT` aktualizovan na novy flow

- [x] Combat feedback: floating damage numbers na UFO zasah
  - [x] Pri zasahu UFO se vykresli plovouci damage text s fade-out (`-X SH` pro shield, `-Y HU` pro hull)
  - [x] Stejny floating damage feedback rozsireny i na mini-bosse (`-Y HU`), vcetne Boss Rush flow
  - [x] Runtime model doplnen o `damageNumbers` list + update krok (drift + TTL cleanup)
  - [x] Render pipeline doplnena o vrstvu damage textu nad bojujicimi objekty

- [x] Backlog reprioritization (focus: visual + gameplay experience)
  - [x] `todo/backlog/veci-k-realizaci.md` preusporadan podle prioritni fronty pro herni zazitek
  - [x] Hotove podbody odstraneny z backlogu (zustavaji pouze aktivni polozky)
  - [x] Doplneny nove gameplay/vizual kandidati: Combat readability 2.0, Biome atmosphere 2.0, Hangar UX follow-up

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

- [x] Endgame / replayability - Boss Rush (MVP) slice 1
  - [x] Novy run mode `BOSS RUSH` dostupny v unified Run setup mode row (vcetne quick cycle `E`)
  - [x] Mission routing pro Boss Rush: kazdy sektor startuje `mini_boss` encounter (bez standardnich mission typů)
  - [x] Completion flow zustava mission-complete/hangar loop (bez campaign auto-victory)
  - [x] Harness coverage pro mode cycling a mini-boss-only mission flow

- [x] Endgame / replayability - Win-state follow-up po MVP (Boss Rush) slice 1
  - [x] Data-driven Boss Rush final clear hranice (`run.bossRush.finalSector` + `finalMissionType`)
  - [x] Boss Rush final encounter uzavira run do `VICTORY` (mimo campaign flow)
  - [x] Boss Rush victory nepouziva campaign endless-unlock side effect
  - [x] Victory overlay dostal dedikovany status text pro Boss Rush clear
  - [x] Help doplnen o explicitni Boss Rush final-clear popis (mission hint + samostatna karta)
  - [x] Harness coverage pro Boss Rush final victory branch

- [x] Hangar UI overflow fix (responsive panel sizing)
  - [x] Hangar top/bottom panel heights jsou odvazene od canvas vysky misto pevnych hodnot
  - [x] `SHOP & OPS` panel ma viewport window + scrollbar thumb pri dlouhem seznamu akci
  - [x] TACTICAL STATUS spacing je adaptivni pro nizsi vysky
  - [x] Spodni action/message bar je clampnuty, aby nepretikal mimo canvas

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
