# Veci k realizaci

## Dalsi chybejici temata (zatim neevidovana)

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

- [ ] Frakce a reputace (Phase 2+ rozsireni)
  - [x] Faction intel volba pred misi (bonus + tradeoff + reputacni dopad)
  - [x] Neutral/black-market vendor jako treti obchodni vrstva
  - [x] Reputation thresholdy (`-20/0/+20/+50`) s odemykatelnymi pasivy
  - [x] Contraband mechanika (silny item za reputacni/bounty riziko)
  - [x] Anti-snowball guard pro reputaci (sector cap + diminishing returns)

- [ ] Endgame / replayability
  - [x] Bounty board (MVP) - data/model + hangar board UI + mission auto-payout hook
  - [x] Mutatory (MVP) - selectable run mutator presets + persistence + gameplay scaling multipliers
  - [x] Endless sektor (run loop bez finalniho win-state)
  - [x] Boss rush (MVP) - samostatny run mode s mini-boss only mission flow
  - [x] Win-state follow-up po MVP (Boss Rush ma vlastni final clear + odlisny victory status)
  - [ ] Samostatna reward tabulka pro final clear (clear bonus/meta reward)
  - [ ] Victory summary 2.0 (drop highlights, damage taken, mission timeline)
  - [x] Jasnejsi mode select UX (Campaign/Endless jako explicitni volba v UI, ne jen toggle klavesou)
  - [x] Endless pacing pass po unlocku (skalovani, anti-snowball ekonomika, delka runu)

- [ ] Audio UX controls
  - [x] Mute toggle (M)
  - [x] Ovladas hlasitosti v UI
  - [x] Persist nastaveni hlasitosti/mute do localStorage
  - [ ] Samostatne volume bus pro UI/gameplay warningy (pokrocilejsi mix)

- [ ] Security / backend readiness
  - [ ] Leaderboard backend input validace (strict schema, initials A-Z, score range)
  - [ ] Rate limit + anti-spam ochrana endpointu
  - [ ] Atomicky file write + lock pri soubeznem zapisu
  - [ ] Zakladni hardening endpointu (error handling, log sanitizace)

- [ ] Stabilita a release kvalita
  - [ ] Crash-safe fallbacky (audio/localStorage/feature detect)
  - [ ] Jednoduchy release checklist pred push do main
  - [ ] Verzovani/changelog rezim nad build timestampem
  - [ ] Smoke gate pravidla pred release (harness + manual sanity)
