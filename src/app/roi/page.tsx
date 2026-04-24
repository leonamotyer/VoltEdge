"use client";

import { DashboardLayout } from "@/frontend/components/DashboardLayout";
import { KpiGrid } from "@/frontend/components/KpiGrid";
import { PanelBento } from "@/frontend/components/PanelBento";
import { KpiCard } from "@/frontend/ui/components/KpiCard";
import { SweepTable } from "@/frontend/ui/components/SweepTable";
import { CapexBreakdownChart } from "@/frontend/sections/roi/CapexBreakdownChart";
import { CumulativeCashChart } from "@/frontend/sections/roi/CumulativeCashChart";
import { AnnualPnLChart } from "@/frontend/sections/roi/AnnualPnLChart";

/** Placeholder figures — swap for model output when the economics API exists. */
const kpis = {
  netProfitCad: 1_850_000,
  roiPct: 14.2,
  paybackYears: 8.4,
  capexCad: 12_400_000,
};

const capexMix = [
  { name: "Battery (energy)", value: 4_200_000 },
  { name: "Battery (power / PCS)", value: 1_100_000 },
  { name: "GPU hardware", value: 4_800_000 },
  { name: "Racks & infra", value: 2_300_000 },
];

const cumulativeCash = Array.from({ length: 13 }, (_, year) => ({
  year: `Y${year}`,
  cumulativeCad: year === 0 ? -kpis.capexCad : -kpis.capexCad + year * 1.55e6 + year * year * 35_000,
}));

const annualPl = [
  { line: "Revenue", cad: 4_2e6 },
  { line: "Energy cost", cad: -1_1e6 },
  { line: "O&M", cad: -620_000 },
  { line: "Net (demo)", cad: 1.85e6 },
];

// Full sweep table data - battery sizing sensitivity analysis (demo data)
const sweepData = [
  { batteryMwh: 0, uptime: 62.3, coverage: 58.1, netProfit: -0.425, capex: 8.12, payback: 25.0, roi: -5.2, avgEnergyCost: 85.4 },
  { batteryMwh: 50, uptime: 74.2, coverage: 71.8, netProfit: 0.156, capex: 9.85, payback: 18.3, roi: 1.6, avgEnergyCost: 72.8 },
  { batteryMwh: 100, uptime: 81.5, coverage: 79.3, netProfit: 0.892, capex: 11.58, payback: 12.9, roi: 7.7, avgEnergyCost: 64.2 },
  { batteryMwh: 150, uptime: 86.7, coverage: 84.6, netProfit: 1.425, capex: 13.31, payback: 9.3, roi: 10.7, avgEnergyCost: 58.6 },
  { batteryMwh: 200, uptime: 90.1, coverage: 88.2, netProfit: 1.763, capex: 15.04, payback: 8.5, roi: 11.7, avgEnergyCost: 54.9 },
  { batteryMwh: 250, uptime: 92.4, coverage: 90.8, netProfit: 1.952, capex: 16.77, payback: 8.6, roi: 11.6, avgEnergyCost: 52.3 },
  { batteryMwh: 300, uptime: 94.1, coverage: 92.7, netProfit: 2.024, capex: 18.50, payback: 9.1, roi: 10.9, avgEnergyCost: 50.5 },
  { batteryMwh: 350, uptime: 95.2, coverage: 94.1, netProfit: 1.998, capex: 20.23, payback: 10.1, roi: 9.9, avgEnergyCost: 49.2 },
  { batteryMwh: 400, uptime: 96.0, coverage: 95.1, netProfit: 1.891, capex: 21.96, payback: 11.6, roi: 8.6, avgEnergyCost: 48.3 },
  { batteryMwh: 450, uptime: 96.6, coverage: 95.9, netProfit: 1.723, capex: 23.69, payback: 13.8, roi: 7.3, avgEnergyCost: 47.7 },
  { batteryMwh: 500, uptime: 97.0, coverage: 96.5, netProfit: 1.512, capex: 25.42, payback: 16.8, roi: 5.9, avgEnergyCost: 47.2 },
];

export default function RoiPage() {
  return (
    <DashboardLayout
      title="ROI & Economics"
      subtitle="High-level return, payback, and cost stack. Wire your sizing + tariff model here later."
    >
      <KpiGrid>
        <KpiCard
          featured
          label="Est. annual net (demo)"
          value={`$${(kpis.netProfitCad / 1e6).toFixed(2)}M CAD`}
          sub="After energy, amortized CAPEX, O&M"
          tone="green"
        />
        <KpiCard label="ROI (demo)" value={`${kpis.roiPct.toFixed(1)}%`} sub="On total CAPEX" tone="blue" />
        <KpiCard label="Simple payback" value={`${kpis.paybackYears.toFixed(1)} yrs`} sub="Undiscounted cash breakeven" tone="orange" />
        <KpiCard label="Total CAPEX (demo)" value={`$${(kpis.capexCad / 1e6).toFixed(1)}M CAD`} sub="Battery + compute + racks" tone="blue" />
      </KpiGrid>
      <PanelBento>
        <CapexBreakdownChart data={capexMix} />
        <CumulativeCashChart data={cumulativeCash} />
        <AnnualPnLChart data={annualPl} />
      </PanelBento>

      {/* Full Sweep Table - Battery Sizing Sensitivity */}
      <SweepTable
        title="Full Sweep Table - Battery Sizing Sensitivity"
        columns={[
          { key: 'batteryMwh', label: 'Battery (MWh)', format: (v) => v.toFixed(0) },
          { key: 'uptime', label: 'Uptime (%)', format: (v) => v.toFixed(1) },
          { key: 'coverage', label: 'Coverage (%)', format: (v) => v.toFixed(1) },
          { key: 'netProfit', label: 'Net Profit ($M)', format: (v) => (v >= 0 ? '+' : '') + v.toFixed(3), colorize: true },
          { key: 'capex', label: 'CAPEX ($M)', format: (v) => v.toFixed(3) },
          { key: 'payback', label: 'Payback (yrs)', format: (v) => v.toFixed(1) },
          { key: 'roi', label: 'ROI (%)', format: (v) => v.toFixed(1) },
          { key: 'avgEnergyCost', label: 'Avg Energy Cost ($/MWh)', format: (v) => v.toFixed(2) },
        ]}
        rows={sweepData}
      />
    </DashboardLayout>
  );
}
