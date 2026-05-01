"use client";

import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
import { CHART_GRID } from "@/frontend/ui/chartTheme";

interface PnLWaterfallChartProps {
  pnl: {
    revenue: number;
    energy_cost: number;
    capex: number;
    opex: number;
    net_profit: number;
  };
}

/**
 * P&L Waterfall Chart showing revenue → costs → net profit flow.
 * Uses color coding: green for gains, red for costs, blue for totals.
 */
export function PnLWaterfallChart({ pnl }: PnLWaterfallChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  // Transform data for waterfall effect
  // Each bar starts at a cumulative position
  const data = [
    {
      name: "Revenue",
      value: pnl.revenue,
      start: 0,
      color: "#27AE60", // Green for revenue
    },
    {
      name: "Energy Cost",
      value: pnl.energy_cost,
      start: pnl.revenue,
      color: "#E74C3C", // Red for costs
    },
    {
      name: "CAPEX",
      value: pnl.capex,
      start: pnl.revenue + pnl.energy_cost,
      color: "#E74C3C", // Red for costs
    },
    {
      name: "OPEX",
      value: pnl.opex,
      start: pnl.revenue + pnl.energy_cost + pnl.capex,
      color: "#E74C3C", // Red for costs
    },
    {
      name: "Net Profit",
      value: pnl.net_profit,
      start: 0,
      color: pnl.net_profit >= 0 ? "#1a3a52" : "#E74C3C", // Blue if positive, red if negative
    },
  ];

  // Check if data is valid
  if (!pnl) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No P&L data available</p>
      </div>
    );
  }

  // Format currency for display
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (absValue >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          margin={{ left: compact ? 0 : 4, right: compact ? 4 : 8, bottom: compact ? 8 : 4, top: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={compact ? -35 : 0}
            textAnchor={compact ? "end" : "middle"}
            height={compact ? 58 : 28}
          />
          <YAxis
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 48 : 60}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value: any) => formatCurrency(value)}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
