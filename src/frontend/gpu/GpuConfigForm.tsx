"use client";

import { useState, useEffect } from "react";
import type { GpuConfig, GpuModelType } from "./types";
import { GPU_PRESETS, GPU_CONFIG_DEFAULTS, calculateGpuMetrics } from "./types";

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
          <div className="form-group">
            <label className="form-label" htmlFor="num-gpus">
              Number of GPUs <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="num-gpus"
              type="number"
              className="form-input"
              min="1"
              value={config.numberOfGpus}
              onChange={(e) => setConfig({ ...config, numberOfGpus: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rental-price">
              Rental Price <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="rental-price"
              type="number"
              className="form-input"
              min="0"
              step="0.01"
              value={config.rentalPricePerHour}
              onChange={(e) => setConfig({ ...config, rentalPricePerHour: parseFloat(e.target.value) || 0 })}
            />
            <div className="form-hint">CAD per GPU-hour</div>
          </div>
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
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="power-per-gpu">
                Power per GPU
              </label>
              <input
                id="power-per-gpu"
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                value={config.powerPerGpu ?? 0}
                disabled={!isCustomModel}
                onChange={(e) => setConfig({ ...config, powerPerGpu: parseFloat(e.target.value) || 0 })}
              />
              <div className="form-hint">kW (from preset)</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="utilization">
                Utilization
              </label>
              <input
                id="utilization"
                type="number"
                className="form-input"
                min="0"
                max="100"
                step="1"
                value={config.utilization ?? GPU_CONFIG_DEFAULTS.utilization}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setConfig({ ...config, utilization: Math.min(100, Math.max(0, val)) });
                }}
              />
              <div className="form-hint">% (expected usage rate)</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="gpu-cost">
                GPU Purchase Cost
              </label>
              <input
                id="gpu-cost"
                type="number"
                className="form-input"
                min="0"
                step="100"
                value={config.gpuPurchaseCost ?? 0}
                disabled={!isCustomModel}
                onChange={(e) => setConfig({ ...config, gpuPurchaseCost: parseFloat(e.target.value) || 0 })}
              />
              <div className="form-hint">CAD per GPU (from preset)</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="system-lifetime">
                System Lifetime
              </label>
              <input
                id="system-lifetime"
                type="number"
                className="form-input"
                min="1"
                value={config.systemLifetime ?? GPU_CONFIG_DEFAULTS.systemLifetime}
                onChange={(e) => setConfig({ ...config, systemLifetime: parseInt(e.target.value) || 0 })}
              />
              <div className="form-hint">years (financial horizon)</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discount-rate">
                Discount Rate
              </label>
              <input
                id="discount-rate"
                type="number"
                className="form-input"
                min="0"
                max="100"
                step="0.1"
                value={config.discountRate ?? GPU_CONFIG_DEFAULTS.discountRate}
                onChange={(e) => setConfig({ ...config, discountRate: parseFloat(e.target.value) || 0 })}
              />
              <div className="form-hint">% (financial assumption)</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fixed-om">
                Fixed Annual O&amp;M
              </label>
              <input
                id="fixed-om"
                type="number"
                className="form-input"
                min="0"
                step="1000"
                value={config.fixedAnnualOM ?? GPU_CONFIG_DEFAULTS.fixedAnnualOM}
                onChange={(e) => setConfig({ ...config, fixedAnnualOM: parseFloat(e.target.value) || 0 })}
              />
              <div className="form-hint">CAD per year</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="deployment-cost">
                Deployment Cost
              </label>
              <input
                id="deployment-cost"
                type="number"
                className="form-input"
                min="0"
                step="1000"
                value={config.deploymentCost ?? GPU_CONFIG_DEFAULTS.deploymentCost}
                onChange={(e) => setConfig({ ...config, deploymentCost: parseFloat(e.target.value) || 0 })}
              />
              <div className="form-hint">CAD (racks/infra)</div>
            </div>
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
