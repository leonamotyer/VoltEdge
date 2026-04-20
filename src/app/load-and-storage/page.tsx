"use client";

import { DashboardLayout } from "@/lib/frontend/components/DashboardLayout";
import { KpiGrid } from "@/lib/frontend/components/KpiGrid";
import { PanelBento } from "@/lib/frontend/components/PanelBento";
import { KpiCard } from "@/lib/frontend/ui/components/KpiCard";
import { SimpleLineChart, SimplePieChart } from "@/lib/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN } from "@/lib/frontend/ui/chartTheme";

/** Small static demo — replace with real loaders when you wire the backend. */
const kpis = {
  capturedMWh: 12_400,
  releasedMWh: 9_800,
  revenueCad: 412_000,
};

const energyMix = [
  { name: "Curtailed wind", value: 42_000 },
  { name: "Battery", value: 9_800 },
  { name: "Grid", value: 3_100 },
];

const batterySweep = [0, 2, 4, 6, 8, 10, 12, 15].map((storageMWh, i) => ({
  storageMWh,
  estimatedGrossRevenueCad: 180_000 + i * 28_000 + storageMWh * 12_000,
}));

const socSample = Array.from({ length: 36 }, (_, i) => ({
  hour: `${i % 24}h`,
  stateOfChargeMWh: 2.8 + 2.2 * Math.sin(i / 5),
}));

export default function LoadAndStoragePage() {
  return (
    <DashboardLayout
      title="Load and Storage"
      subtitle="Demo layout: battery + curtailed supply story. Hook your own data into this page when ready."
    >
      <KpiGrid>
        <KpiCard
          featured
          label="Captured (demo)"
          value={`${kpis.capturedMWh.toLocaleString()} MWh`}
          sub="From curtailed periods"
          tone="green"
        />
        <KpiCard label="Released (demo)" value={`${kpis.releasedMWh.toLocaleString()} MWh`} sub="After round-trip losses" tone="blue" />
        <KpiCard label="Gross revenue (demo)" value={`$${kpis.revenueCad.toLocaleString()} CAD`} sub="Illustrative" tone="orange" />
      </KpiGrid>
      <PanelBento>
        <section className="panel panel--chart">
          <h4>Energy mix</h4>
          <SimplePieChart data={energyMix} />
        </section>
        <section className="panel panel--chart">
          <h4>Battery size vs revenue (demo)</h4>
          <SimpleLineChart data={batterySweep} xKey="storageMWh" yKey="estimatedGrossRevenueCad" color={CHART_GREEN} />
        </section>
        <section className="panel panel--chart">
          <h4>State of charge sample (demo)</h4>
          <SimpleLineChart data={socSample} xKey="hour" yKey="stateOfChargeMWh" color={CHART_BLUE} />
        </section>
      </PanelBento>
    </DashboardLayout>
  );
}
