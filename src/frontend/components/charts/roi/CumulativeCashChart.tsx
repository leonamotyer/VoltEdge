"use client";

import { SimpleLineChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN } from "@/frontend/ui/chartTheme";

interface CumulativeCashDataPoint extends Record<string, string | number> {
  year: string;
  cumulativeCad: number;
}

interface CumulativeCashChartProps {
  data: CumulativeCashDataPoint[];
}

export function CumulativeCashChart({ data }: CumulativeCashChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h4>Cumulative cash position (10-year projection)</h4>
      <SimpleLineChart data={data} xKey="year" yKey="cumulativeCad" color={CHART_GREEN} />
    </section>
  );
}
