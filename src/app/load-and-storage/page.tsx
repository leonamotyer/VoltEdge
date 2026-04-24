"use client";

import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { KpiTable } from "@/frontend/ui/components/KpiTable";
import { isLoadAndStorageData } from "@/frontend/dashboard/guards";
import { GpuCharts } from "@/frontend/gpu/GpuCharts";
import { SimpleLineChart, BatteryPowerVsPriceChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN, CHART_BLUE, CHART_ORANGE } from "@/frontend/ui/chartTheme";
import { loadLoadAndStoragePageData } from "./data";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/gpu/types";

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

          {/* Key Performance Indicators Table */}
          <section style={{ marginTop: "clamp(1.5rem, 4vw, 2rem)" }}>
            <KpiTable
              title="Key Performance Indicators"
              rows={[
                // GPU Configuration
                {
                  metric: "GPU Type",
                  value: gpuConfig?.gpuModel || "Not configured",
                },
                {
                  metric: "GPU Count",
                  value: gpuConfig ? `${gpuConfig.numberOfGpus.toLocaleString()} GPUs` : "—",
                },
                {
                  metric: "GPU Rental Rate",
                  value: gpuConfig ? `$${gpuConfig.rentalPricePerHour.toFixed(3)} CAD/hr` : "—",
                },
                {
                  metric: "GPU Purchase Cost",
                  value: gpuConfig?.gpuPurchaseCost ? `$${gpuConfig.gpuPurchaseCost.toLocaleString()} CAD` : "—",
                },
                {
                  metric: "Power per GPU",
                  value: gpuConfig?.powerPerGpu ? `${gpuConfig.powerPerGpu.toFixed(3)} kW` : "—",
                },
                {
                  metric: "GPU Electrical Load",
                  value: gpuConfig
                    ? `${calculateGpuMetrics(gpuConfig).totalComputePowerMw.toFixed(3)} MW`
                    : "—",
                },
                {
                  metric: "GPU Utilization",
                  value: gpuConfig ? `${gpuConfig.utilization}%` : "—",
                },
                {
                  metric: "System Lifetime",
                  value: gpuConfig ? `${gpuConfig.systemLifetime} years` : "—",
                },
                {
                  metric: "Discount Rate",
                  value: gpuConfig ? `${gpuConfig.discountRate}%` : "—",
                },
                {
                  metric: "Deployment Cost",
                  value: gpuConfig?.deploymentCost ? `$${gpuConfig.deploymentCost.toLocaleString()} CAD` : "—",
                },
                // Battery Configuration
                {
                  metric: "Battery Enabled",
                  value: batteryConfig?.includeBattery ? "Yes" : "No",
                },
                ...(batteryConfig?.includeBattery
                  ? [
                      {
                        metric: "Battery Preset",
                        value: batteryConfig.preset || "—",
                      },
                      {
                        metric: "Battery Capacity",
                        value: `${batteryConfig.batterySize.toFixed(1)} MWh @ ${batteryConfig.batteryPower?.toFixed(1) || "—"} MW`,
                      },
                      {
                        metric: "Round-Trip Efficiency",
                        value: `${batteryConfig.roundTripEfficiency}%`,
                      },
                      {
                        metric: "Battery Lifetime",
                        value: `${batteryConfig.batteryLifetime} years`,
                      },
                      {
                        metric: "Battery Energy Cost",
                        value: `$${batteryConfig.batteryEnergyCost.toLocaleString()} CAD/kWh`,
                      },
                      {
                        metric: "Battery Power System Cost",
                        value: `$${batteryConfig.batteryPowerSystemCost.toLocaleString()} CAD/kW`,
                      },
                      {
                        metric: "Battery Annual O&M",
                        value: `$${batteryConfig.fixedAnnualOM.toLocaleString()} CAD/year`,
                      },
                    ]
                  : []),
                // Grid Supply Configuration
                {
                  metric: "Grid Power Limit",
                  value: gridConfig ? `${gridConfig.gridPowerLimit.toFixed(2)} MW` : "—",
                },
                {
                  metric: "Grid Price Override",
                  value:
                    gridConfig?.gridPriceOverride !== null && gridConfig.gridPriceOverride > 0
                      ? `$${gridConfig.gridPriceOverride.toFixed(2)} CAD/MWh`
                      : "Market price",
                },
                {
                  metric: "Behind-the-Fence Power",
                  value: gridConfig ? `${gridConfig.btfPowerLimit.toFixed(2)} MW` : "—",
                },
                {
                  metric: "BTF Price",
                  value: gridConfig ? `$${gridConfig.btfPrice.toFixed(2)} CAD/MWh` : "—",
                },
                {
                  metric: "Curtailment Value",
                  value: gridConfig ? `$${gridConfig.curtailmentValue.toFixed(2)} CAD/MWh` : "—",
                },
                {
                  metric: "Partial Grid Supply",
                  value: gridConfig?.allowPartialGridSupply ? "Allowed" : "Not allowed",
                },
                {
                  metric: "Partial BTF Supply",
                  value: gridConfig?.allowPartialBtfSupply ? "Allowed" : "Not allowed",
                },
                {
                  metric: "Price Escalation Rate",
                  value: gridConfig ? `${gridConfig.priceEscalationRate}% annually` : "—",
                },
                {
                  metric: "Priority Rule",
                  value: gridConfig?.priorityRule || "—",
                },
              ]}
            />
          </section>

        </DashboardLayout>
      )}
    </DataBoundPage>
  );
}
