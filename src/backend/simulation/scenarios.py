from __future__ import annotations

import csv
import math
import re
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, TypeAlias

import numpy as np
import pandas as pd

from .dispatch import _dispatch_engine
from .finance import annualize_capex

ConfigurationRow: TypeAlias = Mapping[str, Any] | pd.Series
ConfigurationCollection: TypeAlias = pd.DataFrame | Sequence[Mapping[str, Any]]
SimulationSummary: TypeAlias = dict[str, Any]

REQUIRED_CONFIGURATION_COLUMNS: tuple[str, ...] = (
    "configuration_name",
    "gpu_model",
    "number_of_gpus",
    "rental_price_per_hour",
    "power_per_gpu_kw",
    "utilization_pct",
    "gpu_purchase_cost",
    "system_lifetime_years",
    "discount_rate_pct",
    "fixed_annual_om",
    "deployment_cost",
    "include_battery",
    "battery_preset",
    "battery_size_mwh",
    "battery_power_mw",
    "round_trip_efficiency_pct",
    "battery_lifetime_years",
    "battery_energy_cost_per_kwh",
    "battery_power_system_cost_per_kw",
    "battery_annual_om",
    "grid_power_limit_mw",
    "grid_price_override_per_mwh",
    "btf_power_limit_mw",
    "btf_price_per_mwh",
    "curtailment_value_per_mwh",
    "allow_partial_grid_supply",
    "allow_partial_btf_supply",
    "price_escalation_rate_pct",
    "priority_rule",
)

VALID_PRIORITY_RULES = {
    "curtailment_first",
    "grid_first",
    "btf_first",
    "balanced",
}

DATA_DIR = Path(__file__).resolve().parent / "data"
POOL_PRICE_DIR = DATA_DIR / "pool_prices"
SITE_DIR = DATA_DIR / "sites"

PRICE_COLUMN_CANDIDATES: tuple[str, ...] = (
    "pool_price",
    "pool price",
    "pool_price_per_mwh",
    "price",
    "spot_price",
    "market_price",
)

TIME_COLUMN_CANDIDATES: tuple[str, ...] = (
    "timestamp",
    "datetime",
    "date_time",
    "date",
    "datehe",
    "date_he",
    "datehourending",
    "datehourendinghe",
    "hourending",
    "he",
    "interval_start",
    "settlement_interval_start",
)

GPUS_PER_RACK = 8
RACKS_PER_CONTAINER = 12
RACK_COST = 8_000.0
CONTAINER_COST = 250_000.0


def _missing(value: Any) -> bool:
    return value is None or pd.isna(value) or value == ""


def _to_float(row: Mapping[str, Any], key: str, default: float = 0.0) -> float:
    value = row.get(key, default)
    return float(default if _missing(value) else value)


def _to_float_from_keys(row: Mapping[str, Any], keys: Sequence[str], default: float = 0.0) -> float:
    for key in keys:
        value = row.get(key)
        if not _missing(value):
            return float(value)
    return float(default)


def _to_optional_float(row: Mapping[str, Any], key: str) -> float | None:
    value = row.get(key)
    return None if _missing(value) else float(value)


def _to_int(row: Mapping[str, Any], key: str, default: int = 0) -> int:
    value = row.get(key, default)
    return int(default if _missing(value) else value)


def _to_bool(row: Mapping[str, Any], key: str, default: bool = False) -> bool:
    value = row.get(key, default)
    if isinstance(value, bool):
        return value
    if _missing(value):
        return default
    normalized = str(value).strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    raise ValueError(f"Invalid boolean value for {key}: {value!r}")


def _normalize_name(name: str) -> str:
    return "".join(ch for ch in str(name).strip().lower() if ch.isalnum())


def _find_column(columns: Sequence[str], candidates: Sequence[str]) -> str | None:
    normalized = {_normalize_name(col): col for col in columns}
    for candidate in candidates:
        match = normalized.get(_normalize_name(candidate))
        if match is not None:
            return match
    for normalized_name, original_name in normalized.items():
        if (
            "date" in normalized_name
            and "he" in normalized_name
        ) or "hourending" in normalized_name:
            return original_name
    return None


