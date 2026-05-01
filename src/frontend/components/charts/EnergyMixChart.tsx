"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
import { CHART_PIE_COLORS } from "@/frontend/ui/chartTheme";

interface EnergyMixChartProps {
  energyMix: {
    curtailed_percent: number;
    battery_percent: number;
    btf_percent: number;
    grid_percent: number;
    unmet_percent: number;
  };
  uptimePercent: number;
}

/**
 * Energy Mix Donut Chart with center uptime percentage display.
 * Shows breakdown of energy sources as percentages.
 */
export function EnergyMixChart({ energyMix, uptimePercent }: EnergyMixChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  // Transform data for PieChart
  const data = [
    { name: "Curtailed Wind", value: energyMix.curtailed_percent },
    { name: "Battery", value: energyMix.battery_percent },
    { name: "BTF", value: energyMix.btf_percent },
    { name: "Grid", value: energyMix.grid_percent },
    { name: "Unmet", value: energyMix.unmet_percent },
  ].filter((item) => item.value > 0); // Only show non-zero segments

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No energy mix data available</p>
      </div>
    );
  }

  const colors = [...CHART_PIE_COLORS];

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value: any) => `${value.toFixed(1)}%`}
          />
          <Legend
            wrapperStyle={{ fontSize: compact ? 10 : 11, paddingTop: 8 }}
            formatter={(value: any) => value}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={compact ? "45%" : "50%"}
            outerRadius={compact ? "70%" : "75%"}
            label={compact ? false : { fontSize: 11 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {/* Center text showing uptime */}
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: compact ? 20 : 24,
              fontWeight: 700,
              fill: "#1a3a52",
            }}
          >
            {uptimePercent.toFixed(1)}%
          </text>
          <text
            x="50%"
            y="50%"
            dy="1.5em"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: compact ? 10 : 11,
              fill: "#6b7280",
            }}
          >
            Uptime
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
