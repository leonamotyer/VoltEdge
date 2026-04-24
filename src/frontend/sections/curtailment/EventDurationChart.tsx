import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface EventDurationChartProps {
  data: Array<{
    bucket: string;
    hoursInBucket: number;
  }>;
}

export function EventDurationChart({ data }: EventDurationChartProps) {
  return (
    <section className="panel panel--chart">
      <h4>Curtailment event duration (mock — hours accumulated by length bucket)</h4>
      <SimpleBarChart data={data} xKey="bucket" yKey="hoursInBucket" color={CHART_ORANGE} />
    </section>
  );
}
