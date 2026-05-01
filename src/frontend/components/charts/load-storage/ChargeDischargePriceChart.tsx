"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
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
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 280 : 350;

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
      <div className="chart-box" style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={chargeDischargeCycles} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              style={{ fontSize: compact ? "11px" : "12px" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              style={{ fontSize: compact ? "11px" : "12px" }}
              label={{
                value: "Power (MW)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#9ca3af" },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#9ca3af"
              style={{ fontSize: compact ? "11px" : "12px" }}
              label={{
                value: "Pool Price (CAD/MWh)",
                angle: 90,
                position: "insideRight",
                style: { fill: "#9ca3af" },
              }}
            />
            <Tooltip
              contentStyle={{
                fontSize: compact ? 12 : 13,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: compact ? 10 : 11 }} />
            <Bar yAxisId="left" dataKey="chargeMw" name="Charge (MW)" fill={CHART_GREEN} />
            <Bar yAxisId="left" dataKey="dischargeMw" name="Discharge (MW)" fill={CHART_BLUE} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="poolPrice"
              name="Pool Price"
              stroke={CHART_ORANGE}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
