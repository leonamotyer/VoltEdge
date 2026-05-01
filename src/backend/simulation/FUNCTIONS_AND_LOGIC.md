# Functions And Logic

This document explains the simulation package in detail.

## Module overview

### `simulation.dispatch`

Low-level dispatch functions live here. These functions operate on a dispatch dataframe and return annual summaries plus selected traces.

### `simulation.scenarios`

High-level scenario functions live here. These functions:

- validate configuration rows
- normalize inputs
- call the shared dispatch engine
- add finance calculations
- export flat CSV summaries

### `simulation.finance`

Contains simple CAPEX annualization helpers.

## Core dataframe inputs

Most dispatch functions expect a dataframe containing:

- `dt_h`
  Interval duration in hours.
  For 10-minute data this should be `1/6 = 0.166666...`.

- `e_curt_mwh`
  Curtailed energy available in that interval, in MWh.

- `pool_price`
  Optional.
  Needed when grid backup pricing is part of the simulation.

Optional site fields can exist alongside these columns without affecting the dispatch engine.

## Dispatch logic

The shared dispatch engine is `_dispatch_engine(...)` in `simulation/dispatch.py`.

It is the single source of truth for low-level dispatch behavior.

### Interval order

For each interval, the dispatch logic is:

1. Serve GPU demand directly from curtailed energy
2. Discharge the battery to serve remaining demand
3. Use external supply
   External supply can be grid, BTF, or both
4. Record unmet load
5. Charge the battery from leftover curtailed energy
6. Spill any remaining curtailed energy

This ordering is intentional:

- curtailed energy is the primary internal source
- battery discharge is used before external purchases
- charging only happens after serving the interval load

### Battery behavior

Battery variables:

- `batt_mwh`
  Energy capacity

- `batt_p_mw`
  Charge/discharge power cap

- `eta_c`
  Charge efficiency

- `eta_d`
  Discharge efficiency

State of charge is tracked in MWh.

Discharge rule:

- delivered energy to load is limited by:
  - remaining load
  - battery power cap over the interval
  - available state of charge after discharge efficiency

Charge rule:

- charging input is limited by:
  - leftover curtailed energy
  - battery power cap over the interval
  - remaining battery headroom adjusted by charge efficiency

### External supply behavior

External supply can come from:

- grid
- BTF

Ordering modes:

- `price`
  Choose the cheaper available external source first

- `grid_first`
  Always try grid before BTF

- `btf_first`
  Always try BTF before grid

Partial supply rules:

- if partial supply is allowed, the source can serve up to its interval cap
- if partial supply is not allowed, the source only serves if it can cover the whole remaining demand for that interval

Special case:

- `simulate_gpu_with_battery_grid_cap(...)` uses all-or-nothing grid behavior by design

## Low-level functions

### `simulate_gpu_absorption(df, gpu_mw, ...)`

Purpose:

- curtailment-only simulation
- no battery
- no grid
- no BTF

Behavior:

- GPU load is constant at `gpu_mw`
- demand per interval is `gpu_mw * dt_h`
- served energy is `min(e_curt_mwh, demand_mwh)`

Returns:

- annual demand
- annual served energy
- annual unmet energy
- annual spilled curtailment
- curtailment utilization
- coverage
- curtailment energy cost

### `simulate_gpu_with_battery(df, gpu_mw, batt_mwh, ...)`

Purpose:

- curtailment plus battery simulation
- no external backup

Behavior:

- curtailed energy serves demand first
- battery discharges next
- any remaining curtailed energy can charge the battery

Returns:

- all major annual KPIs
- `soc_trace`
- `served`
- energy-cost traces

### `simulate_gpu_with_battery_grid_cap(df, gpu_mw, batt_mwh, grid_cap_mw, ...)`

Purpose:

- curtailment plus battery plus capped grid backup

Behavior:

- direct curtailment
- battery discharge
- capped grid supply
- all-or-nothing grid logic for each interval

Returns:

- the same base dispatch KPIs
- annual grid use and cost
- grid trace arrays

### `simulate_gpu_with_battery_btf_grid_cap(...)`

Purpose:

- curtailment plus battery plus external backup from grid and/or BTF

Behavior:

- direct curtailment
- battery discharge
- external supply from grid and BTF using the selected ordering logic

Returns:

- annual grid and BTF usage
- annual grid and BTF costs
- optional BTF opportunity-loss output when both pool price and BTF price exist

## Scenario functions

### `validate_configuration_columns(configurations)`

Checks that a configuration dataframe includes all required configuration columns.

Use this before batch simulation if you want early failure for malformed CSVs.

### `load_pool_price_csv(csv_path, ...)`

Purpose:

- load raw pool-price CSV files
- detect common price and time columns
- normalize them to:
  - `pool_price`
  - `timestamp`

