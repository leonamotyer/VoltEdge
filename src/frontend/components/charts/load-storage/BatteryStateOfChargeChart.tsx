import { SimpleLineChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN } from "@/frontend/ui/chartTheme";

interface BatteryStateOfChargeChartProps {
  socTimeSeries: Array<{
    timestamp: string;
    socPercent: number;
    capacityUsedMWh: number;
  }>;
}

export function BatteryStateOfChargeChart({ socTimeSeries }: BatteryStateOfChargeChartProps) {
  // Transform the data: timestamp -> formatted time string, socPercent -> soc
  const chartData = socTimeSeries.map((row) => ({
    time: new Date(row.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    }),
    soc: row.socPercent,
  }));

  return (
    <section className="panel panel--chart panel--span-full">
      <h3>Battery State of Charge (48h)</h3>
      <SimpleLineChart
        data={chartData}
        xKey="time"
        yKey="soc"
        color={CHART_GREEN}
      />
    </section>
  );
}
