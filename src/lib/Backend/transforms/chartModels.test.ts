import { describe, expect, it } from "vitest";
import type { DashboardChartMocks } from "../dashboardMocks/types";
import {
  buildCurtailmentSeries,
  buildLoadStorageSeries,
  buildNetworkSeries,
} from "./chartModels";

const emptyMocks: DashboardChartMocks = {
  curtailmentMonthly: [],
  monthlyCurtailmentProfile: [],
  curtailmentAvgTrend: [],
  curtailmentEventDuration: [],
  scadaHourlyWindMs: [],
  batterySweep: [],
  dispatchTimeline: [],
};

describe("chart models", () => {
  it("builds curtailment chart series from route data", () => {
    const result = buildCurtailmentSeries(
      {
        rows: [
          {
            timestamp: "2026-01-01T00:00:00Z",
            poolPriceCadPerMWh: -5,
            curtailmentGapMWh: 10,
          },
        ],
        summary: { hours: 1, totalGapMWh: 10 },
      },
      {
        ...emptyMocks,
        curtailmentMonthly: [{ month: "2026-01", totalCurtailmentMWh: 42 }],
        monthlyCurtailmentProfile: [
          {
            month: "2026-01",
            label: "Jan '26",
            totalCurtailmentMWh: 100,
            unusedEnergyMWh: 40,
          },
        ],
        curtailmentAvgTrend: [{ month: "2026-01", label: "Jan '26", avgCurtailmentMWhPerHour: 9 }],
        curtailmentEventDuration: [{ bucket: "0–2 h", hoursInBucket: 10 }],
      },
    );

    expect(result.hourly[0]).toEqual({
      timestamp: "2026-01-01T00:00:00Z",
      gapMWh: 10,
      priceCadPerMWh: -5,
    });
    expect(result.monthly[0]).toEqual({ month: "2026-01", totalCurtailmentMWh: 42 });
    expect(result.monthlyProfile[0]).toEqual({
      month: "2026-01",
      label: "Jan '26",
      totalCurtailmentMWh: 100,
      unusedEnergyMWh: 40,
    });
    expect(result.avgTrend[0].avgCurtailmentMWhPerHour).toBe(9);
    expect(result.eventDuration[0].bucket).toBe("0–2 h");
  });

  it("builds load and storage chart series from route data", () => {
    const result = buildLoadStorageSeries(
      {
        capturedMWh: 12,
        releasedMWh: 9,
        estimatedGrossRevenueCad: 900,
      },
      {
        ...emptyMocks,
        batterySweep: [
          { storageMWh: 10, estimatedGrossRevenueCad: 5000, capturedMWh: 90, releasedMWh: 80 },
        ],
      },
    );

    expect(result.energyMix).toEqual([
      { name: "Captured", value: 12 },
      { name: "Released", value: 9 },
    ]);
    expect(result.sweep[0].storageMWh).toBe(10);
  });

  it("builds network chart series from route data", () => {
    const result = buildNetworkSeries({
      distanceToPopKm: 120,
      estimatedLatencyMs: 0.6,
      workloads: { inference: true, training: true },
    });

    expect(result.thresholds).toEqual([
      { name: "Estimated", latencyMs: 0.6 },
      { name: "Inference Max", latencyMs: 20 },
      { name: "Training Max", latencyMs: 150 },
    ]);
  });
});
