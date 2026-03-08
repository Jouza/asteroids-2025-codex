# Veci k realizaci

- [ ] Pilot RPG layer
  - [x] MVP: XP + levely pilota
  - [x] MVP: Atributy (Reflex/Systems/Grit/Instinct)
  - [x] MVP: Skill perky + unlock flow v hangaru
  - [ ] Rozsireni tree na 10-12+ perku + branch synergie

- [ ] Frakce a reputace (MVP)
  - [ ] 2 frakce na start
  - [ ] Reputation gain/loss
  - [ ] Frakcni rewardy + odlisne nabidky shopu

- [ ] Endgame / replayability
  - [ ] Bounty board
  - [ ] Mutatory
  - [ ] Endless sektor
  - [ ] Boss rush

- [ ] Help / codex vrstva
  - [x] Samostatna help stranka s objekty, hazardy, chovanim a dopadem
  - [x] Odkaz z hlavni hry na help stranku
  - [x] Sekce zbrani s parametry a ingame vizualizaci vystrelu (data-driven z GAME_CONFIG)
  - [ ] Data-driven generovani help obsahu z content dat (misto rucniho HTML)

- [ ] UI / HUD polish
  - [x] Dvousloupcovy layout (hra vlevo, status panel vpravo) bez horizontal scrollu
  - [x] Prioritizace panelu podle gameplaye (combat -> ekonomika -> nastaveni)
  - [x] Emoji ikonky + tooltipy na ikony (vyznam a popis)
  - [x] Hangar ovladani sjednoceno na sipky + Space (legacy zkratky jako fallback)
  - [x] Hangar matrix readability pass (spacing/font density/truncation pro 1366x768 a 1920x1080)
  - [x] Full inventory flow: Sell/Salvage dostupne i pres Arrow+Space (Immediate Actions), ne jen pres legacy 9/0
  - [x] Selection list orientace: Item X/Y + scroll indikator pri dlouhem seznamu
  - [x] Jemne doladeni Immediate Actions na 1366x768 (nizsi hustota + skupinove oddeleni voleb)

- [ ] Audio UX controls
  - [x] Mute toggle (M)
  - [x] Ovladas hlasitosti v UI
  - [x] Persist nastaveni hlasitosti/mute do localStorage
  - [ ] Samostatne volume bus pro UI/gameplay warningy (pokrocilejsi mix)

- [ ] Dev / testing workflow
  - [x] Preset `dev_fasttrack` pro rychly pruchod hrou
  - [ ] Kratky dev test protocol (co otestovat po vetsi zmene)
  - [ ] Jednoducha smoke stranka/scenar pro manualni QA mimo hlavni run

- [ ] Security / backend readiness
  - [ ] Leaderboard backend input validace (strict schema, initials A-Z, score range)
  - [ ] Rate limit + anti-spam ochrana endpointu
  - [ ] Atomicky file write + lock pri soubeznem zapisu
  - [ ] Zakladni hardening endpointu (error handling, log sanitizace)

- [ ] Performance & runtime budget
  - [ ] Adaptive quality budget pro particles/effects pri FPS dropu
  - [ ] Frame-time / perf overlay pro dev rezim
  - [ ] Guard proti memory growth pri dlouhem runu (particles, bullets, utility efekty)
  - [ ] Profiling pass (CPU hot paths update/render smycky)

- [ ] Stabilita a release kvalita
  - [ ] Crash-safe fallbacky (audio/localStorage/feature detect)
  - [ ] Jednoduchy release checklist pred push do main
  - [ ] Verzovani/changelog rezim nad build timestampem
  - [ ] Smoke gate pravidla pred release (harness + manual sanity)
