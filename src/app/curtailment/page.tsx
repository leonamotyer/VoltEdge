"use client";

import { isCurtailmentData } from "@/frontend/dashboard/guards";
import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { HourlyCurtailmentGapChart } from "@/frontend/sections/curtailment/HourlyCurtailmentGapChart";
import { MonthlyCurtailmentProfileChart } from "@/frontend/sections/curtailment/MonthlyCurtailmentProfileChart";
import { AvgCurtailmentTrendChart } from "@/frontend/sections/curtailment/AvgCurtailmentTrendChart";
import { EventDurationChart } from "@/frontend/sections/curtailment/EventDurationChart";
import { HourlyWindProfileChart } from "@/frontend/sections/curtailment/HourlyWindProfileChart";
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
              <HourlyCurtailmentGapChart data={hourlyData} />
              <MonthlyCurtailmentProfileChart data={mockMonthlyProfile} />
              <AvgCurtailmentTrendChart data={mockAvgTrend} />
              <EventDurationChart data={mockEventDuration} />
              <HourlyWindProfileChart data={mockScadaHourly} />
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
