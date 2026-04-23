/**
 * Load and storage data loader - uses mock data until Python backend is running.
 */
export async function loadLoadAndStoragePageData() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    capturedMWh: 847.3,
    releasedMWh: 719.2,
    estimatedGrossRevenueCad: 48750,
    rawDataByRepository: {
      aeso: { recordCount: 8760, source: "mock" },
      turbine: { count: 10, model: "V150-4.2" },
      scada: { recordCount: 8760, source: "mock" },
    },
  };
}
