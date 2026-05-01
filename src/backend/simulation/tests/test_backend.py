from pathlib import Path
import sys

import pandas as pd
import pytest

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from simulation.dispatch import (
    simulate_gpu_absorption,
    simulate_gpu_with_battery_btf_grid_cap,
    simulate_gpu_with_battery_grid_cap,
)
from simulation.scenarios import simulate_configuration, simulate_configurations_to_csv
from simulation.scenarios import add_pool_price_data, load_pool_price_csv, load_site_csv
from simulation.scenarios import extract_site_sheet_to_csv


def test_absorption_costs():
    df = pd.DataFrame({"dt_h": [1.0, 1.0], "e_curt_mwh": [2.0, 0.0]})
    out = simulate_gpu_absorption(df, gpu_mw=1.0, curtailment_price_usd_per_mwh=25.0)
    assert out["annual_served_mwh"] == 1.0
    assert out["annual_curt_cost_$"] == 25.0


def test_grid_cap_all_or_nothing_behavior():
    df = pd.DataFrame({"dt_h": [1.0], "e_curt_mwh": [0.0], "pool_price": [10.0]})
    out = simulate_gpu_with_battery_grid_cap(
        df,
        gpu_mw=2.0,
        batt_mwh=0.0,
        batt_p_mw=0.0,
        grid_cap_mw=1.0,
    )
    assert out["annual_grid_used_mwh"] == 0.0
    assert out["annual_unmet_mwh"] == 2.0


def test_btf_dispatch_prefers_cheaper_supply():
    df = pd.DataFrame({"dt_h": [1.0], "e_curt_mwh": [0.0], "pool_price": [80.0]})
    out = simulate_gpu_with_battery_btf_grid_cap(
        df,
        gpu_mw=1.0,
        batt_mwh=0.0,
        batt_p_mw=0.0,
        grid_cap_mw=1.0,
        btf_cap_mw=1.0,
        btf_price=40.0,
    )
    assert out["annual_btf_used_mwh"] == 1.0
    assert out["annual_grid_used_mwh"] == 0.0


def test_configuration_simulation_and_csv():
    dispatch_df = pd.DataFrame(
        {
            "dt_h": [1.0, 1.0],
            "e_curt_mwh": [0.0, 1.0],
            "pool_price": [70.0, 70.0],
        }
    )
    config = {
        "configuration_name": "demo",
        "gpu_model": "RTX 5090",
        "target_gpu_mw": 1.0,
        "number_of_gpus": "",
        "rental_price_per_hour": 5.0,
        "power_per_gpu_kw": 1.0,
        "utilization_pct": 100.0,
        "gpu_purchase_cost": 2000.0,
        "system_lifetime_years": 10,
        "discount_rate_pct": 8.0,
        "fixed_annual_om": 1000.0,
        "deployment_cost": 10000.0,
        "include_battery": False,
        "battery_preset": "custom",
        "battery_size_mwh": 0.0,
        "battery_power_mw": "",
        "round_trip_efficiency_pct": 90.0,
        "battery_lifetime_years": 10,
        "battery_energy_cost_per_kwh": 400.0,
        "battery_power_system_cost_per_kw": 200.0,
        "battery_annual_om": 0.0,
        "grid_power_limit_mw": 2.0,
        "grid_price_override_per_mwh": "",
        "btf_power_limit_mw": 0.0,
        "btf_price_per_mwh": 45.0,
        "curtailment_value_per_mwh": 25.0,
        "allow_partial_grid_supply": True,
        "allow_partial_btf_supply": True,
        "price_escalation_rate_pct": 0.0,
        "priority_rule": "grid_first",
    }
    out = simulate_configuration(dispatch_df, config)
    assert out["number_of_gpus"] == 1000.0
    assert out["gpu_mw"] == 1.0
    assert out["annual_grid_used_mwh"] > 0.0

    output_path = Path("simulation/tests/results.csv")
    csv_out = simulate_configurations_to_csv(dispatch_df, [config], output_path)
    assert output_path.exists()
    assert "annual_total_energy_cost" in csv_out.columns
    output_path.unlink(missing_ok=True)


def test_configuration_supports_gpu_rental_price_alias():
    dispatch_df = pd.DataFrame(
        {
            "dt_h": [1.0],
            "e_curt_mwh": [0.0],
            "pool_price": [70.0],
        }
    )
    config = {
        "configuration_name": "alias-demo",
        "gpu_model": "A100",
        "target_gpu_mw": 1.0,
        "number_of_gpus": "",
        "rental_price_per_hour": "",
        "gpu_rental_price_per_hour": 6.5,
        "power_per_gpu_kw": 0.4,
        "utilization_pct": 100.0,
        "gpu_purchase_cost": 12000.0,
        "system_lifetime_years": 10,
        "discount_rate_pct": 8.0,
        "fixed_annual_om": 1000.0,
        "deployment_cost": 10000.0,
        "include_battery": False,
        "battery_preset": "custom",
        "battery_size_mwh": 0.0,
        "battery_power_mw": "",
        "round_trip_efficiency_pct": 90.0,
        "battery_lifetime_years": 10,
        "battery_energy_cost_per_kwh": 400.0,
        "battery_power_system_cost_per_kw": 200.0,
        "battery_annual_om": 0.0,
        "grid_power_limit_mw": 2.0,
        "grid_price_override_per_mwh": "",
        "btf_power_limit_mw": 0.0,
        "btf_price_per_mwh": 45.0,
        "curtailment_value_per_mwh": 25.0,
        "allow_partial_grid_supply": True,
        "allow_partial_btf_supply": True,
        "price_escalation_rate_pct": 0.0,
        "priority_rule": "grid_first",
    }

    out = simulate_configuration(dispatch_df, config)

    assert out["number_of_gpus"] == 2500.0
    assert out["annual_rental_revenue"] == 16250.0


