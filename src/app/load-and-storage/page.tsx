"use client";

import { getDashboardChartMocks } from "@/lib/Backend/dashboardMocks";
import { isLoadAndStorageData } from "@/app/frontEnd/dashboard/guards";
import { buildLoadStorageSeries } from "@/app/frontEnd/transforms/chartModels";
import { InvalidDataPanel } from "@/app/frontEnd/ui/components/InvalidDataPanel";
import { KpiCard } from "@/app/frontEnd/ui/components/KpiCard";
import { SimpleLineChart, SimplePieChart } from "@/app/frontEnd/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN } from "@/app/frontEnd/ui/chartTheme";
import { loadLoadAndStoragePageData } from "./data";

const dashboardChartMocks = getDashboardChartMocks();

export default function LoadAndStoragePage() {
  const data = loadLoadAndStoragePageData();

  if (!isLoadAndStorageData(data)) {
    return (
      <>
        <h3 className="section-header">Load and Storage</h3>
        <InvalidDataPanel routeLabel="Load and Storage" data={data} />
      </>
    );
  }

  const view = data;
  const series = buildLoadStorageSeries(view, dashboardChartMocks);

  return (
    <>
      <h3 className="section-header">Load and Storage</h3>
      <div className="energy-dashboard">
        <div className="kpi-grid">
          <KpiCard
            featured
            label="Captured Energy"
            value={`${view.capturedMWh.toFixed(2)} MWh`}
            sub="Energy absorbed from curtailed periods"
            tone="green"
          />
          <KpiCard label="Released Energy" value={`${view.releasedMWh.toFixed(2)} MWh`} sub="Delivered after storage efficiency losses" tone="blue" />
          <KpiCard
            label="Estimated Gross Revenue"
            value={`$${view.estimatedGrossRevenueCad.toFixed(0)} CAD`}
            sub="Simple price-times-delivered estimate"
            tone="orange"
          />
        </div>
        <div className="panel-bento">
          <section className="panel panel--chart">
            <h4>Energy Mix</h4>
            <SimplePieChart data={series.energyMix} />
          </section>
          <section className="panel panel--chart">
            <h4>Battery sweep revenue (mock — `src/lib/Backend/simulation/simulation.mock.charts.ts`)</h4>
            <SimpleLineChart data={series.sweep} xKey="storageMWh" yKey="estimatedGrossRevenueCad" color={CHART_GREEN} />
          </section>
          <section className="panel panel--chart">
            <h4>Dispatch state of charge snapshot (mock — same simulation mocks)</h4>
            <SimpleLineChart data={series.dispatchTimeline} xKey="timestamp" yKey="stateOfChargeMWh" color={CHART_BLUE} />
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
                capturedMWh: view.capturedMWh,
                releasedMWh: view.releasedMWh,
                estimatedGrossRevenueCad: view.estimatedGrossRevenueCad,
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
