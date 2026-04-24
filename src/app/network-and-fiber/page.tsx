"use client";

import { isNetworkData } from "@/frontend/dashboard/guards";
import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { LatencyThresholdChart } from "@/frontend/sections/network/LatencyThresholdChart";
import { loadNetworkAndFiberPageData } from "./data";

export default function NetworkAndFiberPage() {
  return (
    <DataBoundPage
      loader={loadNetworkAndFiberPageData}
      guard={isNetworkData}
      routeLabel="Network and Fiber Feasibility"
    >
      {(data) => {
        return (
          <DashboardLayout title="Network and Fiber Feasibility">
            <KpiGrid>
              <KpiCard
                featured
                label="Distance to Fiber PoP"
                value={`${data.distanceToPopKm.toFixed(1)} km`}
                sub="Estimated nearest point of presence"
                tone="blue"
              />
              <KpiCard
                label="Estimated Latency"
                value={`${data.estimatedLatencyMs.toFixed(3)} ms`}
                sub="Using simple 5 us per km assumption"
                tone="orange"
              />
              <KpiCard
                label="Workload Feasibility"
                value={`${data.workloads.inference ? "Inference OK" : "Inference No"}`}
                sub={data.workloads.training ? "Training OK" : "Training No"}
                tone={data.workloads.inference ? "green" : "red"}
              />
            </KpiGrid>
            <PanelBento>
              <LatencyThresholdChart estimatedLatencyMs={data.estimatedLatencyMs} />
            </PanelBento>
            {"rawDataByRepository" in data && data.rawDataByRepository ? (
              <section className="panel panel--data">
                <h3>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h3>
                <pre>{JSON.stringify(data.rawDataByRepository, null, 2)}</pre>
              </section>
            ) : null}
            <section className="panel panel--data">
              <h3>Computed scenario</h3>
              <pre>
                {JSON.stringify(
                  {
                    distanceToPopKm: data.distanceToPopKm,
                    estimatedLatencyMs: data.estimatedLatencyMs,
                    workloads: data.workloads,
                  },
                  null,
                  2,
                )}
              </pre>
            </section>
          </DashboardLayout>
        );
      }}
    </DataBoundPage>
  );
}