def _detect_csv_header_row(csv_path: str | Path, candidates: Sequence[str]) -> int:
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.reader(handle)
        for index, row in enumerate(reader):
            if not row:
                continue
            normalized_row = [_normalize_name(cell) for cell in row if str(cell).strip()]
            normalized_set = set(normalized_row)
            has_candidate = any(_normalize_name(candidate) in normalized_set for candidate in candidates)
            has_multiple_fields = len(normalized_row) >= 2
            if has_candidate and has_multiple_fields:
                return index
    return 0


def _parse_hour_ending_timestamps(values: pd.Series) -> pd.Series:
    parsed = pd.to_datetime(values, errors="coerce")
    if not parsed.isna().any():
        return parsed

    raw_values = values.astype(str).str.strip()
    he24_mask = parsed.isna() & raw_values.str.match(r"^\d{1,2}/\d{1,2}/\d{4}\s+24$", na=False)
    if he24_mask.any():
        base_dates = pd.to_datetime(
            raw_values[he24_mask].str.replace(r"\s+24$", " 00", regex=True),
            format="%m/%d/%Y %H",
            errors="coerce",
        )
        parsed.loc[he24_mask] = base_dates + pd.Timedelta(days=1)

    return parsed


def validate_configuration_columns(configurations: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_CONFIGURATION_COLUMNS if col not in configurations.columns]
    if missing:
        raise ValueError(f"Missing required configuration columns: {missing}")


def load_pool_price_csv(
    csv_path: str | Path,
    *,
    price_col: str | None = None,
    time_col: str | None = None,
    skiprows: int | None = None,
    output_price_col: str = "pool_price",
    output_time_col: str = "timestamp",
) -> pd.DataFrame:
    resolved_skiprows = (
        _detect_csv_header_row(csv_path, (*PRICE_COLUMN_CANDIDATES, *TIME_COLUMN_CANDIDATES))
        if skiprows is None
        else skiprows
    )
    pool_df = pd.read_csv(csv_path, skiprows=resolved_skiprows)

    resolved_price_col = price_col or _find_column(pool_df.columns, PRICE_COLUMN_CANDIDATES)
    if resolved_price_col is None:
        raise ValueError(
            "Could not find a pool price column. Pass price_col explicitly."
        )

    resolved_time_col = time_col or _find_column(pool_df.columns, TIME_COLUMN_CANDIDATES)
    result = pd.DataFrame({output_price_col: pd.to_numeric(pool_df[resolved_price_col], errors="coerce")})

    if resolved_time_col is not None:
        timestamps = _parse_hour_ending_timestamps(pool_df[resolved_time_col])
        lowered = _normalize_name(resolved_time_col)
        if "he" in lowered or "hourending" in lowered:
            timestamps = timestamps - pd.Timedelta(hours=1)
        result[output_time_col] = timestamps

    return result


def add_pool_price_data(
    dispatch_df: pd.DataFrame,
    pool_price_data: pd.DataFrame | str | Path,
    *,
    dispatch_time_col: str | None = None,
    pool_time_col: str = "timestamp",
    pool_price_col: str = "pool_price",
    output_price_col: str = "pool_price",
    price_col: str | None = None,
    time_col: str | None = None,
    skiprows: int | None = None,
) -> pd.DataFrame:
    pool_df = (
        load_pool_price_csv(
            pool_price_data,
            price_col=price_col,
            time_col=time_col,
            skiprows=skiprows,
            output_price_col=pool_price_col,
            output_time_col=pool_time_col,
        )
        if isinstance(pool_price_data, (str, Path))
        else pool_price_data.copy()
    )

    result = dispatch_df.copy()
    resolved_dispatch_time_col = dispatch_time_col or _find_column(result.columns, TIME_COLUMN_CANDIDATES)

    if resolved_dispatch_time_col and pool_time_col in pool_df.columns:
        left = result.copy()
        right = pool_df[[pool_time_col, pool_price_col]].copy()
        left[resolved_dispatch_time_col] = pd.to_datetime(left[resolved_dispatch_time_col], errors="coerce")
        right[pool_time_col] = pd.to_datetime(right[pool_time_col], errors="coerce")
        if len(left) == len(right) and left[resolved_dispatch_time_col].equals(right[pool_time_col]):
            merged = left.merge(
                right,
                left_on=resolved_dispatch_time_col,
                right_on=pool_time_col,
                how="left",
            )
        else:
            left["__hour_bucket__"] = left[resolved_dispatch_time_col].dt.floor("h")
            right["__hour_bucket__"] = right[pool_time_col].dt.floor("h")
            merged = left.merge(
                right[["__hour_bucket__", pool_price_col]],
                on="__hour_bucket__",
                how="left",
            )
        merged[output_price_col] = merged[pool_price_col]
        drop_columns = ["__hour_bucket__"]
        if pool_time_col != resolved_dispatch_time_col:
            drop_columns.append(pool_time_col)
        return merged.drop(columns=drop_columns, errors="ignore")

    if len(pool_df) != len(result):
        raise ValueError(
            "Pool price rows do not match dispatch rows. "
            "Provide matching timestamps, include a timestamp column, or use equal-length data."
        )

    result[output_price_col] = pd.to_numeric(pool_df[pool_price_col], errors="coerce").to_numpy()
    return result


