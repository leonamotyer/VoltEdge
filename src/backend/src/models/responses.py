"""Response models for voltEdge API."""
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class AesoHourlyMarketRecord(BaseModel):
    """AESO market data record - pool price and generation."""
    timestamp: datetime
    poolPriceCadPerMWh: float = Field(alias="poolPriceCadPerMWh")
    actualGenerationMWh: float = Field(alias="actualGenerationMWh")
    
    class Config:
        populate_by_name = True  # Allow both snake_case and camelCase


class ScadaHourlyRecord(BaseModel):
    """SCADA telemetry record - wind speed and other sensors."""
    timestamp: datetime
    windSpeedMs: float = Field(alias="windSpeedMs", description="Hub-height wind speed (m/s)")
    
    class Config:
        populate_by_name = True


class TurbineRecord(BaseModel):
    """Turbine database record - specifications and location."""
    siteId: str = Field(alias="siteId")
    turbineId: str = Field(alias="turbineId")
    province: str
    latitude: float
    longitude: float
    manufacturer: str
    model: str
    hubHeightM: float = Field(alias="hubHeightM")
    ratedCapacityMw: float = Field(alias="ratedCapacityMw")
    
    class Config:
        populate_by_name = True


class CurtailmentRow(BaseModel):
    """Single row in curtailment analysis."""
    timestamp: str
    poolPriceCadPerMWh: float
    actualGenerationMWh: float
    modeledGenerationMWh: float
    curtailmentGapMWh: float


class CurtailmentView(BaseModel):
    """Complete curtailment analysis view."""
    rows: list[CurtailmentRow]
    summary: dict[str, Any]
    rawDataByRepository: dict[str, Any]
