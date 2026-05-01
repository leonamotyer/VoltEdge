"use client";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
import { CHART_PIE_COLORS } from "@/frontend/ui/chartTheme";

interface SimpleLineChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color: string;
}

interface SimplePieChartProps {
  data: Array<{ name: string; value: number; fill?: string }>;
}

interface SimpleBarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color: string;
}

interface SimpleGroupedBarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: Array<{ dataKey: string; name: string; color: string }>;
}

export function SimpleLineChart({ data, xKey, yKey, color }: SimpleLineChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  return (
    <div className="chart-box" style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#9ca3af"
            style={{ fontSize: compact ? "11px" : "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: compact ? "11px" : "12px" }} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimplePieChart({ data }: SimplePieChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  return (
    <div className="chart-box" style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: compact ? 10 : 11, paddingTop: 8 }} />
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
              <Cell
                key={`cell-${entry.name}-${index}`}
                fill={entry.fill || CHART_PIE_COLORS[index % CHART_PIE_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({ data, xKey, yKey, color }: SimpleBarChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  return (
    <div className="chart-box" style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#9ca3af"
            style={{ fontSize: compact ? "11px" : "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: compact ? "11px" : "12px" }} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Bar dataKey={yKey} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleGroupedBarChart({ data, xKey, series }: SimpleGroupedBarChartProps) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 240 : 300;

  return (
    <div className="chart-box" style={{ padding: "clamp(0.75rem, 2vw, 1rem)" }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            stroke="#9ca3af"
            style={{ fontSize: compact ? "11px" : "12px" }}
          />
          <YAxis stroke="#9ca3af" style={{ fontSize: compact ? "11px" : "12px" }} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: compact ? 10 : 11 }} />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
