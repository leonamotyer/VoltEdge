import { describe, expect, it } from "vitest";
import { buildCurtailmentView, evaluateNetworkFiber, simulateLoadStorage } from "./siteAnalytics";

describe("site analytics", () => {
  const hourlyAeso = [
    { timestamp: "2026-01-01T00:00:00Z", poolPriceCadPerMWh: -5, actualGenerationMWh: 40 },
    { timestamp: "2026-01-01T01:00:00Z", poolPriceCadPerMWh: 90, actualGenerationMWh: 45 },
  ];

  const hourlyScada = [
    { timestamp: "2026-01-01T00:00:00Z", windSpeedMs: 10 },
    { timestamp: "2026-01-01T01:00:00Z", windSpeedMs: 8 },
  ];

  const baseRequest = {
    latitude: 53.54,
    longitude: -113.49,
    startIso: "2026-01-01T00:00:00Z",
    endIso: "2026-01-01T01:00:00Z",
    turbineCount: 10,
  };

  it("builds curtailment view from market and SCADA rows", () => {
    const view = buildCurtailmentView(baseRequest, hourlyAeso, hourlyScada);

    expect(view.summary.hours).toBe(2);
    expect(view.summary.totalGapMWh).toBeGreaterThan(0);
    expect(view.rows[0]).toMatchObject({
      timestamp: "2026-01-01T00:00:00Z",
      curtailmentGapMWh: 10,
    });
  });

  it("simulates load and storage from curtailment rows", () => {
    const view = simulateLoadStorage(
      {
        ...baseRequest,
        batteryPowerMw: 20,
        batteryDurationHours: 1,
        roundTripEfficiency: 0.9,
      },
      hourlyAeso,
      hourlyScada,
    );

    expect(view.capturedMWh).toBeGreaterThan(0);
    expect(view.releasedMWh).toBeGreaterThan(0);
    expect(view.estimatedGrossRevenueCad).toBeGreaterThan(0);
  });

  it("evaluates network and fiber with thresholds", () => {
    const view = evaluateNetworkFiber(
      {
        siteId: "ab-wind-1",
        inferenceMaxLatencyMs: 20,
        trainingMaxLatencyMs: 150,
      },
      120,
    );

    expect(view.distanceToPopKm).toBe(120);
    expect(view.estimatedLatencyMs).toBe(0.6);
    expect(view.workloads.inference).toBe(true);
    expect(view.workloads.training).toBe(true);
  });

  it("rejects invalid coordinates and date range", () => {
    expect(() =>
      buildCurtailmentView(
        {
          ...baseRequest,
          latitude: 200,
        },
        hourlyAeso,
        hourlyScada,
      ),
    ).toThrow("Invalid latitude");
  });
});
