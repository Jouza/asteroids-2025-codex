# Veci k realizaci

## Aktualni fokus

- [ ] Performance & runtime budget
  - [x] Adaptive quality budget pro particles/effects pri FPS dropu
  - [x] Frame-time / perf overlay pro dev rezim
  - [x] Guard proti memory growth pri dlouhem runu (particles, bullets, utility efekty)
  - [ ] Profiling pass (CPU hot paths update/render smycky)
- [ ] Data-driven generovani help obsahu z content dat (misto rucniho HTML)
- [ ] Jasnejsi mode select UX (Campaign/Endless jako explicitni volba v UI, ne jen toggle klavesou)

## Dalsi chybejici temata (zatim neevidovana)

- [ ] Biome identity 2.0 (audio + rewards)
  - [ ] Biome-specificky ambient layer a warning SFX variace
  - [ ] Biome-specificke mini reward/event hooky (aby biome nebyl jen vizualni)

- [ ] New player onboarding
  - [ ] Kratky tutorial flow pro shared shield-energy model
  - [ ] Contextual hinty pro "proc nejde akce" (shield gate / heat gate / cooldown)

- [ ] Accessibility / readability options
  - [ ] Colorblind-safe rezim pro hazard a resource warning barvy
  - [ ] UI scale / font scale volba pro slabsi citelnost na mensich displejich
  - [ ] Volitelny high-contrast HUD preset

- [ ] Input UX quality
  - [ ] Remap klaves (min. movement/combat/hangar akce)
  - [ ] Volitelne gamepad mapovani (MVP)

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
  - [x] Endless sektor (run loop bez finalniho win-state)
  - [ ] Boss rush
  - [ ] Win-state follow-up po MVP
  - [ ] Samostatna reward tabulka pro final clear (clear bonus/meta reward)
  - [ ] Victory summary 2.0 (drop highlights, damage taken, mission timeline)
  - [ ] Jasnejsi mode select UX (Campaign/Endless jako explicitni volba v UI, ne jen toggle klavesou)
  - [ ] Endless pacing pass po unlocku (skalovani, anti-snowball ekonomika, delka runu)

- [ ] Help / codex vrstva
  - [x] Samostatna help stranka s objekty, hazardy, chovanim a dopadem
  - [x] Odkaz z hlavni hry na help stranku
  - [x] Sekce zbrani s parametry a ingame vizualizaci vystrelu (data-driven z GAME_CONFIG)
  - [x] Sekce typu misi a vysvetleni run loopu (survive -> ufo_hunt -> asteroid_storm -> mini_boss)
  - [x] Seznam vsech biomu (Belt Fringe, Wreck Graveyard, Refinery Complex, Ion Field) s kratkym popisem
  - [ ] Data-driven generovani help obsahu z content dat (misto rucniho HTML)

- [ ] Audio UX controls
  - [x] Mute toggle (M)
  - [x] Ovladas hlasitosti v UI
  - [x] Persist nastaveni hlasitosti/mute do localStorage
  - [ ] Samostatne volume bus pro UI/gameplay warningy (pokrocilejsi mix)

- [ ] Dev / testing workflow
  - [x] Preset `dev_fasttrack` pro rychly pruchod hrou

- [ ] Security / backend readiness
  - [ ] Leaderboard backend input validace (strict schema, initials A-Z, score range)
  - [ ] Rate limit + anti-spam ochrana endpointu
  - [ ] Atomicky file write + lock pri soubeznem zapisu
  - [ ] Zakladni hardening endpointu (error handling, log sanitizace)

- [ ] Performance & runtime budget (priorita v Aktualni fokus)

- [ ] Stabilita a release kvalita
  - [ ] Crash-safe fallbacky (audio/localStorage/feature detect)
  - [ ] Jednoduchy release checklist pred push do main
  - [ ] Verzovani/changelog rezim nad build timestampem
  - [ ] Smoke gate pravidla pred release (harness + manual sanity)
