"""Site analytics - curtailment, load storage, and network fiber analysis."""
from typing import Any
from datetime import datetime, timedelta
from ..models.requests import CurtailmentSiteRequest, LoadStorageRequest, NetworkFiberRequest
from ..models.responses import AesoHourlyMarketRecord, ScadaHourlyRecord


class CurtailmentRow:
    """Single row in curtailment analysis."""
    def __init__(
        self,
        timestamp: str,
        pool_price_cad_per_mwh: float,
        actual_generation_mwh: float,
        modeled_generation_mwh: float,
        curtailment_gap_mwh: float
    ):
        self.timestamp = timestamp
        self.poolPriceCadPerMWh = pool_price_cad_per_mwh
        self.actualGenerationMWh = actual_generation_mwh
        self.modeledGenerationMWh = modeled_generation_mwh
        self.curtailmentGapMWh = curtailment_gap_mwh
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "poolPriceCadPerMWh": self.poolPriceCadPerMWh,
            "actualGenerationMWh": self.actualGenerationMWh,
            "modeledGenerationMWh": self.modeledGenerationMWh,
            "curtailmentGapMWh": self.curtailmentGapMWh,
        }


def build_curtailment_view(
    request: CurtailmentSiteRequest,
    market_rows: list[AesoHourlyMarketRecord],
    scada_rows: list[ScadaHourlyRecord],
) -> dict[str, Any]:
    """Build curtailment analysis view with gap calculations."""
    validate_curtailment_request(request)
    
    rows = build_curtailment_rows(market_rows, scada_rows, request.turbineCount)
    total_gap_mwh = sum(row.curtailmentGapMWh for row in rows)
    
    return {
        "rows": [row.to_dict() for row in rows],
        "summary": {
            "hours": len(rows),
            "totalGapMWh": total_gap_mwh,
        }
    }


def simulate_load_storage(
    request: LoadStorageRequest,
    market_rows: list[AesoHourlyMarketRecord],
    scada_rows: list[ScadaHourlyRecord],
) -> dict[str, float]:
    """Simulate battery storage capture and release."""
    validate_curtailment_request(request)
    assert_finite_positive(request.batteryPowerMw, "Invalid batteryPowerMw")
    assert_finite_positive(request.batteryDurationHours, "Invalid batteryDurationHours")
    
    if request.roundTripEfficiency <= 0 or request.roundTripEfficiency > 1:
        raise ValueError("Invalid roundTripEfficiency")
    
    curtailment = build_curtailment_view(request, market_rows, scada_rows)
    rows = [CurtailmentRow(**r) for r in curtailment["rows"]]
    
    storage_mwh = request.batteryPowerMw * request.batteryDurationHours
    state_of_charge_mwh = 0.0
    captured_mwh = 0.0
    released_mwh = 0.0
    estimated_gross_revenue_cad = 0.0
    
    for row in rows:
        # Charge battery from curtailment
        available_headroom_mwh = max(0, storage_mwh - state_of_charge_mwh)
        charge_mwh = min(row.curtailmentGapMWh, request.batteryPowerMw, available_headroom_mwh)
        state_of_charge_mwh += charge_mwh
        captured_mwh += charge_mwh
        
        # Discharge battery when price is positive
        if row.poolPriceCadPerMWh > 0 and state_of_charge_mwh > 0:
            discharge_mwh = min(state_of_charge_mwh, request.batteryPowerMw)
            state_of_charge_mwh -= discharge_mwh
            
            delivered_mwh = discharge_mwh * request.roundTripEfficiency
            released_mwh += delivered_mwh
            estimated_gross_revenue_cad += delivered_mwh * row.poolPriceCadPerMWh
    
    return {
        "capturedMWh": captured_mwh,
        "releasedMWh": released_mwh,
        "estimatedGrossRevenueCad": estimated_gross_revenue_cad,
    }


def evaluate_network_fiber(
    request: NetworkFiberRequest,
    distance_to_pop_km: float,
) -> dict[str, Any]:
    """Evaluate network fiber latency and workload suitability."""
    if not request.siteId.strip():
        raise ValueError("Invalid siteId")
    
    assert_finite_positive(request.inferenceMaxLatencyMs, "Invalid inferenceMaxLatencyMs")
    assert_finite_positive(request.trainingMaxLatencyMs, "Invalid trainingMaxLatencyMs")
    assert_finite_positive(distance_to_pop_km, "Invalid distanceToPopKm")
    
    estimated_latency_ms = round(distance_to_pop_km * 0.005, 3)
    
    return {
        "distanceToPopKm": distance_to_pop_km,
        "estimatedLatencyMs": estimated_latency_ms,
        "workloads": {
            "inference": estimated_latency_ms <= request.inferenceMaxLatencyMs,
            "training": estimated_latency_ms <= request.trainingMaxLatencyMs,
        }
    }


def build_curtailment_rows(
    market_rows: list[AesoHourlyMarketRecord],
    scada_rows: list[ScadaHourlyRecord],
    turbine_count: int,
) -> list[CurtailmentRow]:
    """Build curtailment rows by joining market and SCADA data."""
    assert_finite_positive(turbine_count, "Invalid turbineCount")
    
    # Create lookup map for SCADA data
    scada_by_timestamp = {
        row.timestamp.isoformat() + "Z": row
        for row in scada_rows
    }
    
    rows = []
    for market_row in market_rows:
        timestamp_key = market_row.timestamp.isoformat() + "Z"
        scada_row = scada_by_timestamp.get(timestamp_key)

        if not scada_row:
            continue

        modeled_per_turbine_mwh = modeled_output_per_turbine(scada_row.windSpeedMs)
        modeled_generation_mwh = modeled_per_turbine_mwh * turbine_count
        curtailment_gap_mwh = max(0, modeled_generation_mwh - market_row.actualGenerationMWh)

        rows.append(CurtailmentRow(
            timestamp=timestamp_key,
            pool_price_cad_per_mwh=market_row.poolPriceCadPerMWh,
            actual_generation_mwh=market_row.actualGenerationMWh,
            modeled_generation_mwh=modeled_generation_mwh,
            curtailment_gap_mwh=curtailment_gap_mwh,
        ))

    # Sort by timestamp
    rows.sort(key=lambda r: r.timestamp)
    return rows


def modeled_output_per_turbine(wind_speed_ms: float) -> float:
    """Simple wind speed to power model."""
    if not isinstance(wind_speed_ms, (int, float)) or wind_speed_ms <= 5:
        return 0.0
    return min(wind_speed_ms - 5, 5)


def validate_curtailment_request(request: CurtailmentSiteRequest) -> None:
    """Validate curtailment request parameters."""
    if not isinstance(request.latitude, (int, float)) or request.latitude < -90 or request.latitude > 90:
        raise ValueError("Invalid latitude")

    if not isinstance(request.longitude, (int, float)) or request.longitude < -180 or request.longitude > 180:
        raise ValueError("Invalid longitude")

    # Parse ISO timestamps
    try:
        start = datetime.fromisoformat(request.startIso.replace('Z', '+00:00'))
        end = datetime.fromisoformat(request.endIso.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        raise ValueError("Invalid date range")

    if start > end:
        raise ValueError("Invalid date range")

    max_range = timedelta(days=366)
    if end - start > max_range:
        raise ValueError("Date range too large")

    assert_finite_positive(request.turbineCount, "Invalid turbineCount")


def assert_finite_positive(value: float | int, message: str) -> None:
    """Assert value is finite and positive."""
    if not isinstance(value, (int, float)) or value <= 0:
        raise ValueError(message)
