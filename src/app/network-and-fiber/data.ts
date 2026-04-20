import { aesoRepository } from "@/lib/backend/aeso/aesoRepository";
import { scadaRepository } from "@/lib/backend/scada/scadaRepository";
import { turbineRepository } from "@/lib/backend/turbine/turbineRepository";
import { DEMO_SITE_ID } from "@/lib/frontend/demoSite";
import { evaluateNetworkFiber, type NetworkFiberRequest } from "@/lib/backend/derived/siteAnalytics";

const DEMO_DISTANCE_TO_FIBER_POP_KM = 120;

const demoNetworkFiberRequest: NetworkFiberRequest = {
  siteId: DEMO_SITE_ID,
  inferenceMaxLatencyMs: 20,
  trainingMaxLatencyMs: 150,
};

export function loadNetworkAndFiberPageData() {
  const view = evaluateNetworkFiber(demoNetworkFiberRequest, DEMO_DISTANCE_TO_FIBER_POP_KM);

  return {
    ...view,
    rawDataByRepository: {
      note: "This route does not run the curtailment merge; snapshots show where live data would be sourced.",
      aeso: { ...aesoRepository.getExportSnapshot(), hourlyMarket: [] },
      turbine: turbineRepository.getExportSnapshot(),
      scada: { ...scadaRepository.getExportSnapshot(), hourlyScada: [] },
    },
  };
}
