import { aesoRepository } from "../../Backend/aeso/aesoRepository";
import { scadaRepository } from "../../Backend/scada/scadaRepository";
import { turbineRepository } from "../../Backend/turbine/turbineRepository";
import { demoCurtailmentWindow, DEMO_SITE_ID } from "../demoSite";
import { simulateLoadStorage } from "../derived/siteAnalytics";

export function loadLoadAndStoragePageData() {
  const turbineCount = turbineRepository.getCountForSite(DEMO_SITE_ID);

  const view = simulateLoadStorage(
    {
      ...demoCurtailmentWindow,
      turbineCount,
      batteryPowerMw: 20,
      batteryDurationHours: 1,
      roundTripEfficiency: 0.9,
    },
    aesoRepository.getDemoHourlyMarket(),
    scadaRepository.getDemoHourlyScada(),
  );

  return {
    ...view,
    rawDataByRepository: {
      aeso: aesoRepository.getExportSnapshot(),
      turbine: turbineRepository.getExportSnapshot(),
      scada: scadaRepository.getExportSnapshot(),
    },
  };
}
