"use client";

import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
import { CHART_GRID } from "@/frontend/ui/chartTheme";

interface SensitivityData {
  parameter: string;
  downside_npv: number;
  upside_npv: number;
  downside_delta: number;
  upside_delta: number;
  total_impact: number;
}

interface SensitivityTornadoProps {
  sensitivities: SensitivityData[];
  baselineNpv: number;
}

/**
 * Tornado chart for NPV sensitivity analysis.
 * Shows horizontal bidirectional bars representing parameter impact on NPV.
 * 
 * - Left bars (red): Downside impact from -20% perturbation
 * - Right bars (green): Upside impact from +20% perturbation
 * - Parameters sorted by total impact (most sensitive at top)
 * - Center reference line at baseline NPV
 */
export function SensitivityTornado({ sensitivities, baselineNpv }: SensitivityTornadoProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 300 : 400;

  // Check if data is valid
  if (!sensitivities || sensitivities.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No sensitivity data available</p>
      </div>
    );
  }

  // Format parameter names for display
  const formatParameterName = (param: string): string => {
    const nameMap: Record<string, string> = {
      gpu_unit_price: "GPU Unit Price",
      gpu_rental_rate: "GPU Rental Rate",
      curt_price: "Curtailment Price",
      btf_price: "BTF Price",
      grid_cap: "Grid Capacity",
      discount_rate: "Discount Rate",
    };
    return nameMap[param] || param;
  };

  // Transform data for tornado chart
  // We need two bars per parameter: downside (negative delta, red) and upside (positive delta, green)
  const data = sensitivities.map((s) => ({
    parameter: formatParameterName(s.parameter),
    downside: s.downside_delta, // Negative value
    upside: s.upside_delta,       // Positive value
  }));

  // Format currency for display
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) {
      return `${value >= 0 ? "+" : ""}${(value / 1_000_000).toFixed(2)}M`;
    }
    if (absValue >= 1_000) {
      return `${value >= 0 ? "+" : ""}${(value / 1_000).toFixed(0)}K`;
    }
    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}`;
  };

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: compact ? 100 : 140, right: compact ? 20 : 40, top: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: compact ? 10 : 12 }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="parameter"
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 95 : 135}
          />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value: any) => [`NPV Impact: ${formatCurrency(value)}`, ""]}
            labelFormatter={(label: any) => `${label} (±20%)`}
          />
          {/* Reference line at zero (baseline NPV) */}
          <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" />
          
          {/* Downside bar (negative impact, red) */}
          <Bar dataKey="downside" fill="#E74C3C" radius={[0, 4, 4, 0]} />
          
          {/* Upside bar (positive impact, green) */}
          <Bar dataKey="upside" fill="#27AE60" radius={[4, 0, 0, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
