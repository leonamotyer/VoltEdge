"use client";

import type { GpuConfig } from "./types";
import { GPU_CONFIG_DEFAULTS } from "./types";
import { SimpleLineChart, SimplePieChart, SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface GpuChartsProps {
  config: GpuConfig;
}

export function GpuCharts({ config }: GpuChartsProps) {
  // Extract values with defaults
  const numberOfGpus = config.numberOfGpus;
  const rentalPricePerHour = config.rentalPricePerHour;
  const utilization = (config.utilization ?? GPU_CONFIG_DEFAULTS.utilization) / 100;
  const systemLifetime = config.systemLifetime ?? GPU_CONFIG_DEFAULTS.systemLifetime;
  const gpuPurchaseCost = config.gpuPurchaseCost ?? 0;
  const deploymentCost = config.deploymentCost ?? GPU_CONFIG_DEFAULTS.deploymentCost;

  // Calculate costs
  const gpuHardwareCost = numberOfGpus * gpuPurchaseCost;
  const gpusPerRack = 8;
  const rackCost = 8_000 * 1.38; // USD to CAD conversion
  const numberOfRacks = Math.ceil(numberOfGpus / gpusPerRack);
  const rackInfraCost = numberOfRacks * rackCost;
  const totalCapex = gpuHardwareCost + rackInfraCost + deploymentCost;

  // Calculate revenue metrics
  const annualRevenue = numberOfGpus * rentalPricePerHour * 8760 * utilization;
  const monthlyRevenue = annualRevenue / 12;

  // 1. Revenue Projection Over System Lifetime
  const revenueProjection = Array.from({ length: systemLifetime }, (_, i) => ({
    year: `Year ${i + 1}`,
    revenue: Math.round(annualRevenue),
  }));

  // 2. CAPEX Breakdown
  const capexBreakdown = [
    { name: "GPU Hardware", value: Math.round(gpuHardwareCost) },
    { name: "Rack Infrastructure", value: Math.round(rackInfraCost) },
    { name: "Deployment", value: Math.round(deploymentCost) },
  ].filter((item) => item.value > 0);

  // 3. Monthly Revenue Projection (12 months)
  const monthlyRevenueData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(0, i).toLocaleString("default", { month: "short" }),
    revenue: Math.round(monthlyRevenue),
  }));

  // Show message if config is incomplete
  if (numberOfGpus === 0 || rentalPricePerHour === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>
        <p>Configure GPU settings above to see revenue projections and cost breakdown.</p>
      </div>
    );
  }

  return (
    <div className="gpu-charts">
      <style jsx>{`
        .gpu-charts {
          display: grid;
          gap: 1.5rem;
        }
        @media (min-width: 900px) {
          .gpu-charts {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .gpu-charts > .chart-full {
            grid-column: 1 / -1;
          }
        }
        .chart-panel {
          background: white;
          border-radius: 18px;
          border: 1px solid rgba(26, 58, 82, 0.1);
          padding: 1.25rem;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 20px 44px -24px rgba(26, 58, 82, 0.14);
          position: relative;
        }
        .chart-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 18px 18px 0 0;
          background: linear-gradient(90deg, #1a3a52, #6eb89a, #c05621);
          opacity: 0.9;
        }
        .chart-panel h4 {
          margin: 0 0 1rem 0;
          color: #1a3050;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: -0.015em;
        }
        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(110, 184, 154, 0.08), rgba(37, 99, 235, 0.06));
          border-radius: 12px;
        }
        .metric-item {
          text-align: center;
        }
        .metric-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }
        .metric-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a3050;
        }
        .metric-sub {
          font-size: 0.75rem;
          color: #9ca3af;
        }
      `}</style>

      {/* Key Metrics Summary */}
      <div className="metrics-summary chart-full">
        <div className="metric-item">
          <div className="metric-label">Total CAPEX</div>
          <div className="metric-value">${(totalCapex / 1_000_000).toFixed(2)}M</div>
          <div className="metric-sub">CAD</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Annual Revenue</div>
          <div className="metric-value">${(annualRevenue / 1_000_000).toFixed(2)}M</div>
          <div className="metric-sub">CAD/year @ {(utilization * 100).toFixed(0)}% util</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Payback Period</div>
          <div className="metric-value">{totalCapex > 0 ? (totalCapex / annualRevenue).toFixed(1) : "N/A"}</div>
          <div className="metric-sub">years (simple)</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">GPU Count</div>
          <div className="metric-value">{numberOfGpus}</div>
          <div className="metric-sub">{numberOfRacks} racks</div>
        </div>
      </div>

      {/* CAPEX Breakdown */}
      {capexBreakdown.length > 0 && (
        <div className="chart-panel">
          <h4>CAPEX Breakdown</h4>
          <SimplePieChart data={capexBreakdown} />
        </div>
      )}

      {/* Monthly Revenue */}
      <div className="chart-panel">
        <h4>Estimated Monthly Revenue</h4>
        <SimpleBarChart data={monthlyRevenueData} xKey="month" yKey="revenue" color={CHART_BLUE} />
      </div>
    </div>
  );
}
