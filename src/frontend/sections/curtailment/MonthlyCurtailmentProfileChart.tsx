import { SimpleGroupedBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_ORANGE, CHART_GREEN } from "@/frontend/ui/chartTheme";

interface MonthlyCurtailmentProfileChartProps {
  data: Array<{
    label: string;
    totalCurtailmentMWh: number;
    unusedEnergyMWh: number;
  }>;
}

export function MonthlyCurtailmentProfileChart({ data }: MonthlyCurtailmentProfileChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h4>Monthly curtailment profile (mock — total gap vs unused energy)</h4>
      <SimpleGroupedBarChart
        data={data}
        xKey="label"
        series={[
          { dataKey: "totalCurtailmentMWh", name: "Total curtailment (MWh)", color: CHART_ORANGE },
          { dataKey: "unusedEnergyMWh", name: "Unused energy (MWh)", color: CHART_GREEN },
        ]}
      />
    </section>
  );
}
