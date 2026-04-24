"use client";

import { useState } from "react";
import type { BatteryConfig } from "./types";
import { BATTERY_PRESETS, calculateBatterySize, getBatteryDerivedMetrics } from "./types";
import { FormInput } from "@/frontend/ui/forms/FormInput";

interface BatteryConfigFormProps {
  config: BatteryConfig;
  onChange: (config: BatteryConfig) => void;
  totalComputePowerMW: number;
}

export function BatteryConfigForm({ config, onChange, totalComputePowerMW }: BatteryConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleBattery = (enabled: boolean) => {
    onChange({ ...config, includeBattery: enabled });
  };

  const handlePresetChange = (preset: BatteryConfig['preset']) => {
    const newConfig = { ...config, preset };

    // Auto-calculate battery size for non-custom presets
    if (preset !== 'custom' && totalComputePowerMW > 0) {
      const calculatedSize = calculateBatterySize(preset, totalComputePowerMW);
      newConfig.batterySize = calculatedSize;
    }

    onChange(newConfig);
  };

  const metrics = getBatteryDerivedMetrics(config, totalComputePowerMW);

  return (
    <div className="config-form">

      {/* Enable/Disable Toggle */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.includeBattery}
            onChange={(e) => handleToggleBattery(e.target.checked)}
            style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
          />
          <span>Include battery storage</span>
        </label>
      </div>

      {/* Show form only if battery is enabled */}
      {config.includeBattery && (
        <>
          {/* Preset Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="battery-preset">
              Battery Sizing Preset
            </label>
            <select
              id="battery-preset"
              className="form-select"
              value={config.preset}
              onChange={(e) => handlePresetChange(e.target.value as BatteryConfig['preset'])}
            >
              {Object.entries(BATTERY_PRESETS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value ? `${value.label} - ${value.description}` : 'Custom'}
                </option>
              ))}
            </select>
            {config.preset !== 'custom' && totalComputePowerMW > 0 && (
              <div className="form-hint">
                {calculateBatterySize(config.preset, totalComputePowerMW).toFixed(1)} MWh
                ({BATTERY_PRESETS[config.preset]?.durationHours}h × {totalComputePowerMW.toFixed(1)} MW)
              </div>
            )}
          </div>

          {/* Basic Settings */}
          <div className="form-grid">
            <FormInput
              id="battery-size"
              label="Battery Size"
              value={config.batterySize}
              onChange={(val) => onChange({ ...config, batterySize: val ?? 0 })}
              unit="MWh"
              min="0.1"
              step="0.1"
              required
              disabled={config.preset !== 'custom'}
            />

            <FormInput
              id="battery-power"
              label="Battery Power"
              value={config.batteryPower ?? ''}
              onChange={(val) => onChange({ ...config, batteryPower: val })}
              unit="MW"
              min="0.1"
              step="0.1"
              placeholder={`Default: ${totalComputePowerMW.toFixed(1)} MW`}
              hint="Leave blank to use total compute power"
            />
          </div>

          {/* Advanced Settings Toggle */}
          <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
            <span>{showAdvanced ? "▼" : "▶"}</span>
            <span>Advanced Settings</span>
          </button>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="form-section">
              <div className="form-grid">
                <FormInput
                  id="round-trip-efficiency"
                  label="Round-trip Efficiency"
                  value={config.roundTripEfficiency}
                  onChange={(val) => onChange({ ...config, roundTripEfficiency: val ?? 0 })}
                  unit="%"
                  min="0"
                  max="100"
                  step="1"
                />

                <FormInput
                  id="battery-lifetime"
                  label="Battery Lifetime"
                  value={config.batteryLifetime}
                  onChange={(val) => onChange({ ...config, batteryLifetime: val ?? 12 })}
                  unit="years"
                  min="1"
                  step="1"
                />

                <FormInput
                  id="battery-energy-cost"
                  label="Battery Energy Cost"
                  value={config.batteryEnergyCost}
                  onChange={(val) => onChange({ ...config, batteryEnergyCost: val ?? 0 })}
                  unit="CAD/kWh"
                  min="0"
                  step="1"
                />

                <FormInput
                  id="battery-power-cost"
                  label="Battery Power-System Cost"
                  value={config.batteryPowerSystemCost}
                  onChange={(val) => onChange({ ...config, batteryPowerSystemCost: val ?? 0 })}
                  unit="CAD/kW"
                  min="0"
                  step="1"
                />

                <FormInput
                  id="battery-om"
                  label="Fixed Annual O&M"
                  value={config.fixedAnnualOM}
                  onChange={(val) => onChange({ ...config, fixedAnnualOM: val ?? 0 })}
                  unit="CAD/year"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          )}

          {/* Derived Metrics */}
          {metrics && (
            <div className="metrics-panel">
              <div className="metric-item">
                <div className="metric-label">Duration</div>
                <div className="metric-value">{metrics.batteryDurationHours.toFixed(1)}h</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Effective Power</div>
                <div className="metric-value">{metrics.effectivePowerMW.toFixed(1)} MW</div>
              </div>
              <div className="metric-item">
                <div className="metric-label">Total CAPEX</div>
                <div className="metric-value">${(metrics.totalCapexCAD / 1_000_000).toFixed(2)}M CAD</div>
              </div>
              {metrics.hasHighPowerToComputeRatio && (
                <div className="metric-item">
                  <div className="metric-label">Power Warning</div>
                  <div className="metric-value" style={{ color: "#f59e0b" }}>
                    ⚠️ Battery power &gt; 3× compute power
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