def load_site_csv(
    csv_path: str | Path,
    *,
    timestamp_col: str = "timestamp",
) -> pd.DataFrame:
    site_df = pd.read_csv(csv_path)
    if timestamp_col in site_df.columns:
        site_df[timestamp_col] = pd.to_datetime(site_df[timestamp_col], errors="coerce")
    if "e_curt_mwh" in site_df.columns:
        site_df["e_curt_mwh"] = pd.to_numeric(site_df["e_curt_mwh"], errors="coerce").fillna(0.0)
    if "dt_h" in site_df.columns:
        site_df["dt_h"] = pd.to_numeric(site_df["dt_h"], errors="coerce")
    return site_df


def extract_site_sheet_to_csv(
    xlsx_path: str | Path,
    output_csv: str | Path,
    *,
    sheet_name: str = "10 Min Data",
    header_row: int = 7,
) -> pd.DataFrame:
    raw = pd.read_excel(xlsx_path, sheet_name=sheet_name, header=None)
    columns = [str(value).strip() if not pd.isna(value) else f"unnamed_{idx}" for idx, value in enumerate(raw.iloc[header_row])]
    site_df = raw.iloc[header_row + 1 :].copy()
    site_df.columns = columns
    site_df = site_df.dropna(how="all")

    rename_map = {
        "t_stamp": "timestamp",
        "AESO DNP FACILITY LIMIT": "aeso_dnp_facility_limit_mw",
        "Potential Production Quantity\n(MW)": "potential_production_mw",
        "Curtailed Production Qty\n(MW)": "curtailed_production_mw",
        "Generated Energy\n(MWh)": "generated_energy_mwh",
        "Curtailment Potential Loss \n(MWh)": "e_curt_mwh",
        "Curtailment Start Time": "curtailment_start_time",
        "Curtailment Event\n(min)": "curtailment_event_min",
        "Load Power Direct Use\n(MW)": "load_power_direct_use_mw",
        "Load Energy Direct Use\n(MWh)": "load_energy_direct_use_mwh",
        "Storage Charge\n(MW)": "storage_charge_mw",
        "Stored Energy\n(MWh)": "stored_energy_mwh",
        "Storage Discharged Energy (MWh)": "storage_discharged_energy_mwh",
        "Storage Discharge (MW)": "storage_discharge_mw",
        "Back-up Grid Supply \n(w/ VoltEdge)\n(MWh)": "backup_grid_supply_mwh",
        "Total VoltEdge Consumption\n(MWh)": "total_voltedge_consumption_mwh",
        "Direct Use Charges\n(w/ VoltEdge)": "direct_use_charges",
        "Back-up Grid Supply Charges\n(w/ VoltEdge)": "backup_grid_supply_charges",
        "Total Power Charge\n(w/ VoltEdge)": "total_power_charge",
        "Grid Supply Charges\n(Market)": "grid_supply_charges_market",
        "Curtailment Event Energy (MWh)": "curtailment_event_energy_mwh",
        "Total Curtailment Event Duration \n(min)": "total_curtailment_event_duration_min",
        "Last Curtailment Event End": "last_curtailment_event_end",
        "Time Between Curtailments (days)": "time_between_curtailments_days",
    }
    site_df = site_df.rename(columns=rename_map)

    if "timestamp" in site_df.columns:
        site_df["timestamp"] = pd.to_datetime(site_df["timestamp"], errors="coerce")
        site_df = site_df[site_df["timestamp"].notna()].copy()

    numeric_candidates = [
        "Day",
        "Hour",
        "Minute",
        "aeso_dnp_facility_limit_mw",
        "potential_production_mw",
        "curtailed_production_mw",
        "generated_energy_mwh",
        "e_curt_mwh",
        "curtailment_event_min",
        "load_power_direct_use_mw",
        "load_energy_direct_use_mwh",
        "storage_charge_mw",
        "stored_energy_mwh",
        "storage_discharged_energy_mwh",
        "storage_discharge_mw",
        "backup_grid_supply_mwh",
        "total_voltedge_consumption_mwh",
        "direct_use_charges",
        "backup_grid_supply_charges",
        "total_power_charge",
        "grid_supply_charges_market",
        "curtailment_event_energy_mwh",
        "total_curtailment_event_duration_min",
        "time_between_curtailments_days",
    ]
    for column in numeric_candidates:
        if column in site_df.columns:
            site_df[column] = pd.to_numeric(site_df[column], errors="coerce")

    site_df["dt_h"] = 1.0 / 6.0
    drop_columns = [column for column in site_df.columns if column.startswith("unnamed_")]
    if drop_columns:
        site_df = site_df.drop(columns=drop_columns)

    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    site_df.to_csv(output_path, index=False)
    return site_df


