import { SimpleLineChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/frontend/ui/chartTheme";

interface AvgCurtailmentTrendChartProps {
  data: Array<{
    label: string;
    avgCurtailmentMWhPerHour: number;
  }>;
}

export function AvgCurtailmentTrendChart({ data }: AvgCurtailmentTrendChartProps) {
  return (
    <section className="panel panel--chart">
      <h4>Average curtailment trend (MWh per hour by month)</h4>
      <SimpleLineChart
        data={data}
        xKey="label"
        yKey="avgCurtailmentMWhPerHour"
        color={CHART_BLUE}
      />
    </section>
  );
}
