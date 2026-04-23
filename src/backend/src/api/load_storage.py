"""Load and storage simulation API endpoints."""
from fastapi import APIRouter, HTTPException
from ..models.requests import LoadStorageRequest
from ..analytics.site_analytics import simulate_load_storage
from ..repositories.aeso import AesoRepository
from ..repositories.scada import ScadaRepository

router = APIRouter(prefix="/api/load-storage", tags=["load-storage"])


@router.post("/view")
async def get_load_storage_simulation(request: LoadStorageRequest):
    """
    Simulate battery storage with curtailed energy for data center load.

    Models a battery that:
    1. Charges from curtailed wind energy
    2. Discharges when pool prices are positive
    3. Accounts for round-trip efficiency losses

    Args:
        request: Simulation parameters (site, dates, battery specs, efficiency)

    Returns:
        Hourly simulation with SOC tracking + summary statistics

    Note:
        Currently uses static mock data from JSON files. Request parameters are
        accepted but not yet used for filtering.
    """
    try:
        # Fetch market data (using demo data for now)
        aeso_repo = AesoRepository()
        market_rows = aeso_repo.get_demo_hourly_market()

        # Fetch SCADA data (using demo data for now)
        scada_repo = ScadaRepository()
        scada_rows = scada_repo.get_demo_hourly_scada()
        
        # Run battery simulation
        result = simulate_load_storage(request, market_rows, scada_rows)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
