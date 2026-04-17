import type { DashboardChartMocks } from "../../Backend/dashboardMocks/types";

type CurtailmentRouteData = {
  rows: Array<{
    timestamp: string;
    poolPriceCadPerMWh: number;
    curtailmentGapMWh: number;
  }>;
  summary: { hours: number; totalGapMWh: number };
};

type LoadRouteData = {
  capturedMWh: number;
  releasedMWh: number;
  estimatedGrossRevenueCad: number;
};

type NetworkRouteData = {
  distanceToPopKm: number;
  estimatedLatencyMs: number;
  workloads: { inference: boolean; training: boolean };
};

export function buildCurtailmentSeries(data: CurtailmentRouteData, mock: DashboardChartMocks) {
  return {
    hourly: data.rows.map((row) => ({
      timestamp: row.timestamp,
      gapMWh: row.curtailmentGapMWh,
      priceCadPerMWh: row.poolPriceCadPerMWh,
    })),
    monthly: mock.curtailmentMonthly,
    monthlyProfile: mock.monthlyCurtailmentProfile,
    avgTrend: mock.curtailmentAvgTrend,
    eventDuration: mock.curtailmentEventDuration,
    scadaHourlyWindMs: mock.scadaHourlyWindMs,
  };
}

export function buildLoadStorageSeries(data: LoadRouteData, mock: DashboardChartMocks) {
  return {
    energyMix: [
      { name: "Captured", value: data.capturedMWh },
      { name: "Released", value: data.releasedMWh },
    ],
    sweep: mock.batterySweep,
    dispatchTimeline: mock.dispatchTimeline,
  };
}

export function buildNetworkSeries(data: NetworkRouteData) {
  return {
    thresholds: [
      { name: "Estimated", latencyMs: data.estimatedLatencyMs },
      { name: "Inference Max", latencyMs: 20 },
      { name: "Training Max", latencyMs: 150 },
    ],
  };
}
