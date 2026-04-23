"""
Financial calculations for GPU + battery systems.
Extracted from application/mockup.py (lines 239-289).
"""
from typing import Any


def crf(r: float, n: int) -> float:
    """
    Calculate Capital Recovery Factor.
    
    Converts a present value (CAPEX) into an equivalent annual cost over n years
    at discount rate r.
    
    Args:
        r: Discount rate (e.g., 0.08 for 8%)
        n: Project lifetime in years
    
    Returns:
        Capital Recovery Factor
    
    Examples:
        >>> crf(0.08, 12)  # 8% over 12 years
        0.1326...
        >>> crf(0, 10)  # Zero discount rate
        0.1
    """
    return r * (1 + r)**n / ((1 + r)**n - 1) if r > 1e-9 else 1.0 / n


def compute_financials(
    dispatch_result: dict[str, Any],
    capex_result: dict[str, Any],
    uptime_frac: float,
) -> dict[str, Any]:
    """
    Calculate financial metrics from dispatch and CAPEX results.
    
    Computes:
    - Annual revenue from GPU rental (rental price × uptime)
    - Total annual costs (energy + annualized CAPEX + O&M)
    - Net profit
    - Payback period (years to recover CAPEX from annual cash flow)
    - ROI percentage
    - Net profit per MWh served
    
    Args:
        dispatch_result: Output dict from dispatch simulation with keys:
            - "annual_total_energy_cost_$": Total annual energy costs
            - "annual_served_mwh": Total MWh delivered to GPU load
        capex_result: Output dict from compute_capex() with keys:
            - "annual_rental_price_$": Potential annual revenue at 100% uptime
            - "annualized_capex_$": Annualized capital costs
            - "annual_fixed_om_$": Annual O&M costs
            - "capex_total_$": Total upfront capital cost
        uptime_frac: Fraction of time system is operational (0.0 to 1.0)
    
    Returns:
        Dictionary with financial metrics:
            - annual_revenue_$: Actual revenue (rental × uptime)
            - annual_energy_cost_$: Energy costs
            - annualized_capex_$: Annualized capital costs
            - annual_fixed_om_$: O&M costs
            - annual_total_cost_$: Sum of all costs
            - annual_net_profit_$: Revenue - total costs
            - payback_years: Years to recover CAPEX from cash flow
            - roi_%: Return on investment percentage
            - net_profit_per_mwh_$: Net profit per MWh served
    
    Examples:
        >>> dispatch = {
        ...     "annual_total_energy_cost_$": 50000,
        ...     "annual_served_mwh": 1000
        ... }
        >>> capex = {
        ...     "annual_rental_price_$": 200000,
        ...     "annualized_capex_$": 80000,
        ...     "annual_fixed_om_$": 20000,
        ...     "capex_total_$": 800000
        ... }
        >>> result = compute_financials(dispatch, capex, uptime_frac=0.9)
        >>> result["annual_revenue_$"]
        180000.0
        >>> result["annual_net_profit_$"]
        30000.0
    """
    # Calculate annual revenue based on actual uptime
    rev = capex_result["annual_rental_price_$"] * uptime_frac
    
    # Extract cost components
    e_cost = dispatch_result["annual_total_energy_cost_$"]
    ann_cap = capex_result["annualized_capex_$"]
    om = capex_result["annual_fixed_om_$"]
    
    # Calculate total costs and net profit
    total_c = e_cost + ann_cap + om
    net = rev - total_c
    
    # Get served energy for per-MWh metrics
    served = dispatch_result["annual_served_mwh"]
    
    # Calculate annual cash flow (revenue - operating costs, before CAPEX)
    ann_cf = rev - e_cost - om
    
    # Calculate payback period (years to recover CAPEX from cash flow)
    payback = capex_result["capex_total_$"] / ann_cf if ann_cf > 0 else float("inf")
    
    # Calculate ROI percentage
    roi = (net / capex_result["capex_total_$"]) * 100 if capex_result["capex_total_$"] > 0 else 0.0
    
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
