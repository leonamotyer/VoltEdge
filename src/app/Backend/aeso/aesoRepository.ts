/** One hourly AESO-style market row (pool price + metered or aggregate generation). */
export interface AesoHourlyMarketRecord {
  timestamp: string;
  poolPriceCadPerMWh: number;
  actualGenerationMWh: number;
}

export class AesoRepository {
  getDemoHourlyMarket(): AesoHourlyMarketRecord[] {
    return [
      { timestamp: "2026-01-01T00:00:00Z", poolPriceCadPerMWh: -5, actualGenerationMWh: 40 },
      { timestamp: "2026-01-01T01:00:00Z", poolPriceCadPerMWh: 90, actualGenerationMWh: 45 },
    ];
  }

  /** JSON-friendly snapshot for UI provenance (same rows the controller consumes). */
  getExportSnapshot() {
    return {
      repository: "AesoRepository",
      dataSource: "AESO",
      doc: "voltedge_data_sources.md",
      portal: "https://developer-apim.aeso.ca/",
      note: "Demo hourly pool price and generation-shaped values; replace with APIM or published CSVs.",
      hourlyMarket: this.getDemoHourlyMarket(),
    };
  }
}

export const aesoRepository = new AesoRepository();
