import type { AesoHourlyMarketRecord } from "../aeso/aesoRepository";
import type { ScadaHourlyRecord } from "../scada/scadaRepository";

export type CurtailmentSiteRequest = {
  latitude: number;
  longitude: number;
  startIso: string;
  endIso: string;
  turbineCount: number;
};

export type CurtailmentRow = {
  timestamp: string;
  poolPriceCadPerMWh: number;
  actualGenerationMWh: number;
  modeledGenerationMWh: number;
  curtailmentGapMWh: number;
};

export type LoadStorageRequest = CurtailmentSiteRequest & {
  batteryPowerMw: number;
  batteryDurationHours: number;
  roundTripEfficiency: number;
};

export type NetworkFiberRequest = {
  siteId: string;
  inferenceMaxLatencyMs: number;
  trainingMaxLatencyMs: number;
};

export function buildCurtailmentView(
  request: CurtailmentSiteRequest,
  marketRows: AesoHourlyMarketRecord[],
  scadaRows: ScadaHourlyRecord[],
): { rows: CurtailmentRow[]; summary: { hours: number; totalGapMWh: number } } {
  validateCurtailmentRequest(request);

  const rows = buildCurtailmentRows(marketRows, scadaRows, request.turbineCount);
  const totalGapMWh = rows.reduce((sum, row) => sum + row.curtailmentGapMWh, 0);

  return {
    rows,
    summary: {
      hours: rows.length,
      totalGapMWh,
    },
  };
}

export function simulateLoadStorage(
  request: LoadStorageRequest,
  marketRows: AesoHourlyMarketRecord[],
  scadaRows: ScadaHourlyRecord[],
): { capturedMWh: number; releasedMWh: number; estimatedGrossRevenueCad: number } {
  validateCurtailmentRequest(request);
  assertFinitePositive(request.batteryPowerMw, "Invalid batteryPowerMw");
  assertFinitePositive(request.batteryDurationHours, "Invalid batteryDurationHours");
  if (request.roundTripEfficiency <= 0 || request.roundTripEfficiency > 1) {
    throw new Error("Invalid roundTripEfficiency");
  }

  const { rows } = buildCurtailmentView(request, marketRows, scadaRows);
  const storageMWh = request.batteryPowerMw * request.batteryDurationHours;

  let stateOfChargeMWh = 0;
  let capturedMWh = 0;
  let releasedMWh = 0;
  let estimatedGrossRevenueCad = 0;

  for (const row of rows) {
    const availableHeadroomMWh = Math.max(0, storageMWh - stateOfChargeMWh);
    const chargeMWh = Math.min(row.curtailmentGapMWh, request.batteryPowerMw, availableHeadroomMWh);
    stateOfChargeMWh += chargeMWh;
    capturedMWh += chargeMWh;

    if (row.poolPriceCadPerMWh > 0 && stateOfChargeMWh > 0) {
      const dischargeMWh = Math.min(stateOfChargeMWh, request.batteryPowerMw);
      stateOfChargeMWh -= dischargeMWh;

      const deliveredMWh = dischargeMWh * request.roundTripEfficiency;
      releasedMWh += deliveredMWh;
      estimatedGrossRevenueCad += deliveredMWh * row.poolPriceCadPerMWh;
    }
  }

  return {
    capturedMWh,
    releasedMWh,
    estimatedGrossRevenueCad,
  };
}

export function evaluateNetworkFiber(
  request: NetworkFiberRequest,
  distanceToPopKm: number,
): {
  distanceToPopKm: number;
  estimatedLatencyMs: number;
  workloads: { inference: boolean; training: boolean };
} {
  if (!request.siteId.trim()) {
    throw new Error("Invalid siteId");
  }
  assertFinitePositive(request.inferenceMaxLatencyMs, "Invalid inferenceMaxLatencyMs");
  assertFinitePositive(request.trainingMaxLatencyMs, "Invalid trainingMaxLatencyMs");
  assertFinitePositive(distanceToPopKm, "Invalid distanceToPopKm");

  const estimatedLatencyMs = Number((distanceToPopKm * 0.005).toFixed(3));

  return {
    distanceToPopKm,
    estimatedLatencyMs,
    workloads: {
      inference: estimatedLatencyMs <= request.inferenceMaxLatencyMs,
      training: estimatedLatencyMs <= request.trainingMaxLatencyMs,
    },
  };
}

function buildCurtailmentRows(
  marketRows: AesoHourlyMarketRecord[],
  scadaRows: ScadaHourlyRecord[],
  turbineCount: number,
): CurtailmentRow[] {
  assertFinitePositive(turbineCount, "Invalid turbineCount");

  const scadaByTimestamp = new Map(scadaRows.map((row) => [row.timestamp, row]));
  const rows: CurtailmentRow[] = [];

  for (const marketRow of marketRows) {
    const scadaRow = scadaByTimestamp.get(marketRow.timestamp);
    if (!scadaRow) {
      continue;
    }

    const modeledPerTurbineMWh = modeledOutputPerTurbine(scadaRow.windSpeedMs);
    const modeledGenerationMWh = modeledPerTurbineMWh * turbineCount;
    const curtailmentGapMWh = Math.max(0, modeledGenerationMWh - marketRow.actualGenerationMWh);

    rows.push({
      timestamp: marketRow.timestamp,
      poolPriceCadPerMWh: marketRow.poolPriceCadPerMWh,
      actualGenerationMWh: marketRow.actualGenerationMWh,
      modeledGenerationMWh,
      curtailmentGapMWh,
    });
  }

  return rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function modeledOutputPerTurbine(windSpeedMs: number): number {
  if (!Number.isFinite(windSpeedMs) || windSpeedMs <= 5) {
    return 0;
  }
  return Math.min(windSpeedMs - 5, 5);
}

function validateCurtailmentRequest(request: CurtailmentSiteRequest) {
  if (!Number.isFinite(request.latitude) || request.latitude < -90 || request.latitude > 90) {
    throw new Error("Invalid latitude");
  }
  if (!Number.isFinite(request.longitude) || request.longitude < -180 || request.longitude > 180) {
    throw new Error("Invalid longitude");
  }

  const start = Date.parse(request.startIso);
  const end = Date.parse(request.endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    throw new Error("Invalid date range");
  }

  const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (end - start > maxRangeMs) {
    throw new Error("Date range too large");
  }

  assertFinitePositive(request.turbineCount, "Invalid turbineCount");
}

function assertFinitePositive(value: number, message: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(message);
  }
}
