import { SimplePieChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN, CHART_BLUE, CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface EnergySourceMixChartProps {
  energyMix: {
    curtailedWindMWh: number;
    batteryDischargeMWh: number;
    gridImportMWh: number;
    btfMWh: number;
    totalMWh: number;
  };
}

export function EnergySourceMixChart({ energyMix }: EnergySourceMixChartProps) {
  // Transform energy mix data into pie chart format
  const pieData = [
    { name: "Curtailed Wind", value: energyMix.curtailedWindMWh, fill: CHART_GREEN },
    { name: "Battery Discharge", value: energyMix.batteryDischargeMWh, fill: CHART_BLUE },
    { name: "Grid Import", value: energyMix.gridImportMWh, fill: CHART_ORANGE },
  ];

  // Only include BTF if it has a non-zero value
  if (energyMix.btfMWh > 0) {
    pieData.push({ name: "BTF", value: energyMix.btfMWh, fill: "#9333ea" });
  }

  return (
    <section className="panel panel--chart">
      <h3>Energy Source Mix</h3>
      <SimplePieChart data={pieData} />
    </section>
  );
}
