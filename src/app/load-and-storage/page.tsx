"use client";

import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { isLoadAndStorageData } from "@/frontend/dashboard/guards";
import { GpuCharts } from "@/frontend/gpu/GpuCharts";
import { SimpleLineChart, SimplePieChart, BatteryPowerVsPriceChart } from "@/frontend/ui/components/charts/SimpleCharts";
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
            <section style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  color: "#1a3050",
                  marginBottom: "1rem",
                }}
              >
                GPU Revenue Simulation
              </h3>
              <GpuCharts config={gpuConfig} />
            </section>
          )}

          {/* Battery Storage Simulation Results */}
          <section>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "#1a3050",
                marginBottom: "1rem",
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
                <h4>Battery State of Charge (48h)</h4>
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
                <h4>Charge/Discharge Cycles vs Pool Price</h4>
                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.75rem" }}>
                  Battery charges during low/negative prices (curtailment) and discharges during high prices
                </p>
                <BatteryPowerVsPriceChart
                  data={data.chargeDischargeCycles}
                  chargeColor={CHART_GREEN}
                  dischargeColor={CHART_BLUE}
                  priceColor={CHART_ORANGE}
                />
              </section>
              <section className="panel panel--chart">
                <h4>Energy Source Mix</h4>
                <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.75rem" }}>
                  Sources used to power GPU load over simulation period
                </p>
                <SimplePieChart
                  data={[
                    { name: "Curtailed Wind (Direct)", value: data.energyMix.curtailedWindMWh },
                    { name: "Battery Discharge", value: data.energyMix.batteryDischargeMWh },
                    { name: "Grid Import", value: data.energyMix.gridImportMWh },
                    ...(data.energyMix.btfMWh > 0
                      ? [{ name: "BTF", value: data.energyMix.btfMWh }]
                      : []),
                  ]}
                />
              </section>
            </PanelBento>
          </section>

        </DashboardLayout>
      )}
    </DataBoundPage>
  );
}
