"""Dispatch simulation and system sizing API endpoints."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any
import numpy as np
from ..models.requests import DispatchRequest
from ..analytics.dispatch import run_dispatch, compute_capex, compute_financials
from ..mocks.generate_demo import generate_demo_data

router = APIRouter(prefix="/api/dispatch", tags=["dispatch"])


@router.post("/simulate")
async def simulate_dispatch(request: DispatchRequest) -> dict[str, Any]:
    """
    Run comprehensive dispatch simulation with financial calculations.

    This endpoint performs a complete analysis including:
    1. Energy dispatch optimization (curtailment → battery → BTF → grid)
    2. CAPEX calculations (GPU hardware + battery + racks)
    3. Financial analysis (revenue, costs, profit, ROI, payback)
    4. Time series generation for visualization

    Dispatch Priority Hierarchy:
        1. Direct curtailed wind → GPU load
        2. Battery discharge → GPU load
        3. BTF (Behind-the-Fence) → GPU load
        4. Grid import → GPU load

    Battery charges from surplus curtailed energy after serving GPU load.

    Returns:
        Dictionary with four main sections:

        dispatch: Energy sourcing breakdown and costs
            - full_supply_interval_share: Fraction of time GPU is fully powered (uptime)
            - coverage_energy: Energy coverage ratio (served / total demand)
            - annual_*_mwh: Annual energy flows (served, unmet, from each source)
            - annual_*_cost_$: Annual energy costs (grid, BTF, curtailment)
            - annual_total_energy_cost_$: Total annual energy costs
            - avg_energy_cost_$/mwh: Average energy cost per MWh

        capex: Hardware costs and configuration
            - n_gpus: Number of GPUs required
            - n_racks: Number of racks required
            - capex_batt_energy_$: Battery energy component cost
            - capex_batt_power_$: Battery power/PCS component cost
            - capex_gpu_$: Total GPU hardware cost
            - capex_rack_$: Total rack infrastructure cost
            - capex_total_$: Total upfront capital cost
            - annualized_capex_$: Annual capital cost (CRF applied)
            - annual_fixed_om_$: Annual O&M costs (5% of CAPEX)
            - annual_rental_price_$: Potential annual revenue at 100% uptime

        financials: Revenue, profit, and return metrics
            - annual_revenue_$: Actual revenue (rental × uptime)
            - annual_energy_cost_$: Energy procurement costs
            - annualized_capex_$: Annualized capital costs
            - annual_fixed_om_$: Annual O&M costs
            - annual_total_cost_$: Sum of all costs
            - annual_net_profit_$: Revenue - total costs
            - payback_years: Years to recover CAPEX from cash flow
            - roi_%: Return on investment percentage
            - net_profit_per_mwh_$: Net profit per MWh served

        timeseries: Internal time series for charting (52,704 points for leap year)
            - soc: Battery state of charge (MWh) at each timestep
            - served: Binary flag indicating if GPU load is fully served
            - unmet: Unmet energy demand (MWh) at each timestep

    Note: Currently uses synthetic demo data (52,704 10-minute intervals).
          Future versions will support loading curtailment data from repositories.
    """
    try:
        # Get demo curtailment data (10-min resolution, leap year)
        df = generate_demo_data()
        curt_np = df["p_curt_mw"].to_numpy().astype(np.float64)
        price_np = df["pool_price"].to_numpy().astype(np.float64)
        dt_h = float(df["dt_h"].iloc[0])

        # Run dispatch simulation with battery efficiencies
        dispatch = run_dispatch(
            curt_np, price_np, dt_h,
            gpu_mw=request.gpu_mw,
            batt_mwh=request.batt_mwh,
            batt_p_mw=request.batt_p_mw,
            grid_cap_mw=request.grid_cap_mw,
            btf_cap_mw=request.btf_cap_mw,
            btf_price=request.btf_price,
            curt_price=request.curt_price,
            eta_c=request.eta_c,
            eta_d=request.eta_d,
        )

        # Calculate CAPEX breakdown
        capex = compute_capex(
            request.gpu_mw,
            request.batt_mwh,
            request.batt_p_mw,
            request.gpu_type,
            request.discount_rate,
            request.project_life,
            unit_price_override=request.unit_price_override,
            rental_hr_override=request.rental_hr_override,
        )

        # Calculate financial metrics
        financials = compute_financials(
            dispatch,
            capex,
            dispatch["full_supply_interval_share"],
        )

        # Extract timeseries for charting (convert numpy to lists for JSON)
        timeseries = {
            "soc": dispatch["_soc"].tolist(),
            "served": dispatch["_served"].tolist(),
            "unmet": dispatch["_unmet"].tolist(),
        }

        # Remove internal arrays from dispatch dict
        dispatch_summary = {k: v for k, v in dispatch.items() if not k.startswith("_")}

        return {
            "dispatch": dispatch_summary,
            "capex": capex,
            "financials": financials,
            "timeseries": timeseries,
        }

    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Invalid GPU type or parameter: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


class BatteryParameterSweepRequest(BaseModel):
    """Request for battery capacity parameter sweep with custom range."""
    gpu_mw: float = Field(..., gt=0)
    batt_p_mw: float = Field(..., ge=0)
    eta_c: float = Field(0.95, gt=0, le=1, description="Battery charging efficiency (0-1)")
    eta_d: float = Field(0.95, gt=0, le=1, description="Battery discharging efficiency (0-1)")
    grid_cap_mw: float = Field(..., ge=0)
    btf_cap_mw: float = Field(..., ge=0)
    btf_price: float = Field(..., ge=0)
    curt_price: float = Field(..., ge=0)
    discount_rate: float = Field(0.08, ge=0, le=1)
    project_life: int = Field(12, ge=1, le=30)
    gpu_type: str = Field("RTX 5090")
    batt_mwh_min: float = Field(0, ge=0)
    batt_mwh_max: float = Field(100, ge=0)
    batt_mwh_step: float = Field(10, gt=0)


@router.post("/battery-sweep")
async def sweep_battery_capacity(request: BatteryParameterSweepRequest) -> dict[str, Any]:
    """
    Parameter sweep over battery capacity.

    Runs multiple simulations varying battery MWh from min to max.
    Returns ROI, payback, uptime for each battery size.
    """
    try:
        df = generate_demo_data()
        curt_np = df["p_curt_mw"].to_numpy().astype(np.float64)
        price_np = df["pool_price"].to_numpy().astype(np.float64)
        dt_h = float(df["dt_h"].iloc[0])

        # Generate sweep points
        sweep_points = np.arange(request.batt_mwh_min, request.batt_mwh_max + request.batt_mwh_step, request.batt_mwh_step)

        results = []
        for batt_mwh in sweep_points:
            dispatch = run_dispatch(
                curt_np, price_np, dt_h,
                gpu_mw=request.gpu_mw,
                batt_mwh=float(batt_mwh),
                batt_p_mw=request.batt_p_mw,
                grid_cap_mw=request.grid_cap_mw,
                btf_cap_mw=request.btf_cap_mw,
                btf_price=request.btf_price,
                curt_price=request.curt_price,
                eta_c=request.eta_c,
                eta_d=request.eta_d,
            )

            capex = compute_capex(
                request.gpu_mw, float(batt_mwh), request.batt_p_mw,
                request.gpu_type, request.discount_rate, request.project_life
            )

            financials = compute_financials(
                dispatch, capex, dispatch["full_supply_interval_share"]
            )

            results.append({
                "batt_mwh": float(batt_mwh),
                "uptime_%": dispatch["full_supply_interval_share"] * 100,
                "roi_%": financials["roi_%"],
                "payback_years": financials["payback_years"],
                "net_profit_$": financials["annual_net_profit_$"],
                "capex_total_$": capex["capex_total_$"],
            })

        return {"sweep": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sweep error: {str(e)}")


class GpuParameterSweepRequest(BaseModel):
    """Request for GPU load parameter sweep with custom range."""
    batt_mwh: float = Field(..., ge=0)
    batt_p_mw: float = Field(..., ge=0)
    eta_c: float = Field(0.95, gt=0, le=1, description="Battery charging efficiency (0-1)")
    eta_d: float = Field(0.95, gt=0, le=1, description="Battery discharging efficiency (0-1)")
    grid_cap_mw: float = Field(..., ge=0)
    btf_cap_mw: float = Field(..., ge=0)
    btf_price: float = Field(..., ge=0)
    curt_price: float = Field(..., ge=0)
    discount_rate: float = Field(0.08, ge=0, le=1)
    project_life: int = Field(12, ge=1, le=30)
    gpu_type: str = Field("RTX 5090")
    gpu_mw_min: float = Field(0.1, gt=0)
    gpu_mw_max: float = Field(2.0, gt=0)
    gpu_mw_step: float = Field(0.2, gt=0)


@router.post("/gpu-sweep")
async def sweep_gpu_load(request: GpuParameterSweepRequest) -> dict[str, Any]:
    """
    Parameter sweep over GPU load.

    Runs multiple simulations varying GPU MW from min to max.
    Returns ROI, payback, uptime for each GPU load.
    """
    try:
        df = generate_demo_data()
        curt_np = df["p_curt_mw"].to_numpy().astype(np.float64)
        price_np = df["pool_price"].to_numpy().astype(np.float64)
        dt_h = float(df["dt_h"].iloc[0])

        sweep_points = np.arange(request.gpu_mw_min, request.gpu_mw_max + request.gpu_mw_step, request.gpu_mw_step)

        results = []
        for gpu_mw in sweep_points:
            dispatch = run_dispatch(
                curt_np, price_np, dt_h,
                gpu_mw=float(gpu_mw),
                batt_mwh=request.batt_mwh,
                batt_p_mw=request.batt_p_mw,
                grid_cap_mw=request.grid_cap_mw,
                btf_cap_mw=request.btf_cap_mw,
                btf_price=request.btf_price,
                curt_price=request.curt_price,
                eta_c=request.eta_c,
                eta_d=request.eta_d,
            )

            capex = compute_capex(
                float(gpu_mw), request.batt_mwh, request.batt_p_mw,
                request.gpu_type, request.discount_rate, request.project_life
            )

            financials = compute_financials(
                dispatch, capex, dispatch["full_supply_interval_share"]
            )

            results.append({
                "gpu_mw": float(gpu_mw),
                "n_gpus": capex["n_gpus"],
                "uptime_%": dispatch["full_supply_interval_share"] * 100,
                "roi_%": financials["roi_%"],
                "payback_years": financials["payback_years"],
                "net_profit_$": financials["annual_net_profit_$"],
                "capex_total_$": capex["capex_total_$"],
            })

        return {"sweep": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sweep error: {str(e)}")


@router.get("/demo-data")
async def get_demo_data(seed: int = 42, year: int = 2024):
    """
    Get synthetic wind curtailment time series.

    Returns 52,704 rows (10-min resolution for leap year).
    """
    try:
        df = generate_demo_data(seed, year)
        return {
            "rows": df.to_dict(orient="records"),
            "summary": {
                "rows": len(df),
                "start": str(df["t_stamp"].iloc[0]),
                "end": str(df["t_stamp"].iloc[-1]),
                "total_curtailed_mwh": float(df["e_curt_mwh"].sum()),
                "total_potential_mwh": float(df["e_pot_mwh"].sum()),
                "curtailment_rate_%": float(df["e_curt_mwh"].sum() / df["e_pot_mwh"].sum() * 100),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data generation error: {str(e)}")
