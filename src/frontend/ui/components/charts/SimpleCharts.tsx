"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useIsCompactCharts } from "@/frontend/ui/hooks/useMediaQuery";
import { CHART_GRID, CHART_PIE_COLORS } from "@/frontend/ui/chartTheme";

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

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

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

/** Grouped bars (e.g. monthly curtailment vs unused energy) — shared category axis. */
export function SimpleGroupedBarChart({
  data,
  xKey,
  series,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: readonly { dataKey: string; name: string; color: string }[];
}) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 220 : 260;

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ left: compact ? 0 : 4, right: compact ? 4 : 8, bottom: compact ? 8 : 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: compact ? 10 : 12 }}
            angle={compact ? -35 : 0}
            textAnchor={compact ? "end" : "middle"}
            height={compact ? 48 : 28}
            interval={0}
          />
          <YAxis tick={{ fontSize: compact ? 10 : 12 }} width={compact ? 40 : 48} />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 12 : 13,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: compact ? 11 : 12, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: "#334155" }}>{value}</span>}
          />
          {series.map((s) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              maxBarSize={56}
            />
          ))}
        </BarChart>
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

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

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

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

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

/**
 * Dual-axis chart for battery charge/discharge power vs pool price
 * - Left Y-axis: Power in MW (charge and discharge)
 * - Right Y-axis: Pool price in CAD/MWh
 */
export function BatteryPowerVsPriceChart({
  data,
  chargeColor,
  dischargeColor,
  priceColor,
}: {
  data: Array<{
    timestamp: string;
    chargeMw: number;
    dischargeMw: number;
    poolPrice: number;
  }>;
  chargeColor: string;
  dischargeColor: string;
  priceColor: string;
}) {
  const compact = useIsCompactCharts();
  const chartHeight = compact ? 220 : 260;

  // Check if data is empty
  if (!data || data.length === 0) {
    return (
      <div className="chart-box" style={{ minHeight: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

  // Format timestamp for display
  const formattedData = data.map((d) => {
    const date = new Date(d.timestamp);
    const hour = date.getHours();
    const day = date.getDate();
    return {
      ...d,
      displayTime: `D${day} ${hour.toString().padStart(2, "0")}:00`,
    };
  });

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart
          data={formattedData}
          margin={{ left: compact ? 0 : 4, right: compact ? 0 : 4, bottom: compact ? 8 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: compact ? 9 : 11 }}
            angle={compact ? -45 : -35}
            textAnchor="end"
            height={compact ? 58 : 52}
            interval={compact ? 5 : 3}
          />
          {/* Left Y-axis for power (MW) */}
          <YAxis
            yAxisId="power"
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 38 : 46}
            label={{
              value: "Power (MW)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: compact ? 10 : 11, fill: "#6b7280" },
            }}
          />
          {/* Right Y-axis for price (CAD/MWh) */}
          <YAxis
            yAxisId="price"
            orientation="right"
            tick={{ fontSize: compact ? 10 : 12 }}
            width={compact ? 42 : 50}
            label={{
              value: "Pool Price (CAD/MWh)",
              angle: 90,
              position: "insideRight",
              style: { fontSize: compact ? 10 : 11, fill: "#6b7280" },
            }}
          />
          <Tooltip
            contentStyle={{
              fontSize: compact ? 11 : 12,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value, name) => {
              const numValue = typeof value === "number" ? value : 0;
              if (name === "chargeMw") return [`${numValue.toFixed(2)} MW`, "Charge"];
              if (name === "dischargeMw") return [`${numValue.toFixed(2)} MW`, "Discharge"];
              if (name === "poolPrice") return [`${numValue.toFixed(2)} CAD/MWh`, "Pool Price"];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: compact ? 10 : 11, paddingTop: 8 }}
            formatter={(value) => {
              if (value === "chargeMw") return "Charge (MW)";
              if (value === "dischargeMw") return "Discharge (MW)";
              if (value === "poolPrice") return "Pool Price (CAD/MWh)";
              return value;
            }}
          />
          {/* Charge power as bars */}
          <Bar
            yAxisId="power"
            dataKey="chargeMw"
            fill={chargeColor}
            radius={[3, 3, 0, 0]}
            maxBarSize={compact ? 18 : 24}
          />
          {/* Discharge power as bars */}
          <Bar
            yAxisId="power"
            dataKey="dischargeMw"
            fill={dischargeColor}
            radius={[3, 3, 0, 0]}
            maxBarSize={compact ? 18 : 24}
          />
          {/* Pool price as line on right axis */}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="poolPrice"
            stroke={priceColor}
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
