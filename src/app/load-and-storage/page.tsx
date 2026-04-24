"use client";

import { DataBoundPage } from "@/frontend/components/DataBoundPage";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiTable } from "@/frontend/ui/components/KpiTable";
import { isLoadAndStorageData } from "@/frontend/dashboard/guards";
import { loadLoadAndStoragePageData } from "./data";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/gpu/types";
import { GpuRevenueSection } from "@/frontend/sections/load-storage/GpuRevenueSection";
import { BatteryStorageKpis } from "@/frontend/sections/load-storage/BatteryStorageKpis";
import { BatteryStateOfChargeChart } from "@/frontend/sections/load-storage/BatteryStateOfChargeChart";
import { ChargeDischargePriceChart } from "@/frontend/sections/load-storage/ChargeDischargePriceChart";

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
          {/* GPU Revenue Section - conditional rendering handled inside component */}
          <GpuRevenueSection gpuConfig={gpuConfig} energyMix={data.energyMix} />

          {/* Battery Storage KPIs */}
          <BatteryStorageKpis
            capturedMWh={data.capturedMWh}
            releasedMWh={data.releasedMWh}
            estimatedGrossRevenueCad={data.estimatedGrossRevenueCad}
          />

          {/* Battery Charts */}
          <PanelBento>
            <BatteryStateOfChargeChart socTimeSeries={data.socTimeSeries} />
            <ChargeDischargePriceChart chargeDischargeCycles={data.chargeDischargeCycles} />
          </PanelBento>

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
