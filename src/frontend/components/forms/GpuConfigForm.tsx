"use client";

import { useState, useEffect } from "react";
import type { GpuConfig, GpuModelType } from "@/frontend/types/config";
import { GPU_PRESETS, GPU_CONFIG_DEFAULTS } from "@/frontend/types/config";

interface GpuConfigFormProps {
  onConfigChange?: (config: GpuConfig) => void;
}

export function GpuConfigForm({ onConfigChange }: GpuConfigFormProps) {
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
    customPricingEnabled: false,
    unitCostMultiplier: 100,
    rentalRateMultiplier: 100,
    rackCount: 1,
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

  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="gpu-model">GPU Model</label>
        <select
          id="gpu-model"
          value={config.gpuModel}
          onChange={(e) => setConfig({ ...config, gpuModel: e.target.value as GpuModelType })}
        >
          {(Object.keys(GPU_PRESETS) as Array<keyof typeof GPU_PRESETS>).map((model) => (
            <option key={model} value={model}>
              {GPU_PRESETS[model].label}
            </option>
          ))}
          <option value="Custom">Custom</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="num-gpus">Number of GPUs</label>
        <input
          id="num-gpus"
          type="number"
          value={config.numberOfGpus}
          onChange={(e) => setConfig({ ...config, numberOfGpus: Number(e.target.value) })}
          min="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="rental-price">Rental Price (CAD/hour)</label>
        <input
          id="rental-price"
          type="number"
          value={config.rentalPricePerHour}
          onChange={(e) => setConfig({ ...config, rentalPricePerHour: Number(e.target.value) })}
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
}
