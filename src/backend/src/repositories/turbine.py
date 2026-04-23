"""Turbine database repository."""
import json
from pathlib import Path
from typing import Any
from ..models.responses import TurbineRecord

DEMO_SITE_ID = "ab-wind-1"


class TurbineRepository:
    """Turbine database repository - specifications and location."""

    def __init__(self):
        """Initialize repository and load data from JSON file."""
        data_path = Path(__file__).parent.parent.parent / "data" / "turbine_data.json"
        with open(data_path, "r") as f:
            raw_data = json.load(f)

        self._data = [
            TurbineRecord(
                siteId=record["siteId"],
                turbineId=record["turbineId"],
                province=record["province"],
                latitude=record["latitude"],
                longitude=record["longitude"],
                manufacturer=record["manufacturer"],
                model=record["model"],
                hubHeightM=record["hubHeightM"],
                ratedCapacityMw=record["ratedCapacityMw"]
            )
            for record in raw_data
        ]

    def get_demo_records(self) -> list[TurbineRecord]:
        """Return demo turbine records from JSON file."""
        return self._data

    def get_count_for_site(self, site_id: str) -> int:
        """Get turbine count for a specific site."""
        return len([r for r in self.get_demo_records() if r.siteId == site_id])

    def get_export_snapshot(self) -> dict[str, Any]:
        """JSON-friendly snapshot for UI provenance."""
        return {
            "repository": "TurbineRepository",
            "dataSource": "Canadian Wind Turbine Database",
            "doc": "voltedge_data_sources.md",
            "dataset": "https://open.canada.ca/data/en/dataset/79fdad93-9025-49ad-ba16-c26d718cc070",
            "mapService": "https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/wind_turbine_database2_en/MapServer",
            "note": "Demo ten-turbine slice for one site; replace with province-filtered ESRI query.",
            "turbines": [r.model_dump() for r in self.get_demo_records()]
        }


# Singleton instance
turbine_repository = TurbineRepository()
