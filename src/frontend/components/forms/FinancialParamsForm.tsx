"use client";

import type { FinancialParams } from "@/frontend/types/config";

interface FinancialParamsFormProps {
  config: FinancialParams;
  onChange: (config: FinancialParams) => void;
}

export function FinancialParamsForm({ config, onChange }: FinancialParamsFormProps) {
  return (
    <div className="config-form">
      <div className="form-group">
        <label htmlFor="discountRate">Discount Rate (%)</label>
        <input
          id="discountRate"
          type="number"
          value={config.discountRate}
          onChange={(e) => onChange({ ...config, discountRate: Number(e.target.value) })}
          min="0"
          max="30"
          step="0.5"
        />
      </div>

      <div className="form-group">
        <label htmlFor="projectLifeYears">Project Life (years)</label>
        <input
          id="projectLifeYears"
          type="number"
          value={config.projectLifeYears}
          onChange={(e) => onChange({ ...config, projectLifeYears: Number(e.target.value) })}
          min="5"
          max="30"
          step="1"
        />
      </div>
    </div>
  );
}
