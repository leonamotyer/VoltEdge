# Simulation Backend

This `simulation/` folder is the backend simulation layer for VoltEdge.

Use it for customized inputs when:

- load normalized site data
- attach hourly pool prices
- run one or many GPU/power configurations
- write flat simulation summaries for downstream backend or API use

## Backend Entry Points

Import these from `simulation`:

- `load_site_csv(...)`
- `load_pool_price_csv(...)`
- `add_pool_price_data(...)`
- `simulate_configuration(...)`
- `simulate_configurations(...)`
- `simulate_configurations_to_csv(...)`

Core modules:

- `simulation/scenarios.py`
- `simulation/dispatch.py`
- `simulation/finance.py`

## Typical Backend Flow

```python
import pandas as pd

from simulation import (
    add_pool_price_data,
    load_site_csv,
    simulate_configurations_to_csv,
)

dispatch_df = load_site_csv("simulation/data/sites/site1.csv")

dispatch_df = add_pool_price_data(
    dispatch_df,
    "simulation/data/pool_prices/AESO_PoolPrice_2024.csv",
)

config_df = pd.read_csv("simulation/configs/configurations.csv")

results_df = simulate_configurations_to_csv(
    dispatch_df,
    config_df,
    "simulation/results/simulation_summary.csv",
)
```

## Required Dispatch Data

The simulation expects a dataframe with:

- `dt_h`
  Interval duration in hours. For 10-minute data this is typically `1/6`.
- `e_curt_mwh`
  Curtailed energy available in the interval.
- `timestamp`
  Recommended when attaching hourly pool prices.

Optional:

- `pool_price`
  Needed if grid pricing is part of the run.

`load_site_csv(...)` is the easiest way to load the normalized site files in `simulation/data/sites/`.

## Pool Price Handling

Use `add_pool_price_data(...)` to attach hourly pool prices to dispatch intervals.

Important behavior:

- AESO-style `Date (HE)` values are treated as hour-ending timestamps.
- The loader converts them to hour-start timestamps before merging.
- If the dispatch dataframe has a recognized time column such as `timestamp`, hourly prices are merged automatically by hour bucket.

Example:

```python
dispatch_df = add_pool_price_data(
    dispatch_df,
    "simulation/data/pool_prices/AESO_PoolPrice_2024.csv",
)
```

## Configuration CSV

Use `simulation/configs/configurations.csv` as the backend example input.

Required configuration columns:

- `configuration_name`
- `gpu_model`
- `number_of_gpus`
- `rental_price_per_hour`
- `power_per_gpu_kw`
- `utilization_pct`
- `gpu_purchase_cost`
- `system_lifetime_years`
- `discount_rate_pct`
- `fixed_annual_om`
- `deployment_cost`
- `include_battery`
- `battery_preset`
- `battery_size_mwh`
- `battery_power_mw`
- `round_trip_efficiency_pct`
- `battery_lifetime_years`
- `battery_energy_cost_per_kwh`
- `battery_power_system_cost_per_kw`
- `battery_annual_om`
- `grid_power_limit_mw`
- `grid_price_override_per_mwh`
- `btf_power_limit_mw`
- `btf_price_per_mwh`
- `curtailment_value_per_mwh`
- `allow_partial_grid_supply`
- `allow_partial_btf_supply`
- `price_escalation_rate_pct`
- `priority_rule`

## GPU Sizing Inputs

There are two supported ways to define GPU load:

1. Provide `number_of_gpus`
2. (default) Provide `target_gpu_mw` and leave `number_of_gpus` blank or `0`

If `target_gpu_mw` is provided, the simulator computes GPU count from:

```text
number_of_gpus = ceil(target_gpu_mw * 1000 / (power_per_gpu_kw * utilization_pct / 100))
```

Revenue uses:

```text
number_of_gpus * rental_price_per_hour * utilization_pct / 100 * total_hours
```

## Priority Rule

Valid `priority_rule` values:

- `curtailment_first`
  Use curtailment first, then choose between grid and BTF by lower price.
- `grid_first`
  Always try grid before BTF.
- `btf_first`
  Always try BTF before grid.
- (default) `balanced` 
  Compare curtailment, grid, and BTF prices each interval and dispatch the cheapest first.

## Output

`simulate_configurations_to_csv(...)` writes one flat row per configuration.

Common output fields include:

- `annual_served_mwh`
- `annual_unmet_mwh`
- `annual_grid_used_mwh`
- `annual_btf_used_mwh`
- `annual_total_energy_cost`
- `annual_total_cost`
- `annual_net_value`
- `annual_rental_revenue`
- `gpu_rack_count`
- `gpu_container_count`

Trace fields such as `soc_trace` are kept in memory for dataframe results, but dropped from CSV output.

## Demo Script

Use the demo generator if you want ready-made backend test inputs and outputs:

```bash
python simulation/scripts/generate_demo_configurations.py
```

It generates:

- `simulation/configs/demo_gpu_configurations.csv`
- `simulation/results/demo_gpu_results.csv`

The demo set includes:

- `RTX 3090`
- `RTX 5090`
- `PRO 6000`
- `A100`

Each with:

- one `1.0 MW` no-battery case
- one `1.0 MW` with-battery case

## Files Used By Backend

Recommended sample inputs:

- `simulation/data/sites/site1.csv`
- `simulation/data/pool_prices/AESO_PoolPrice_2024.csv`
- `simulation/configs/configurations.csv`

Reference defaults:

- `simulation/configs/global_defaults.yaml`

## Notes

- The finance layer includes fixed infrastructure assumptions for racks and containers.
- Those values are defined in code and mirrored in `simulation/configs/global_defaults.yaml`.

## More Detail

For function-by-function behavior and dispatch logic, see [FUNCTIONS_AND_LOGIC.md](FUNCTIONS_AND_LOGIC.md).
