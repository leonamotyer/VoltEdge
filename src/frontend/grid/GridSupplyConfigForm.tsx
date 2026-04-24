"use client";

import { useState } from "react";
import type { GridSupplyConfig, PriorityRule } from "./types";
import { PRIORITY_RULES, getGridSupplyDerivedMetrics } from "./types";
import { FormInput } from "@/frontend/ui/forms/FormInput";

interface GridSupplyConfigFormProps {
  config: GridSupplyConfig;
  onChange: (config: GridSupplyConfig) => void;
  totalComputePowerMW: number;
}

export function GridSupplyConfigForm({ config, onChange, totalComputePowerMW }: GridSupplyConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpdate = (updates: Partial<GridSupplyConfig>) => {
    onChange({ ...config, ...updates });
  };

  const derived = getGridSupplyDerivedMetrics(config, totalComputePowerMW);

  return (
    <div className="config-form">

      <h3>Basic Settings</h3>

      {/* Grid Power Settings */}
      <FormInput
        id="gridPowerLimit"
        label="Grid Power Limit"
        value={config.gridPowerLimit}
        onChange={(val) => handleUpdate({ gridPowerLimit: val ?? 0 })}
        unit="MW"
        min="0"
        step="0.1"
        hint="Set to 0 to disable grid power"
      />

      <FormInput
        id="gridPriceOverride"
        label="Grid Price Override"
        value={config.gridPriceOverride ?? ''}
        onChange={(val) => handleUpdate({ gridPriceOverride: val })}
        unit="CAD/MWh, optional"
        min="0"
        step="1"
        placeholder="Leave blank to use pool price time series"
        hint="If blank, backend uses pool price time series"
      />

      {/* BTF Power Settings */}
      <FormInput
        id="btfPowerLimit"
        label="BTF Power Limit"
        value={config.btfPowerLimit}
        onChange={(val) => handleUpdate({ btfPowerLimit: val ?? 0 })}
        unit="MW"
        min="0"
        step="0.1"
        hint="Set to 0 to disable BTF power"
      />

      {derived.btfEnabled && (
        <FormInput
          id="btfPrice"
          label="BTF Price"
          value={config.btfPrice}
          onChange={(val) => handleUpdate({ btfPrice: val ?? 0 })}
          unit="CAD/MWh"
          min="0"
          step="1"
          required
        />
      )}

      {/* Curtailment Value */}
      <FormInput
        id="curtailmentValue"
        label="Curtailment Value"
        value={config.curtailmentValue}
        onChange={(val) => handleUpdate({ curtailmentValue: val ?? 0 })}
        unit="CAD/MWh"
        min="0"
        step="1"
        required
        hint="Required - typically much lower than grid/BTF price"
      />

      {/* Advanced Settings Toggle */}
      <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
        <span>{showAdvanced ? "▼" : "▶"}</span>
        <span>Advanced Settings</span>
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="form-section">
          <h4 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1a3050", marginBottom: "1rem" }}>
            Advanced Settings
          </h4>

          {/* Partial Supply Toggles */}
          <div className="form-group">
            <label htmlFor="allowPartialGridSupply" className="checkbox-label">
              <input
                id="allowPartialGridSupply"
                type="checkbox"
                checked={config.allowPartialGridSupply}
                onChange={(e) => handleUpdate({ allowPartialGridSupply: e.target.checked })}
              />
              <span>Allow Partial Grid Supply</span>
            </label>
            <div className="form-hint" style={{ marginLeft: "1.5rem" }}>
              If off, grid must fully cover remaining demand in each interval
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allowPartialBtfSupply" className="checkbox-label">
              <input
                id="allowPartialBtfSupply"
                type="checkbox"
                checked={config.allowPartialBtfSupply}
                onChange={(e) => handleUpdate({ allowPartialBtfSupply: e.target.checked })}
              />
              <span>Allow Partial BTF Supply</span>
            </label>
          </div>

          {/* Price Escalation */}
          <FormInput
            id="priceEscalationRate"
            label="Price Escalation Rate"
            value={config.priceEscalationRate}
            onChange={(val) => handleUpdate({ priceEscalationRate: val ?? 0 })}
            unit="%/year"
            min="0"
            max="100"
            step="0.1"
          />

          {/* Priority Rule */}
          <div className="form-group">
            <label className="form-label" htmlFor="priorityRule">
              Priority Rule
            </label>
            <select
              id="priorityRule"
              className="form-select"
              value={config.priorityRule}
              onChange={(e) => handleUpdate({ priorityRule: e.target.value as PriorityRule })}
            >
              {Object.entries(PRIORITY_RULES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="form-hint">Order of using grid vs BTF power</div>
          </div>
        </div>
      )}

      {/* Derived Metrics */}
      <div className="metrics-panel">
        <div className="metric-item">
          <div className="metric-label">Total Backup Power</div>
          <div className="metric-value">{derived.totalBackupPowerMW.toFixed(1)} MW</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">Grid Enabled</div>
          <div className="metric-value">{derived.gridEnabled ? "Yes" : "No"}</div>
        </div>
        <div className="metric-item">
          <div className="metric-label">BTF Enabled</div>
          <div className="metric-value">{derived.btfEnabled ? "Yes" : "No"}</div>
        </div>
        {derived.hasUnmetDemandRisk && (
          <div className="metric-item">
            <div className="metric-label">Unmet Demand Risk</div>
            <div className="metric-value" style={{ color: "#ef4444" }}>
              ⚠️ Backup capacity &lt; compute load
            </div>
          </div>
        )}
        {derived.hasBtfPriceWarning && (
          <div className="metric-item">
            <div className="metric-label">BTF Price Warning</div>
            <div className="metric-value" style={{ color: "#f59e0b" }}>
              ⚠️ BTF will rarely be used (BTF price &gt; grid price)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
