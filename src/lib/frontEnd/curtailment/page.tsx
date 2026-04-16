import { aesoRepository } from "../../Backend/aeso/aesoRepository";
import { scadaRepository } from "../../Backend/scada/scadaRepository";
import { turbineRepository } from "../../Backend/turbine/turbineRepository";
import { demoCurtailmentWindow, DEMO_SITE_ID } from "../demoSite";
import { buildCurtailmentView } from "../derived/siteAnalytics";

export function loadCurtailmentPageData() {
  const turbineCount = turbineRepository.getCountForSite(DEMO_SITE_ID);

  const view = buildCurtailmentView(
    {
      ...demoCurtailmentWindow,
      turbineCount,
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
