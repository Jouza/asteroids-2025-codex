# Veci k realizaci

## Prioritni fronta (herni zazitek: vizual + gameplay)

- [ ] Atmosphere follow-up (post Raw Space v1)
  - [ ] Dalsi "event beat" varianty podle hazard typu (unikatni signature pulse)
  - [ ] Biome expansion follow-up (8 -> 10) s dalsimi odlisnymi hazard archetypy

- [ ] Hangar visual/gameplay UX follow-up
  - [ ] Tactical status viewport/scroll pro nizsi vysky (stejny princip jako SHOP & OPS)
  - [ ] Lepsi vizualni oddeleni high-priority akci (repair/claim/reroll) od utility akci

## Dalsi chybejici temata (sekundarni)

- [ ] Accessibility / readability options
  - [ ] Colorblind-safe rezim pro hazard a resource warning barvy
  - [ ] UI scale / font scale volba pro slabsi citelnost na mensich displejich
  - [ ] Volitelny high-contrast HUD preset

- [ ] Input UX quality
  - [ ] Remap klaves (min. movement/combat/hangar akce)
  - [ ] Volitelne gamepad mapovani (MVP)

- [ ] Pilot RPG layer
  - [ ] Rozsireni tree na 10-12+ perku + branch synergie

- [ ] Audio UX controls
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
