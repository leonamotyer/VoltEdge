"""
REST API endpoints for battery sizing and GPU rack count optimization.
"""
from fastapi import APIRouter, HTTPException
from typing import Any
import numpy as np

from ..models.requests import BatterySweepRequest, GpuSweepRequest
from ..analytics.optimization import battery_sweep
from ..analytics.dispatch import run_dispatch
from ..analytics.gpu_config import compute_capex, GPU_SPECS, GPUS_PER_RACK
from ..analytics.financials import compute_financials
from ..mocks.generate_demo import generate_demo_data


router = APIRouter(prefix="/api/optimization", tags=["optimization"])


@router.post("/battery-sweep")
async def run_battery_sweep(request: BatterySweepRequest) -> dict[str, Any]:
    """
    Run battery sizing optimization sweep.

    Tests battery sizes: 0.0, 0.5, 1.0, 2.0, 3.3, 5.0, 6.6, 9.9, 13.2, 20.0 MWh

    Returns list of results with metrics for each battery size:
    - batt_mwh, uptime_%, coverage_%, net_profit_$M, capex_$M, payback_yrs, roi_%, avg_cost_$/mwh
    """
    try:
        # Get demo data (same as dispatch.py)
        df = generate_demo_data()
        curt_arr = df["p_curt_mw"].to_numpy().astype(np.float64)
        price_arr = df["pool_price"].to_numpy().astype(np.float64)
        dt_h = float(df["dt_h"].iloc[0])
        
        # Run battery sweep
        results = battery_sweep(
            curt_arr=curt_arr,
            price_arr=price_arr,
            dt_h=dt_h,
            gpu_mw=request.gpu_mw,
            grid_cap_mw=request.grid_cap_mw,
            btf_cap_mw=request.btf_cap_mw,
            btf_price=request.btf_price,
            curt_price=request.curt_price,
            gpu_type=request.gpu_type,
            discount_rate=request.discount_rate,
            project_life=request.project_life,
            unit_price_override=request.unit_price_override,
            rental_hr_override=request.rental_hr_override,
        )
        
        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gpu-sweep")
async def run_gpu_sweep(request: GpuSweepRequest) -> dict[str, Any]:
    """
    Run GPU rack count optimization sweep.

    Tests rack counts from 1 to 40 (step 2).

    Returns list of results with metrics for each rack count:
    - n_racks, n_gpus, gpu_mw, uptime_%, profit_$M
    """
    try:
        # Validate GPU type
        if request.gpu_type not in GPU_SPECS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid GPU type. Must be one of: {list(GPU_SPECS.keys())}"
            )

        # Get demo data (same as dispatch.py)
        df = generate_demo_data()
        curt_arr = df["p_curt_mw"].to_numpy().astype(np.float64)
        price_arr = df["pool_price"].to_numpy().astype(np.float64)
        dt_h = float(df["dt_h"].iloc[0])

        # GPU specs for power calculation
        spec = GPU_SPECS[request.gpu_type]
        power_kw = spec["power_kw"]

        results = []

        # Sweep rack counts: 1 to 40, step 2
        for n_racks in range(1, 41, 2):
            # Calculate GPU count and load
            n_gpus = n_racks * GPUS_PER_RACK
            gpu_mw = n_gpus * power_kw / 1000

            # Run dispatch simulation
            dispatch = run_dispatch(
                curt_arr, price_arr, dt_h,
                gpu_mw=gpu_mw,
                batt_mwh=request.batt_mwh,
                batt_p_mw=request.batt_p_mw,
                grid_cap_mw=request.grid_cap_mw,
                btf_cap_mw=request.btf_cap_mw,
                btf_price=request.btf_price,
                curt_price=request.curt_price,
            )

            # Calculate CAPEX
            capex = compute_capex(
                gpu_mw, request.batt_mwh, request.batt_p_mw,
                request.gpu_type, request.discount_rate, request.project_life,
                unit_price_override=request.unit_price_override,
                rental_hr_override=request.rental_hr_override,
            )

            # Calculate financials
            financials = compute_financials(
                dispatch, capex,
                dispatch["full_supply_interval_share"],
            )

            # Collect metrics
            results.append({
                "n_racks": n_racks,
                "n_gpus": n_gpus,
                "gpu_mw": gpu_mw,
                "uptime_%": dispatch["full_supply_interval_share"] * 100,
                "profit_$M": financials["annual_net_profit_$"] / 1e6,
            })

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
