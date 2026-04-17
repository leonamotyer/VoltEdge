/**
 * Mock chart series that would be built from AESO pool price + generation / curtailment aggregates.
 * Replace with real ETL from CSV or APIM when wired.
 */

/** @deprecated Use monthlyCurtailmentProfile for richer charts; kept for single-series callers if needed. */
export function getAesoCurtailmentMonthlyMock() {
  return getMonthlyCurtailmentProfileMock().map(({ month, totalCurtailmentMWh }) => ({
    month,
    totalCurtailmentMWh,
  }));
}

/** Monthly profile: total curtailment gap vs modeled unused energy (would-be generation not dispatched). */
export function getMonthlyCurtailmentProfileMock() {
  return [
    { month: "2026-01", label: "Jan '26", totalCurtailmentMWh: 420.5, unusedEnergyMWh: 186.2 },
    { month: "2026-02", label: "Feb '26", totalCurtailmentMWh: 388.2, unusedEnergyMWh: 171.4 },
    { month: "2026-03", label: "Mar '26", totalCurtailmentMWh: 451.7, unusedEnergyMWh: 198.8 },
    { month: "2026-04", label: "Apr '26", totalCurtailmentMWh: 402.4, unusedEnergyMWh: 176.1 },
    { month: "2026-05", label: "May '26", totalCurtailmentMWh: 435.0, unusedEnergyMWh: 189.3 },
    { month: "2026-06", label: "Jun '26", totalCurtailmentMWh: 468.3, unusedEnergyMWh: 204.1 },
  ];
}

/** Rolling / reported average curtailment intensity (MWh per hour) — trend mock. */
export function getCurtailmentAvgTrendMock() {
  return [
    { month: "2026-01", label: "Jan '26", avgCurtailmentMWhPerHour: 11.2 },
    { month: "2026-02", label: "Feb '26", avgCurtailmentMWhPerHour: 10.4 },
    { month: "2026-03", label: "Mar '26", avgCurtailmentMWhPerHour: 12.1 },
    { month: "2026-04", label: "Apr '26", avgCurtailmentMWhPerHour: 10.8 },
    { month: "2026-05", label: "May '26", avgCurtailmentMWhPerHour: 11.6 },
    { month: "2026-06", label: "Jun '26", avgCurtailmentMWhPerHour: 12.4 },
  ];
}

/** Histogram of curtailment event lengths (hours accumulated per duration bucket) — mock. */
export function getCurtailmentEventDurationMock() {
  return [
    { bucket: "0–2 h", hoursInBucket: 38 },
    { bucket: "2–6 h", hoursInBucket: 112 },
    { bucket: "6–12 h", hoursInBucket: 156 },
    { bucket: "12–24 h", hoursInBucket: 94 },
    { bucket: "24+ h", hoursInBucket: 41 },
  ];
}
