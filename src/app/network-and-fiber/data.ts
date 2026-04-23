/**
 * Network and fiber data loader - uses mock data until Python backend is running.
 */
export async function loadNetworkAndFiberPageData() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    distanceToPopKm: 12.4,
    estimatedLatencyMs: 0.062,
    workloads: {
      inference: true,
      training: true,
    },
    rawDataByRepository: {
      location: { latitude: 53.54, longitude: -113.49 },
      source: "mock",
    },
  };
}
