import type { IScadaRepository } from "../repositories/interfaces";

/** One aligned SCADA / site telemetry row (demo shape — expand with power, yaw, etc. when wired). */
export interface ScadaHourlyRecord {
  timestamp: string;
  /** Hub-height wind speed (m/s) or equivalent met channel used for simple modeled output. */
  windSpeedMs: number;
}

export class ScadaRepository implements IScadaRepository {
  /** Demo SCADA met series aligned to AESO demo timestamps. */
  getDemoHourlyScada(): ScadaHourlyRecord[] {
    return [
      { timestamp: "2026-01-01T00:00:00Z", windSpeedMs: 10 },
      { timestamp: "2026-01-01T01:00:00Z", windSpeedMs: 8 },
    ];
  }

  getExportSnapshot() {
    return {
      repository: "ScadaRepository",
      dataSource: "Site SCADA / operator telemetry",
      doc: "voltedge_data_sources.md",
      note: "Demo hub-height wind channels; replace with historian or file ingest.",
      hourlyScada: this.getDemoHourlyScada(),
    };
  }
}

export const scadaRepository = new ScadaRepository();
