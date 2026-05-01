import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface EventDurationChartProps {
  data: Array<{
    bucket: string;
    count: number;
  }>;
}

export function EventDurationChart({ data }: EventDurationChartProps) {
  return (
    <section className="panel panel--chart">
      <h4>Curtailment event duration distribution</h4>
      <SimpleBarChart data={data} xKey="bucket" yKey="count" color={CHART_ORANGE} />
    </section>
  );
}
