"""
Dispatch simulation and financial modeling.
Ported from mockup.py (lines 60-289).
"""
import math
from typing import Any
import numpy as np

# Constants from mockup.py
USD_TO_CAD = 1.38
GPUS_PER_RACK = 8
RACK_PRICE_CAD = 8_000 * USD_TO_CAD
BATT_COST_PER_KWH = 220 * USD_TO_CAD  # $/kWh
BATT_COST_PER_KW = 130 * USD_TO_CAD   # $/kW
FIXED_OM_FRAC = 0.05  # 5% of CAPEX/yr

GPU_SPECS = {
    "RTX 3090": {
        "power_kw": 0.350,
        "unit_price_cad": 900 * USD_TO_CAD,
        "rental_hr_cad": 0.13 * USD_TO_CAD,
        "label": "RTX 3090 (Entry / Inference)"
    },
    "RTX 5090": {
        "power_kw": 0.575,
        "unit_price_cad": 5_000,
        "rental_hr_cad": 0.37 * USD_TO_CAD,
        "label": "RTX 5090 (Mid-tier / AI)"
    },
    "A6000": {
        "power_kw": 0.300,
        "unit_price_cad": 6_000 * USD_TO_CAD,
        "rental_hr_cad": 0.37 * USD_TO_CAD,
        "label": "A6000 (Pro / Data Science)"
    },
    "PRO 6000": {
        "power_kw": 0.600,
        "unit_price_cad": 15_000,
        "rental_hr_cad": 0.80 * USD_TO_CAD,
        "label": "PRO 6000 (High-perf / LLM)"
    },
}


def run_dispatch(
    curtailed_mw: np.ndarray,
    pool_price: np.ndarray,
    dt_h: float,
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float,
    grid_cap_mw: float,
    btf_cap_mw: float,
    btf_price: float,
    curt_price: float,
    eta_c: float = 0.95,
    eta_d: float = 0.95,
) -> dict[str, Any]:
    """
    Dispatch simulation - battery storage with curtailed energy.
    
    Priority hierarchy:
    1. Curtailed wind → GPU load
    2. Battery discharge → GPU load
    3. BTF (Behind-the-Fence) → GPU load
    4. Grid → GPU load
    
    Battery charges from surplus curtailed energy.
    
    Args:
        curtailed_mw: Available curtailed power (MW) at each timestep
        pool_price: Pool price (CAD/MWh) at each timestep
        dt_h: Timestep duration (hours)
        gpu_mw: GPU load (MW)
        batt_mwh: Battery capacity (MWh)
        batt_p_mw: Battery power rating (MW)
        grid_cap_mw: Grid import capacity (MW)
        btf_cap_mw: BTF capacity (MW)
        btf_price: BTF price (CAD/MWh)
        curt_price: Curtailment purchase price (USD/MWh)
        eta_c: Charging efficiency (default 0.95)
        eta_d: Discharging efficiency (default 0.95)
    
    Returns:
        Dictionary with hourly arrays and summary statistics
    """
    n = len(curtailed_mw)
    soc = 0.0
    batt_p_mwh = batt_p_mw * dt_h
    demand_mwh = gpu_mw * dt_h
    
    # Output arrays
    direct_curt = np.zeros(n)
    batt_used = np.zeros(n)
    grid_used = np.zeros(n)
    btf_used = np.zeros(n)
    unmet = np.zeros(n)
    spilled = np.zeros(n)
    soc_arr = np.zeros(n)
    served = np.zeros(n, dtype=bool)
    
    for i in range(n):
        avail = curtailed_mw[i] * dt_h
        need = demand_mwh
        
        # 1) Curtailed wind
        u_c = min(avail, need)
        direct_curt[i] = u_c
        need -= u_c
        avail -= u_c
        
        # Charge battery with surplus
        head = max((batt_mwh - soc) / eta_c, 0.0)
        charge = min(avail, batt_p_mwh, head)
        soc += charge * eta_c
        spilled[i] = avail - charge
        
        # 2) Battery discharge
        if need > 0 and soc > 1e-9:
            u_b = min(soc * eta_d, batt_p_mwh, need)
            batt_used[i] = u_b
            soc -= u_b / eta_d
            need -= u_b
        
        # 3) BTF
        if need > 0 and btf_cap_mw > 0:
            u_btf = min(btf_cap_mw * dt_h, need)
            btf_used[i] = u_btf
            need -= u_btf
        
        # 4) Grid
        if need > 0 and grid_cap_mw > 0:
            u_g = min(grid_cap_mw * dt_h, need)
            grid_used[i] = u_g
            need -= u_g
        
        unmet[i] = max(need, 0.0)
        soc_arr[i] = soc
        served[i] = need < 1e-9
    
    total_demand = demand_mwh * n
    total_served = float(direct_curt.sum() + batt_used.sum() + grid_used.sum() + btf_used.sum())
    e_cost = float((grid_used * pool_price).sum()) + btf_used.sum() * btf_price + direct_curt.sum() * curt_price
    
    return {
        "full_supply_interval_share": float(served.mean()),
        "coverage_energy": total_served / total_demand if total_demand > 0 else 0.0,
        "annual_unmet_mwh": float(unmet.sum()),
        "annual_served_mwh": total_served,
        "annual_gpu_demand_mwh": total_demand,
        "annual_direct_curt_used_mwh": float(direct_curt.sum()),
        "annual_batt_used_mwh": float(batt_used.sum()),
        "annual_grid_used_mwh": float(grid_used.sum()),
        "annual_btf_used_mwh": float(btf_used.sum()),
        "annual_spilled_curt_mwh": float(spilled.sum()),
        "annual_grid_cost_$": float((grid_used * pool_price).sum()),
        "annual_btf_cost_$": float(btf_used.sum() * btf_price),
        "annual_curt_cost_$": float(direct_curt.sum() * curt_price),
        "annual_total_energy_cost_$": e_cost,
        "avg_energy_cost_$/mwh": e_cost / total_served if total_served > 0 else 0.0,
        "_soc": soc_arr,
        "_served": served.astype(int),
        "_unmet": unmet,
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
        unit_price_override: Custom GPU unit price (CAD) - overrides spec default
        rental_hr_override: Custom rental rate (CAD/hr) - overrides spec default

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

