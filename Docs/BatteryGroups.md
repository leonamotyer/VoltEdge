##source of truth do not change##

## 2. Battery Group

### Basic Settings (shown by default)

| Input | Type | Unit | Required | Description |
|---|---|---:|---|---|
| Include battery storage | Toggle | — | Yes | Enable or disable battery storage |
| Battery size | Number | MWh | If enabled | Total usable battery energy capacity |
| Battery power | Number | MW | Optional | Maximum charge/discharge rate |

---

### Advanced Settings (collapsed by default)

| Input | Type | Unit | Default | Description |
|---|---|---:|---:|---|
| Round-trip efficiency | Number | % | 90 | Overall battery efficiency |
| Battery energy cost | Number | CAD/kWh | Preset / internal default | Cost of storage capacity |
| Battery power-system cost | Number | CAD/kW | Preset / internal default | Cost of inverter / power equipment |
| Battery lifetime | Number | Years | 12 | Financial life of battery system |
| Fixed annual O&M | Number | CAD/year | 0 | Annual non-energy battery operating cost |

---

### Quick Presets (optional)

| Preset | Rule | Purpose |
|---|---|---|
| Small buffer | Battery size = 1–2 hours of compute load | Short-term smoothing |
| Medium buffer | Battery size = 4 hours of compute load | Daily shifting |
| Large buffer | Battery size = 8 hours of compute load | Deeper shifting / backup |
| Custom | User enters manually | Full control |

> Example: if total compute power is **10 MW**, then:
> - 2-hour battery = **20 MWh**
> - 4-hour battery = **40 MWh**
> - 8-hour battery = **80 MWh**

---

### Derived (python functions will be provided later)

| Metric | Formula |
|---|---|
| Battery duration (hours) | Battery size / Battery power |
| Starting battery energy (MWh) | Battery size × Starting battery level |
| Annualized battery CAPEX | Based on battery energy cost, battery power-system cost, discount rate, and battery lifetime |

---

### Interaction Rules

1. If **Include battery storage = Off**:
    - Hide all battery inputs
    - Ignore all battery-related calculations

2. If battery is enabled:
    - **Battery size** must be greater than 0
    - **Battery power** must be greater than 0 if entered

3. If **Battery power** is left blank:
    - Default to **total compute power**

4. **Round-trip efficiency** must be between **0% and 100%**

5. **Battery lifetime** must be greater than 0

6. **Battery energy cost**, **battery power-system cost**, and **Fixed annual O&M** must be greater than or equal to 0

7. Recommended guardrail:
    - Battery power should not exceed a reasonable multiple of total compute power unless advanced users explicitly override it

8. Battery sizing presets should use **total compute power** from the GPU group:
    - Battery size = Compute power × selected duration