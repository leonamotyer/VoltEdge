"use client";

import { currency, percentage, decimal } from "@/frontend/utils/formatters";

interface ExecutiveSummaryTableProps {
  dispatch: Record<string, number>;
  capex: Record<string, number>;
  financials: Record<string, number>;
}

/**
 * Comprehensive KPI table for Executive Summary page.
 * Displays 25+ KPIs organized into 5 sections.
 */
export function ExecutiveSummaryTable({ dispatch, capex, financials }: ExecutiveSummaryTableProps) {
  // Section 1: GPU Configuration
  const gpuSection = [
    { metric: "GPU Count", value: capex.n_gpus?.toFixed(0) || "0" },
    { metric: "Rack Count", value: capex.n_racks?.toFixed(0) || "0" },
    { metric: "GPU Load (MW)", value: decimal(dispatch.annual_gpu_demand_mwh / 8760, 2) },
    { metric: "Unit Price (CAD)", value: currency(capex._unit_price_cad || 0) },
    { metric: "Rental Rate (CAD/hr)", value: currency(capex._rental_hr_cad || 0) },
  ];

  // Section 2: Energy Dispatch
  const energySection = [
    { metric: "Annual Served (MWh)", value: decimal(dispatch.annual_served_mwh, 0) },
    { metric: "Annual Unmet (MWh)", value: decimal(dispatch.annual_unmet_mwh, 0) },
    { metric: "Curtailed Wind Used (MWh)", value: decimal(dispatch.annual_direct_curt_used_mwh, 0) },
    { metric: "Battery Discharge (MWh)", value: decimal(dispatch.annual_batt_used_mwh, 0) },
    { metric: "BTF Used (MWh)", value: decimal(dispatch.annual_btf_used_mwh, 0) },
    { metric: "Grid Import (MWh)", value: decimal(dispatch.annual_grid_used_mwh, 0) },
    { metric: "Spilled Curtailment (MWh)", value: decimal(dispatch.annual_spilled_curt_mwh, 0) },
    { metric: "Avg Energy Cost ($/MWh)", value: currency(dispatch["avg_energy_cost_$/mwh"] || 0) },
  ];

  // Section 3: Financial Summary
  const financialSection = [
    { metric: "Annual Revenue", value: currency(financials.annual_revenue_$ || 0) },
    { metric: "Energy Cost", value: currency(financials.annual_energy_cost_$ || 0) },
    { metric: "Annualized CAPEX", value: currency(financials.annualized_capex_$ || 0) },
    { metric: "Annual O&M", value: currency(financials.annual_fixed_om_$ || 0) },
    { metric: "Total Annual Cost", value: currency(financials.annual_total_cost_$ || 0) },
    { metric: "Net Annual Profit", value: currency(financials.annual_net_profit_$ || 0) },
    { metric: "Payback Period (years)", value: financials.payback_years < 99 ? decimal(financials.payback_years, 1) : ">25" },
    { metric: "ROI (%)", value: percentage(financials["roi_%"] / 100, 1) },
    { metric: "Net Profit per MWh", value: currency(financials.net_profit_per_mwh_$ || 0) },
  ];

  // Section 4: Uptime & Coverage
  const uptimeSection = [
    { metric: "Full-Supply Uptime (%)", value: percentage(dispatch.full_supply_interval_share, 1) },
    { metric: "Energy Coverage (%)", value: percentage(dispatch.coverage_energy, 1) },
  ];

  // Section 5: CAPEX Breakdown
  const capexSection = [
    { metric: "Total CAPEX", value: currency(capex.capex_total_$ || 0) },
    { metric: "Battery Energy CAPEX", value: currency(capex.capex_batt_energy_$ || 0) },
    { metric: "Battery Power CAPEX", value: currency(capex.capex_batt_power_$ || 0) },
    { metric: "GPU Hardware CAPEX", value: currency(capex.capex_gpu_$ || 0) },
    { metric: "Rack CAPEX", value: currency(capex.capex_rack_$ || 0) },
  ];

  return (
    <div className="executive-summary-table">
      {renderSection("GPU Configuration", gpuSection)}
      {renderSection("Energy Dispatch", energySection)}
      {renderSection("Financial Summary", financialSection)}
      {renderSection("Uptime & Coverage", uptimeSection)}
      {renderSection("CAPEX Breakdown", capexSection)}
    </div>
  );
}

function renderSection(title: string, rows: Array<{ metric: string; value: string }>) {
  return (
    <div className="kpi-section">
      <h4 className="section-title">{title}</h4>
      <div className="kpi-grid">
        {rows.map((row, index) => (
          <div key={index} className="kpi-row">
            <span className="kpi-metric">{row.metric}</span>
            <span className="kpi-value">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
