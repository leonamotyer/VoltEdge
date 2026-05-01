"""
Dispatch simulation and financial modeling.
Pure numpy operations for battery + GPU energy dispatch optimization.
"""
import math
from typing import Any
import numpy as np

# Constants - All values in CAD
GPUS_PER_RACK = 8
RACK_PRICE_CAD = 8_000  # CAD per rack
BATT_COST_PER_KWH = 220  # CAD/kWh (energy component)
BATT_COST_PER_KW = 130   # CAD/kW (power/PCS component)
FIXED_OM_FRAC = 0.05  # 5% of CAPEX/yr

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
        "_direct_curt": direct_curt,
        "_batt_used": batt_used,
        "_btf_used": btf_used,
        "_grid_used": grid_used,
    }
