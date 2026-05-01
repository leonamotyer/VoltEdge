import { SimpleGroupedBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_ORANGE, CHART_BLUE } from "@/frontend/ui/chartTheme";

interface MonthlyCurtailmentProfileChartProps {
  data: Array<{
    label: string;
    totalCurtailmentMWh: number;
    curtailmentRatePercent: number;
  }>;
}

export function MonthlyCurtailmentProfileChart({ data }: MonthlyCurtailmentProfileChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h4>Monthly curtailment profile (curtailed MWh + rate %)</h4>
      <SimpleGroupedBarChart
        data={data}
        xKey="label"
        series={[
          { dataKey: "totalCurtailmentMWh", name: "Total curtailment (MWh)", color: CHART_ORANGE },
          { dataKey: "curtailmentRatePercent", name: "Curtailment rate (%)", color: CHART_BLUE },
        ]}
      />
    </section>
  );
}
