"use client";

import { getDashboardChartMocks } from "@/lib/Backend/dashboardMocks";
import { isCurtailmentData } from "@/lib/frontEnd/dashboard/guards";
import { buildCurtailmentSeries } from "@/lib/frontEnd/transforms/chartModels";
import { InvalidDataPanel } from "@/lib/frontEnd/ui/components/InvalidDataPanel";
import { KpiCard } from "@/lib/frontEnd/ui/components/KpiCard";
import {
  SimpleBarChart,
  SimpleGroupedBarChart,
  SimpleLineChart,
} from "@/lib/frontEnd/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/lib/frontEnd/ui/chartTheme";
import { loadCurtailmentPageData } from "./data";

const dashboardChartMocks = getDashboardChartMocks();

export default function CurtailmentPage() {
  const data = loadCurtailmentPageData();

  if (!isCurtailmentData(data)) {
    return (
      <>
        <h3 className="section-header">Curtailment Intelligence</h3>
        <InvalidDataPanel routeLabel="Curtailment Intelligence" data={data} />
      </>
    );
  }

  const view = data;
  const series = buildCurtailmentSeries(view, dashboardChartMocks);

  return (
    <>
      <h3 className="section-header">Curtailment Intelligence</h3>
      <div className="energy-dashboard">
        <div className="kpi-grid">
          <KpiCard
            featured
            label="Total Curtailment Events"
            value="4,966"
            sub="Distinct curtailment intervals in demo window (mock)"
            tone="blue"
          />
          <KpiCard label="Median Duration" value="40 min" sub="Typical event length (mock)" tone="green" />
          <KpiCard label="Longest Event" value="6.0 hr" sub="Single longest continuous span (mock)" tone="orange" />
        </div>
        <div className="panel-bento">
          <section className="panel panel--chart">
            <h4>Hourly Curtailment Gap</h4>
            <SimpleLineChart data={series.hourly} xKey="timestamp" yKey="gapMWh" color={CHART_BLUE} />
          </section>
          <section className="panel panel--chart panel--span-full">
            <h4>Monthly curtailment profile (mock — total gap vs unused energy)</h4>
            <SimpleGroupedBarChart
              data={series.monthlyProfile}
              xKey="label"
              series={[
                { dataKey: "totalCurtailmentMWh", name: "Total curtailment (MWh)", color: CHART_ORANGE },
                { dataKey: "unusedEnergyMWh", name: "Unused energy (MWh)", color: CHART_GREEN },
              ]}
            />
          </section>
          <section className="panel panel--chart">
            <h4>Average curtailment trend (mock — MWh per hour by month)</h4>
            <SimpleLineChart
              data={series.avgTrend}
              xKey="label"
              yKey="avgCurtailmentMWhPerHour"
              color={CHART_BLUE}
            />
          </section>
          <section className="panel panel--chart">
            <h4>Curtailment event duration (mock — hours accumulated by length bucket)</h4>
            <SimpleBarChart data={series.eventDuration} xKey="bucket" yKey="hoursInBucket" color={CHART_ORANGE} />
          </section>
          <section className="panel panel--chart panel--span-full">
            <h4>Hour-of-day wind profile (mock — `scada/scada.mock.charts.ts`)</h4>
            <SimpleBarChart data={series.scadaHourlyWindMs} xKey="hour" yKey="avgWindMs" color={CHART_GREEN} />
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
          <pre>{JSON.stringify({ rows: view.rows, summary: view.summary }, null, 2)}</pre>
        </section>
      </div>
    </>
  );
}
