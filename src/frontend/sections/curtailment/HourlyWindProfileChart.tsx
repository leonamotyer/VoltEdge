import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN } from "@/frontend/ui/chartTheme";

interface HourlyWindProfileChartProps {
  data: Array<{
    hour: number;
    avgWindMs: number;
  }>;
}

export function HourlyWindProfileChart({ data }: HourlyWindProfileChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h4>Hour-of-day wind profile (mock)</h4>
      <SimpleBarChart data={data} xKey="hour" yKey="avgWindMs" color={CHART_GREEN} />
    </section>
  );
}
