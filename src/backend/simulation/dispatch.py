from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import numpy as np
import pandas as pd


def _finite(value: Any) -> bool:
    try:
        return np.isfinite(float(value))
    except (TypeError, ValueError):
        return False


def _curt_price(
    curtailment_price_per_mwh: float,
    curtailment_price_usd_per_mwh: float | None,
) -> float:
    return float(
        curtailment_price_per_mwh
        if curtailment_price_usd_per_mwh is None
        else curtailment_price_usd_per_mwh
    )


def _external_order(
    grid_price: float | None,
    btf_price: float | None,
    *,
    grid_cap_mwh: float,
    btf_cap_mwh: float,
    external_order: str,
) -> list[str]:
    options: list[tuple[str, float]] = []
    if grid_cap_mwh > 0.0 and _finite(grid_price):
        options.append(("grid", float(grid_price)))
    if btf_cap_mwh > 0.0 and _finite(btf_price):
        options.append(("btf", float(btf_price)))

    if external_order == "grid_first":
        rank = {"grid": 0, "btf": 1}
        options.sort(key=lambda item: rank[item[0]])
    elif external_order == "btf_first":
        rank = {"btf": 0, "grid": 1}
        options.sort(key=lambda item: rank[item[0]])
    else:
        options.sort(key=lambda item: item[1])

    return [name for name, _ in options]


def _supply_with_cap(remaining_mwh: float, cap_mwh: float, allow_partial: bool) -> float:
    if remaining_mwh <= 0.0 or cap_mwh <= 0.0:
        return 0.0
    if allow_partial:
        return min(remaining_mwh, cap_mwh)
    return remaining_mwh if remaining_mwh <= cap_mwh else 0.0


