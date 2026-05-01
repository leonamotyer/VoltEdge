"use client";

import type { BatteryConfig } from "@/frontend/types/config";

interface BatteryConfigFormProps {
  config: BatteryConfig;
  onChange: (config: BatteryConfig) => void;
  totalComputePowerMW: number;
}

export function BatteryConfigForm({ config, onChange }: BatteryConfigFormProps) {
  return (
    <div className="config-form">
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.includeBattery}
            onChange={(e) => onChange({ ...config, includeBattery: e.target.checked })}
          />
          Include battery storage
        </label>
      </div>

      {config.includeBattery && (
        <>
          <div className="form-group">
            <label htmlFor="battery-size">Battery Size (MWh)</label>
            <input
              id="battery-size"
              type="number"
              value={config.batterySize}
              onChange={(e) => onChange({ ...config, batterySize: Number(e.target.value) })}
              min="0.1"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="battery-power">Battery Power (MW)</label>
            <input
              id="battery-power"
              type="number"
              value={config.batteryPower ?? ''}
              onChange={(e) => onChange({ ...config, batteryPower: e.target.value ? Number(e.target.value) : null })}
              min="0.1"
              step="0.1"
            />
          </div>
        </>
      )}
    </div>
  );
}
