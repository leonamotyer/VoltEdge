import { aesoRepository } from "@/lib/Backend/aeso/aesoRepository";
import { scadaRepository } from "@/lib/Backend/scada/scadaRepository";
import { turbineRepository } from "@/lib/Backend/turbine/turbineRepository";
import { demoCurtailmentWindow, DEMO_SITE_ID } from "@/app/frontEnd/demoSite";
import { buildCurtailmentView } from "@/app/frontEnd/derived/siteAnalytics";

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