def _dispatch_engine(
    df: pd.DataFrame,
    *,
    gpu_mw: float,
    batt_mwh: float = 0.0,
    batt_p_mw: float | None = None,
    grid_cap_mw: float = 0.0,
    btf_cap_mw: float = 0.0,
    btf_price: float | None = None,
    eta_c: float = 1.0,
    eta_d: float = 1.0,
    soc0_mwh: float = 0.0,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    grid_price_col: str = "pool_price",
    curtailment_price_per_mwh: float = 25.0,
    all_or_nothing_grid: bool = False,
    allow_partial_grid: bool = True,
    allow_partial_btf: bool = True,
    external_order: str = "price",
) -> dict[str, Any]:
    gpu_mw = float(gpu_mw)
    batt_mwh = float(batt_mwh)
    batt_p_mw = gpu_mw if batt_p_mw is None else float(batt_p_mw)
    eta_c = float(eta_c)
    eta_d = float(eta_d)
    curtailment_price_per_mwh = float(curtailment_price_per_mwh)

    dt = df[dt_col].to_numpy(dtype=float)
    avail = df[curt_energy_col].to_numpy(dtype=float)
    demand = gpu_mw * dt
    grid_price = (
        df[grid_price_col].to_numpy(dtype=float)
        if grid_price_col in df.columns
        else None
    )

    soc = min(max(float(soc0_mwh), 0.0), batt_mwh)

    supplied_curt = np.zeros_like(avail)
    supplied_batt = np.zeros_like(avail)
    supplied_grid = np.zeros_like(avail)
    supplied_btf = np.zeros_like(avail)
    charged_in = np.zeros_like(avail)
    unmet = np.zeros_like(avail)
    spilled = np.zeros_like(avail)
    soc_trace = np.zeros_like(avail)
    curt_cost = np.zeros_like(avail)
    grid_cost = np.zeros_like(avail) if grid_price is not None else None
    btf_cost = np.zeros_like(avail) if _finite(btf_price) else None
    btf_opp_cost = (
        np.zeros_like(avail)
        if grid_price is not None and _finite(btf_price)
        else None
    )

    for i in range(len(avail)):
        rem_demand = demand[i]
        rem_avail = avail[i]

        direct_curt = min(rem_avail, rem_demand)
        supplied_curt[i] = direct_curt
        rem_avail -= direct_curt
        rem_demand -= direct_curt

        if batt_mwh > 0.0 and batt_p_mw > 0.0 and eta_d > 0.0:
            batt_limit = batt_p_mw * dt[i]
            batt_to_load = min(rem_demand, batt_limit, soc * eta_d)
            supplied_batt[i] = batt_to_load
            rem_demand -= batt_to_load
            soc -= batt_to_load / eta_d

        for source in _external_order(
            None if grid_price is None else grid_price[i],
            btf_price,
            grid_cap_mwh=float(grid_cap_mw) * dt[i],
            btf_cap_mwh=float(btf_cap_mw) * dt[i],
            external_order=external_order,
        ):
            if rem_demand <= 0.0:
                break

            if source == "grid":
                cap = float(grid_cap_mw) * dt[i]
                amount = (
                    _supply_with_cap(rem_demand, cap, allow_partial=False)
                    if all_or_nothing_grid
                    else _supply_with_cap(rem_demand, cap, allow_partial=allow_partial_grid)
                )
                supplied_grid[i] += amount
                rem_demand -= amount
                if grid_cost is not None:
                    grid_cost[i] += amount * grid_price[i]
            else:
                cap = float(btf_cap_mw) * dt[i]
                amount = _supply_with_cap(rem_demand, cap, allow_partial=allow_partial_btf)
                supplied_btf[i] += amount
                rem_demand -= amount
                if btf_cost is not None:
                    btf_cost[i] += amount * float(btf_price)
                if btf_opp_cost is not None:
                    btf_opp_cost[i] += amount * max(float(grid_price[i]) - float(btf_price), 0.0)

        unmet[i] = max(rem_demand, 0.0)

        if batt_mwh > 0.0 and batt_p_mw > 0.0 and eta_c > 0.0:
            charge_limit = batt_p_mw * dt[i]
            headroom = batt_mwh - soc
            charge_in = min(rem_avail, charge_limit, headroom / eta_c)
            charged_in[i] = charge_in
            soc += charge_in * eta_c
            rem_avail -= charge_in

        spilled[i] = max(rem_avail, 0.0)
        curt_cost[i] = (supplied_curt[i] + charged_in[i]) * curtailment_price_per_mwh
        soc = min(max(soc, 0.0), batt_mwh)
        soc_trace[i] = soc

    served = supplied_curt + supplied_batt + supplied_grid + supplied_btf
    annual_served = float(served.sum())
    annual_demand = float(demand.sum())

    out: dict[str, Any] = {
        "gpu_mw": gpu_mw,
        "batt_mwh": batt_mwh,
        "batt_p_mw": batt_p_mw,
        "grid_cap_mw": float(grid_cap_mw),
        "btf_cap_mw": float(btf_cap_mw),
        "btf_price_$_per_mwh": float(btf_price) if _finite(btf_price) else btf_price,
        "eta_c": eta_c,
        "eta_d": eta_d,
        "curtailment_price_$_per_mwh": curtailment_price_per_mwh,
        "annual_gpu_demand_mwh": annual_demand,
        "annual_served_mwh": annual_served,
        "annual_unmet_mwh": float(unmet.sum()),
        "annual_direct_curt_used_mwh": float(supplied_curt.sum()),
        "annual_batt_used_mwh": float(supplied_batt.sum()),
        "annual_grid_used_mwh": float(supplied_grid.sum()),
        "annual_btf_used_mwh": float(supplied_btf.sum()),
        "annual_spilled_curt_mwh": float(spilled.sum()),
        "curt_energy_input_mwh": float((supplied_curt + charged_in).sum()),
        "coverage_energy": annual_served / annual_demand if annual_demand > 0.0 else np.nan,
        "full_supply_interval_share": float((unmet == 0.0).mean()),
        "interval_full_supply_share": float((unmet == 0.0).mean()),
        "any_supply_interval_share": float((served > 0.0).mean()),
        "interval_any_supply_share": float((served > 0.0).mean()),
        "curt_utilization": float(supplied_curt.sum() / avail.sum()) if float(avail.sum()) > 0.0 else np.nan,
        "gpu_coverage": annual_served / annual_demand if annual_demand > 0.0 else np.nan,
        "annual_curt_cost_$": float(curt_cost.sum()),
        "served": unmet == 0.0,
        "soc_trace": soc_trace,
        "supplied_grid_mwh": supplied_grid,
        "supplied_btf_mwh": supplied_btf,
        "curt_cost_$": curt_cost,
    }

    annual_total_cost = out["annual_curt_cost_$"]
    if grid_cost is not None:
        out["annual_grid_cost_$"] = float(grid_cost.sum())
        out["grid_cost_$"] = grid_cost
        annual_total_cost += out["annual_grid_cost_$"]
    if btf_cost is not None:
        out["annual_btf_cost_$"] = float(btf_cost.sum())
        out["btf_cost_$"] = btf_cost
        annual_total_cost += out["annual_btf_cost_$"]
    if btf_opp_cost is not None:
        out["annual_btf_opportunity_loss_$"] = float(btf_opp_cost.sum())
        out["btf_opportunity_loss_$"] = btf_opp_cost

    out["annual_total_energy_cost_$"] = float(annual_total_cost)
    out["avg_energy_cost_$_per_mwh_served"] = (
        float(annual_total_cost / annual_served) if annual_served > 0.0 else np.nan
    )
    return out


