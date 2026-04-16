/**
 * Chart-only mock: hour-of-day rollup for SCADA-derived wind (not live historian).
 * Keeps chart code decoupled from `ScadaRepository` demo time series length.
 */
export function getScadaHourlyWindProfileMock() {
  return [
    { hour: 0, avgWindMs: 8.1 },
    { hour: 6, avgWindMs: 7.4 },
    { hour: 12, avgWindMs: 9.2 },
    { hour: 18, avgWindMs: 8.6 },
  ];
}
