"""AESO market data repository."""
import json
from pathlib import Path
from datetime import datetime
from typing import Any
from ..models.responses import AesoHourlyMarketRecord


class AesoRepository:
    """AESO market data repository - pool price and generation."""

    def __init__(self):
        """Initialize repository and load data from JSON file."""
        data_path = Path(__file__).parent.parent.parent / "data" / "aeso_market_data.json"
        with open(data_path, "r") as f:
            raw_data = json.load(f)

        self._data = [
            AesoHourlyMarketRecord(
                timestamp=datetime.fromisoformat(record["timestamp"]),
                poolPriceCadPerMWh=record["poolPriceCadPerMWh"],
                actualGenerationMWh=record["actualGenerationMWh"]
            )
            for record in raw_data
        ]

    def get_demo_hourly_market(self) -> list[AesoHourlyMarketRecord]:
        """Return demo hourly market data from JSON file."""
        return self._data

    def get_export_snapshot(self) -> dict[str, Any]:
        """JSON-friendly snapshot for UI provenance."""
        return {
            "repository": "AesoRepository",
            "dataSource": "AESO",
            "doc": "voltedge_data_sources.md",
            "portal": "https://developer-apim.aeso.ca/",
            "note": "Demo hourly pool price and generation-shaped values; replace with APIM or published CSVs.",
            "hourlyMarket": [r.model_dump() for r in self.get_demo_hourly_market()]
        }


# Singleton instance
aeso_repository = AesoRepository()
