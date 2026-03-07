# Regression Checklist

Pouziti pred vetsim merge nebo balanc zmenou.

## 1) Automaticky smoke test (combat harness)

Spust:

```powershell
node tools/combat-harness.js
node tools/validate-content-data.js
```

Ocekavany vysledek:

- vsechny testy `PASS`
- finalni radek `Combat harness passed: X/X`
- finalni radek `Content validation passed.`

Kontrolovane oblasti:

- profile save/load roundtrip (localStorage)
- survive objective text po vyprseni casu
- primary archetypy (spread/rail/chain)
- set bonus tier aktivace (2/3 a 3/3)
- hangar input mapping (`Digit0`, `KeyR`)

## 2) Manualni herni smoke check (5-7 min)

- Start runu (`Enter`) bez chyb v konzoli.
- V hangaru:
  - `4` prepina primary, `5` secondary, `R` utility.
  - `8/9/0` funguje na vybrane polozce.
- Bekom runu:
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
- Po zmene spustit:
  - `node tools/combat-harness.js`
  - `node tools/validate-content-data.js`
  - kratky manualni smoke check