def list_available_pool_price_files() -> list[Path]:
    return sorted(POOL_PRICE_DIR.glob("*.csv"))


def list_available_site_files() -> list[Path]:
    return sorted(SITE_DIR.glob("*.csv"))


def _gpu_count_for_target_mw(
    target_gpu_mw: float,
    power_per_gpu_kw: float,
    utilization_pct: float,
) -> int:
    effective_kw_per_gpu = float(power_per_gpu_kw) * float(utilization_pct) / 100.0
    if effective_kw_per_gpu <= 0.0:
        raise ValueError("power_per_gpu_kw and utilization_pct must produce a positive effective GPU load")
    return int(math.ceil(float(target_gpu_mw) * 1000.0 / effective_kw_per_gpu))


def _normalize_config(row: ConfigurationRow) -> dict[str, Any]:
    power_per_gpu_kw = _to_float(row, "power_per_gpu_kw")
    utilization_pct = _to_float(row, "utilization_pct")
    target_gpu_mw = _to_optional_float(row, "target_gpu_mw")
    number_of_gpus = _to_int(row, "number_of_gpus")
    if target_gpu_mw is not None and target_gpu_mw > 0.0 and number_of_gpus <= 0:
        number_of_gpus = _gpu_count_for_target_mw(
            target_gpu_mw,
            power_per_gpu_kw,
            utilization_pct,
        )

    include_battery = _to_bool(row, "include_battery")
    batt_mwh = _to_float(row, "battery_size_mwh")
    batt_p_mw = _to_optional_float(row, "battery_power_mw")
    if include_battery and batt_mwh > 0.0 and batt_p_mw is None:
        batt_p_mw = batt_mwh
    if not include_battery or batt_mwh <= 0.0:
        batt_mwh = 0.0
        batt_p_mw = 0.0

    priority_rule = str(row.get("priority_rule", "curtailment_first")).strip() or "curtailment_first"
    if priority_rule not in VALID_PRIORITY_RULES:
        raise ValueError(f"Invalid priority_rule: {priority_rule!r}")

    return {
        "configuration_name": str(row.get("configuration_name", "")).strip(),
        "gpu_model": str(row.get("gpu_model", "")).strip(),
        "target_gpu_mw": target_gpu_mw,
        "number_of_gpus": number_of_gpus,
        "rental_price_per_hour": _to_float_from_keys(
            row,
            ("rental_price_per_hour", "gpu_rental_price_per_hour"),
        ),
        "power_per_gpu_kw": power_per_gpu_kw,
        "utilization_pct": utilization_pct,
        "gpu_purchase_cost": _to_float(row, "gpu_purchase_cost"),
        "system_lifetime_years": max(_to_int(row, "system_lifetime_years", 1), 1),
        "discount_rate_pct": _to_float(row, "discount_rate_pct"),
        "fixed_annual_om": _to_float(row, "fixed_annual_om"),
        "deployment_cost": _to_float(row, "deployment_cost"),
        "include_battery": include_battery,
        "battery_preset": str(row.get("battery_preset", "")).strip(),
        "battery_size_mwh": batt_mwh,
        "battery_power_mw": float(batt_p_mw or 0.0),
        "round_trip_efficiency_pct": _to_float(row, "round_trip_efficiency_pct", 100.0),
        "battery_lifetime_years": max(_to_int(row, "battery_lifetime_years", 1), 1),
        "battery_energy_cost_per_kwh": _to_float(row, "battery_energy_cost_per_kwh"),
        "battery_power_system_cost_per_kw": _to_float(row, "battery_power_system_cost_per_kw"),
        "battery_annual_om": _to_float(row, "battery_annual_om"),
        "grid_power_limit_mw": _to_float(row, "grid_power_limit_mw"),
        "grid_price_override_per_mwh": _to_optional_float(row, "grid_price_override_per_mwh"),
        "btf_power_limit_mw": _to_float(row, "btf_power_limit_mw"),
        "btf_price_per_mwh": _to_float(row, "btf_price_per_mwh"),
        "curtailment_value_per_mwh": _to_float(row, "curtailment_value_per_mwh", 25.0),
        "allow_partial_grid_supply": _to_bool(row, "allow_partial_grid_supply", True),
        "allow_partial_btf_supply": _to_bool(row, "allow_partial_btf_supply", True),
        "price_escalation_rate_pct": _to_float(row, "price_escalation_rate_pct"),
        "priority_rule": priority_rule,
    }


