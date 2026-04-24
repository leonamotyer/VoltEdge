"use client";

import { useState, useEffect } from "react";
import type { GpuConfig, GpuModelType } from "./types";
import { GPU_PRESETS, GPU_CONFIG_DEFAULTS, calculateGpuMetrics } from "./types";
import { CsvUpload } from "@/frontend/ui/components/CsvUpload";
import { FormInput } from "@/frontend/ui/forms/FormInput";

interface GpuConfigFormProps {
  onConfigChange?: (config: GpuConfig) => void;
}

export function GpuConfigForm({ onConfigChange }: GpuConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<GpuConfig>({
    gpuModel: "RTX 5090",
    numberOfGpus: 100,
    rentalPricePerHour: GPU_PRESETS["RTX 5090"].rental_hr_cad,
    powerPerGpu: GPU_PRESETS["RTX 5090"].power_kw,
    utilization: GPU_CONFIG_DEFAULTS.utilization,
    gpuPurchaseCost: GPU_PRESETS["RTX 5090"].unit_price_cad,
    systemLifetime: GPU_CONFIG_DEFAULTS.systemLifetime,
    discountRate: GPU_CONFIG_DEFAULTS.discountRate,
    fixedAnnualOM: GPU_CONFIG_DEFAULTS.fixedAnnualOM,
    deploymentCost: GPU_CONFIG_DEFAULTS.deploymentCost,
  });

  // Auto-fill preset values when GPU model changes
  useEffect(() => {
    if (config.gpuModel !== "Custom") {
      const preset = GPU_PRESETS[config.gpuModel];
      setConfig((prev) => ({
        ...prev,
        powerPerGpu: preset.power_kw,
        gpuPurchaseCost: preset.unit_price_cad,
        rentalPricePerHour: preset.rental_hr_cad,
      }));
    }
  }, [config.gpuModel]);

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleModelChange = (model: GpuModelType) => {
    setConfig((prev) => ({ ...prev, gpuModel: model }));
  };

  const metrics = calculateGpuMetrics(config);
  const isCustomModel = config.gpuModel === "Custom";

  return (
    <div className="config-form">

      {/* Basic Settings */}
      <div className="form-section">
        <h3>Basic Settings</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="gpu-model">
            GPU Model <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            id="gpu-model"
            className="form-select"
            value={config.gpuModel}
            onChange={(e) => handleModelChange(e.target.value as GpuModelType)}
          >
            {(Object.keys(GPU_PRESETS) as Array<keyof typeof GPU_PRESETS>).map((model) => (
              <option key={model} value={model}>
                {GPU_PRESETS[model].label}
              </option>
            ))}
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="form-grid">
          <FormInput
            id="num-gpus"
            label="Number of GPUs"
            value={config.numberOfGpus}
            onChange={(val) => setConfig({ ...config, numberOfGpus: val ?? 0 })}
            min="1"
            required
          />

          <FormInput
            id="rental-price"
            label="Rental Price"
            value={config.rentalPricePerHour}
            onChange={(val) => setConfig({ ...config, rentalPricePerHour: val ?? 0 })}
            min="0"
            step="0.01"
            hint="CAD per GPU-hour"
            required
          />
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
        <span>{showAdvanced ? "▼" : "▶"}</span>
        <span>Advanced Settings</span>
      </button>

      {/* Advanced Settings (collapsed by default) */}
      {showAdvanced && (
        <div className="form-section">
          {/* CSV Upload - First Advanced Setting */}
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>
              Upload Configuration
            </label>
            <CsvUpload />
          </div>

          <div className="form-grid">
            <FormInput
              id="power-per-gpu"
              label="Power per GPU"
              value={config.powerPerGpu ?? 0}
              onChange={(val) => setConfig({ ...config, powerPerGpu: val ?? 0 })}
              unit="kW"
              min="0"
              step="0.01"
              disabled={!isCustomModel}
              hint="from preset"
            />

            <FormInput
              id="utilization"
              label="Utilization"
              value={config.utilization ?? GPU_CONFIG_DEFAULTS.utilization}
              onChange={(val) => {
                const clamped = Math.min(100, Math.max(0, val ?? 0));
                setConfig({ ...config, utilization: clamped });
              }}
              unit="%"
              min="0"
              max="100"
              step="1"
              hint="expected usage rate"
            />

            <FormInput
              id="gpu-cost"
              label="GPU Purchase Cost"
              value={config.gpuPurchaseCost ?? 0}
              onChange={(val) => setConfig({ ...config, gpuPurchaseCost: val ?? 0 })}
              unit="CAD per GPU"
              min="0"
              step="100"
              disabled={!isCustomModel}
              hint="from preset"
            />

            <FormInput
              id="system-lifetime"
              label="System Lifetime"
              value={config.systemLifetime ?? GPU_CONFIG_DEFAULTS.systemLifetime}
              onChange={(val) => setConfig({ ...config, systemLifetime: val ?? 0 })}
              unit="years"
              min="1"
              hint="financial horizon"
            />

            <FormInput
              id="discount-rate"
              label="Discount Rate"
              value={config.discountRate ?? GPU_CONFIG_DEFAULTS.discountRate}
              onChange={(val) => setConfig({ ...config, discountRate: val ?? 0 })}
              unit="%"
              min="0"
              max="100"
              step="0.1"
              hint="financial assumption"
            />

            <FormInput
              id="fixed-om"
              label="Fixed Annual O&M"
              value={config.fixedAnnualOM ?? GPU_CONFIG_DEFAULTS.fixedAnnualOM}
              onChange={(val) => setConfig({ ...config, fixedAnnualOM: val ?? 0 })}
              unit="CAD per year"
              min="0"
              step="1000"
            />

            <FormInput
              id="deployment-cost"
              label="Deployment Cost"
              value={config.deploymentCost ?? GPU_CONFIG_DEFAULTS.deploymentCost}
              onChange={(val) => setConfig({ ...config, deploymentCost: val ?? 0 })}
              unit="CAD"
              min="0"
              step="1000"
              hint="racks/infra"
            />
          </div>
        </div>
      )}

      {/* Derived Metrics */}
      <div className="metrics-panel">
        <h4>Derived Metrics</h4>
        <div className="metric-row">
          <span className="metric-label">Total Compute Power</span>
          <span className="metric-value">{metrics.totalComputePowerMw.toFixed(3)} MW</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Annual Revenue (est.)</span>
          <span className="metric-value">${(metrics.annualRevenueCad / 1_000_000).toFixed(2)}M CAD</span>
        </div>
      </div>
    </div>
  );
}
