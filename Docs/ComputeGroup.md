##source of truth do not change##

## 1. GPU / Compute Group

### Basic Settings (shown by default)

| Input | Type | Unit | Required | Description |
|---|---|---:|---|---|
| GPU model | Dropdown | — | Yes | Select hardware type |
| Number of GPUs | Integer | GPUs | Yes | Size of deployment |
| Rental price | Number | CAD / GPU-hour | Yes | Expected earning per GPU |

---

### Advanced Settings (collapsed by default)

| Input | Type | Unit | Default Source | Description |
|---|---|---:|---|---|
| Power per GPU | Number | kW | From preset | Override hardware power |
| Utilization | Number | % | 85% | Expected usage rate |
| GPU purchase cost | Number | CAD / GPU | From preset | Hardware cost |
| System lifetime | Number | Years | 4–5 | Financial horizon |
| Discount rate | Number | % | 8% | Financial assumption |
| Fixed annual O&M | Number | CAD/year | 0 | Operating cost |
| Deployment cost | Number | CAD | 0 | Racks / infra |

---

### GPU Presets (auto-fill values)

| GPU model | Power (kW) | Default cost (CAD) | Notes |
|---|---:|---:|---|
| RTX 3090 | 0.35 | ~900 | Low-end |
| RTX 5090 | 0.58 | ~2000 | Mid-range |
| RTX A6000 | 0.30 | ~6000 | Pro |
| RTX Pro 6000 | 0.60 | ~8000 | Enterprise |
| Custom | — | — | User-defined |

---

### Derived (not user inputs)

| Metric | Formula |
|---|---|
| Total compute power (MW) | GPUs × Power per GPU / 1000 |
| Annual revenue | GPUs × Rental price × 8760 × Utilization |

---

### Interaction Rules

1. Selecting a GPU model:
    - Auto-fills **Power per GPU** and **GPU cost**
    - Unlocks editing only if "Custom" selected

2. Advanced settings:
    - Hidden by default
    - Expand via “Advanced settings”

3. Utilization:
    - Must be between 0–100%
    - Defaults to 85% (can tune later)

4. Rental price:
    - Primary revenue driver → must be visible

5. Total compute power:
    - **Not editable**
    - Used downstream by battery/grid sizing