def _public_subset(result: Mapping[str, Any], keys: list[str]) -> dict[str, Any]:
    return {key: result[key] for key in keys if key in result}


def simulate_gpu_absorption(
    df: pd.DataFrame,
    gpu_mw: float,
    *,
    curtailment_price_per_mwh: float = 25.0,
    curtailment_price_usd_per_mwh: float | None = None,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
) -> dict[str, Any]:
    result = _dispatch_engine(
        df,
        gpu_mw=gpu_mw,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        curtailment_price_per_mwh=_curt_price(
            curtailment_price_per_mwh,
            curtailment_price_usd_per_mwh,
        ),
    )
    return _public_subset(
        result,
        [
            "gpu_mw",
            "curtailment_price_$_per_mwh",
            "annual_gpu_demand_mwh",
            "annual_served_mwh",
            "annual_unmet_mwh",
            "annual_spilled_curt_mwh",
            "curt_utilization",
            "gpu_coverage",
            "interval_full_supply_share",
            "interval_any_supply_share",
            "annual_curt_cost_$",
            "avg_energy_cost_$_per_mwh_served",
        ],
    )


def simulate_gpu_with_battery(
    df: pd.DataFrame,
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float | None = None,
    eta_c: float = 1.0,
    eta_d: float = 1.0,
    soc0_mwh: float = 0.0,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    *,
    curtailment_price_per_mwh: float = 25.0,
    curtailment_price_usd_per_mwh: float | None = None,
) -> dict[str, Any]:
    return _dispatch_engine(
        df,
        gpu_mw=gpu_mw,
        batt_mwh=batt_mwh,
        batt_p_mw=batt_p_mw,
        eta_c=eta_c,
        eta_d=eta_d,
        soc0_mwh=soc0_mwh,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        curtailment_price_per_mwh=_curt_price(
            curtailment_price_per_mwh,
            curtailment_price_usd_per_mwh,
        ),
    )


def simulate_gpu_with_battery_grid_cap(
    df: pd.DataFrame,
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float | None = None,
    grid_cap_mw: float = 0.0,
    eta_c: float = 1.0,
    eta_d: float = 1.0,
    soc0_mwh: float = 0.0,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    grid_price_col: str = "pool_price",
    *,
    curtailment_price_per_mwh: float = 25.0,
    curtailment_price_usd_per_mwh: float | None = None,
) -> dict[str, Any]:
    return _dispatch_engine(
        df,
        gpu_mw=gpu_mw,
        batt_mwh=batt_mwh,
        batt_p_mw=batt_p_mw,
        grid_cap_mw=grid_cap_mw,
        eta_c=eta_c,
        eta_d=eta_d,
        soc0_mwh=soc0_mwh,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        grid_price_col=grid_price_col,
        curtailment_price_per_mwh=_curt_price(
            curtailment_price_per_mwh,
            curtailment_price_usd_per_mwh,
        ),
        all_or_nothing_grid=True,
    )


def simulate_gpu_with_battery_btf_grid_cap(
    df: pd.DataFrame,
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float | None = None,
    grid_cap_mw: float = 0.0,
    eta_c: float = 1.0,
    eta_d: float = 1.0,
    soc0_mwh: float = 0.0,
    curt_energy_col: str = "e_curt_mwh",
    dt_col: str = "dt_h",
    grid_price_col: str = "pool_price",
    btf_cap_mw: float = 0.0,
    btf_price: float | None = None,
    *,
    curtailment_price_per_mwh: float = 25.0,
    curtailment_price_usd_per_mwh: float | None = None,
) -> dict[str, Any]:
    return _dispatch_engine(
        df,
        gpu_mw=gpu_mw,
        batt_mwh=batt_mwh,
        batt_p_mw=batt_p_mw,
        grid_cap_mw=grid_cap_mw,
        btf_cap_mw=btf_cap_mw,
        btf_price=btf_price,
        eta_c=eta_c,
        eta_d=eta_d,
        soc0_mwh=soc0_mwh,
        curt_energy_col=curt_energy_col,
        dt_col=dt_col,
        grid_price_col=grid_price_col,
        curtailment_price_per_mwh=_curt_price(
            curtailment_price_per_mwh,
            curtailment_price_usd_per_mwh,
        ),
    )
