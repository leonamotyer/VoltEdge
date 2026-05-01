"use client";

import type { GridSupplyConfig } from "@/frontend/types/config";

interface GridSupplyConfigFormProps {
  config: GridSupplyConfig;
  onChange: (config: GridSupplyConfig) => void;
  totalComputePowerMW: number;
}

export function GridSupplyConfigForm({ config, onChange }: GridSupplyConfigFormProps) {
  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="gridPowerLimit">Grid Import Cap (MW)</label>
        <input
          id="gridPowerLimit"
          type="number"
          value={config.gridPowerLimit}
          onChange={(e) => onChange({ ...config, gridPowerLimit: Number(e.target.value) })}
          min="0"
          step="0.1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="btfPowerLimit">BTF Supply Cap (MW)</label>
        <input
          id="btfPowerLimit"
          type="number"
          value={config.btfPowerLimit}
          onChange={(e) => onChange({ ...config, btfPowerLimit: Number(e.target.value) })}
          min="0"
          step="0.1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="btfPrice">BTF Price (CAD/MWh)</label>
        <input
          id="btfPrice"
          type="number"
          value={config.btfPrice}
          onChange={(e) => onChange({ ...config, btfPrice: Number(e.target.value) })}
          min="0"
          step="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="curtailmentValue">Curtailment Price (CAD/MWh)</label>
        <input
          id="curtailmentValue"
          type="number"
          value={config.curtailmentValue}
          onChange={(e) => onChange({ ...config, curtailmentValue: Number(e.target.value) })}
          min="0"
          step="1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="gridPriceOverride">Grid Pool Price Override (CAD/MWh)</label>
        <input
          id="gridPriceOverride"
          type="number"
          value={config.gridPriceOverride ?? ''}
          onChange={(e) => onChange({ ...config, gridPriceOverride: e.target.value ? Number(e.target.value) : null })}
          min="0"
          step="1"
        />
      </div>
    </div>
  );
}
