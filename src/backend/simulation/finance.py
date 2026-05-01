from __future__ import annotations


def capital_recovery_factor(discount_rate: float, life_years: int) -> float:
    if life_years <= 0:
        raise ValueError("life_years must be >= 1")
    rate = float(discount_rate)
    if abs(rate) < 1e-12:
        return 1.0 / float(life_years)
    growth = (1.0 + rate) ** int(life_years)
    return rate * growth / (growth - 1.0)


def annualize_capex(capex: float, discount_rate: float, life_years: int) -> float:
    return float(capex) * capital_recovery_factor(discount_rate, life_years)
