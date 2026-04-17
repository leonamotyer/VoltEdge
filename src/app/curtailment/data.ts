import { aesoRepository } from "@/app/Backend/aeso/aesoRepository";
import { scadaRepository } from "@/app/Backend/scada/scadaRepository";
import { turbineRepository } from "@/app/Backend/turbine/turbineRepository";
import { demoCurtailmentWindow, DEMO_SITE_ID } from "@/app/frontEnd/demoSite";
import { buildCurtailmentView } from "@/app/Backend/derived/siteAnalytics";

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
