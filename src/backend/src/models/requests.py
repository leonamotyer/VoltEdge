"""Request models for voltEdge API."""
from typing import Literal
from pydantic import BaseModel, Field


class CurtailmentSiteRequest(BaseModel):
    """Request for curtailment analysis."""
    latitude: float
    longitude: float
    startIso: str = Field(alias="startIso", description="Start time in ISO format")
    endIso: str = Field(alias="endIso", description="End time in ISO format")
    turbineCount: int = Field(alias="turbineCount", gt=0)

    class Config:
        populate_by_name = True


class LoadStorageRequest(BaseModel):
    """Request for load/storage analysis - extends CurtailmentSiteRequest."""
    latitude: float
    longitude: float
    startIso: str = Field(alias="startIso")
    endIso: str = Field(alias="endIso")
    turbineCount: int = Field(alias="turbineCount", gt=0)
    batteryPowerMw: float = Field(alias="batteryPowerMw", gt=0)
    batteryDurationHours: float = Field(alias="batteryDurationHours", gt=0)
    roundTripEfficiency: float = Field(alias="roundTripEfficiency", gt=0, le=1.0)

    class Config:
        populate_by_name = True


class NetworkFiberRequest(BaseModel):
    """Request for network/fiber analysis."""
    siteId: str = Field(alias="siteId")
    inferenceMaxLatencyMs: int = Field(alias="inferenceMaxLatencyMs", gt=0)
    trainingMaxLatencyMs: int = Field(alias="trainingMaxLatencyMs", gt=0)

    class Config:
        populate_by_name = True


class DispatchRequest(BaseModel):
    """
    Comprehensive request model for dispatch simulation with financial calculations.

    This model captures all parameters needed for:
    1. Dispatch optimization (energy sourcing priorities)
    2. CAPEX calculations (hardware costs)
    3. Financial analysis (ROI, payback, profit)

    GPU Configuration:
        - gpu_mw: Total GPU electrical load
        - gpu_type: GPU model (RTX 3090, RTX 5090, A6000, PRO 6000)
        - unit_price_override: Optional custom GPU unit price
        - rental_hr_override: Optional custom rental rate

    Battery Specifications:
        - batt_mwh: Battery energy capacity
        - batt_p_mw: Battery power rating (charge/discharge limit)
        - eta_c: Charging efficiency (default 0.95)
        - eta_d: Discharging efficiency (default 0.95)

    Grid/BTF Capacity and Pricing:
        - grid_cap_mw: Maximum grid import capacity
        - btf_cap_mw: Maximum behind-the-fence supply capacity
        - btf_price: BTF energy price (CAD/MWh)
        - curt_price: Curtailment purchase price (USD/MWh)

    Financial Parameters:
        - discount_rate: Annual discount rate for NPV calculations
        - project_life: Project lifetime for annualization
    """
    # GPU configuration
    gpu_mw: float = Field(..., gt=0, description="GPU electrical load (MW)")
    gpu_type: Literal["RTX 3090", "RTX 5090", "A6000", "PRO 6000"] = Field(
        "RTX 5090", description="GPU model (RTX 3090, RTX 5090, A6000, PRO 6000)"
    )
    unit_price_override: float | None = Field(None, description="Custom GPU unit price (CAD)")
    rental_hr_override: float | None = Field(None, description="Custom rental rate (CAD/hr)")

    # Battery specifications
    batt_mwh: float = Field(..., ge=0, description="Battery energy capacity (MWh)")
    batt_p_mw: float = Field(..., ge=0, description="Battery power rating (MW)")
    eta_c: float = Field(0.95, gt=0, le=1, description="Battery charging efficiency (0-1)")
    eta_d: float = Field(0.95, gt=0, le=1, description="Battery discharging efficiency (0-1)")

    # Grid/BTF caps and prices
    grid_cap_mw: float = Field(..., ge=0, description="Grid import capacity (MW)")
    btf_cap_mw: float = Field(..., ge=0, description="BTF supply capacity (MW)")
    btf_price: float = Field(..., ge=0, description="BTF price (CAD/MWh)")
    curt_price: float = Field(..., ge=0, description="Curtailment price (USD/MWh)")

    # Financial parameters
    discount_rate: float = Field(0.08, ge=0, le=1, description="Discount rate (0-1)")
    project_life: int = Field(12, ge=1, le=30, description="Project lifetime (years)")


class BatterySweepRequest(BaseModel):
    """Request model for battery sizing optimization."""
    # GPU configuration
    gpu_mw: float = Field(..., gt=0, description="GPU load (MW)")
    gpu_type: Literal["RTX 3090", "RTX 5090", "A6000", "PRO 6000"] = Field(
        "RTX 5090", description="GPU model"
    )

    # Grid and BTF configuration
    grid_cap_mw: float = Field(..., ge=0, description="Grid import capacity (MW)")
    btf_cap_mw: float = Field(..., ge=0, description="Behind-the-fence capacity (MW)")
    btf_price: float = Field(..., gt=0, description="BTF price (CAD/MWh)")
    curt_price: float = Field(..., gt=0, description="Curtailment price (USD/MWh)")

    # Financial parameters
    discount_rate: float = Field(0.08, gt=0, description="Discount rate (e.g., 0.08 for 8%)")
    project_life: int = Field(12, gt=0, description="Project lifetime (years)")
    unit_price_override: float | None = Field(None, description="Custom GPU unit price (CAD)")
    rental_hr_override: float | None = Field(None, description="Custom rental rate (CAD/hr)")


class GpuSweepRequest(BaseModel):
    """Request model for GPU rack count optimization."""
    # Battery configuration (fixed for sweep)
    batt_mwh: float = Field(..., ge=0, description="Battery capacity (MWh)")
    batt_p_mw: float = Field(..., ge=0, description="Battery power (MW)")

    # GPU configuration
    gpu_type: Literal["RTX 3090", "RTX 5090", "A6000", "PRO 6000"] = Field(
        "RTX 5090", description="GPU model"
    )

    # Grid and BTF configuration
    grid_cap_mw: float = Field(..., ge=0, description="Grid import capacity (MW)")
    btf_cap_mw: float = Field(..., ge=0, description="Behind-the-fence capacity (MW)")
    btf_price: float = Field(..., gt=0, description="BTF price (CAD/MWh)")
    curt_price: float = Field(..., gt=0, description="Curtailment price (USD/MWh)")

    # Financial parameters
    discount_rate: float = Field(0.08, gt=0, description="Discount rate (e.g., 0.08 for 8%)")
    project_life: int = Field(12, gt=0, description="Project lifetime (years)")
    unit_price_override: float | None = Field(None, description="Custom GPU unit price (CAD)")
    rental_hr_override: float | None = Field(None, description="Custom rental rate (CAD/hr)")
