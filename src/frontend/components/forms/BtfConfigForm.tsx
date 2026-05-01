"use client";

import type { BtfConfig } from "@/frontend/types/config";

interface BtfConfigFormProps {
  config: BtfConfig;
  onChange: (config: BtfConfig) => void;
  totalComputePowerMW: number;
}

export function BtfConfigForm({ config, onChange }: BtfConfigFormProps) {
  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="btfCapacity">BTF Capacity (MW)</label>
        <input
          id="btfCapacity"
          type="number"
          value={config.capacity}
          onChange={(e) => onChange({ ...config, capacity: Number(e.target.value) })}
          min="0"
          max="100"
          step="0.1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="btfPrice">BTF Energy Price (CAD/MWh)</label>
        <input
          id="btfPrice"
          type="number"
          value={config.price}
          onChange={(e) => onChange({ ...config, price: Number(e.target.value) })}
          min="0"
          max="200"
          step="1"
        />
      </div>
    </div>
  );
}
