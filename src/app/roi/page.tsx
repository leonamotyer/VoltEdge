"use client";

import { DashboardLayout } from "@/lib/frontend/components/DashboardLayout";
import { KpiGrid } from "@/lib/frontend/components/KpiGrid";
import { PanelBento } from "@/lib/frontend/components/PanelBento";
import { KpiCard } from "@/lib/frontend/ui/components/KpiCard";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "@/lib/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN } from "@/lib/frontend/ui/chartTheme";

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
        <section className="panel panel--chart">
          <h4>CAPEX breakdown (demo)</h4>
          <SimplePieChart data={capexMix} />
        </section>
        <section className="panel panel--chart panel--span-full">
          <h4>Cumulative cash position (demo)</h4>
          <SimpleLineChart data={cumulativeCash} xKey="year" yKey="cumulativeCad" color={CHART_GREEN} />
        </section>
        <section className="panel panel--chart panel--span-full">
          <h4>Annual P&amp;L lines (demo, $ CAD)</h4>
          <SimpleBarChart data={annualPl} xKey="line" yKey="cad" color={CHART_BLUE} />
        </section>
      </PanelBento>
    </DashboardLayout>
  );
}
