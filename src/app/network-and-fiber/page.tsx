"use client";

import { isNetworkData } from "@/frontend/dashboard/guards";
import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/frontend/ui/chartTheme";
import { loadNetworkAndFiberPageData } from "./data";

export default function NetworkAndFiberPage() {
  return (
    <DataBoundPage
      loader={loadNetworkAndFiberPageData}
      guard={isNetworkData}
      routeLabel="Network and Fiber Feasibility"
    >
      {(data) => {
        // Build threshold comparison data
        const thresholdData = [
          { name: "Estimated", latencyMs: data.estimatedLatencyMs },
          { name: "Inference Max", latencyMs: 20 },
          { name: "Training Max", latencyMs: 150 },
        ];

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
              <section className="panel panel--chart">
                <h4>Latency vs Thresholds</h4>
                <SimpleBarChart data={thresholdData} xKey="name" yKey="latencyMs" color={CHART_BLUE} />
              </section>
            </PanelBento>
            {"rawDataByRepository" in data && data.rawDataByRepository ? (
              <section className="panel panel--data">
                <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
                <pre>{JSON.stringify(data.rawDataByRepository, null, 2)}</pre>
              </section>
            ) : null}
            <section className="panel panel--data">
              <h4>Computed scenario</h4>
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
