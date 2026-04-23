"use client";

import { isCurtailmentData } from "@/frontend/dashboard/guards";
import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import {
  SimpleBarChart,
  SimpleGroupedBarChart,
  SimpleLineChart,
} from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/frontend/ui/chartTheme";
import { loadCurtailmentPageData } from "./data";

// Mock data for supplementary charts (not yet returned by API)
const mockMonthlyProfile = [
  { label: "Jan '26", totalCurtailmentMWh: 2450, unusedEnergyMWh: 980 },
  { label: "Feb '26", totalCurtailmentMWh: 2100, unusedEnergyMWh: 840 },
  { label: "Mar '26", totalCurtailmentMWh: 1890, unusedEnergyMWh: 756 },
];

const mockAvgTrend = [
  { label: "Jan '26", avgCurtailmentMWhPerHour: 3.3 },
  { label: "Feb '26", avgCurtailmentMWhPerHour: 3.1 },
  { label: "Mar '26", avgCurtailmentMWhPerHour: 2.6 },
];

const mockEventDuration = [
  { bucket: "0-1h", hoursInBucket: 120 },
  { bucket: "1-2h", hoursInBucket: 85 },
  { bucket: "2-4h", hoursInBucket: 45 },
  { bucket: "4h+", hoursInBucket: 22 },
];

const mockScadaHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  avgWindMs: 4 + Math.sin(i / 3) * 2 + Math.random(),
}));

export default function CurtailmentPage() {
  return (
    <DataBoundPage
      loader={loadCurtailmentPageData}
      guard={isCurtailmentData}
      routeLabel="Curtailment Intelligence"
    >
      {(data) => {
        // Transform API data for charts
        const hourlyData = data.rows.map((row: any) => ({
          timestamp: row.timestamp,
          gapMWh: row.curtailmentGapMWh,
          priceCadPerMWh: row.poolPriceCadPerMWh,
        }));

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
                <SimpleLineChart data={hourlyData} xKey="timestamp" yKey="gapMWh" color={CHART_BLUE} />
              </section>
              <section className="panel panel--chart panel--span-full">
                <h4>Monthly curtailment profile (mock — total gap vs unused energy)</h4>
                <SimpleGroupedBarChart
                  data={mockMonthlyProfile}
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
                  data={mockAvgTrend}
                  xKey="label"
                  yKey="avgCurtailmentMWhPerHour"
                  color={CHART_BLUE}
                />
              </section>
              <section className="panel panel--chart">
                <h4>Curtailment event duration (mock — hours accumulated by length bucket)</h4>
                <SimpleBarChart data={mockEventDuration} xKey="bucket" yKey="hoursInBucket" color={CHART_ORANGE} />
              </section>
              <section className="panel panel--chart panel--span-full">
                <h4>Hour-of-day wind profile (mock)</h4>
                <SimpleBarChart data={mockScadaHourly} xKey="hour" yKey="avgWindMs" color={CHART_GREEN} />
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
