"""
Minimal FastAPI application for heavy calculations.
Endpoints for dispatch simulation, battery optimization, and financial analysis.
"""
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

from .dispatch import run_dispatch
from .gpu_config import compute_capex, compute_financials, GPU_SPECS
from .optimization import battery_sweep
from .financials import compute_npv, compute_irr, project_cash_flows

app = FastAPI(title="VoltEdge Calculation Service", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"service": "VoltEdge Calculation Service", "status": "running"}


@app.get("/gpu-specs")
async def get_gpu_specs():
    """Return available GPU specifications."""
    return {"gpu_specs": GPU_SPECS}


@app.post("/calculate/dispatch")
async def calculate_dispatch(
    curtailed_mw: list[float],
    pool_price: list[float],
    dt_h: float,
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float,
    grid_cap_mw: float,
    btf_cap_mw: float,
    btf_price: float,
    curt_price: float,
) -> dict[str, Any]:
    """Run dispatch simulation."""
    try:
        result = run_dispatch(
            np.array(curtailed_mw),
            np.array(pool_price),
            dt_h, gpu_mw, batt_mwh, batt_p_mw,
            grid_cap_mw, btf_cap_mw, btf_price, curt_price
        )
        # Convert numpy arrays to lists for JSON serialization
        for key in ["_soc", "_served", "_unmet", "_direct_curt", "_batt_used", "_btf_used", "_grid_used"]:
            if key in result:
                result[key] = result[key].tolist()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/capex")
async def calculate_capex(
    gpu_mw: float,
    batt_mwh: float,
    batt_p_mw: float,
    gpu_type: str,
    discount_rate: float = 0.08,
    project_life: int = 12,
    unit_price_override: float | None = None,
    rental_hr_override: float | None = None,
) -> dict[str, Any]:
    """Calculate CAPEX for GPU + battery system."""
    try:
        return compute_capex(
            gpu_mw, batt_mwh, batt_p_mw, gpu_type,
            discount_rate, project_life,
            unit_price_override, rental_hr_override
        )
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid GPU type: {gpu_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/financials")
async def calculate_financials(
    dispatch: dict[str, Any],
    capex: dict[str, Any],
    uptime_frac: float,
) -> dict[str, Any]:
    """Calculate financial metrics."""
    try:
        return compute_financials(dispatch, capex, uptime_frac)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/battery-sweep")
async def calculate_battery_sweep(
    curt_arr: list[float],
    price_arr: list[float],
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
    """Run battery sizing sweep analysis."""
    try:
        return battery_sweep(
            np.array(curt_arr), np.array(price_arr),
            dt_h, gpu_mw, grid_cap_mw, btf_cap_mw,
            btf_price, curt_price, gpu_type,
            discount_rate, project_life,
            unit_price_override, rental_hr_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/npv")
async def calculate_npv(cash_flows: list[float], discount_rate: float) -> dict[str, float]:
    """Calculate Net Present Value."""
    try:
        return {"npv": compute_npv(cash_flows, discount_rate)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate/irr")
async def calculate_irr(cash_flows: list[float]) -> dict[str, float]:
    """Calculate Internal Rate of Return."""
    try:
        return {"irr": compute_irr(cash_flows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
