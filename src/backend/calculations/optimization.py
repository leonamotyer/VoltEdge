"""
Battery sizing optimization and sensitivity analysis.
"""
from typing import Any
import numpy as np
from .dispatch import run_dispatch
from .gpu_config import compute_capex, compute_financials


def battery_sweep(
    curt_arr: np.ndarray,
    price_arr: np.ndarray,
    dt_h: float,
    gpu_mw: float,
    grid_cap_mw: float,
    btf_cap_mw: float,
    btf_price: float,
    curt_price: float,
    gpu_type: str,
    discount_rate: float,
    project_life: int,
    unit_price_override: float | None = None,
    rental_hr_override: float | None = None,
) -> list[dict[str, Any]]:
    """
    Run sensitivity analysis across multiple battery sizes.
    
    For each battery size:
    1. Simulates dispatch (energy sourcing, battery operation)
    2. Calculates CAPEX (hardware costs, annualized values)
    3. Computes financials (revenue, profit, payback, ROI)
    
    Battery sizes tested (MWh): 0.0, 0.5, 1.0, 2.0, 3.3, 5.0, 6.6, 9.9, 13.2, 20.0
    
    Args:
        curt_arr: Curtailed wind power array (MW) at each timestep
        price_arr: Pool price array (CAD/MWh) at each timestep
        dt_h: Timestep duration (hours)
        gpu_mw: GPU electrical load (MW)
        grid_cap_mw: Grid import capacity (MW)
        btf_cap_mw: Behind-the-fence capacity (MW)
        btf_price: BTF price (CAD/MWh)
        curt_price: Curtailment purchase price (USD/MWh)
        gpu_type: GPU model key (e.g., "RTX 5090")
        discount_rate: Discount rate for CRF (e.g., 0.08 for 8%)
        project_life: Project lifetime (years)
        unit_price_override: Custom GPU unit price (CAD)
        rental_hr_override: Custom rental rate (CAD/hr)
    
    Returns:
        List of dictionaries, one per battery size, with metrics:
        - batt_mwh: Battery energy capacity (MWh)
        - uptime_%: Percentage of time load is fully met
        - coverage_%: Percentage of total energy demand served
        - net_profit_$M: Annual net profit (millions CAD)
        - capex_$M: Total CAPEX (millions CAD)
        - payback_yrs: Payback period (years, capped at 25)
        - roi_%: Return on investment percentage
        - avg_cost_$/mwh: Average energy cost per MWh served
    """
    rows = []
    
    # Fixed battery sizes
    battery_sizes = [0.0, 0.5, 1.0, 2.0, 3.3, 5.0, 6.6, 9.9, 13.2, 20.0]
    
    for batt_mwh in battery_sizes:
        # Battery power rating matches energy capacity (1C rate)
        batt_p_mw = batt_mwh
        
        # Run dispatch simulation
        dispatch = run_dispatch(
            curt_arr, price_arr, dt_h,
            gpu_mw=gpu_mw,
            batt_mwh=batt_mwh,
            batt_p_mw=batt_p_mw,
            grid_cap_mw=grid_cap_mw,
            btf_cap_mw=btf_cap_mw,
            btf_price=btf_price,
            curt_price=curt_price,
        )
        
        # Calculate CAPEX
        capex = compute_capex(
            gpu_mw, batt_mwh, batt_p_mw,
            gpu_type, discount_rate, project_life,
            unit_price_override=unit_price_override,
            rental_hr_override=rental_hr_override,
        )
        
        # Calculate financials
        financials = compute_financials(
            dispatch, capex,
            dispatch["full_supply_interval_share"],
        )
        
        # Collect metrics
        rows.append({
            "batt_mwh": batt_mwh,
            "uptime_%": dispatch["full_supply_interval_share"] * 100,
            "coverage_%": dispatch["coverage_energy"] * 100,
            "net_profit_$M": financials["annual_net_profit_$"] / 1e6,
            "capex_$M": capex["capex_total_$"] / 1e6,
            "payback_yrs": min(financials["payback_years"], 25),
            "roi_%": financials["roi_%"],
            "avg_cost_$/mwh": dispatch["avg_energy_cost_$/mwh"],
        })
    
    return rows
