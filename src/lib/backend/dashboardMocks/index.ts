import {
  getAesoCurtailmentMonthlyMock,
  getCurtailmentAvgTrendMock,
  getCurtailmentEventDurationMock,
  getMonthlyCurtailmentProfileMock,
} from "../aeso/aeso.mock.charts";
import { getScadaHourlyWindProfileMock } from "../scada/scada.mock.charts";
import { getBatterySweepMock, getDispatchTimelineMock } from "../simulation/simulation.mock.charts";
import type { DashboardChartMocks } from "./types";

/** Composed mock payloads for dashboard charts, grouped by backend source. */
export function getDashboardChartMocks(): DashboardChartMocks {
  return {
    curtailmentMonthly: getAesoCurtailmentMonthlyMock(),
    monthlyCurtailmentProfile: getMonthlyCurtailmentProfileMock(),
    curtailmentAvgTrend: getCurtailmentAvgTrendMock(),
    curtailmentEventDuration: getCurtailmentEventDurationMock(),
    scadaHourlyWindMs: getScadaHourlyWindProfileMock(),
    batterySweep: getBatterySweepMock(),
    dispatchTimeline: getDispatchTimelineMock(),
  };
}

export type { DashboardChartMocks } from "./types";
