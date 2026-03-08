# Codex How-To (prakticky navod)

Kratky navod, jak efektivne zadavat ukoly a jak prechazet do novych Codex vlaken bez ztraty kontextu.

## 1) Jak me ovladat v jednom vlakne

Pouzij tento format:

1. Cil:
   - co ma byt vysledek (funkce, fix, refaktor, dokumentace)
2. Kontext:
   - co uz je hotovo
   - co je problem
   - ktere soubory jsou relevantni
3. Omezeni:
   - co se nesmi menit
   - architektura, pravidla gameplaye, UX pravidla
4. Definice hotovo:
   - co musi probehnout pred uzavrenim (testy, TODO update, help update, commit, push)

Priklad kratkeho zadani:

```text
Cil: Upravit X.
Hotovo: Y.
Problem: Z.
Relevantni soubory: a.js, b.js.
Omezeni: nemenit core model; zachovat controls.
Done: spust harness, update TODO, commit+push.
```

## 2) Rezimy zadani, ktere funguji nejlip

- `Implementuj rovnou`:
  - kdyz chces zmenu okamzite udelat end-to-end.
- `Nejdriv navrh, pak implementace`:
  - kdyz chces nejdriv porovnat varianty.
- `Review mode`:
  - napis `udelat review` a cekej primarne seznam rizik/bugu.

## 3) Jak otevrit nove vlakno bez ztraty kontextu

Kdyz zakladas nove vlakno, posli hned prvni zpravu ve formatu:

```text
Projekt: STARFANG
Stav: (1-3 odrazky)
Posledni commit na main: <hash>
Co je hotovo: ...
Co chybi: ...
Priorita ted: ...
Omezeni: ...
Relevantni soubory: ...
Pozadovany vystup: implementace + test + TODO + commit + push
```

Doporucene minimum pri handoffu:

- posledni commit hash
- seznam zmenenych souboru
- otevrene ukoly (max 3)
- explicitni "co delat ted jako prvni"

## 4) Prompt sablony pro dalsi vyvoj

### A) Pokracovani po predchozim tasku

```text
Navaz na posledni zmenu (<hash>).
Udelej: <konkretni ukol>.
Omezeni: <...>.
Pred pushem: node tools/combat-harness.js.
Aktualizuj TODO a help pokud meni mechaniku.
```

### B) Vetsi feature

```text
Cil feature: <...>
Rozsah: <co ano / co ne>
Rizika: <...>
Soubory: <...>
Postup: nejdriv plan, pak implementace po krocich.
```

### C) Cisty bugfix

```text
Bug: <popis + reprodukce>
Ocekavane chovani: <...>
Podezrele soubory: <...>
Udelej fix + minimal regression check + commit/push.
```

## 5) Co zvedne kvalitu vysledku

- Pis konkretne "co nesahat".
- Napis jasnou prioritu (`P0`, `P1`).
- U UX zmen dej i cilovou situaci (napr. "1366x768 full inventory").
- Kdyz chces jen jednu vec, napis `implementuj pouze P1`.

## 6) Co delat pri delsim vlakne

Po 2-4 vetsich krocich si vyzadej:

- kratky stav:
  - co je hotovo
  - co je otevrene
  - co je dalsi krok

Prikaz:

```text
Dej mi handoff summary pro nove vlakno.
```

## 7) Vazba na projektova pravidla

- Trvale instrukce jsou v [AGENTS.md](../AGENTS.md).
- TODO pravidla jsou v [todo/AGENTS.md](../todo/AGENTS.md).
- Opakovatelny pre-push workflow je ve skillu:
  - [.agents/skills/release-gate/SKILL.md](../.agents/skills/release-gate/SKILL.md)