def _battery_efficiencies(round_trip_efficiency_pct: float) -> tuple[float, float]:
    rte = np.clip(float(round_trip_efficiency_pct) / 100.0, 0.0, 1.0)
    eta = float(np.sqrt(rte))
    return eta, eta


def _priority_order(config: Mapping[str, Any], pool_price: float) -> list[str]:
    grid_cap = float(config["grid_power_limit_mw"])
    btf_cap = float(config["btf_power_limit_mw"])
    grid_enabled = grid_cap > 0.0 and np.isfinite(pool_price)
    btf_enabled = btf_cap > 0.0
    rule = str(config["priority_rule"])

    if rule == "grid_first":
        return ["grid", "btf", "curtailment"]
    if rule == "btf_first":
        return ["btf", "grid", "curtailment"]
    if rule == "balanced":
        options: list[tuple[str, float]] = [("curtailment", float(config["curtailment_value_per_mwh"]))]
        if grid_enabled:
            options.append(("grid", float(pool_price)))
        if btf_enabled:
            options.append(("btf", float(config["btf_price_per_mwh"])))
        options.sort(key=lambda item: item[1])
        return [name for name, _ in options]

    order = ["curtailment"]
    external: list[tuple[str, float]] = []
    if grid_enabled:
        external.append(("grid", float(pool_price)))
    if btf_enabled:
        external.append(("btf", float(config["btf_price_per_mwh"])))
    external.sort(key=lambda item: item[1])
    order.extend(name for name, _ in external)
    return order


def _take_power(remaining: float, cap: float, allow_partial: bool) -> float:
    if remaining <= 0.0 or cap <= 0.0:
        return 0.0
    if allow_partial:
        return min(remaining, cap)
    return remaining if remaining <= cap else 0.0


