# Regression Checklist

Pouziti pred push do `main` a pred vetsi balanc/content zmenou.

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
- Mise `SURVIVE`:
  - po dobehnuti casu se ukazuje `Clear remaining threats: N`.
- Po game over + restart:
  - progression zustava (loadout/upgrades/inventory/equipment/salvage).
- HUD:
  - cooldowny a set status se aktualizuji korektne.

## 3) Balancing sanity check

- Zmeny cisel delat primarne v `js/balance-data.js`.
- Obsah mise/UFO/loot upravovat v `js/content-data.js`.
- Preset tuning delat v `js/balance-presets.js` a spoustet build s URL parametrem `?preset=arcade_fast`, `?preset=survival_hard` nebo `?preset=dev_fasttrack` (rychly debug pruchod).
- Nemenit core shared model pravidlo: akce spotrebovavaji energy i shield pool; bez shield cost akce neprojde.
- Po zmene spustit:
  - `node tools/combat-harness.js`
  - `node tools/validate-content-data.js` (pokud doslo ke zmene content/balance dat)
  - kratky manualni smoke check
