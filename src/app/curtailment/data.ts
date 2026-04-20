import { aesoRepository } from "@/lib/backend/aeso/aesoRepository";
import { scadaRepository } from "@/lib/backend/scada/scadaRepository";
import { turbineRepository } from "@/lib/backend/turbine/turbineRepository";
import { demoCurtailmentWindow, DEMO_SITE_ID } from "@/lib/frontend/demoSite";
import { buildCurtailmentView } from "@/lib/backend/derived/siteAnalytics";

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
