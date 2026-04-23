/**
 * Curtailment data loader - uses mock data until Python backend is running.
 */
export async function loadCurtailmentPageData() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    rows: [
      { timestamp: "2026-01-01T00:00:00Z", poolPriceCadPerMWh: 65.2, curtailmentGapMWh: 2.4 },
      { timestamp: "2026-01-01T01:00:00Z", poolPriceCadPerMWh: 58.1, curtailmentGapMWh: 1.8 },
      { timestamp: "2026-01-01T02:00:00Z", poolPriceCadPerMWh: 52.3, curtailmentGapMWh: 0.0 },
      { timestamp: "2026-01-01T03:00:00Z", poolPriceCadPerMWh: 48.7, curtailmentGapMWh: 0.0 },
      { timestamp: "2026-01-01T04:00:00Z", poolPriceCadPerMWh: 46.2, curtailmentGapMWh: 0.5 },
      { timestamp: "2026-01-01T05:00:00Z", poolPriceCadPerMWh: 45.1, curtailmentGapMWh: 1.2 },
      { timestamp: "2026-01-01T06:00:00Z", poolPriceCadPerMWh: 47.8, curtailmentGapMWh: 3.1 },
      { timestamp: "2026-01-01T07:00:00Z", poolPriceCadPerMWh: 53.4, curtailmentGapMWh: 2.7 },
      { timestamp: "2026-01-01T08:00:00Z", poolPriceCadPerMWh: 61.9, curtailmentGapMWh: 1.9 },
      { timestamp: "2026-01-01T09:00:00Z", poolPriceCadPerMWh: 72.5, curtailmentGapMWh: 0.0 },
    ],
    summary: { hours: 10, totalGapMWh: 13.6 },
    rawDataByRepository: {
      aeso: { recordCount: 10, source: "mock" },
      turbine: { count: 10, model: "V150-4.2" },
      scada: { recordCount: 10, source: "mock" },
    },
  };
}
