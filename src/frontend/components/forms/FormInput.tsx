import React from 'react';

interface FormInputProps {
  id: string;
  label: string;
  value: number | string;
  onChange: (value: number | null) => void;
  type?: 'number' | 'text';
  unit?: string;
  hint?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function FormInput({
  id,
  label,
  value,
  onChange,
  type = 'number',
  unit,
  hint,
  min,
  max,
  step,
  required = false,
  disabled = false,
  placeholder,
}: FormInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      const numValue = e.target.value ? parseFloat(e.target.value) : null;
      onChange(numValue);
    } else {
      onChange(e.target.value as any);
    }
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label}
        {unit && <span style={{ fontSize: "0.875rem", color: "#6b7280" }}> ({unit})</span>}
        {required && <span style={{ color: "#dc2626" }}> *</span>}
      </label>
      <input
        id={id}
        type={type}
        className="form-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
      />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
