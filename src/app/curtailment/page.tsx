"use client";

import { getDashboardChartMocks } from "@/lib/backend/dashboardMocks";
import { isCurtailmentData } from "@/lib/frontend/dashboard/guards";
import { buildCurtailmentSeries } from "@/lib/backend/transforms/chartModels";
import { DataBoundPage } from "@/lib/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/lib/frontend/components/DashboardLayout";
import { KpiGrid } from "@/lib/frontend/components/KpiGrid";
import { PanelBento } from "@/lib/frontend/components/PanelBento";
import { KpiCard } from "@/lib/frontend/ui/components/KpiCard";
import {
  SimpleBarChart,
  SimpleGroupedBarChart,
  SimpleLineChart,
} from "@/lib/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/lib/frontend/ui/chartTheme";
import { loadCurtailmentPageData } from "./data";

const dashboardChartMocks = getDashboardChartMocks();

export default function CurtailmentPage() {
  return (
    <DataBoundPage
      loader={loadCurtailmentPageData}
      guard={isCurtailmentData}
      routeLabel="Curtailment Intelligence"
    >
      {(data) => {
        const series = buildCurtailmentSeries(data, dashboardChartMocks);

        return (
          <DashboardLayout title="Curtailment Intelligence">
            <KpiGrid>
              <KpiCard
                featured
                label="Total Curtailment Events"
                value="4,966"
                sub="Distinct curtailment intervals in demo window (mock)"
                tone="blue"
              />
              <KpiCard label="Median Duration" value="40 min" sub="Typical event length (mock)" tone="green" />
              <KpiCard label="Longest Event" value="6.0 hr" sub="Single longest continuous span (mock)" tone="orange" />
            </KpiGrid>
            <PanelBento>
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
            </PanelBento>
            {"rawDataByRepository" in data && data.rawDataByRepository ? (
              <section className="panel panel--data">
                <h4>Raw inputs by repository (`aeso/`, `turbine/`, `scada/`)</h4>
                <pre>{JSON.stringify(data.rawDataByRepository, null, 2)}</pre>
              </section>
            ) : null}
            <section className="panel panel--data">
              <h4>Computed scenario</h4>
              <pre>{JSON.stringify({ rows: data.rows, summary: data.summary }, null, 2)}</pre>
            </section>
          </DashboardLayout>
        );
      }}
    </DataBoundPage>
  );
}
