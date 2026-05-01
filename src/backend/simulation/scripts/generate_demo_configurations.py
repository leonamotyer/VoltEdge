from __future__ import annotations

import math
from pathlib import Path
import sys

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from simulation import (
    add_pool_price_data,
    load_site_csv,
    simulate_configurations_to_csv,
)


TARGET_GPU_MW = 1.0
UTILIZATION_PCT = 100.0
CONFIG_OUTPUT_PATH = ROOT_DIR / "simulation/configs/demo_gpu_configurations.csv"
RESULTS_OUTPUT_PATH = ROOT_DIR / "simulation/results/demo_gpu_results.csv"
SITE_DATA_PATH = ROOT_DIR / "simulation/data/sites/site1.csv"
POOL_PRICE_PATH = ROOT_DIR / "simulation/data/pool_prices/AESO_PoolPrice_2024.csv"

GPU_PRESETS = [
    {
        "gpu_model": "RTX 3090",
        "rental_price_per_hour": 0.25,
        "power_per_gpu_kw": 0.35,
        "gpu_purchase_cost": 1500.0,
    },
    {
        "gpu_model": "RTX 5090",
        "rental_price_per_hour": 0.75,
        "power_per_gpu_kw": 0.575,
        "gpu_purchase_cost": 2800.0,
    },
    {
        "gpu_model": "PRO 6000",
        "rental_price_per_hour": 0.60,
        "power_per_gpu_kw": 0.55,
        "gpu_purchase_cost": 3200.0,
    },
    {
        "gpu_model": "A100",
        "rental_price_per_hour": 0.45,
        "power_per_gpu_kw": 0.40,
        "gpu_purchase_cost": 12000.0,
    },
]

BATTERY_VARIANTS = [
    {
        "suffix": "no_battery",
        "include_battery": False,
        "battery_size_mwh": 0.0,
        "battery_power_mw": "",
        "battery_annual_om": 0.0,
    },
    {
        "suffix": "with_battery",
        "include_battery": True,
        "battery_size_mwh": 1.0,
        "battery_power_mw": 1.0,
        "battery_annual_om": 10000.0,
    },
]


def gpu_count_for_target_mw(
    target_gpu_mw: float,
    power_per_gpu_kw: float,
    utilization_pct: float,
) -> int:
    effective_kw_per_gpu = power_per_gpu_kw * (utilization_pct / 100.0)
    if effective_kw_per_gpu <= 0.0:
        raise ValueError("effective_kw_per_gpu must be positive")
    return int(math.ceil((target_gpu_mw * 1000.0) / effective_kw_per_gpu))


def build_demo_rows(
    *,
    target_gpu_mw: float = TARGET_GPU_MW,
    utilization_pct: float = UTILIZATION_PCT,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for preset in GPU_PRESETS:
        gpu_count = gpu_count_for_target_mw(
            target_gpu_mw,
            preset["power_per_gpu_kw"],
            utilization_pct,
        )
        for battery in BATTERY_VARIANTS:
            rows.append(
                {
                    "configuration_name": (
                        f"{preset['gpu_model'].lower().replace(' ', '_')}_{target_gpu_mw:.1f}mw_{battery['suffix']}"
                    ),
                    "gpu_model": preset["gpu_model"],
                    "target_gpu_mw": target_gpu_mw,
                    "number_of_gpus": gpu_count,
                    "rental_price_per_hour": preset["rental_price_per_hour"],
                    "power_per_gpu_kw": preset["power_per_gpu_kw"],
                    "utilization_pct": utilization_pct,
                    "gpu_purchase_cost": preset["gpu_purchase_cost"],
                    "system_lifetime_years": 10,
                    "discount_rate_pct": 8.0,
                    "fixed_annual_om": 1000.0,
                    "deployment_cost": 10000.0,
                    "include_battery": battery["include_battery"],
                    "battery_preset": "custom",
                    "battery_size_mwh": battery["battery_size_mwh"],
                    "battery_power_mw": battery["battery_power_mw"],
                    "round_trip_efficiency_pct": 90.0,
                    "battery_lifetime_years": 10,
                    "battery_energy_cost_per_kwh": 400.0,
                    "battery_power_system_cost_per_kw": 200.0,
                    "battery_annual_om": battery["battery_annual_om"],
                    "grid_power_limit_mw": TARGET_GPU_MW / 2,
                    "grid_price_override_per_mwh": "",
                    "btf_power_limit_mw": TARGET_GPU_MW / 2,
                    "btf_price_per_mwh": 45.0,
                    "curtailment_value_per_mwh": 25.0,
                    "allow_partial_grid_supply": True,
                    "allow_partial_btf_supply": True,
                    "price_escalation_rate_pct": 0.0,
                    "priority_rule": "balanced",
                }
            )
    return rows


def main() -> None:
    df = pd.DataFrame(build_demo_rows())
    CONFIG_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(CONFIG_OUTPUT_PATH, index=False)
    print(f"Wrote {len(df)} rows to {CONFIG_OUTPUT_PATH}")

    dispatch_df = load_site_csv(SITE_DATA_PATH)
    dispatch_df = add_pool_price_data(dispatch_df, POOL_PRICE_PATH)
    results_df = simulate_configurations_to_csv(
        dispatch_df,
        df,
        RESULTS_OUTPUT_PATH,
    )
    print(f"Wrote {len(results_df)} rows to {RESULTS_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
