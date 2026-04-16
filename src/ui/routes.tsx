import { useEffect, useState } from "react";
import {
  Navigate,
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";
import { loadCurtailmentPageData } from "../lib/frontEnd/curtailment/page";
import { loadLoadAndStoragePageData } from "../lib/frontEnd/loadAndStorage/page";
import { loadNetworkAndFiberPageData } from "../lib/frontEnd/networkAndFIber/page";
import { getDashboardChartMocks } from "../lib/Backend/mocks";
import {
  buildCurtailmentSeries,
  buildLoadStorageSeries,
  buildNetworkSeries,
} from "../lib/frontEnd/transforms/chartModels";
import { AppLayout } from "./App";
import {
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from "./components/charts/SimpleCharts";

const dashboardChartMocks = getDashboardChartMocks();

type ViewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: unknown };

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouterErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/curtailment" replace /> },
      {
        path: "curtailment",
        element: (
          <DataRoute
            title="Curtailment Intelligence"
            load={loadCurtailmentPageData}
            routeKey="curtailment"
          />
        ),
      },
      {
        path: "load-and-storage",
        element: (
          <DataRoute
            title="Load and Storage"
            load={loadLoadAndStoragePageData}
            routeKey="load-storage"
          />
        ),
      },
      {
        path: "network-and-fiber",
        element: (
          <DataRoute
            title="Network and Fiber Feasibility"
            load={loadNetworkAndFiberPageData}
            routeKey="network-fiber"
          />
        ),
      },
      { path: "*", element: <Navigate to="/curtailment" replace /> },
    ],
  },
]);

