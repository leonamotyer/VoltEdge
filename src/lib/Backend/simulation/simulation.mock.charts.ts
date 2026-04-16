/**
 * Mock outputs from the dispatch + storage sizing layer (same conceptual home as siteAnalytics extensions).
 * Not from an external vendor API.
 */
export function getBatterySweepMock() {
  return [
    { storageMWh: 5, estimatedGrossRevenueCad: 5500, capturedMWh: 80, releasedMWh: 72 },
    { storageMWh: 10, estimatedGrossRevenueCad: 9800, capturedMWh: 120, releasedMWh: 108 },
    { storageMWh: 20, estimatedGrossRevenueCad: 15400, capturedMWh: 185, releasedMWh: 166.5 },
    { storageMWh: 40, estimatedGrossRevenueCad: 21100, capturedMWh: 240, releasedMWh: 216 },
  ];
}

export function getDispatchTimelineMock() {
  return [
    {
      timestamp: "2026-01-01T00:00:00Z",
      poolPriceCadPerMWh: -5,
      chargeMWh: 10,
      dischargeMWh: 0,
      stateOfChargeMWh: 10,
    },
    {
      timestamp: "2026-01-01T01:00:00Z",
      poolPriceCadPerMWh: 90,
      chargeMWh: 0,
      dischargeMWh: 9,
      stateOfChargeMWh: 1,
    },
  ];
}
