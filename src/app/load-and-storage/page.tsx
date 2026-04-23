"use client";

import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { isLoadAndStorageData } from "@/frontend/dashboard/guards";
import { loadLoadAndStoragePageData } from "./data";

export default function LoadAndStoragePage() {
  return (
    <DataBoundPage
      loader={loadLoadAndStoragePageData}
      guard={isLoadAndStorageData}
      routeLabel="Load and Storage"
    >
      {(data) => (
        <DashboardLayout
          title="Load and Storage"
          subtitle="Battery storage simulation with curtailed wind energy"
        >
          <KpiGrid>
            <KpiCard
              featured
              label="Captured"
              value={`${data.capturedMWh.toLocaleString()} MWh`}
              sub="From curtailed periods"
              tone="green"
            />
            <KpiCard
              label="Released"
              value={`${data.releasedMWh.toLocaleString()} MWh`}
              sub="After round-trip losses"
              tone="blue"
            />
            <KpiCard
              label="Gross revenue"
              value={`$${data.estimatedGrossRevenueCad.toLocaleString()} CAD`}
              sub="From battery arbitrage"
              tone="orange"
            />
          </KpiGrid>
          <PanelBento>
            <section className="panel panel--data">
              <h4>Battery Simulation Results</h4>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </section>
          </PanelBento>
        </DashboardLayout>
      )}
    </DataBoundPage>
  );
}
