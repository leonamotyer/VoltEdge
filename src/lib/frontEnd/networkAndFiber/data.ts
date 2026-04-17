import { aesoRepository } from "../../Backend/aeso/aesoRepository";
import { scadaRepository } from "../../Backend/scada/scadaRepository";
import { turbineRepository } from "../../Backend/turbine/turbineRepository";
import { DEMO_SITE_ID } from "../demoSite";
import { evaluateNetworkFiber, type NetworkFiberRequest } from "../derived/siteAnalytics";

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
