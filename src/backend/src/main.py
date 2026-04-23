"""voltEdge Python Backend - FastAPI Application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.curtailment import router as curtailment_router
from .api.load_storage import router as load_storage_router
from .api.network import router as network_router
from .api.dispatch import router as dispatch_router
from .api.optimization import router as optimization_router

# Create FastAPI app
app = FastAPI(
    title="voltEdge API",
    description="Python backend for voltEdge wind energy analytics",
    version="1.0.0"
)

# Configure CORS - allow Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "voltEdge API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "checks": {
            "api": "ok",
            "repositories": "ok"
        }
    }


# Register API routers
app.include_router(curtailment_router)
app.include_router(load_storage_router)
app.include_router(network_router)
app.include_router(dispatch_router)
app.include_router(optimization_router)

# Test endpoint to verify repositories work

from .repositories.aeso import aeso_repository
from .repositories.scada import scada_repository
from .repositories.turbine import turbine_repository


@app.get("/api/test/repositories")
async def test_repositories():
    """Test endpoint to verify repositories are working."""
    return {
        "aeso": {
            "recordCount": len(aeso_repository.get_demo_hourly_market()),
            "sample": aeso_repository.get_demo_hourly_market()[0].model_dump()
        },
        "scada": {
            "recordCount": len(scada_repository.get_demo_hourly_scada()),
            "sample": scada_repository.get_demo_hourly_scada()[0].model_dump()
        },
        "turbine": {
            "recordCount": len(turbine_repository.get_demo_records()),
            "sample": turbine_repository.get_demo_records()[0].model_dump()
        }
    }
