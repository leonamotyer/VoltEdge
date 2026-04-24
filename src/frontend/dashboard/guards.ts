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
  socTimeSeries: Array<{ timestamp: string; socPercent: number; capacityUsedMWh: number }>;
  chargeDischargeCycles: Array<{
    timestamp: string;
    chargeMw: number;
    dischargeMw: number;
    poolPrice: number;
  }>;
  energyMix: {
    curtailedWindMWh: number;
    batteryDischargeMWh: number;
    gridImportMWh: number;
    btfMWh: number;
    totalMWh: number;
  };
  rawDataByRepository?: { aeso: unknown; turbine: unknown; scada?: unknown };
} {
  if (
    !isObject(value) ||
    typeof value.capturedMWh !== "number" ||
    typeof value.releasedMWh !== "number" ||
    typeof value.estimatedGrossRevenueCad !== "number" ||
    !Array.isArray(value.socTimeSeries) ||
    value.socTimeSeries.length === 0 ||
    !Array.isArray(value.chargeDischargeCycles) ||
    value.chargeDischargeCycles.length === 0 ||
    !isObject(value.energyMix) ||
    typeof value.energyMix.curtailedWindMWh !== "number" ||
    typeof value.energyMix.batteryDischargeMWh !== "number" ||
    typeof value.energyMix.gridImportMWh !== "number" ||
    typeof value.energyMix.btfMWh !== "number" ||
    typeof value.energyMix.totalMWh !== "number"
  ) {
    return false;
  }

  const sampleSoc = value.socTimeSeries[0];
  if (!isObject(sampleSoc)) {
    return false;
  }

  const sampleCycle = value.chargeDischargeCycles[0];
  if (!isObject(sampleCycle)) {
    return false;
  }

  return (
    typeof sampleSoc.timestamp === "string" &&
    typeof sampleSoc.socPercent === "number" &&
    typeof sampleSoc.capacityUsedMWh === "number" &&
    typeof sampleCycle.timestamp === "string" &&
    typeof sampleCycle.chargeMw === "number" &&
    typeof sampleCycle.dischargeMw === "number" &&
    typeof sampleCycle.poolPrice === "number"
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
