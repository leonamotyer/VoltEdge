export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCurtailmentData(
  value: unknown,
): value is {
  rows: Array<{ timestamp: string; poolPriceCadPerMWh: number; curtailmentGapMWh: number }>;
  summary: { hours: number; totalGapMWh: number };
  rawDataByRepository?: { aeso: unknown; turbine: unknown; scada?: unknown };
} {
  if (!isObject(value) || !isObject(value.summary) || !Array.isArray(value.rows) || value.rows.length === 0) {
    return false;
  }
  const sampleRow = value.rows[0];
  if (!isObject(sampleRow)) {
    return false;
  }
  return (
    typeof value.summary.hours === "number" &&
    typeof value.summary.totalGapMWh === "number" &&
    typeof sampleRow.timestamp === "string" &&
    typeof sampleRow.poolPriceCadPerMWh === "number" &&
    typeof sampleRow.curtailmentGapMWh === "number"
  );
}

export function isLoadAndStorageData(
  value: unknown,
): value is {
  capturedMWh: number;
  releasedMWh: number;
  estimatedGrossRevenueCad: number;
  rawDataByRepository?: { aeso: unknown; turbine: unknown; scada?: unknown };
} {
  return (
    isObject(value) &&
    typeof value.capturedMWh === "number" &&
    typeof value.releasedMWh === "number" &&
    typeof value.estimatedGrossRevenueCad === "number"
  );
}

export function isNetworkData(
  value: unknown,
): value is {
  distanceToPopKm: number;
  estimatedLatencyMs: number;
  workloads: { inference: boolean; training: boolean };
  rawDataByRepository?: unknown;
} {
  return (
    isObject(value) &&
    typeof value.distanceToPopKm === "number" &&
    typeof value.estimatedLatencyMs === "number" &&
    isObject(value.workloads) &&
    typeof value.workloads.inference === "boolean" &&
    typeof value.workloads.training === "boolean"
  );
}
