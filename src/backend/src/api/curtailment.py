"""Curtailment analysis API endpoints."""
from fastapi import APIRouter, HTTPException
from ..models.requests import CurtailmentSiteRequest
from ..analytics.site_analytics import build_curtailment_view
from ..repositories.aeso import AesoRepository
from ..repositories.scada import ScadaRepository

router = APIRouter(prefix="/api/curtailment", tags=["curtailment"])


@router.post("/view")
async def get_curtailment_view(request: CurtailmentSiteRequest):
    """
    Calculate curtailment gap analysis for a wind site.

    Compares modeled generation (from wind speed data) against actual generation
    to identify curtailment opportunities.

    Args:
        request: Curtailment analysis parameters (site, date range, turbine count)

    Returns:
        Hourly curtailment rows + summary statistics

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

        # Calculate curtailment view
        result = build_curtailment_view(request, market_rows, scada_rows)

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
