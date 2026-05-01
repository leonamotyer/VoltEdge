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
import { CHART_BLUE, CHART_ORANGE, CHART_GREEN } from "@/frontend/ui/chartTheme";

interface MarginalCostChartProps {
  data: Array<{
    hour: number;
    "marginal_cost_$/mwh": number;
    "pool_price_$/mwh": number;
    source: string;
  }>;
}

/**
 * Marginal Cost vs Pool Price Dual-Axis Chart.
 * 
 * Displays hourly marginal cost of energy procurement compared to
 * AESO pool price to visualize arbitrage opportunities and cost dynamics.
 * 
 * - Blue Line: Pool price (CAD/MWh) - market rate for grid electricity
 * - Orange Bars: Marginal cost ($/MWh) - actual cost to procure energy
 * - Green highlights: Hours where pool price significantly exceeds marginal cost (arbitrage)
 * 
 * Chart automatically downsamples to every 10th hour for readability when
 * displaying full year (8760 hours).
 */
export function MarginalCostChart({ data }: MarginalCostChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 280 : 350;

  // Downsample for readability: show every 10th hour to avoid overcrowding
  const downsampledData = data.filter((_, idx) => idx % 10 === 0);

  // Calculate arbitrage indicator: 1 if spread > $5/MWh, 0 otherwise
  const chartData = downsampledData.map((d) => ({
    hour: d.hour,
    marginal_cost: d["marginal_cost_$/mwh"],
    pool_price: d["pool_price_$/mwh"],
    arbitrage: d["pool_price_$/mwh"] - d["marginal_cost_$/mwh"] > 5 ? 1 : 0,
    source: d.source,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const spread = data.pool_price - data.marginal_cost;

    return (
      <div
        style={{
          backgroundColor: "#1f2937",
          padding: "8px 12px",
          border: "1px solid #374151",
          borderRadius: "4px",
          fontSize: "13px",
        }}
      >
        <div style={{ marginBottom: "4px", fontWeight: 600 }}>Hour {data.hour}</div>
        <div style={{ color: CHART_BLUE }}>
          Pool Price: ${data.pool_price.toFixed(2)}/MWh
        </div>
        <div style={{ color: CHART_ORANGE }}>
          Marginal Cost: ${data.marginal_cost.toFixed(2)}/MWh
        </div>
        <div style={{ color: spread > 5 ? CHART_GREEN : "#9ca3af" }}>
          Spread: ${spread.toFixed(2)}/MWh
        </div>
        <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>
          Source: {data.source}
        </div>
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <section className="panel panel--chart panel--span-full">
        <h3>Marginal Cost vs Pool Price</h3>
        <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
          No marginal cost data available
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel--chart panel--span-full">
      <h3>Marginal Cost vs Pool Price</h3>
      <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1rem" }}>
        Hourly energy procurement cost compared to grid market price. Green highlights indicate
        arbitrage opportunities (spread &gt; $5/MWh).
      </p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="hour"
            stroke="#9ca3af"
            style={{ fontSize: compact ? "11px" : "12px" }}
            label={{
              value: "Hour of Year",
              position: "insideBottom",
              offset: -10,
              style: { fill: "#9ca3af" },
            }}
          />
          <YAxis
            yAxisId="left"
            stroke="#9ca3af"
            style={{ fontSize: compact ? "11px" : "12px" }}
            label={{
              value: "Cost ($/MWh)",
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: compact ? "11px" : "12px" }}
            iconType="line"
          />
          
          {/* Marginal Cost Bars (Left Axis) */}
          <Bar
            yAxisId="left"
            dataKey="marginal_cost"
            name="Marginal Cost"
            fill={CHART_ORANGE}
            opacity={0.7}
          />
          
          {/* Pool Price Line (Right Axis) */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pool_price"
            name="Pool Price"
            stroke={CHART_BLUE}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}
