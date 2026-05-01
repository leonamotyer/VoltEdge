"use client";

import { isCurtailmentData } from "@/frontend/components/tables/guards";
import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { HourlyCurtailmentGapChart } from "@/frontend/components/charts/curtailment/HourlyCurtailmentGapChart";
import { MonthlyCurtailmentProfileChart } from "@/frontend/components/charts/curtailment/MonthlyCurtailmentProfileChart";
import { AvgCurtailmentTrendChart } from "@/frontend/components/charts/curtailment/AvgCurtailmentTrendChart";
import { EventDurationChart } from "@/frontend/components/charts/curtailment/EventDurationChart";
import { HourlyWindProfileChart } from "@/frontend/components/charts/curtailment/HourlyWindProfileChart";
import { loadCurtailmentPageData } from "./data";
import { useCurtailmentEvents } from "@/hooks/useCurtailmentEvents";
import { useCurtailmentStats } from "@/hooks/useCurtailmentStats";
import { useCurtailmentProfiles } from "@/hooks/useCurtailmentProfiles";

export default function CurtailmentPage() {
  // Fetch real-time data from API endpoints
  const { events } = useCurtailmentEvents();
  const { stats } = useCurtailmentStats();
  const { hourlyProfile, monthlyProfile } = useCurtailmentProfiles();

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

        // Transform monthly profile for chart
        const monthlyChartData = monthlyProfile.map((month) => ({
          label: formatMonthLabel(month.month),
          totalCurtailmentMWh: month.total_curtailed_mwh,
          curtailmentRatePercent: month.curtailment_rate_percent,
        }));

        // Transform hourly profile for chart (avg trend by month)
        const avgTrendData = monthlyProfile.map((month) => ({
          label: formatMonthLabel(month.month),
          avgCurtailmentMWhPerHour: month.total_curtailed_mwh / (30 * 24), // Approximate hours in month
        }));

        // Create event duration histogram (0-24 hour bins)
        const durationHistogram = createDurationHistogram(events);

        // Transform hourly profile for wind chart
        const hourlyWindData = hourlyProfile.map((h) => ({
          hour: h.hour,
          avgCurtailmentMW: h.avg_curtailment_mw,
        }));

        return (
          <DashboardLayout title="Curtailment Intelligence">
            <KpiGrid>
              <KpiCard
                featured
                label="Total Curtailment Events"
                value={stats?.total_events.toLocaleString() || "0"}
                sub="Distinct curtailment intervals detected"
                tone="blue"
              />
              <KpiCard
                label="Median Duration"
                value={formatDuration(stats?.median_duration || 0)}
                sub="Typical event length"
                tone="green"
              />
              <KpiCard
                label="Longest Event"
                value={formatDuration(stats?.longest_event_hours || 0)}
                sub="Single longest continuous span"
                tone="orange"
              />
              <KpiCard
                label="Top 10% Share"
                value={`${((stats?.top_10_percent_share || 0) * 100).toFixed(1)}%`}
                sub="Of total curtailment from top events"
                tone="blue"
              />
            </KpiGrid>
            <PanelBento>
              <HourlyCurtailmentGapChart data={hourlyData} />
              <MonthlyCurtailmentProfileChart data={monthlyChartData} />
              <AvgCurtailmentTrendChart data={avgTrendData} />
              <EventDurationChart data={durationHistogram} />
              <HourlyWindProfileChart data={hourlyWindData} />
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

/**
 * Format month string (e.g., "2026-01" -> "Jan '26")
 */
function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex]} '${year.slice(2)}`;
}

/**
 * Format duration in hours to human-readable string
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours.toFixed(1)} hr`;
}

/**
 * Create histogram of event durations with 0-24 hour bins
 */
function createDurationHistogram(events: Array<{ duration_hours: number }>): Array<{ bucket: string; count: number }> {
  const bins = [
    { max: 1, label: "0-1h" },
    { max: 2, label: "1-2h" },
    { max: 4, label: "2-4h" },
    { max: 8, label: "4-8h" },
    { max: 24, label: "8-24h" },
  ];

  const histogram = bins.map((bin) => ({
    bucket: bin.label,
    count: 0,
  }));

  events.forEach((event) => {
    const binIndex = bins.findIndex((bin) => event.duration_hours <= bin.max);
    if (binIndex !== -1) {
      histogram[binIndex].count++;
    }
  });

  return histogram;
}
