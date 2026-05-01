"use client";

import type { GpuConfig } from "@/frontend/types/config";
import { GPU_CONFIG_DEFAULTS } from "@/frontend/types/config";
import { SimpleLineChart, SimplePieChart, SimpleBarChart } from "@/frontend/ui/components/charts/SimpleCharts";
import { CHART_BLUE, CHART_GREEN, CHART_ORANGE } from "@/frontend/ui/chartTheme";

interface GpuChartsProps {
  config: GpuConfig;
  energyMix?: {
    curtailedWindMWh: number;
    batteryDischargeMWh: number;
    gridImportMWh: number;
    btfMWh: number;
  };
}

export function GpuCharts({ config, energyMix }: GpuChartsProps) {
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
          gap: 1rem;
        }
        @media (min-width: 900px) {
          .gpu-charts {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 1.5rem;
          }
          .gpu-charts > .chart-full {
            grid-column: 1 / -1;
          }
        }
        .chart-panel {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(26, 58, 82, 0.1);
          padding: 0;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 20px 44px -24px rgba(26, 58, 82, 0.14);
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) {
          .chart-panel {
            border-radius: 18px;
          }
        }
        .chart-panel h4 {
          padding: clamp(1rem, 3vw, 1.25rem) clamp(1rem, 3vw, 1.25rem) 0.5rem clamp(1rem, 3vw, 1.25rem);
          margin: 0 0 0.75rem 0;
          color: #1a3050;
          font-size: clamp(0.9rem, 2.5vw, 0.95rem);
          font-weight: 600;
          letter-spacing: -0.015em;
        }
        .chart-description {
          padding: 0 clamp(1rem, 3vw, 1.25rem) 0.5rem clamp(1rem, 3vw, 1.25rem);
          margin: 0;
          font-size: clamp(0.8rem, 2vw, 0.875rem);
          color: #64748b;
          line-height: 1.5;
        }
        .chart-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          z-index: 1;
          border-radius: 16px 16px 0 0;
          background: linear-gradient(90deg, #1a3a52, #6eb89a, #c05621);
          opacity: 0.9;
        }
        @media (min-width: 900px) {
          .chart-panel::before {
            border-radius: 18px 18px 0 0;
          }
        }
        .metrics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.65rem;
          margin-bottom: 1rem;
          padding: clamp(0.875rem, 2.5vw, 1rem);
          background: linear-gradient(135deg, rgba(110, 184, 154, 0.08), rgba(37, 99, 235, 0.06));
          border-radius: 12px;
        }
        @media (min-width: 900px) {
          .metrics-summary {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.75rem;
            margin-bottom: 1.25rem;
          }
        }
        .metric-item {
          text-align: center;
          min-width: 0;
        }
        .metric-label {
          font-size: clamp(0.65rem, 1.8vw, 0.75rem);
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
          word-break: break-word;
        }
        .metric-value {
          font-size: clamp(1.1rem, 3.5vw, 1.25rem);
          font-weight: 700;
          color: #1a3050;
          line-height: 1.2;
        }
        .metric-sub {
          font-size: clamp(0.7rem, 1.8vw, 0.75rem);
          color: #9ca3af;
          word-break: break-word;
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

      {/* Energy Source Mix - moved from battery section */}
      {energyMix && (
        <div className="chart-panel">
          <h4>Energy Source Mix</h4>
          <p className="chart-description">Sources used to power GPU load over simulation period</p>
          <SimplePieChart
            data={[
              { name: "Curtailed Wind (Direct)", value: energyMix.curtailedWindMWh },
              { name: "Battery Discharge", value: energyMix.batteryDischargeMWh },
              { name: "Grid Import", value: energyMix.gridImportMWh },
              ...(energyMix.btfMWh > 0 ? [{ name: "BTF", value: energyMix.btfMWh }] : []),
            ]}
          />
        </div>
      )}

      {/* CAPEX Breakdown */}
      {capexBreakdown.length > 0 && (
        <div className="chart-panel">
          <h4>CAPEX Breakdown</h4>
          <SimplePieChart data={capexBreakdown} />
        </div>
      )}
    </div>
  );
}
