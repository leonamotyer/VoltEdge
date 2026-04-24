"use client";

import { useState } from "react";
import type { GridSupplyConfig, PriorityRule } from "./types";
import { PRIORITY_RULES, getGridSupplyDerivedMetrics } from "./types";

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
      <div className="form-group">
        <label className="form-label" htmlFor="gridPowerLimit">
          Grid Power Limit <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(MW)</span>
        </label>
        <input
          id="gridPowerLimit"
          type="number"
          className="form-input"
          min="0"
          step="0.1"
          value={config.gridPowerLimit}
          onChange={(e) => handleUpdate({ gridPowerLimit: parseFloat(e.target.value) || 0 })}
        />
        <div className="form-hint">Set to 0 to disable grid power</div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="gridPriceOverride">
          Grid Price Override <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(CAD/MWh, optional)</span>
        </label>
        <input
          id="gridPriceOverride"
          type="number"
          className="form-input"
          min="0"
          step="1"
          value={config.gridPriceOverride ?? ''}
          onChange={(e) => handleUpdate({
            gridPriceOverride: e.target.value ? parseFloat(e.target.value) : null
          })}
          placeholder="Leave blank to use pool price time series"
        />
        <div className="form-hint">If blank, backend uses pool price time series</div>
      </div>

      {/* BTF Power Settings */}
      <div className="form-group">
        <label className="form-label" htmlFor="btfPowerLimit">
          BTF Power Limit <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(MW)</span>
        </label>
        <input
          id="btfPowerLimit"
          type="number"
          className="form-input"
          min="0"
          step="0.1"
          value={config.btfPowerLimit}
          onChange={(e) => handleUpdate({ btfPowerLimit: parseFloat(e.target.value) || 0 })}
        />
        <div className="form-hint">Set to 0 to disable BTF power</div>
      </div>

      {derived.btfEnabled && (
        <div className="form-group">
          <label className="form-label" htmlFor="btfPrice">
            BTF Price <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(CAD/MWh)</span>
          </label>
          <input
            id="btfPrice"
            type="number"
            className="form-input"
            min="0"
            step="1"
            value={config.btfPrice}
            onChange={(e) => handleUpdate({ btfPrice: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      )}

      {/* Curtailment Value */}
      <div className="form-group">
        <label className="form-label" htmlFor="curtailmentValue">
          Curtailment Value <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(CAD/MWh)</span>
          <span style={{ color: "#ef4444", marginLeft: "0.25rem" }}>*</span>
        </label>
        <input
          id="curtailmentValue"
          type="number"
          className="form-input"
          min="0"
          step="1"
          value={config.curtailmentValue}
          onChange={(e) => handleUpdate({ curtailmentValue: parseFloat(e.target.value) || 0 })}
          required
        />
        <div className="form-hint">Required - typically much lower than grid/BTF price</div>
      </div>

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
          <div className="form-group">
            <label className="form-label" htmlFor="priceEscalationRate">
              Price Escalation Rate <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>(%/year)</span>
            </label>
            <input
              id="priceEscalationRate"
              type="number"
              className="form-input"
              min="0"
              max="100"
              step="0.1"
              value={config.priceEscalationRate}
              onChange={(e) => handleUpdate({ priceEscalationRate: parseFloat(e.target.value) || 0 })}
            />
          </div>

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
