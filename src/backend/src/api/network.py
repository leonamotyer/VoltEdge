"""Network fiber analysis API endpoints."""
from fastapi import APIRouter, HTTPException
from ..models.requests import NetworkFiberRequest
from ..analytics.site_analytics import evaluate_network_fiber

router = APIRouter(prefix="/api/network", tags=["network"])


@router.post("/view")
async def get_network_evaluation(request: NetworkFiberRequest):
    """
    Evaluate network fiber connectivity for a remote wind site.

    Calculates:
    - Distance from site to data center
    - Estimated latency (5ms per 1000km)
    - Workload suitability (inference vs training)

    Args:
        request: Site and data center coordinates

    Returns:
        Distance, latency, and suitability assessment

    Note:
        Currently uses a demo distance value of 100.0 km. Future versions will
        calculate distance from site coordinates to actual PoP locations.
    """
    try:
        # Use demo distance for now (100 km to nearest PoP)
        demo_distance_km = 100.0

        result = evaluate_network_fiber(request, demo_distance_km)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
