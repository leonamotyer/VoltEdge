import { BatteryPowerVsPriceChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_GREEN, CHART_BLUE, CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface ChargeDischargePriceChartProps {
  chargeDischargeCycles: Array<{
    timestamp: string;
    chargeMw: number;
    dischargeMw: number;
    poolPrice: number;
  }>;
}

export function ChargeDischargePriceChart({
  chargeDischargeCycles,
}: ChargeDischargePriceChartProps) {
  return (
    <section className="panel panel--chart panel--span-full">
      <h3>Charge/Discharge Cycles vs Pool Price</h3>
      <p style={{
        fontSize: "clamp(0.8rem, 2vw, 0.875rem)",
        color: "#64748b",
        marginBottom: "clamp(0.5rem, 1.5vw, 0.75rem)",
        padding: "0 clamp(1rem, 3vw, 1.25rem)",
        lineHeight: "1.5"
      }}>
        Battery charges during low/negative prices (curtailment) and discharges during high prices
      </p>
      <BatteryPowerVsPriceChart
        data={chargeDischargeCycles}
        chargeColor={CHART_GREEN}
        dischargeColor={CHART_BLUE}
        priceColor={CHART_ORANGE}
      />
    </section>
  );
}
