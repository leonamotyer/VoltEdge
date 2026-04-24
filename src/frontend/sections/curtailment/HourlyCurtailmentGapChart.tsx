import { SimpleLineChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/frontend/ui/chartTheme";

interface HourlyCurtailmentGapChartProps {
  data: Array<{
    timestamp: string;
    gapMWh: number;
    priceCadPerMWh: number;
  }>;
}

export function HourlyCurtailmentGapChart({ data }: HourlyCurtailmentGapChartProps) {
  return (
    <section className="panel panel--chart">
      <h3>Hourly Curtailment Gap</h3>
      <SimpleLineChart data={data} xKey="timestamp" yKey="gapMWh" color={CHART_BLUE} />
    </section>
  );
}