function DataRoute({
  title,
  load,
  routeKey,
}: {
  title: string;
  load: () => Promise<unknown>;
  routeKey: "curtailment" | "load-storage" | "network-fiber";
}) {
  const [view, setView] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setView({ status: "loading" });

    load()
      .then((data) => {
        if (!cancelled) {
          setView({ status: "ready", data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Request failed";
          setView({ status: "error", message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <>
      <h3 className="section-header">{title}</h3>
      {view.status === "loading" && <p>Loading data...</p>}
      {view.status === "error" && <p className="error">{view.message}</p>}
      {view.status === "ready" && <RouteView routeKey={routeKey} data={view.data} />}
    </>
  );
}

function RouteView({
  routeKey,
  data,
}: {
  routeKey: "curtailment" | "load-storage" | "network-fiber";
  data: unknown;
}) {
  if (routeKey === "curtailment") {
    if (!isCurtailmentData(data)) {
      return <InvalidDataPanel routeLabel="Curtailment Intelligence" data={data} />;
    }
    const view = data as {
      rows: Array<{
        timestamp: string;
        poolPriceCadPerMWh: number;
        curtailmentGapMWh: number;
      }>;
      summary: { hours: number; totalGapMWh: number };
    };
    const avgGap = view.summary.hours > 0 ? view.summary.totalGapMWh / view.summary.hours : 0;
    const series = buildCurtailmentSeries(view, dashboardChartMocks);

    return (
      <>
        <div className="kpi-grid">
          <KpiCard label="Hours Analyzed" value={`${view.summary.hours}`} sub="Matched market and SCADA rows" tone="blue" />
          <KpiCard label="Total Curtailment Gap" value={`${view.summary.totalGapMWh.toFixed(1)} MWh`} sub="Modeled minus actual generation" tone="amber" />
          <KpiCard label="Average Gap / Hour" value={`${avgGap.toFixed(2)} MWh`} sub="Useful for sizing storage strategy" tone="teal" />
        </div>
        <section className="panel">
          <h4>Hourly Curtailment Gap</h4>
          <SimpleLineChart
            data={series.hourly}
            xKey="timestamp"
            yKey="gapMWh"
            color="#1a4a72"
          />
        </section>
        <section className="panel">
          <h4>Monthly Curtailment (mock — `src/lib/Backend/mocks/aeso.mock.charts.ts`)</h4>
          <SimpleBarChart
            data={series.monthly}
            xKey="month"
            yKey="totalCurtailmentMWh"
            color="#e67e22"
          />
        </section>
        <section className="panel">
          <h4>Hour-of-day wind profile (mock — `scada/scada.mock.charts.ts`)</h4>
          <SimpleBarChart
            data={series.scadaHourlyWindMs}
            xKey="hour"
            yKey="avgWindMs"
            color="#0e9e6a"
          />
        </section>
        {"rawDataByRepository" in view && view.rawDataByRepository && (
          <section className="panel">
            <h4>
              Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)
            </h4>
            <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
          </section>
        )}
        <section className="panel">
          <h4>Computed scenario (controller output)</h4>
          <pre>{JSON.stringify({ rows: view.rows, summary: view.summary }, null, 2)}</pre>
        </section>
      </>
    );
  }

  if (routeKey === "load-storage") {
    if (!isLoadAndStorageData(data)) {
      return <InvalidDataPanel routeLabel="Load and Storage" data={data} />;
    }
    const view = data;
    const series = buildLoadStorageSeries(view, dashboardChartMocks);

    return (
      <>
        <div className="kpi-grid">
          <KpiCard label="Captured Energy" value={`${view.capturedMWh.toFixed(2)} MWh`} sub="Energy absorbed from curtailed periods" tone="teal" />
          <KpiCard label="Released Energy" value={`${view.releasedMWh.toFixed(2)} MWh`} sub="Delivered after storage efficiency losses" tone="blue" />
          <KpiCard label="Estimated Gross Revenue" value={`$${view.estimatedGrossRevenueCad.toFixed(0)} CAD`} sub="Simple price-times-delivered estimate" tone="amber" />
        </div>
        <section className="panel">
          <h4>Energy Mix</h4>
          <SimplePieChart data={series.energyMix} />
        </section>
        <section className="panel">
          <h4>Battery sweep revenue (mock — `src/lib/Backend/mocks/simulation.mock.charts.ts`)</h4>
          <SimpleLineChart
            data={series.sweep}
            xKey="storageMWh"
            yKey="estimatedGrossRevenueCad"
            color="#0e9e6a"
          />
        </section>
        <section className="panel">
          <h4>Dispatch state of charge snapshot (mock — same simulation mocks)</h4>
          <SimpleLineChart
            data={series.dispatchTimeline}
            xKey="timestamp"
            yKey="stateOfChargeMWh"
            color="#1a4a72"
          />
        </section>
        {"rawDataByRepository" in view && view.rawDataByRepository && (
          <section className="panel">
            <h4>
              Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)
            </h4>
            <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
          </section>
        )}
        <section className="panel">
          <h4>Computed scenario (controller output)</h4>
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

  if (!isNetworkData(data)) {
    return <InvalidDataPanel routeLabel="Network and Fiber Feasibility" data={data} />;
  }
  const view = data;
  const series = buildNetworkSeries(view);

  return (
    <>
      <div className="kpi-grid">
        <KpiCard label="Distance to Fiber PoP" value={`${view.distanceToPopKm.toFixed(1)} km`} sub="Estimated nearest point of presence" tone="blue" />
        <KpiCard label="Estimated Latency" value={`${view.estimatedLatencyMs.toFixed(3)} ms`} sub="Using simple 5 us per km assumption" tone="amber" />
        <KpiCard label="Workload Feasibility" value={`${view.workloads.inference ? "Inference OK" : "Inference No"}`} sub={view.workloads.training ? "Training OK" : "Training No"} tone={view.workloads.inference ? "teal" : "red"} />
      </div>
      <section className="panel">
        <h4>Latency vs Thresholds</h4>
        <SimpleBarChart
          data={series.thresholds}
          xKey="name"
          yKey="latencyMs"
          color="#1a4a72"
        />
      </section>
      {"rawDataByRepository" in view && view.rawDataByRepository && (
        <section className="panel">
          <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
          <pre>{JSON.stringify(view.rawDataByRepository, null, 2)}</pre>
        </section>
      )}
      <section className="panel">
        <h4>Computed scenario (controller output)</h4>
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

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "amber" | "teal" | "red";
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

function isCurtailmentData(
  value: unknown,
): value is {
  rows: Array<{ timestamp: string; poolPriceCadPerMWh: number; curtailmentGapMWh: number }>;
  summary: { hours: number; totalGapMWh: number };
  rawDataByRepository?: { aeso: unknown; turbine: unknown };
} {
  if (!isObject(value) || !isObject(value.summary) || !Array.isArray(value.rows) || value.rows.length === 0) {
    return false;
  }
  const sampleRow = value.rows[0];
  if (!isObject(sampleRow)) {
    return false;
  }
  return (
    typeof value.summary.hours === "number" &&
    typeof value.summary.totalGapMWh === "number" &&
    typeof sampleRow.timestamp === "string" &&
    typeof sampleRow.poolPriceCadPerMWh === "number" &&
    typeof sampleRow.curtailmentGapMWh === "number"
  );
}

function isLoadAndStorageData(
  value: unknown,
): value is {
  capturedMWh: number;
  releasedMWh: number;
  estimatedGrossRevenueCad: number;
  rawDataByRepository?: { aeso: unknown; turbine: unknown };
} {
  return (
    isObject(value) &&
    typeof value.capturedMWh === "number" &&
    typeof value.releasedMWh === "number" &&
    typeof value.estimatedGrossRevenueCad === "number"
  );
}

function isNetworkData(
  value: unknown,
): value is {
  distanceToPopKm: number;
  estimatedLatencyMs: number;
  workloads: { inference: boolean; training: boolean };
  rawDataByRepository?: unknown;
} {
  return (
    isObject(value) &&
    typeof value.distanceToPopKm === "number" &&
    typeof value.estimatedLatencyMs === "number" &&
    isObject(value.workloads) &&
    typeof value.workloads.inference === "boolean" &&
    typeof value.workloads.training === "boolean"
  );
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function RouterErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown route error";

  return (
    <main className="app-shell">
      <section className="content">
        <header className="ve-header">
          <h2>VoltEdge MDC</h2>
          <p>We hit an unexpected application error.</p>
        </header>
        <section className="panel">
          <h4>Routing Error</h4>
          <p className="error">{message}</p>
        </section>
      </section>
    </main>
  );
}
