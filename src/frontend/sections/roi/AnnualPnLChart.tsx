"use client";

import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/frontend/ui/chartTheme";

interface AnnualPnLDataPoint extends Record<string, string | number> {
  line: string;
  cad: number;
}

interface AnnualPnLChartProps {
  data: AnnualPnLDataPoint[];
}

export function AnnualPnLChart({ data }: AnnualPnLChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h4>Annual P&amp;L lines (demo, $ CAD)</h4>
      <SimpleBarChart data={data} xKey="line" yKey="cad" color={CHART_BLUE} />
    </section>
  );
}
