# Regression Checklist

Pouziti pred push do `main` a pred vetsi balanc/content zmenou.

## Dev test protocol (kratka verze)

Pouzij tento sled po kazde vetsi zmene:

1. Spust automaticke gate:
   - `node tools/combat-harness.js` (vzdy)
   - `node tools/validate-content-data.js` (jen kdyz se meni content/balance data)
2. Projdi manualni smoke scenar "Campaign to Victory + Endless Unlock" (sekce nize).
3. Over, ze nejsou chyby v konzoli a zadny flow neskoncil dead-endem.
4. Teprve potom commit/push.

## 1) Automaticky smoke test (combat harness)

Spust:

```powershell
node tools/combat-harness.js
```

Ocekavany vysledek:

- vsechny testy `PASS`
- finalni radek `Combat harness passed: X/X`

Dalsi povinny krok pri zmene content/balance dat:

```powershell
node tools/validate-content-data.js
```

Ocekavany vysledek:

- finalni radek `Content validation passed.`

Kontrolovane oblasti:

- profile save/load roundtrip (localStorage)
- survive objective text po vyprseni casu
- primary archetypy (spread/rail/chain)
- set bonus tier aktivace (2/3 a 3/3)
- hangar input mapping (legacy fallback klavesy)
- ion storm anti-hard-lock (shield recovery z 0)

## 2) Manualni herni smoke check (5-7 min)

- Start runu (`Enter`) bez chyb v konzoli.
- V hangaru:
  - Primarni flow: `Left/Right` sekce, `Up/Down` vyber, `Space` akce, `Enter` start sektoru.
  - V `Immediate Actions` funguje pres `Space` i `Sell selected` a `Salvage selected`.
  - V `Selection list` sedi orientace `Item X/Y` a scroll indikator pri 20+ polozkach.
  - Legacy fallback stale funguje (`4/5/R`, `8/9/0`, `T/Y/U/I/O/K`).
- Behem runu:
  - `M` prepina mute/unmute bez erroru v konzoli.
  - `B` prepina perf overlay (FPS/ms/quality/hotspots).
  - `N` vypise profiling snapshot do konzole (pro zaznam a porovnani behu).
- Mise `SURVIVE`:
  - po dobehnuti casu se ukazuje `Clear remaining threats: N`.
- Po game over + restart:
  - progression zustava (loadout/upgrades/inventory/equipment/salvage).
- HUD:
  - cooldowny a set status se aktualizuji korektne.

## 2.1) Smoke scenar: Campaign to Victory + Endless Unlock (8-12 min)

Cil: rychle overit novy win-state, final boss flow a persist odemknuti Endless.

- Spust hru s rychlym presetem:
  - `index.html?preset=dev_fasttrack`
- Dokoncuj sektory az do final encounteru.
- Ve final encounteru over:
  - final boss ma odlisny pressure/faze oproti mini-bossi.
  - gravity anomaly nehard-lockuje pohyb; thrust/boost umi pomoct z core zony ven.
- Po porazce final bosse over:
  - zobrazi se `VICTORY` summary overlay.
  - summary obsahuje run/build progress informace (ne prazdny panel).
- Po navratu do menu/hangaru over:
  - Endless je odemceny (persistuje po restartu stranky).
- Proved quick restart runu a potvrd:
  - Campaign i Endless flow jde normalne spustit.

## 2.2) Smoke scenar: Hangar readability + decisions (3-5 min)

Cil: overit, ze novy Hangar 2.0 dava hraci jasny signal o progresu a equip rozhodnuti.

- Vstup do hangaru po misi a over:
  - v hlavicce je progression line (`Cooldown Lv`, `Magazine Lv`, `Max shots`).
- V `Shop & Ops` nakup 1x `Weapon Tuning` a 1x `Magazine Upgrade`:
  - levely se okamzite propisou do radku akce i do progression line nahore.
- V `Selected Detail` vyber modul a over:
  - je videt verdict `Net gain / Net neutral / Net loss` + `Net score`.
- V `Run/Status` over:
  - vidis `Primary/Secondary/Utility CD` + `Shield drain P/S/U`.

## 3) Balancing sanity check

- Zmeny cisel delat primarne v `js/balance-data.js`.
- Obsah mise/UFO/loot upravovat v `js/content-data.js`.
- Preset tuning delat v `js/balance-presets.js` a spoustet build s URL parametrem `?preset=arcade_fast`, `?preset=survival_hard` nebo `?preset=dev_fasttrack` (rychly debug pruchod).
- Nemenit core shared model pravidlo: akce spotrebovavaji energy i shield pool; bez shield cost akce neprojde.
- Po zmene spustit:
  - `node tools/combat-harness.js`
  - `node tools/validate-content-data.js` (pokud doslo ke zmene content/balance dat)
  - kratky manualni smoke check
