"use client";

import { SimplePieChart } from "@/frontend/ui/components/charts/SimpleCharts";

interface CapexBreakdownItem {
  name: string;
  value: number;
}

interface CapexBreakdownChartProps {
  data: CapexBreakdownItem[];
}

export function CapexBreakdownChart({ data }: CapexBreakdownChartProps) {
  return (
    <section className="panel panel--chart">
      <h3>CAPEX breakdown (demo)</h3>
      <SimplePieChart data={data} />
    </section>
  );
}
