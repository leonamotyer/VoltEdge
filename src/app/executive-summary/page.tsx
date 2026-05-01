"use client";

import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { PanelBento } from "@/frontend/components/PanelBento";
import { EnergyMixChart } from "@/frontend/components/charts/EnergyMixChart";
import { PnLWaterfallChart } from "@/frontend/components/charts/PnLWaterfallChart";
import { SensitivityTornado } from "@/frontend/components/charts/SensitivityTornado";
import { ExecutiveSummaryTable } from "@/frontend/components/tables/ExecutiveSummaryTable";
import { useDispatchSimulation } from "@/hooks/useDispatchSimulation";
import { useSensitivity } from "@/hooks/useSensitivity";
import { useConfig } from "@/frontend/context/ConfigContext";
import { calculateGpuMetrics } from "@/frontend/types/config";

/**
 * Executive Summary Page - Investor-focused dashboard with energy mix donut chart,
 * P&L waterfall chart, and comprehensive KPI table.
 *
 * This page implements Gap 2 from GAP_IMPLEMENTATION_PLAN.md.
 */
export default function ExecutiveSummaryPage() {
  const { data, loading, error } = useDispatchSimulation();
  const { gpuConfig, batteryConfig, gridConfig } = useConfig();

  // Build sensitivity config from current configuration
  const sensitivityConfig = gpuConfig
    ? {
        gpu_mw: calculateGpuMetrics(gpuConfig).totalComputePowerMw,
        gpu_type: gpuConfig.gpuModel,
        // TODO: Add custom pricing support if needed for funding pitch
        unit_price_override: null,
        rental_hr_override: null,
        batt_mwh: batteryConfig.includeBattery ? batteryConfig.batterySize : 0,
        batt_p_mw: batteryConfig.includeBattery
          ? batteryConfig.batteryPower || calculateGpuMetrics(gpuConfig).totalComputePowerMw
          : 0,
        eta_c: batteryConfig.roundTripEfficiency / 100,
        eta_d: batteryConfig.roundTripEfficiency / 100,
        grid_cap_mw: gridConfig.gridPowerLimit,
        btf_cap_mw: gridConfig.btfPowerLimit,
        btf_price: gridConfig.btfPrice,
        curt_price: gridConfig.curtailmentValue,
        discount_rate: 0.08,
        project_life: 12,
      }
    : null;

  const {
    baselineNpv,
    baselineIrr,
    sensitivities,
    loading: sensitivityLoading,
    error: sensitivityError,
  } = useSensitivity(sensitivityConfig);

  if (loading) {
    return (
      <DashboardLayout title="Executive Summary">
        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
          Loading simulation data...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Executive Summary">
        <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
          Error loading simulation data: {error || "No data available"}
        </div>
      </DashboardLayout>
    );
  }

  const { dispatch, capex, financials, energy_mix_summary, pnl_waterfall } = data;
  const uptimePercent = (dispatch.full_supply_interval_share || 0) * 100;

  return (
    <DashboardLayout
      title="Executive Summary"
      subtitle="Investor-focused overview with energy sourcing, financial performance, and comprehensive KPIs"
    >
      <PanelBento>
        {/* Energy Mix Donut Chart */}
        <section className="panel panel--chart">
          <h3>Energy Sourcing Mix</h3>
          {energy_mix_summary ? (
            <EnergyMixChart
              energyMix={energy_mix_summary}
              uptimePercent={uptimePercent}
            />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
              Energy mix data not available
            </div>
          )}
        </section>

        {/* P&L Waterfall Chart */}
        <section className="panel panel--chart">
          <h3>Annual P&L Breakdown</h3>
          {pnl_waterfall ? (
            <PnLWaterfallChart pnl={pnl_waterfall} />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
              P&L data not available
            </div>
          )}
        </section>

        {/* Comprehensive KPI Table */}
        <section className="panel panel--full-width">
          <h3>Comprehensive KPI Summary</h3>
          <ExecutiveSummaryTable
            dispatch={dispatch}
            capex={capex}
            financials={financials}
          />
        </section>

        {/* NPV Sensitivity Analysis (Tornado Chart) */}
        <section className="panel panel--chart panel--span-full">
          <h3>NPV Sensitivity Analysis</h3>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
            Impact of ±20% parameter changes on Net Present Value (baseline NPV:{" "}
            {baselineNpv !== null
              ? `$${(baselineNpv / 1_000_000).toFixed(2)}M`
              : "calculating..."}
            )
          </p>
          {sensitivityLoading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
              Calculating sensitivity analysis...
            </div>
          ) : sensitivityError ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
              Error: {sensitivityError}
            </div>
          ) : sensitivities.length > 0 && baselineNpv !== null ? (
            <SensitivityTornado sensitivities={sensitivities} baselineNpv={baselineNpv} />
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
              No sensitivity data available
            </div>
          )}
        </section>
      </PanelBento>
    </DashboardLayout>
  );
}
