"use client";

import { useState } from "react";
import type { BatteryConfig } from "./types";
import { BATTERY_PRESETS, calculateBatterySize, getBatteryDerivedMetrics } from "./types";

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
            <div className="form-group">
              <label className="form-label" htmlFor="battery-size">
                Battery Size (MWh) <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                id="battery-size"
                type="number"
                className="form-input"
                min="0.1"
                step="0.1"
                value={config.batterySize}
                onChange={(e) => onChange({ ...config, batterySize: parseFloat(e.target.value) || 0 })}
                disabled={config.preset !== 'custom'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="battery-power">
                Battery Power (MW)
              </label>
              <input
                id="battery-power"
                type="number"
                className="form-input"
                min="0.1"
                step="0.1"
                value={config.batteryPower ?? ''}
                onChange={(e) => onChange({ ...config, batteryPower: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder={`Default: ${totalComputePowerMW.toFixed(1)} MW`}
              />
              <div className="form-hint">Leave blank to use total compute power</div>
            </div>
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
                <div className="form-group">
                  <label className="form-label" htmlFor="round-trip-efficiency">
                    Round-trip Efficiency (%)
                  </label>
                  <input
                    id="round-trip-efficiency"
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    step="1"
                    value={config.roundTripEfficiency}
                    onChange={(e) => onChange({ ...config, roundTripEfficiency: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="battery-lifetime">
                    Battery Lifetime (years)
                  </label>
                  <input
                    id="battery-lifetime"
                    type="number"
                    className="form-input"
                    min="1"
                    step="1"
                    value={config.batteryLifetime}
                    onChange={(e) => onChange({ ...config, batteryLifetime: parseInt(e.target.value) || 12 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="battery-energy-cost">
                    Battery Energy Cost (CAD/kWh)
                  </label>
                  <input
                    id="battery-energy-cost"
                    type="number"
                    className="form-input"
                    min="0"
                    step="1"
                    value={config.batteryEnergyCost}
                    onChange={(e) => onChange({ ...config, batteryEnergyCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="battery-power-cost">
                    Battery Power-System Cost (CAD/kW)
                  </label>
                  <input
                    id="battery-power-cost"
                    type="number"
                    className="form-input"
                    min="0"
                    step="1"
                    value={config.batteryPowerSystemCost}
                    onChange={(e) => onChange({ ...config, batteryPowerSystemCost: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="battery-om">
                    Fixed Annual O&M (CAD/year)
                  </label>
                  <input
                    id="battery-om"
                    type="number"
                    className="form-input"
                    min="0"
                    step="1000"
                    value={config.fixedAnnualOM}
                    onChange={(e) => onChange({ ...config, fixedAnnualOM: parseFloat(e.target.value) || 0 })}
                  />
                </div>
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
