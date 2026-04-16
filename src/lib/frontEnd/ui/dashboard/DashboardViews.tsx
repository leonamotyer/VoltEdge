"use client";

import { getDashboardChartMocks } from "@/lib/Backend/dashboardMocks";
import {
  isCurtailmentData,
  isLoadAndStorageData,
  isNetworkData,
} from "@/lib/frontEnd/dashboard/guards";
import {
  buildCurtailmentSeries,
  buildLoadStorageSeries,
  buildNetworkSeries,
} from "@/lib/frontEnd/transforms/chartModels";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/lib/frontEnd/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/lib/frontEnd/ui/chartTheme";

const dashboardChartMocks = getDashboardChartMocks();

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "green" | "orange" | "red";
}) {
  return (
    <article className={`kpi-card ${tone}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <p className="kpi-sub">{sub}</p>
    </article>
  );
}

function InvalidDataPanel({ routeLabel, data }: { routeLabel: string; data: unknown }) {
  return (
    <section className="panel">
      <h4>{routeLabel} data shape mismatch</h4>
      <p className="error">The loader returned an unexpected payload format.</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

export function CurtailmentDashboard({ data }: { data: unknown }) {
  if (!isCurtailmentData(data)) {
    return <InvalidDataPanel routeLabel="Curtailment Intelligence" data={data} />;
  }
  const view = data;
  const avgGap = view.summary.hours > 0 ? view.summary.totalGapMWh / view.summary.hours : 0;
  const series = buildCurtailmentSeries(view, dashboardChartMocks);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Hours Analyzed" value={`${view.summary.hours}`} sub="Matched market and SCADA rows" tone="blue" />
        <KpiCard
          label="Total Curtailment Gap"
          value={`${view.summary.totalGapMWh.toFixed(1)} MWh`}
          sub="Modeled minus actual generation"
          tone="orange"
        />
        <KpiCard label="Average Gap / Hour" value={`${avgGap.toFixed(2)} MWh`} sub="Useful for sizing storage strategy" tone="green" />
      </div>
      <section className="panel">
        <h4>Hourly Curtailment Gap</h4>
        <SimpleLineChart data={series.hourly} xKey="timestamp" yKey="gapMWh" color={CHART_BLUE} />
      </section>
      <section className="panel">
        <h4>Monthly Curtailment (mock — `src/lib/Backend/aeso/aeso.mock.charts.ts`)</h4>
        <SimpleBarChart data={series.monthly} xKey="month" yKey="totalCurtailmentMWh" color={CHART_ORANGE} />
      </section>
      <section className="panel">
        <h4>Hour-of-day wind profile (mock — `scada/scada.mock.charts.ts`)</h4>
        <SimpleBarChart data={series.scadaHourlyWindMs} xKey="hour" yKey="avgWindMs" color={CHART_GREEN} />
      </section>
      {"rawDataByRepository" in view && view.rawDataByRepository && (
        <section className="panel">
          <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
          <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
        </section>
      )}
      <section className="panel">
        <h4>Computed scenario</h4>
        <pre>{JSON.stringify({ rows: view.rows, summary: view.summary }, null, 2)}</pre>
      </section>
    </>
  );
}

export function LoadStorageDashboard({ data }: { data: unknown }) {
  if (!isLoadAndStorageData(data)) {
    return <InvalidDataPanel routeLabel="Load and Storage" data={data} />;
  }
  const view = data;
  const series = buildLoadStorageSeries(view, dashboardChartMocks);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Captured Energy" value={`${view.capturedMWh.toFixed(2)} MWh`} sub="Energy absorbed from curtailed periods" tone="green" />
        <KpiCard label="Released Energy" value={`${view.releasedMWh.toFixed(2)} MWh`} sub="Delivered after storage efficiency losses" tone="blue" />
        <KpiCard
          label="Estimated Gross Revenue"
          value={`$${view.estimatedGrossRevenueCad.toFixed(0)} CAD`}
          sub="Simple price-times-delivered estimate"
          tone="orange"
        />
      </div>
      <section className="panel">
        <h4>Energy Mix</h4>
        <SimplePieChart data={series.energyMix} />
      </section>
      <section className="panel">
        <h4>Battery sweep revenue (mock — `src/lib/Backend/simulation/simulation.mock.charts.ts`)</h4>
        <SimpleLineChart data={series.sweep} xKey="storageMWh" yKey="estimatedGrossRevenueCad" color={CHART_GREEN} />
      </section>
      <section className="panel">
        <h4>Dispatch state of charge snapshot (mock — same simulation mocks)</h4>
        <SimpleLineChart data={series.dispatchTimeline} xKey="timestamp" yKey="stateOfChargeMWh" color={CHART_BLUE} />
      </section>
      {"rawDataByRepository" in view && view.rawDataByRepository && (
        <section className="panel">
          <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
          <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
        </section>
      )}
      <section className="panel">
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
    </>
  );
}

export function NetworkDashboard({ data }: { data: unknown }) {
  if (!isNetworkData(data)) {
    return <InvalidDataPanel routeLabel="Network and Fiber Feasibility" data={data} />;
  }
  const view = data;
  const series = buildNetworkSeries(view);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Distance to Fiber PoP" value={`${view.distanceToPopKm.toFixed(1)} km`} sub="Estimated nearest point of presence" tone="blue" />
        <KpiCard label="Estimated Latency" value={`${view.estimatedLatencyMs.toFixed(3)} ms`} sub="Using simple 5 us per km assumption" tone="orange" />
        <KpiCard
          label="Workload Feasibility"
          value={`${view.workloads.inference ? "Inference OK" : "Inference No"}`}
          sub={view.workloads.training ? "Training OK" : "Training No"}
          tone={view.workloads.inference ? "green" : "red"}
        />
      </div>
      <section className="panel">
        <h4>Latency vs Thresholds</h4>
        <SimpleBarChart data={series.thresholds} xKey="name" yKey="latencyMs" color={CHART_BLUE} />
      </section>
      {"rawDataByRepository" in view && view.rawDataByRepository && (
        <section className="panel">
          <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
          <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
        </section>
      )}
      <section className="panel">
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
    </>
  );
}
