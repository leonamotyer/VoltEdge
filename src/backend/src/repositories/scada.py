"""SCADA telemetry repository."""
import json
from pathlib import Path
from datetime import datetime
from typing import Any
from ..models.responses import ScadaHourlyRecord


class ScadaRepository:
    """SCADA telemetry repository - site wind speed and sensors."""

    def __init__(self):
        """Initialize repository and load data from JSON file."""
        data_path = Path(__file__).parent.parent.parent / "data" / "scada_data.json"
        with open(data_path, "r") as f:
            raw_data = json.load(f)

        self._data = [
            ScadaHourlyRecord(
                timestamp=datetime.fromisoformat(record["timestamp"]),
                windSpeedMs=record["windSpeedMs"]
            )
            for record in raw_data
        ]

    def get_demo_hourly_scada(self) -> list[ScadaHourlyRecord]:
        """Return demo SCADA met series from JSON file."""
        return self._data

    def get_export_snapshot(self) -> dict[str, Any]:
        """JSON-friendly snapshot for UI provenance."""
        return {
            "repository": "ScadaRepository",
            "dataSource": "Site SCADA / operator telemetry",
            "doc": "voltedge_data_sources.md",
            "note": "Demo hub-height wind channels; replace with historian or file ingest.",
            "hourlyScada": [r.model_dump() for r in self.get_demo_hourly_scada()]
        }


# Singleton instance
scada_repository = ScadaRepository()
