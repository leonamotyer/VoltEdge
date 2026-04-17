"use client";

import { isNetworkData } from "@/app/frontEnd/dashboard/guards";
import { buildNetworkSeries } from "@/app/Backend/transforms/chartModels";
import { InvalidDataPanel } from "@/app/frontEnd/ui/components/InvalidDataPanel";
import { KpiCard } from "@/app/frontEnd/ui/components/KpiCard";
import { SimpleBarChart } from "@/app/frontEnd/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/app/frontEnd/ui/chartTheme";
import { loadNetworkAndFiberPageData } from "./data";

export default function NetworkAndFiberPage() {
  const data = loadNetworkAndFiberPageData();

  if (!isNetworkData(data)) {
    return (
      <>
        <h3 className="section-header">Network and Fiber Feasibility</h3>
        <InvalidDataPanel routeLabel="Network and Fiber Feasibility" data={data} />
      </>
    );
  }

  const view = data;
  const series = buildNetworkSeries(view);

  return (
    <>
      <h3 className="section-header">Network and Fiber Feasibility</h3>
      <div className="energy-dashboard">
        <div className="kpi-grid">
          <KpiCard
            featured
            label="Distance to Fiber PoP"
            value={`${view.distanceToPopKm.toFixed(1)} km`}
            sub="Estimated nearest point of presence"
            tone="blue"
          />
          <KpiCard label="Estimated Latency" value={`${view.estimatedLatencyMs.toFixed(3)} ms`} sub="Using simple 5 us per km assumption" tone="orange" />
          <KpiCard
            label="Workload Feasibility"
            value={`${view.workloads.inference ? "Inference OK" : "Inference No"}`}
            sub={view.workloads.training ? "Training OK" : "Training No"}
            tone={view.workloads.inference ? "green" : "red"}
          />
        </div>
        <div className="panel-bento">
          <section className="panel panel--chart">
            <h4>Latency vs Thresholds</h4>
            <SimpleBarChart data={series.thresholds} xKey="name" yKey="latencyMs" color={CHART_BLUE} />
          </section>
        </div>
        {"rawDataByRepository" in view && view.rawDataByRepository ? (
          <section className="panel panel--data">
            <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
            <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
          </section>
        ) : null}
        <section className="panel panel--data">
          <h4>Computed scenario</h4>
          <pre>
            {JSON.stringify(
              {
                distanceToPopKm: view.distanceToPopKm,
                estimatedLatencyMs: view.estimatedLatencyMs,
                workloads: view.workloads,
              },
              null,
              2,
            )}
          </pre>
        </section>
      </div>
    </>
  );
}
