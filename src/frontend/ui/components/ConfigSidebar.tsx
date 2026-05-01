"use client";

import { GpuConfigForm } from "@/frontend/components/forms/GpuConfigForm";
import { BatteryConfigForm } from "@/frontend/components/forms/BatteryConfigForm";
import { GridSupplyConfigForm } from "@/frontend/components/forms/GridSupplyConfigForm";
import { BtfConfigForm } from "@/frontend/components/forms/BtfConfigForm";
import { FinancialParamsForm } from "@/frontend/components/forms/FinancialParamsForm";
import { calculateGpuMetrics } from "@/frontend/types/config";
import { useConfig } from "@/frontend/context/ConfigContext";
import { DataSourceToggle } from "./upload/DataSourceToggle";
import { ExcelUploader } from "./upload/ExcelUploader";
import { PoolPriceUploader } from "./upload/PoolPriceUploader";
import { useState } from "react";

export function ConfigSidebar() {
  const {
    gpuConfig,
    batteryConfig,
    gridConfig,
    btfConfig,
    financialParams,
    setGpuConfig,
    setBatteryConfig,
    setGridConfig,
    setBtfConfig,
    setFinancialParams
  } = useConfig();
  const [showDataUpload, setShowDataUpload] = useState(false);

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
        {/* Data Source Section */}
        <section className="config-section">
          <h3 className="config-section-title">Data Source</h3>
          <DataSourceToggle />

          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setShowDataUpload(!showDataUpload)}
          >
            <span>{showDataUpload ? "▼" : "▶"}</span>
            <span>Upload Files</span>
          </button>

          {showDataUpload && (
            <div className="upload-section">
              <div className="upload-group">
                <h4 className="upload-title">Wind Curtailment (.xlsx)</h4>
                <ExcelUploader />
              </div>

              <div className="upload-group">
                <h4 className="upload-title">AESO Pool Price (.csv)</h4>
                <PoolPriceUploader />
              </div>
            </div>
          )}
        </section>

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

        {/* Behind-the-Fence (BTF) Configuration */}
        <section className="config-section">
          <h3 className="config-section-title">Behind-the-Fence (BTF)</h3>
          <BtfConfigForm
            config={btfConfig}
            onChange={setBtfConfig}
            totalComputePowerMW={totalComputePowerMW}
          />
        </section>

        {/* Financial Parameters */}
        <section className="config-section">
          <h3 className="config-section-title">Financial Parameters</h3>
          <FinancialParamsForm
            config={financialParams}
            onChange={setFinancialParams}
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

        .upload-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .upload-group {
          margin-bottom: 1.5rem;
        }

        .upload-title {
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .advanced-toggle:hover {
          color: #60a5fa;
        }

        :global(.upload-container) {
          margin: 0;
        }

        :global(.upload-dropzone) {
          padding: 1.5rem;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        :global(.upload-dropzone:hover) {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(59, 130, 246, 0.05);
        }

        :global(.upload-dropzone.dragging) {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }

        :global(.upload-dropzone.success) {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(34, 197, 94, 0.05);
        }

        :global(.upload-dropzone.error) {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.05);
        }

        :global(.upload-text) {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0.25rem 0;
        }

        :global(.upload-hint) {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0.25rem 0;
        }

        :global(.success-text) {
          color: #22c55e;
        }

        :global(.error-text) {
          color: #ef4444;
        }

        :global(.spinner) {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
