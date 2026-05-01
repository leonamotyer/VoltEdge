"""
GPU configuration and CAPEX calculations.
"""
import math
from typing import Any

# Constants from dispatch.py
GPUS_PER_RACK = 8
RACK_PRICE_CAD = 8_000
BATT_COST_PER_KWH = 220
BATT_COST_PER_KW = 130
FIXED_OM_FRAC = 0.05

GPU_SPECS = {
    "RTX 3090": {
        "power_kw": 0.350,
        "unit_price_cad": 900,
        "rental_hr_cad": 0.13,
        "label": "RTX 3090 (Entry / Inference)"
    },
    "RTX 5090": {
        "power_kw": 0.575,
        "unit_price_cad": 5_000,
        "rental_hr_cad": 0.37,
        "label": "RTX 5090 (Mid-tier / AI)"
    },
    "A6000": {
        "power_kw": 0.300,
        "unit_price_cad": 6_000,
        "rental_hr_cad": 0.37,
        "label": "A6000 (Pro / Data Science)"
    },
    "PRO 6000": {
        "power_kw": 0.600,
        "unit_price_cad": 15_000,
        "rental_hr_cad": 0.80,
        "label": "PRO 6000 (High-perf / LLM)"
    },
}


def crf(r: float, n: int) -> float:
    """Capital Recovery Factor - annualize CAPEX."""
    return r * (1 + r)**n / ((1 + r)**n - 1) if r > 1e-9 else 1.0 / n


def compute_capex(
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float,
    gpu_type: str,
    discount_rate: float = 0.08,
    project_life: int = 12,
    unit_price_override: float | None = None,
    rental_hr_override: float | None = None,
) -> dict[str, Any]:
    """
    Calculate CAPEX for GPU + battery system.

    Args:
        gpu_mw: GPU electrical load (MW)
        batt_mwh: Battery energy capacity (MWh)
        batt_p_mw: Battery power rating (MW)
        gpu_type: GPU model key (from GPU_SPECS)
        discount_rate: Discount rate for CRF calculation
        project_life: Project lifetime (years)
        unit_price_override: Custom GPU unit price (CAD)
        rental_hr_override: Custom rental rate (CAD/hr)

    Returns:
        Dictionary with CAPEX breakdown and annualized values
    """
    spec = GPU_SPECS[gpu_type]
    n_gpus = max(1, int(gpu_mw * 1000 / spec["power_kw"]))
    n_racks = math.ceil(n_gpus / GPUS_PER_RACK)

    cap_batt_e = batt_mwh * 1000 * BATT_COST_PER_KWH
    cap_batt_p = batt_p_mw * 1000 * BATT_COST_PER_KW

    unit_price = unit_price_override if unit_price_override is not None else spec["unit_price_cad"]
    rental_hr = rental_hr_override if rental_hr_override is not None else spec["rental_hr_cad"]

    cap_gpu = n_gpus * unit_price
    cap_rack = n_racks * RACK_PRICE_CAD
    cap_total = cap_batt_e + cap_batt_p + cap_gpu + cap_rack

    ann_capex = cap_total * crf(discount_rate, project_life)
    fixed_om = cap_total * FIXED_OM_FRAC

    return {
        "n_gpus": n_gpus,
        "n_racks": n_racks,
        "capex_batt_energy_$": cap_batt_e,
        "capex_batt_power_$": cap_batt_p,
        "capex_gpu_$": cap_gpu,
        "capex_rack_$": cap_rack,
        "capex_total_$": cap_total,
        "annualized_capex_$": ann_capex,
        "annual_fixed_om_$": fixed_om,
        "annual_rental_price_$": n_gpus * rental_hr * 8760,
        "_unit_price_cad": unit_price,
        "_rental_hr_cad": rental_hr,
    }


def compute_financials(
    dispatch: dict[str, Any],
    capex: dict[str, Any],
    uptime_frac: float,
) -> dict[str, Any]:
    """
    Calculate financial metrics from dispatch and CAPEX results.

    Args:
        dispatch: Output from run_dispatch()
        capex: Output from compute_capex()
        uptime_frac: Fraction of time system is operational (0-1)

    Returns:
        Dictionary with revenue, costs, payback, ROI
    """
    rev = capex["annual_rental_price_$"] * uptime_frac
    e_cost = dispatch["annual_total_energy_cost_$"]
    ann_cap = capex["annualized_capex_$"]
    om = capex["annual_fixed_om_$"]
    total_c = e_cost + ann_cap + om
    net = rev - total_c
    served = dispatch["annual_served_mwh"]
    ann_cf = rev - e_cost - om
    payback = capex["capex_total_$"] / ann_cf if ann_cf > 0 else float("inf")
    roi = (net / capex["capex_total_$"]) * 100 if capex["capex_total_$"] > 0 else 0.0

    return {
        "annual_revenue_$": rev,
        "annual_energy_cost_$": e_cost,
        "annualized_capex_$": ann_cap,
        "annual_fixed_om_$": om,
        "annual_total_cost_$": total_c,
        "annual_net_profit_$": net,
        "payback_years": payback,
        "roi_%": roi,
        "net_profit_per_mwh_$": net / served if served > 0 else 0.0,
    }
