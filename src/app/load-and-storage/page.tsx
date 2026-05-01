"use client";

import { useMemo } from "react";
import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiTable } from "@/frontend/ui/components/KpiTable";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";
import { GpuRevenueSection } from "@/frontend/components/charts/load-storage/GpuRevenueSection";
import { BatteryStorageKpis } from "@/frontend/components/charts/load-storage/BatteryStorageKpis";
import { BatteryStateOfChargeChart } from "@/frontend/components/charts/load-storage/BatteryStateOfChargeChart";
import { useDispatchSimulation } from "@/hooks/useDispatchSimulation";

export default function LoadAndStoragePage() {
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();

  // Fetch real dispatch simulation data from backend
  const { socTimeSeries, energyMix, loading, error } = useDispatchSimulation();

  // Calculate KPI values from backend data
  const capturedMWh = energyMix.curtailedWindMWh;
  const releasedMWh = energyMix.batteryDischargeMWh;

  // Estimate revenue based on battery discharge and typical arbitrage spread
  const estimatedGrossRevenueCad = batteryConfig.includeBattery
    ? Math.round(releasedMWh * 50) // Simplified: $50/MWh average spread
    : 0;

  const totalComputePowerMw = useMemo(
    () => (gpuConfig ? calculateGpuMetrics(gpuConfig).totalComputePowerMw : 0),
    [gpuConfig],
  );

  if (loading) {
    return (
      <DashboardLayout
        title="Load and Storage"
        subtitle="GPU compute and battery storage simulation with curtailed wind energy"
      >
        <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
          Loading dispatch simulation data...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Load and Storage"
        subtitle="GPU compute and battery storage simulation with curtailed wind energy"
      >
        <div style={{ padding: "2rem", color: "#ef4444" }}>
          <strong>Error loading data:</strong> {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Load and Storage"
      subtitle="GPU compute and battery storage simulation with curtailed wind energy"
    >
      {/* GPU Revenue Section - conditional rendering handled inside component */}
      <GpuRevenueSection gpuConfig={gpuConfig} energyMix={energyMix} />

      {/* Battery Storage KPIs */}
      <BatteryStorageKpis
        capturedMWh={capturedMWh}
        releasedMWh={releasedMWh}
        estimatedGrossRevenueCad={estimatedGrossRevenueCad}
      />

      {/* Battery Charts */}
      <PanelBento>
        <BatteryStateOfChargeChart socTimeSeries={socTimeSeries} />
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
                  metric: "Grid Import Cap",
                  value: gridConfig ? `${gridConfig.gridPowerLimit.toFixed(2)} MW` : "—",
                },
                {
                  metric: "Grid Pool Price Override",
                  value:
                    gridConfig?.gridPriceOverride !== null && gridConfig.gridPriceOverride > 0
                      ? `$${gridConfig.gridPriceOverride.toFixed(2)} CAD/MWh`
                      : "Market price",
                },
                {
                  metric: "BTF Supply Cap",
                  value: gridConfig ? `${gridConfig.btfPowerLimit.toFixed(2)} MW` : "—",
                },
                {
                  metric: "BTF Price",
                  value: gridConfig ? `$${gridConfig.btfPrice.toFixed(2)} CAD/MWh` : "—",
                },
                {
                  metric: "Curtailment Price",
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

          {/* Data Source Info */}
          <div style={{ gridColumn: "span 12", fontSize: "0.8rem", color: "#64748b", marginTop: "1rem" }}>
            <h5>Data Sources</h5>
            <ul>
              <li>Backend dispatch simulation: 52,704 10-minute intervals (leap year demo data)</li>
              <li>Energy mix: {energyMix.totalMWh.toFixed(1)} MWh total served</li>
              <li>
                Sources: {energyMix.curtailedWindMWh.toFixed(1)} MWh curtailed wind,{" "}
                {energyMix.batteryDischargeMWh.toFixed(1)} MWh battery, {energyMix.gridImportMWh.toFixed(1)} MWh grid,{" "}
                {energyMix.btfMWh.toFixed(1)} MWh BTF
              </li>
            </ul>
          </div>
    </DashboardLayout>
  );
}
