# Veci k realizaci

## Prioritni fronta (herni zazitek: vizual + gameplay)

- [ ] Endgame / replayability
  - [ ] Samostatna reward tabulka pro final clear (campaign + boss rush)
  - [ ] Victory summary 2.0 (drop highlights, damage taken, mission timeline)
  - [ ] Boss Rush depth pass (variace encounter flow mezi sektory, ne jen linearni mini-boss loop)

- [ ] Combat readability / telegraph 2.0
  - [ ] Silnejsi telegraphy pro nejrizikovejsi hazard ticky (pred-tick warning + pulse intenzita)
  - [ ] Off-screen warning indikator pro velke boss/hazard hrozby mimo viewport
  - [ ] Hit clarity pass: odlisit incoming damage typy (kinetic/explosive/dot) pres VFX cue

- [ ] Atmosphere follow-up (post Raw Space v1)
  - [ ] Lokalni slider/preset pro intenzitu ambient VFX (Low/Default/High) pro slabsi GPU
  - [ ] Dalsi "event beat" varianty podle hazard typu (unikatni signature pulse)

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
