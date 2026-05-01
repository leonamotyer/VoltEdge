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


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE MANAGEMENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

# In-memory state for data source (could be replaced with file/database storage)
_data_source_state = {
    "source": "demo",  # "demo" or "uploaded"
    "has_curtailment_upload": False,
    "has_pool_price_upload": False,
}


@app.get("/api/upload/data-source")
async def get_data_source():
    """Get current data source configuration."""
    return _data_source_state


@app.post("/api/upload/toggle-source")
async def toggle_data_source(request: dict[str, Any]):
    """Toggle between demo and uploaded data source."""
    source = request.get("source")
    if source not in ["demo", "uploaded"]:
        raise HTTPException(status_code=400, detail="Invalid source. Must be 'demo' or 'uploaded'")

    _data_source_state["source"] = source
    return {"status": "success", "source": source}


@app.post("/api/upload/curtailment")
async def upload_curtailment(file: Any):
    """Upload curtailment Excel file."""
    # For now, just mark as uploaded
    # TODO: Implement actual file parsing and storage
    _data_source_state["has_curtailment_upload"] = True
    return {
        "message": "Curtailment data uploaded successfully",
        "status": "success"
    }


@app.post("/api/upload/pool-price")
async def upload_pool_price(file: Any):
    """Upload pool price CSV file."""
    # For now, just mark as uploaded
    # TODO: Implement actual file parsing and storage
    _data_source_state["has_pool_price_upload"] = True
    return {
        "message": "Pool price data uploaded successfully",
        "status": "success"
    }


# ─────────────────────────────────────────────────────────────────────────────
# ECONOMICS AND SENSITIVITY ANALYSIS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/economics/marginal-costs")
async def calculate_marginal_costs(request: dict[str, Any]) -> dict[str, Any]:
    """
    Calculate marginal cost analysis and arbitrage opportunities.

    Returns:
    - marginal_costs: Hourly marginal cost time-series by energy source
    - arbitrage_hours: Filtered array of profitable arbitrage hours
    - cost_distribution: Boxplot statistics by energy source
    - summary: Overall metrics for the analysis period
    """
    # TODO: Implement actual marginal cost calculation
    # For now, return mock data structure
    return {
        "marginal_costs": [],
        "arbitrage_hours": [],
        "cost_distribution": {},
        "summary": {
            "total_hours": 0,
            "avg_marginal_cost_$/mwh": 0,
            "avg_pool_price_$/mwh": 0,
            "avg_spread_$/mwh": 0,
        }
    }


@app.post("/api/sensitivity/npv")
async def calculate_sensitivity_npv(request: dict[str, Any]) -> dict[str, Any]:
    """
    Calculate NPV sensitivity analysis.

    Returns baseline NPV/IRR and sensitivity data for various parameters.
    """
    # TODO: Implement actual sensitivity analysis
    # For now, return mock data structure
    return {
        "baseline_npv": 0,
        "baseline_irr": 0,
        "sensitivities": []
    }
