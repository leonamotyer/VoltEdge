"use client";

import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { isLoadAndStorageData } from "@/frontend/dashboard/guards";
import { GpuCharts } from "@/frontend/gpu/GpuCharts";
import { SimpleLineChart, BatteryPowerVsPriceChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN, CHART_BLUE, CHART_ORANGE } from "@/frontend/ui/chartTheme";
import { loadLoadAndStoragePageData } from "./data";
import { useConfig } from "@/frontend/context/ConfigContext";

export default function LoadAndStoragePage() {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();

  return (
    <DataBoundPage
      loader={loadLoadAndStoragePageData}
      guard={isLoadAndStorageData}
      routeLabel="Load and Storage"
    >
      {(data) => (
        <DashboardLayout
          title="Load and Storage"
          subtitle="GPU compute and battery storage simulation with curtailed wind energy"
        >
          {/* GPU Charts - shown when config is set from sidebar */}
          {gpuConfig && (
            <section style={{ marginBottom: "clamp(1.5rem, 4vw, 2rem)" }}>
              <h3
                style={{
                  fontSize: "clamp(1rem, 2.8vw, 1.125rem)",
                  fontWeight: 600,
                  color: "#1a3050",
                  marginBottom: "clamp(0.75rem, 2vw, 1rem)",
                }}
              >
                GPU Revenue Simulation
              </h3>
              <GpuCharts config={gpuConfig} energyMix={data.energyMix} />
            </section>
          )}

          {/* Battery Storage Simulation Results */}
          <section>
            <h3
              style={{
                fontSize: "clamp(1rem, 2.8vw, 1.125rem)",
                fontWeight: 600,
                color: "#1a3050",
                marginBottom: "clamp(0.75rem, 2vw, 1rem)",
              }}
            >
              Battery Storage Simulation
            </h3>

            <KpiGrid>
              <KpiCard
                featured
                label="Captured"
                value={`${data.capturedMWh.toLocaleString()} MWh`}
                sub="From curtailed periods"
                tone="green"
              />
              <KpiCard
                label="Released"
                value={`${data.releasedMWh.toLocaleString()} MWh`}
                sub="After round-trip losses"
                tone="blue"
              />
              <KpiCard
                label="Gross revenue"
                value={`$${data.estimatedGrossRevenueCad.toLocaleString()} CAD`}
                sub="From battery arbitrage"
                tone="orange"
              />
            </KpiGrid>
            <PanelBento>
              <section className="panel panel--chart panel--span-full">
                <h3>Battery State of Charge (48h)</h3>
                <SimpleLineChart
                  data={data.socTimeSeries.map((row) => ({
                    time: new Date(row.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                    }),
                    soc: row.socPercent,
                  }))}
                  xKey="time"
                  yKey="soc"
                  color={CHART_GREEN}
                />
              </section>
              <section className="panel panel--chart panel--span-full">
                <h3>Charge/Discharge Cycles vs Pool Price</h3>
                <p style={{
                  fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
                  color: "#64748b",
                  marginBottom: "clamp(0.5rem, 1.5vw, 0.75rem)",
                  padding: "0 clamp(1rem, 3vw, 1.25rem)",
                  lineHeight: "1.5"
                }}>
                  Battery charges during low/negative prices (curtailment) and discharges during high prices
                </p>
                <BatteryPowerVsPriceChart
                  data={data.chargeDischargeCycles}
                  chargeColor={CHART_GREEN}
                  dischargeColor={CHART_BLUE}
                  priceColor={CHART_ORANGE}
                />
              </section>
            </PanelBento>
          </section>

        </DashboardLayout>
      )}
    </DataBoundPage>
  );
}
