"""
Financial calculations using scipy for IRR/NPV.
"""
from typing import Any
from scipy.optimize import newton


def compute_npv(cash_flows: list[float], discount_rate: float) -> float:
    """Calculate Net Present Value: NPV = Σ(CF_t / (1+r)^t)"""
    return sum(cf / ((1 + discount_rate) ** year) for year, cf in enumerate(cash_flows))


def compute_irr(cash_flows: list[float]) -> float:
    """Calculate Internal Rate of Return using scipy solver."""
    if all(cf >= 0 for cf in cash_flows) or all(cf <= 0 for cf in cash_flows):
        return float("nan")

    try:
        return float(newton(
            lambda r: sum(cf / ((1 + r) ** t) for t, cf in enumerate(cash_flows)),
            x0=0.1
        ))
    except:
        return float("nan")


def project_cash_flows(config: dict[str, Any], simulation_results: dict[str, Any], years: int = 10) -> dict[str, Any]:
    """Simple cash flow projection without degradation/escalation complexity."""
    capex_total = config["capex_total_$"]
    annual_revenue = config["annual_revenue_$"]
    annual_energy_cost = config["annual_energy_cost_$"]
    annual_om = config["annual_fixed_om_$"]
    discount_rate = config["discount_rate"]

    # Year 0: CAPEX
    cash_flows = [-capex_total]

    # Years 1-N: Simple constant cash flow
    annual_cf = annual_revenue - annual_energy_cost - annual_om
    for year in range(1, years + 1):
        cash_flows.append(annual_cf)

    # Calculate NPV and IRR
    npv = compute_npv(cash_flows, discount_rate)
    irr = compute_irr(cash_flows)

    # Simplified yearly details (all years same)
    yearly_details = [{
        "year": year,
        "revenue_$": annual_revenue,
        "energy_cost_$": annual_energy_cost,
        "om_cost_$": annual_om,
        "cash_flow_$": annual_cf
    } for year in range(1, years + 1)]

    return {
        "cash_flows": cash_flows,
        "npv": npv,
        "irr": irr,
        "yearly_details": yearly_details,
    }
