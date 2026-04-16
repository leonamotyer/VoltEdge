/**
 * Mock chart series that would be built from AESO pool price + generation / curtailment aggregates.
 * Replace with real ETL from CSV or APIM when wired.
 */
export function getAesoCurtailmentMonthlyMock() {
  return [
    { month: "2026-01", totalCurtailmentMWh: 420.5 },
    { month: "2026-02", totalCurtailmentMWh: 388.2 },
    { month: "2026-03", totalCurtailmentMWh: 451.7 },
    { month: "2026-04", totalCurtailmentMWh: 402.4 },
  ];
}