def _financials(config: Mapping[str, Any], hours: float, served_mwh: float, energy_cost: float) -> dict[str, float]:
    gpu_count = int(config["number_of_gpus"])
    rack_count = int(math.ceil(gpu_count / GPUS_PER_RACK)) if gpu_count > 0 else 0
    container_count = int(math.ceil(rack_count / RACKS_PER_CONTAINER)) if rack_count > 0 else 0

    gpu_capex = float(gpu_count) * float(config["gpu_purchase_cost"])
    rack_capex = float(rack_count) * RACK_COST
    container_capex = float(container_count) * CONTAINER_COST
    deployment_capex = float(config["deployment_cost"])
    battery_energy_capex = float(config["battery_size_mwh"]) * 1000.0 * float(config["battery_energy_cost_per_kwh"])
    battery_power_capex = float(config["battery_power_mw"]) * 1000.0 * float(config["battery_power_system_cost_per_kw"])

    discount_rate = float(config["discount_rate_pct"]) / 100.0
    annualized_gpu_capex = annualize_capex(
        gpu_capex + rack_capex + container_capex + deployment_capex,
        discount_rate,
        int(config["system_lifetime_years"]),
    )
    annualized_battery_capex = annualize_capex(
        battery_energy_capex + battery_power_capex,
        discount_rate,
        int(config["battery_lifetime_years"]),
    )
    annual_om = float(config["fixed_annual_om"]) + float(config["battery_annual_om"])
    annual_revenue = (
        float(config["number_of_gpus"])
        * float(config["rental_price_per_hour"])
        * float(config["utilization_pct"])
        / 100.0
        * float(hours)
    )
    total_cost = float(energy_cost) + annualized_gpu_capex + annualized_battery_capex + annual_om
    return {
        "gpu_rack_count": float(rack_count),
        "gpu_container_count": float(container_count),
        "gpu_rack_capex": float(rack_capex),
        "gpu_container_capex": float(container_capex),
        "annual_gpu_capex": float(gpu_capex + rack_capex + container_capex + deployment_capex),
        "annual_battery_capex": float(battery_energy_capex + battery_power_capex),
        "annualized_gpu_capex": float(annualized_gpu_capex),
        "annualized_battery_capex": float(annualized_battery_capex),
        "annual_fixed_om": float(annual_om),
        "annual_rental_revenue": float(annual_revenue),
        "annual_total_cost": float(total_cost),
        "annual_net_value": float(annual_revenue - total_cost),
        "avg_total_cost_per_mwh_served": float(total_cost / served_mwh) if served_mwh > 0.0 else np.nan,
    }


