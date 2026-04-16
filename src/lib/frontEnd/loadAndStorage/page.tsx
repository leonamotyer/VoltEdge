import { aesoRepository } from "../../Backend/aeso/aesoRepository";
import { scadaRepository } from "../../Backend/scada/scadaRepository";
import { turbineRepository } from "../../Backend/turbine/turbineRepository";
import { simulateLoadStorage } from "../derived/siteAnalytics";

const DEMO_SITE_ID = "ab-wind-1";

export async function loadLoadAndStoragePageData() {
  const turbineCount = turbineRepository.getCountForSite(DEMO_SITE_ID);

  const view = simulateLoadStorage(
    {
      latitude: 53.54,
      longitude: -113.49,
      startIso: "2026-01-01T00:00:00Z",
      endIso: "2026-01-01T01:00:00Z",
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
