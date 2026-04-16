import { getAesoCurtailmentMonthlyMock } from "../aeso/aeso.mock.charts";
import { getScadaHourlyWindProfileMock } from "../scada/scada.mock.charts";
import { getBatterySweepMock, getDispatchTimelineMock } from "../simulation/simulation.mock.charts";
import type { DashboardChartMocks } from "./types";

/** Composed mock payloads for dashboard charts, grouped by backend source. */
export function getDashboardChartMocks(): DashboardChartMocks {
  return {
    curtailmentMonthly: getAesoCurtailmentMonthlyMock(),
    scadaHourlyWindMs: getScadaHourlyWindProfileMock(),
    batterySweep: getBatterySweepMock(),
    dispatchTimeline: getDispatchTimelineMock(),
  };
}

export type { DashboardChartMocks } from "./types";