def test_load_pool_price_csv_and_attach_by_order():
    price_path = Path("simulation/tests/pool_prices.csv")
    price_path.write_text('Pool Price\n\nDate (HE),Price ($)\n"01/01/2024 01","50.0"\n"01/01/2024 02","60.0"\n', encoding="utf-8")

    loaded = load_pool_price_csv(price_path)
    dispatch_df = pd.DataFrame({"dt_h": [1.0, 1.0], "e_curt_mwh": [0.0, 0.0]})
    merged = add_pool_price_data(dispatch_df, loaded)

    assert list(merged["pool_price"]) == [50.0, 60.0]
    price_path.unlink(missing_ok=True)


def test_load_pool_price_csv_detects_aeso_hour_ending_timestamp():
    price_path = Path("simulation/tests/aeso_pool_prices.csv")
    price_path.write_text(
        'Pool Price\n\n""\n\nDate (HE),Price ($),30Ravg ($),AIL Demand (MW)\n"01/01/2024 01","50.0","0","0"\n"01/01/2024 02","60.0","0","0"\n',
        encoding="utf-8",
    )

    loaded = load_pool_price_csv(price_path)

    assert list(loaded.columns) == ["pool_price", "timestamp"]
    assert list(loaded["pool_price"]) == [50.0, 60.0]
    assert loaded["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S").tolist() == [
        "2024-01-01 00:00:00",
        "2024-01-01 01:00:00",
    ]
    price_path.unlink(missing_ok=True)


def test_load_pool_price_csv_handles_hour_ending_24():
    price_path = Path("simulation/tests/aeso_pool_prices_he24.csv")
    price_path.write_text(
        'Pool Price\n\n""\n\nDate (HE),Price ($)\n"01/01/2024 23","50.0"\n"01/01/2024 24","60.0"\n"01/02/2024 01","70.0"\n',
        encoding="utf-8",
    )

    loaded = load_pool_price_csv(price_path)

    assert loaded["timestamp"].dt.strftime("%Y-%m-%d %H:%M:%S").tolist() == [
        "2024-01-01 22:00:00",
        "2024-01-01 23:00:00",
        "2024-01-02 00:00:00",
    ]
    price_path.unlink(missing_ok=True)


def test_attach_pool_price_by_timestamp():
    dispatch_df = pd.DataFrame(
        {
            "timestamp": ["2025-01-01 00:10:00", "2025-01-01 00:50:00"],
            "dt_h": [1.0 / 6.0, 1.0 / 6.0],
            "e_curt_mwh": [0.0, 0.0],
        }
    )
    pool_df = pd.DataFrame(
        {
            "timestamp": pd.to_datetime(["2025-01-01 00:00:00"]),
            "pool_price": [70.0],
        }
    )

    merged = add_pool_price_data(dispatch_df, pool_df, dispatch_time_col="timestamp")

    assert list(merged["pool_price"]) == [70.0, 70.0]


def test_attach_hourly_pool_price_auto_detects_timestamp():
    dispatch_df = pd.DataFrame(
        {
            "timestamp": ["2025-01-01 00:10:00", "2025-01-01 00:50:00", "2025-01-01 01:10:00"],
            "dt_h": [1.0 / 6.0, 1.0 / 6.0, 1.0 / 6.0],
            "e_curt_mwh": [0.0, 0.0, 0.0],
        }
    )
    pool_df = pd.DataFrame(
        {
            "timestamp": pd.to_datetime(["2025-01-01 00:00:00", "2025-01-01 01:00:00"]),
            "pool_price": [70.0, 80.0],
        }
    )

    merged = add_pool_price_data(dispatch_df, pool_df)

    assert list(merged["pool_price"]) == [70.0, 70.0, 80.0]


def test_extract_site_sheet_to_csv():
    pytest.importorskip("openpyxl")
    source = Path("simulation/tests/site_source.xlsx")
    output = Path("simulation/tests/site_output.csv")
    rows = [
        ["meta"],
        ["meta"],
        ["meta"],
        ["meta"],
        ["meta"],
        ["meta"],
        ["meta"],
        ["t_stamp", "Curtailment Potential Loss \n(MWh)", "Potential Production Quantity\n(MW)"],
        ["2024-01-01 00:00:00", 1.5, 10.0],
    ]
    pd.DataFrame(rows).to_excel(source, sheet_name="10 Min Data", header=False, index=False)

    out = extract_site_sheet_to_csv(source, output)

    assert output.exists()
    assert "timestamp" in out.columns
    assert "e_curt_mwh" in out.columns
    assert out.loc[out.index[0], "dt_h"] == 1.0 / 6.0
    source.unlink(missing_ok=True)
    output.unlink(missing_ok=True)


def test_sample_configuration_summary_has_no_blank_core_outputs():
    dispatch_df = load_site_csv("simulation/data/sites/site1.csv")
    dispatch_df = add_pool_price_data(dispatch_df, "simulation/data/pool_prices/AESO_PoolPrice_2024.csv")
    results = simulate_configurations_to_csv(
        dispatch_df,
        "simulation/configs/configurations.csv",
        "simulation/tests/sample_results.csv",
    )

    core_columns = [
        "annual_served_mwh",
        "annual_unmet_mwh",
        "coverage_energy",
        "annual_direct_curt_used_mwh",
        "annual_grid_used_mwh",
        "annual_total_energy_cost",
        "annual_total_cost",
        "annual_net_value",
    ]
    assert not results[core_columns].isna().any().any()
    Path("simulation/tests/sample_results.csv").unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__]))
