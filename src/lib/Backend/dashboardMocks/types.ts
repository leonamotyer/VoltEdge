/**
 * Chart supplements that are not yet returned by live API calls.
 * Split by backend concern so imports show where each series would originate.
 */
export type DashboardChartMocks = {
  /** Would be derived from AESO market + metered generation aggregates (demo values). */
  curtailmentMonthly: Array<{ month: string; totalCurtailmentMWh: number }>;
  /** Monthly curtailment profile: total gap vs unused energy (mock — `aeso/aeso.mock.charts.ts`). */
  monthlyCurtailmentProfile: Array<{
    month: string;
    label: string;
    totalCurtailmentMWh: number;
    unusedEnergyMWh: number;
  }>;
  /** Average curtailment rate trend (MWh/h) by month — mock. */
  curtailmentAvgTrend: Array<{ month: string; label: string; avgCurtailmentMWhPerHour: number }>;
  /** Event duration buckets (hours in bucket) — mock. */
  curtailmentEventDuration: Array<{ bucket: string; hoursInBucket: number }>;
  /** Hour-of-day rollup mock for SCADA wind profile charts (`scada/scada.mock.charts.ts`). */
  scadaHourlyWindMs: Array<{ hour: number; avgWindMs: number }>;
  /** Internal dispatch / sizing simulation (not an external API). */
  batterySweep: Array<{
    storageMWh: number;
    estimatedGrossRevenueCad: number;
    capturedMWh: number;
    releasedMWh: number;
  }>;
  /** Internal dispatch timeline (pairs with pool price from AESO path in real build). */
  dispatchTimeline: Array<{
    timestamp: string;
    poolPriceCadPerMWh: number;
    chargeMWh: number;
    dischargeMWh: number;
    stateOfChargeMWh: number;
  }>;
};
