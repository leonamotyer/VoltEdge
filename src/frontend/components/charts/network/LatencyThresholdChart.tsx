import { SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE } from "@/frontend/ui/chartTheme";

interface LatencyThresholdChartProps {
  estimatedLatencyMs: number;
}

export function LatencyThresholdChart({ estimatedLatencyMs }: LatencyThresholdChartProps) {
  // Build threshold comparison data
  const thresholdData = [
    { name: "Estimated", latencyMs: estimatedLatencyMs },
    { name: "Inference Max", latencyMs: 20 },
    { name: "Training Max", latencyMs: 150 },
  ];

  return (
    <section className="panel panel--chart">
      <h3>Latency vs Thresholds</h3>
      <SimpleBarChart data={thresholdData} xKey="name" yKey="latencyMs" color={CHART_BLUE} />
    </section>
  );
}
