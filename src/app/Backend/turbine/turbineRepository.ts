/** One row from the Canadian Wind Turbine Database (or operator feed mapped to the same shape). */
export interface TurbineRecord {
  siteId: string;
  turbineId: string;
  province: string;
  latitude: number;
  longitude: number;
  manufacturer: string;
  model: string;
  hubHeightM: number;
  ratedCapacityMw: number;
}

const DEMO_SITE_ID = "ab-wind-1";

export class TurbineRepository {
  getDemoRecords(): TurbineRecord[] {
    const rows: TurbineRecord[] = [];
    for (let i = 1; i <= 10; i += 1) {
      rows.push({
        siteId: DEMO_SITE_ID,
        turbineId: `AB-DEMO-${String(i).padStart(3, "0")}`,
        province: "AB",
        latitude: 53.54 + i * 0.0001,
        longitude: -113.49 - i * 0.0001,
        manufacturer: "Vestas",
        model: "V150-4.2",
        hubHeightM: 105,
        ratedCapacityMw: 4.2,
      });
    }
    return rows;
  }

  getCountForSite(siteId: string): number {
    return this.getDemoRecords().filter((row) => row.siteId === siteId).length;
  }

  /** JSON-friendly snapshot for UI provenance. */
  getExportSnapshot() {
    return {
      repository: "TurbineRepository",
      dataSource: "Canadian Wind Turbine Database",
      doc: "voltedge_data_sources.md",
      dataset:
        "https://open.canada.ca/data/en/dataset/79fdad93-9025-49ad-ba16-c26d718cc070",
      mapService:
        "https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/wind_turbine_database2_en/MapServer",
      note: "Demo ten-turbine slice for one site; replace with province-filtered ESRI query.",
      turbines: this.getDemoRecords(),
    };
  }
}

export const turbineRepository = new TurbineRepository();
