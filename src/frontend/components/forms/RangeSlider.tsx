import React from 'react';

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  showBadge?: boolean;
  badgeFormatter?: (value: number, defaultValue: number) => string;
  defaultValue?: number;
  hint?: string;
}

export function RangeSlider({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  disabled = false,
  showBadge = false,
  badgeFormatter,
  defaultValue,
  hint,
}: RangeSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  // Calculate deviation for badge display
  const getDeviationBadge = () => {
    if (!showBadge || !badgeFormatter || defaultValue === undefined) {
      return null;
    }
    return badgeFormatter(value, defaultValue);
  };

  const badge = getDeviationBadge();

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="form-label" htmlFor={id} style={{ marginBottom: 0 }}>
          {label}
          {unit && <span style={{ fontSize: "0.875rem", color: "#6b7280" }}> ({unit})</span>}
        </label>
        {badge && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.125rem 0.5rem',
              borderRadius: '0.25rem',
              backgroundColor: value > defaultValue! ? '#fef3c7' : value < defaultValue! ? '#dbeafe' : '#f3f4f6',
              color: value > defaultValue! ? '#92400e' : value < defaultValue! ? '#1e40af' : '#6b7280',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={{
            flex: 1,
            height: '0.5rem',
            borderRadius: '0.25rem',
            background: disabled ? '#e5e7eb' : '#d1d5db',
            outline: 'none',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        />
        <span
          style={{
            minWidth: '4rem',
            textAlign: 'right',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: disabled ? '#9ca3af' : '#1f2937',
          }}
        >
          {value}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
