"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsCompactCharts } from "@/lib/frontEnd/ui/hooks/useMediaQuery";
import { CHART_GRID, CHART_PIE_COLORS } from "@/lib/frontEnd/ui/chartTheme";

export function SimpleLineChart({
  data,
  xKey,
  yKey,
  color,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color: string;
}) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 200 : 240;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ left: compact ? 0 : 4, right: compact ? 4 : 8, bottom: compact ? 8 : 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={compact ? -40 : 0}
            textAnchor={compact ? "end" : "middle"}
            height={compact ? 52 : 28}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: compact ? 10 : 12 }} width={compact ? 36 : 44} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={2.25} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  color,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color: string;
}) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 200 : 240;

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ left: compact ? 0 : 4, right: compact ? 4 : 8, bottom: compact ? 8 : 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={compact ? -40 : 0}
            textAnchor={compact ? "end" : "middle"}
            height={compact ? 52 : 28}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: compact ? 10 : 12 }} width={compact ? 36 : 44} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimplePieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const colors = [...CHART_PIE_COLORS];
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 200 : 240;

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
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={compact ? "72%" : "78%"}
            label={compact ? false : { fontSize: 11 }}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
