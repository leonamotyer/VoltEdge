##source of truth do not change##

## 3. Electricity Supply & Prices

This group controls **how the system buys energy** and at what cost.

---

### Basic Settings (shown by default)

| Input | Type | Unit | Required | Description |
|---|---|---:|---|---|
| Grid power limit | Number | MW | Optional | Maximum grid power available; set to 0 to disable grid power |
| Grid price override | Number | CAD/MWh | Optional | Optional fixed grid price; if left blank, backend uses the pool price time series |
| BTF power limit | Number | MW | Optional | Maximum BTF power available; set to 0 to disable BTF power |
| BTF price | Number | CAD/MWh | If BTF enabled | Price of BTF electricity |
| Curtailment value | Number | CAD/MWh | Yes | Cost/value of curtailed energy |

---

### Advanced Settings (collapsed by default)

| Input | Type | Unit | Default | Description |
|---|---|---:|---:|---|
| Allow partial grid supply | Toggle | — | Off | If off, grid must fully cover remaining demand in each interval |
| Allow partial BTF supply | Toggle | — | On | Allow BTF to partially supply demand |
| Price escalation rate | Number | %/year | 0 | Optional annual price increase |
| Priority rule | Dropdown | — | Cheapest first | Order of using grid vs BTF power |

---

### Derived (to be used later, don't have to drive them now)

| Metric | Formula |
|---|---|
| Total available backup power (MW) | Grid power limit + BTF power limit |
| Energy cost | Sum of (energy used × price) across all sources |
| Weighted average electricity cost | Total energy cost / total energy consumed |

---

### Interaction Rules

1. **Grid power limit**:
   - If set to `0`, grid power is disabled
   - If greater than `0`, grid power is available up to that limit

2. **Grid price override**:
   - If left blank, backend uses the internal pool price time series
   - If provided, backend uses the fixed override instead of the pool price time series
   - Must be ≥ 0 if entered

3. **BTF power limit**:
   - If set to `0`, BTF power is disabled
   - If greater than `0`, BTF power is available up to that limit

4. **BTF price**:
   - Required if `BTF power limit > 0`
   - Ignored if `BTF power limit = 0`
   - Must be ≥ 0

5. **Curtailment value**:
   - Always required
   - Must be ≥ 0
   - Typically much lower than grid or BTF price

6. **Supply constraint rule (important)**:
   - At any time:  
     `Grid supply ≤ Grid power limit`  
     `BTF supply ≤ BTF power limit`

7. **System-level constraint (important)**:
   - Total supply used is bounded by demand:
     ```
     Curtailment + Battery discharge + Grid + BTF ≤ Compute power
     ```

8. **Recommended guardrail**:
   - If `Grid power limit + BTF power limit < Compute power`, the system may experience unmet demand
   - This should be allowed, but clearly surfaced to the user

9. **Price sanity check**:
   - All entered prices must be ≥ 0
   - If `BTF price` is consistently above grid price, BTF will rarely be used under a cheapest-first rule

---

### Design Principle

- Users only set:
  - **How much backup power is available**
  - **Whether to override the default grid price**
  - **What BTF costs**

- System decides:
  - **When each source is used**
  - **Based on cost and availability**