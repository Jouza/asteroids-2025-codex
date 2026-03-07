# Regression Checklist

Pouziti pred vetsim merge nebo balanc zmenou.

## 1) Automaticky smoke test (combat harness)

Spust:

```powershell
node tools/combat-harness.js
```

Ocekavany vysledek:

- vsechny testy `PASS`
- finalni radek `Combat harness passed: X/X`

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
- Mise `SURVIVE`:
  - po dobehnuti casu se ukazuje `Clear remaining threats: N`.
- Po game over + restart:
  - progression zustava (loadout/upgrades/inventory/equipment/salvage).
- HUD:
  - cooldowny a set status se aktualizuji korektne.

## 3) Balancing sanity check

- Zmeny cisel delat primarne v `js/balance-data.js`.
- Po zmene spustit:
  - `node tools/combat-harness.js`
  - kratky manualni smoke check
