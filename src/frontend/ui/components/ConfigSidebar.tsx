"use client";

import { GpuConfigForm } from "@/frontend/gpu/GpuConfigForm";
import { BatteryConfigForm } from "@/frontend/battery/BatteryConfigForm";
import { GridSupplyConfigForm } from "@/frontend/grid/GridSupplyConfigForm";
import { calculateGpuMetrics } from "@/frontend/gpu/types";
import { useConfig } from "@/frontend/context/ConfigContext";

export function ConfigSidebar() {
  const { gpuConfig, batteryConfig, gridConfig, setGpuConfig, setBatteryConfig, setGridConfig } = useConfig();

  // Calculate total compute power from GPU config
  const totalComputePowerMW = gpuConfig ? calculateGpuMetrics(gpuConfig).totalComputePowerMw : 0;

  return (
    <div className="config-sidebar-content">
      {/* Branding */}
      <div className="sidebar-brand">
        <div className="sidebar-mark" aria-hidden="true" />
        <h1>
          <span className="sidebar-title-strong">VoltEdge</span>
          <span className="sidebar-title-rest"> MDC</span>
        </h1>
        <p className="sidebar-subtitle">Configuration Panel</p>
      </div>

      {/* Configuration Forms */}
      <div className="config-sections">
        {/* GPU Configuration */}
        <section className="config-section">
          <h3 className="config-section-title">GPU Revenue Simulation</h3>
          <GpuConfigForm onConfigChange={setGpuConfig} />
        </section>

        {/* Battery Configuration */}
        <section className="config-section">
          <h3 className="config-section-title">Battery Storage</h3>
          <BatteryConfigForm
            config={batteryConfig}
            onChange={setBatteryConfig}
            totalComputePowerMW={totalComputePowerMW}
          />
        </section>

        {/* Grid Supply Configuration */}
        <section className="config-section">
          <h3 className="config-section-title">Grid Supply</h3>
          <GridSupplyConfigForm
            config={gridConfig}
            onChange={setGridConfig}
            totalComputePowerMW={totalComputePowerMW}
          />
        </section>
      </div>

      <style jsx>{`
        .config-sidebar-content {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .config-sections {
          flex: 1;
          overflow-y: auto;
          padding-top: 1rem;
        }

        .config-section {
          margin-bottom: 2rem;
        }

        .config-section-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .config-placeholder {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.875rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
