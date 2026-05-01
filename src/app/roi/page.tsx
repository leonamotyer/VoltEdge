"use client";

import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { SweepTable } from "@/frontend/ui/components/SweepTable";
import { CapexBreakdownChart } from "@/frontend/components/charts/roi/CapexBreakdownChart";
import { CumulativeCashChart } from "@/frontend/components/charts/roi/CumulativeCashChart";
import { AnnualPnLChart } from "@/frontend/components/charts/roi/AnnualPnLChart";
import { MarginalCostChart } from "@/frontend/components/charts/roi/MarginalCostChart";
import { useOptimizationSweeps } from "@/hooks/useOptimizationSweeps";
import { useFinancialProjections } from "@/hooks/useFinancialProjections";
import { useEconomics } from "@/hooks/useEconomics";

export default function RoiPage() {
  // Fetch optimization sweeps and financial projections
  const { batterySweep, loading: sweepsLoading, error: sweepsError } = useOptimizationSweeps();
  const {
    npv,
    irr,
    cashFlows,
    yearlyDetails,
    baselineFinancials,
    capex,
    loading: financialsLoading,
    error: financialsError
  } = useFinancialProjections();

  // Fetch marginal cost economics analysis
  const {
    marginalCosts,
    costDistribution,
    summary: economicsSummary,
    loading: economicsLoading,
    error: economicsError
  } = useEconomics();

  const loading = sweepsLoading || financialsLoading || economicsLoading;
  const error = sweepsError || financialsError || economicsError;

  // Transform CAPEX breakdown from backend response
  const capexMix = capex.capex_total_$ ? [
    { name: "Battery (energy)", value: capex.capex_batt_energy_$ || 0 },
    { name: "Battery (power / PCS)", value: capex.capex_batt_power_$ || 0 },
    { name: "GPU hardware", value: capex.capex_gpu_$ || 0 },
    { name: "Racks & infra", value: capex.capex_rack_$ || 0 },
  ] : [];

  // Transform cash flows to cumulative cash position
  const cumulativeCash = cashFlows.map((cashFlow, index) => {
    const cumulative = cashFlows.slice(0, index + 1).reduce((sum, cf) => sum + cf, 0);
    return {
      year: `Y${index}`,
      cumulativeCad: cumulative,
    };
  });

  // Transform yearly details to P&L chart data
  const annualPl = yearlyDetails.length > 0 ? [
    { line: "Revenue", cad: yearlyDetails[0].revenue_$ },
    { line: "Energy cost", cad: -yearlyDetails[0].energy_cost_$ },
    { line: "O&M", cad: -yearlyDetails[0].om_cost_$ },
    { line: "Net", cad: yearlyDetails[0].cash_flow_$ },
  ] : [];

  // Transform battery sweep data for table
  const sweepTableData = batterySweep.map(row => ({
    batteryMwh: row.batt_mwh,
    uptime: row["uptime_%"],
    coverage: row["coverage_%"],
    netProfit: row["net_profit_$M"],
    capex: row["capex_$M"],
    payback: row.payback_yrs,
    roi: row["roi_%"],
    avgEnergyCost: row["avg_cost_$/mwh"],
  }));

  // Extract KPIs from baseline financials
  const netProfitCad = baselineFinancials.annual_net_profit_$ || 0;
  const roiPct = baselineFinancials["roi_%"] || 0;
  const paybackYears = baselineFinancials.payback_years || 0;
  const capexCad = capex.capex_total_$ || 0;

  if (loading) {
    return (
      <DashboardLayout
        title="ROI & Economics"
        subtitle="Loading financial projections and optimization sweeps..."
      >
        <div className="p-8 text-center text-gray-600">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="ROI & Economics"
        subtitle="Error loading financial data"
      >
        <div className="p-8 text-center text-red-600">Error: {error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="ROI & Economics"
      subtitle="Multi-year NPV/IRR analysis with optimization sweeps"
    >
      <KpiGrid>
        <KpiCard
          featured
          label="Est. annual net profit"
          value={`$${(netProfitCad / 1e6).toFixed(2)}M CAD`}
          sub="After energy, amortized CAPEX, O&M"
          tone="green"
        />
        <KpiCard
          label="ROI"
          value={`${roiPct.toFixed(1)}%`}
          sub="On total CAPEX"
          tone="blue"
        />
        <KpiCard
          label="Simple payback"
          value={`${paybackYears.toFixed(1)} yrs`}
          sub="Undiscounted cash breakeven"
          tone="orange"
        />
        <KpiCard
          label="Total CAPEX"
          value={`$${(capexCad / 1e6).toFixed(1)}M CAD`}
          sub="Battery + compute + racks"
          tone="blue"
        />
      </KpiGrid>
      <PanelBento>
        <CapexBreakdownChart data={capexMix} />
        <CumulativeCashChart data={cumulativeCash} />
        <AnnualPnLChart data={annualPl} />
      </PanelBento>

      {/* Marginal Cost Analysis */}
      <MarginalCostChart data={marginalCosts} />

      {/* Battery Sizing Sensitivity Sweep */}
      <SweepTable
        title="Battery Sizing Optimization Sweep"
        columns={[
          { key: 'batteryMwh', label: 'Battery (MWh)', format: (v) => v.toFixed(1) },
          { key: 'uptime', label: 'Uptime (%)', format: (v) => v.toFixed(1) },
          { key: 'coverage', label: 'Coverage (%)', format: (v) => v.toFixed(1) },
          { key: 'netProfit', label: 'Net Profit ($M)', format: (v) => (v >= 0 ? '+' : '') + v.toFixed(3), colorize: true },
          { key: 'capex', label: 'CAPEX ($M)', format: (v) => v.toFixed(2) },
          { key: 'payback', label: 'Payback (yrs)', format: (v) => v.toFixed(1) },
          { key: 'roi', label: 'ROI (%)', format: (v) => v.toFixed(1), colorize: true },
          { key: 'avgEnergyCost', label: 'Avg Energy Cost ($/MWh)', format: (v) => v.toFixed(1) },
        ]}
        rows={sweepTableData}
      />
    </DashboardLayout>
  );
}