Important behavior:

- automatically detects header rows in files like the current AESO CSV
- if the source time column is hour-ending, the loader shifts it back one hour so the timestamp represents the start of the hour bucket

### `add_pool_price_data(dispatch_df, pool_price_data, ...)`

Purpose:

- attach market prices onto a dispatch dataframe

Supported modes:

- direct row-by-row assignment
- exact timestamp merge
- hourly bucket merge onto 10-minute site timestamps

This is what makes hourly AESO pool prices usable with 10-minute site data.

If `dispatch_time_col` is not passed, the function will try to auto-detect a recognized dispatch time column such as `timestamp`, `datetime`, or `date_time`.

### `load_site_csv(csv_path)`

Loads a normalized site CSV and parses the timestamp column.

### `extract_site_sheet_to_csv(xlsx_path, output_csv, ...)`

Purpose:

- convert a workbook-style 10-minute site sheet into a normalized simulation CSV

Current assumptions:

- source worksheet name defaults to `10 Min Data`
- header row defaults to row index `7`

Normalization includes:

- renaming `t_stamp` to `timestamp`
- renaming curtailment-loss MWh to `e_curt_mwh`
- adding `dt_h = 1/6`
- dropping unnamed workbook tail columns

### `simulate_configuration(dispatch_df, configuration, ...)`

Purpose:

- run one configuration row against one dispatch dataframe

What it does:

1. Normalizes the config row
2. Converts GPU count, power per GPU, and utilization into constant `gpu_mw`
3. Converts round-trip efficiency into symmetric `eta_c` and `eta_d`
4. Applies grid price override if provided
5. Applies price escalation as a per-run multiplier
6. Calls the shared dispatch engine
7. Adds finance outputs

Output includes:

- dispatch KPIs
- energy cost KPIs
- CAPEX and O&M summaries
- rental revenue estimate
- net annual value

### `simulate_configurations(dispatch_df, configurations, ...)`

Runs `simulate_configuration(...)` for each configuration row and returns a dataframe of results.

### `simulate_configurations_to_csv(dispatch_df, configurations, output_csv, ...)`

Runs batch simulation and writes a flat CSV.

Behavior:

- trace fields like `soc_trace` are removed before writing
- the returned dataframe matches the written flat CSV

## Configuration logic

GPU load is computed as:

```text
gpu_mw =
  number_of_gpus
  * power_per_gpu_kw
  * utilization_pct / 100
  / 1000
```

In code this is expressed as division by `100000` because:

- `power_per_gpu_kw` is already in kW
- utilization is a percent
- converting kW to MW requires dividing by `1000`

So:

```text
gpus * kW * percent / 100 / 1000 = gpus * kW * percent / 100000
```

Battery defaults:

- if battery is enabled
- and `battery_power_mw` is blank
- and `battery_size_mwh > 0`

then battery power defaults to battery energy capacity.

## Finance logic

Finance outputs are built in `_financials(...)`.

### Included CAPEX

- GPU purchase CAPEX
- deployment CAPEX
- battery energy CAPEX
- battery power-system CAPEX
- fixed GPU rack CAPEX
- fixed container CAPEX

### Fixed infrastructure assumptions

These are currently hardcoded and not user inputs:

- `8` GPUs per rack
- `12` racks per container
- `8,000 CAD` per rack
- `250,000 CAD` per container

The same defaults are mirrored in:

- `simulation/configs/global_defaults.yaml`

Derived outputs include:

- `gpu_rack_count`
- `gpu_container_count`
- `gpu_rack_capex`
- `gpu_container_capex`

### Annualization

CAPEX is annualized using the capital recovery factor:

```text
CRF = r(1+r)^n / ((1+r)^n - 1)
```

Where:

- `r` is discount rate
- `n` is asset life in years

### Revenue proxy

Annual rental revenue is:

```text
number_of_gpus
* rental_price_per_hour
* utilization_pct / 100
* total_hours
```

### Net value

Annual net value is:

```text
annual_rental_revenue - annual_total_cost
```

## Data files in this repo

### `simulation/data/sites/site1.csv`

Normalized 10-minute site file extracted from:

- `2024_Annual_10min_ES_Analysis_R4_1MW.xlsx`

### `simulation/data/pool_prices/AESO_PoolPrice_2024.csv`

Current pool-price file used for attaching hourly market prices to 10-minute site data.

## Recommended production usage

For batch runs:

1. `load_site_csv(...)`
2. `add_pool_price_data(...)`
3. `pd.read_csv(configuration_csv)`
4. `simulate_configurations_to_csv(...)`

For low-level validation or notebooks:

1. build a dataframe with `dt_h`, `e_curt_mwh`, and optionally `pool_price`
2. call a function from `simulation.dispatch`