def simulate_configuration(
    dispatch_df: pd.DataFrame,
    configuration: ConfigurationRow,
    *,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    pool_price_col: str = "pool_price",
) -> SimulationSummary:
    config = _normalize_config(configuration)

    dt = dispatch_df[dt_col].to_numpy(dtype=float)

    gpu_mw = (
        float(config["number_of_gpus"])
        * float(config["power_per_gpu_kw"])
        * float(config["utilization_pct"])
        / 100000.0
    )
    batt_mwh = float(config["battery_size_mwh"])
    batt_p_mw = float(config["battery_power_mw"])
    eta_c, eta_d = _battery_efficiencies(float(config["round_trip_efficiency_pct"]))
    escalation = 1.0 + float(config["price_escalation_rate_pct"]) / 100.0
    working_df = dispatch_df.copy()
    if config["grid_price_override_per_mwh"] is not None:
        working_df[pool_price_col] = float(config["grid_price_override_per_mwh"])
    elif pool_price_col in working_df.columns:
        working_df[pool_price_col] = pd.to_numeric(working_df[pool_price_col], errors="coerce")
    else:
        working_df[pool_price_col] = np.nan

    if pool_price_col in working_df.columns:
        working_df[pool_price_col] = working_df[pool_price_col] * escalation

    dispatch_result = _dispatch_engine(
        working_df,
        gpu_mw=gpu_mw,
        batt_mwh=batt_mwh,
        batt_p_mw=batt_p_mw,
        grid_cap_mw=float(config["grid_power_limit_mw"]),
        btf_cap_mw=float(config["btf_power_limit_mw"]),
        btf_price=float(config["btf_price_per_mwh"]) * escalation,
        eta_c=eta_c,
        eta_d=eta_d,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        grid_price_col=pool_price_col,
        curtailment_price_per_mwh=float(config["curtailment_value_per_mwh"]) * escalation,
        allow_partial_grid=bool(config["allow_partial_grid_supply"]),
        allow_partial_btf=bool(config["allow_partial_btf_supply"]),
        external_order=(
            "grid_first"
            if config["priority_rule"] == "grid_first"
            else "btf_first"
            if config["priority_rule"] == "btf_first"
            else "price"
        ),
    )

    annual_served = float(dispatch_result["annual_served_mwh"])
    annual_demand = float(dispatch_result["annual_gpu_demand_mwh"])
    annual_energy_cost = float(dispatch_result["annual_total_energy_cost_$"])

    result = {
        "configuration_name": config["configuration_name"],
        "gpu_model": config["gpu_model"],
        "priority_rule": config["priority_rule"],
        "target_gpu_mw": float(config["target_gpu_mw"]) if config["target_gpu_mw"] is not None else np.nan,
        "number_of_gpus": float(config["number_of_gpus"]),
        "gpu_mw": float(gpu_mw),
        "batt_mwh": float(batt_mwh),
        "batt_p_mw": float(batt_p_mw),
        "grid_cap_mw": float(config["grid_power_limit_mw"]),
        "btf_cap_mw": float(config["btf_power_limit_mw"]),
        "curtailment_price_per_mwh": float(config["curtailment_value_per_mwh"]),
        "btf_price_per_mwh": float(config["btf_price_per_mwh"]),
        "annual_gpu_demand_mwh": annual_demand,
        "annual_served_mwh": annual_served,
        "annual_unmet_mwh": float(dispatch_result["annual_unmet_mwh"]),
        "coverage_energy": float(dispatch_result["coverage_energy"]),
        "full_supply_interval_share": float(dispatch_result["full_supply_interval_share"]),
        "any_supply_interval_share": float(dispatch_result["any_supply_interval_share"]),
        "annual_direct_curt_used_mwh": float(dispatch_result["annual_direct_curt_used_mwh"]),
        "annual_batt_used_mwh": float(dispatch_result["annual_batt_used_mwh"]),
        "annual_grid_used_mwh": float(dispatch_result["annual_grid_used_mwh"]),
        "annual_btf_used_mwh": float(dispatch_result["annual_btf_used_mwh"]),
        "annual_spilled_curt_mwh": float(dispatch_result["annual_spilled_curt_mwh"]),
        "annual_curt_cost": float(dispatch_result["annual_curt_cost_$"]),
        "annual_grid_cost": float(dispatch_result.get("annual_grid_cost_$", 0.0)),
        "annual_btf_cost": float(dispatch_result.get("annual_btf_cost_$", 0.0)),
        "annual_total_energy_cost": annual_energy_cost,
        "avg_energy_cost_per_mwh_served": float(annual_energy_cost / annual_served) if annual_served > 0.0 else np.nan,
        "soc_trace": dispatch_result["soc_trace"],
    }
    result.update(_financials(config, float(dt.sum()), annual_served, annual_energy_cost))
    return result


def simulate_configurations(
    dispatch_df: pd.DataFrame,
    configurations: ConfigurationCollection,
    *,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    pool_price_col: str = "pool_price",
) -> pd.DataFrame:
    config_df = configurations if isinstance(configurations, pd.DataFrame) else pd.DataFrame(configurations)
    validate_configuration_columns(config_df)
    rows = [
        simulate_configuration(
            dispatch_df,
            row,
            curt_energy_col=curt_energy_col,
            dt_col=dt_col,
            pool_price_col=pool_price_col,
        )
        for row in config_df.to_dict(orient="records")
    ]
    return pd.DataFrame(rows)


def simulate_configurations_to_csv(
    dispatch_df: pd.DataFrame,
    configurations: ConfigurationCollection | str | Path,
    output_csv: str | Path,
    *,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    pool_price_col: str = "pool_price",
) -> pd.DataFrame:
    config_df = pd.read_csv(configurations) if isinstance(configurations, (str, Path)) else pd.DataFrame(configurations)
    results = simulate_configurations(
        dispatch_df,
        config_df,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        pool_price_col=pool_price_col,
    )
    output_path = Path(output_csv)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    flat_results = results.drop(columns=["soc_trace"], errors="ignore")
    flat_results.to_csv(output_path, index=False)
    return flat_results
