"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { useConfig } from "@/frontend/context/ConfigContext";
import type { GpuConfig, BatteryConfig, GridSupplyConfig } from "@/frontend/types/config";

interface UploadState {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
}

interface ParsedConfiguration {
  configuration_name: string;
  gpuConfig: GpuConfig;
  batteryConfig: BatteryConfig;
  gridConfig: GridSupplyConfig;
}

export function CsvUpload() {
  const { setGpuConfig, setBatteryConfig, setGridConfig } = useConfig();
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    message: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [configurations, setConfigurations] = useState<ParsedConfiguration[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith(".csv")) {
      setUploadState({
        status: "error",
        message: "Invalid file format. Only .csv files are accepted.",
      });
      return;
    }

    setUploadState({ status: "uploading", message: "Processing CSV file..." });

    try {
      const text = await file.text();
      const parsedConfigs = parseAllConfigurationsFromCsv(text);

      if (parsedConfigs.length === 0) {
        throw new Error("No valid configurations found in CSV file");
      }

      // Store all configurations
      setConfigurations(parsedConfigs);
      setSelectedIndex(0);

      // Apply the first configuration immediately
      const firstConfig = parsedConfigs[0];
      setGpuConfig(firstConfig.gpuConfig);
      setBatteryConfig(firstConfig.batteryConfig);
      setGridConfig(firstConfig.gridConfig);

      setUploadState({
        status: "success",
        message: `Loaded ${parsedConfigs.length} configuration${parsedConfigs.length > 1 ? 's' : ''} from ${file.name}`,
      });
    } catch (error) {
      setUploadState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to parse CSV file",
      });
      // Clear configurations on error
      setConfigurations([]);
      setSelectedIndex(0);
    }
  };

  // Handle configuration selection change
  const handleConfigChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10);
    setSelectedIndex(index);

    const selectedConfig = configurations[index];
    if (selectedConfig) {
      setGpuConfig(selectedConfig.gpuConfig);
      setBatteryConfig(selectedConfig.batteryConfig);
      setGridConfig(selectedConfig.gridConfig);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    if (uploadState.status !== "uploading") {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="csv-upload-container">
      <div
        className={`upload-dropzone ${
          uploadState.status === "idle" ? (isDragging ? "dragging" : "") : ""
        } ${uploadState.status === "uploading" ? "uploading" : ""} ${
          uploadState.status === "error" ? "error" : ""
        } ${uploadState.status === "success" ? "success" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          style={{ display: "none" }}
          aria-label="CSV file input"
        />

        {uploadState.status === "idle" && !isDragging && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              Drop CSV file here or <span className="upload-link">browse</span>
            </p>
            <p className="upload-hint">Supports configuration files with multiple scenarios</p>
          </>
        )}

        {uploadState.status === "idle" && isDragging && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">Drop file to upload</p>
          </>
        )}

        {uploadState.status === "uploading" && (
          <>
            <div className="spinner" aria-label="Processing file" />
            <p className="upload-text">{uploadState.message}</p>
          </>
        )}

        {uploadState.status === "success" && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon success-icon"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="upload-text success-text">{uploadState.message}</p>
          </>
        )}

        {uploadState.status === "error" && (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon error-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="upload-text error-text">{uploadState.message}</p>
            <p className="upload-hint">Click to try again</p>
          </>
        )}
      </div>

      {/* Configuration Selector - shown when multiple configs are loaded */}
      {configurations.length > 0 && (
        <div className="config-selector">
          <label htmlFor="config-select" className="selector-label">
            Select Configuration ({configurations.length} loaded):
          </label>
          <select
            id="config-select"
            value={selectedIndex}
            onChange={handleConfigChange}
            className="selector-dropdown"
          >
            {configurations.map((config, index) => (
              <option key={index} value={index}>
                {config.configuration_name || `Configuration ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <style jsx>{`
        .csv-upload-container {
          margin-bottom: 0;
        }

        .upload-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 240px;
          border: 2px dashed rgba(110, 184, 154, 0.25);
          border-radius: 14px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.02);
          position: relative;
        }

        .upload-dropzone:hover {
          border-color: rgba(110, 184, 154, 0.5);
          background: rgba(255, 255, 255, 0.04);
          box-shadow: 0 4px 16px rgba(110, 184, 154, 0.08);
        }

        .upload-dropzone:focus-visible {
          outline: 2px solid rgba(110, 184, 154, 0.6);
          outline-offset: 2px;
        }

        .upload-dropzone.dragging {
          border-style: solid;
          border-color: var(--color-chart-green);
          background: rgba(110, 184, 154, 0.12);
          box-shadow: 0 8px 24px rgba(110, 184, 154, 0.15);
        }

        .upload-dropzone.uploading {
          cursor: wait;
          border-color: rgba(110, 184, 154, 0.4);
          background: rgba(255, 255, 255, 0.03);
        }

        .upload-dropzone.error {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.06);
        }

        .upload-dropzone.error:hover {
          border-color: rgba(239, 68, 68, 0.6);
          background: rgba(239, 68, 68, 0.08);
        }

        .upload-dropzone.success {
          border-color: rgba(110, 184, 154, 0.5);
          background: rgba(110, 184, 154, 0.08);
        }

        .upload-icon {
          flex-shrink: 0;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .success-icon {
          color: var(--color-chart-green);
        }

        .error-icon {
          color: rgba(239, 68, 68, 0.9);
        }

        .upload-text {
          font-size: 0.9375rem;
          color: #ffffff;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
          font-weight: 500;
        }

        .upload-link {
          color: var(--color-chart-green);
          text-decoration: underline;
          font-weight: 600;
        }

        .upload-hint {
          font-size: 0.8125rem;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          line-height: 1.4;
        }

        .success-text {
          color: var(--color-chart-green);
          font-weight: 600;
        }

        .error-text {
          color: rgba(239, 68, 68, 0.95);
          font-weight: 600;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--color-chart-green);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .config-selector {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          border: 1px solid rgba(110, 184, 154, 0.2);
        }

        .selector-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 0.5rem;
          letter-spacing: 0.01em;
        }

        .selector-dropdown {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(110, 184, 154, 0.25);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236eb89a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 12px;
          padding-right: 2.5rem;
        }

        .selector-dropdown:hover {
          background-color: rgba(255, 255, 255, 0.08);
          border-color: rgba(110, 184, 154, 0.4);
        }

        .selector-dropdown:focus {
          outline: none;
          border-color: var(--color-chart-green);
          box-shadow: 0 0 0 3px rgba(110, 184, 154, 0.15);
        }

        .selector-dropdown option {
          background: #0a1628;
          color: #ffffff;
          padding: 0.5rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .upload-dropzone,
          .selector-dropdown,
          .spinner {
            transition: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Parse CSV configuration file and extract all configurations
 * Returns an array of configurations, one per data row
 */
function parseConfigCsv(csvText: string): {
  gpuConfig: GpuConfig | null;
  batteryConfig: BatteryConfig | null;
  gridConfig: GridSupplyConfig | null;
} {
  const configurations = parseAllConfigurationsFromCsv(csvText);

  // For backward compatibility, return the first configuration
  // In the future, the UI will be updated to handle multiple configurations
  if (configurations.length === 0) {
    return {
      gpuConfig: null,
      batteryConfig: null,
      gridConfig: null,
    };
  }

  const first = configurations[0];
  return {
    gpuConfig: first.gpuConfig,
    batteryConfig: first.batteryConfig,
    gridConfig: first.gridConfig,
  };
}

/**
 * Parse all rows from CSV and return array of configurations
 */
function parseAllConfigurationsFromCsv(csvText: string): ParsedConfiguration[] {
  const lines = csvText.trim().split('\n');

  if (lines.length < 1) {
    throw new Error('CSV file is empty');
  }

  if (lines.length < 2) {
    throw new Error('CSV file has no data rows (only header)');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse all data rows
  const configurations: ParsedConfiguration[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNumber = i + 1; // 1-based line number for error messages
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    try {
      const values = line.split(',').map(v => v.trim());

      if (values.length !== headers.length) {
        errors.push(`Row ${lineNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      // Create a map of header -> value for this row
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Parse this row into a configuration
      const config = parseRowToConfiguration(row, lineNumber);
      configurations.push(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Row ${lineNumber}: ${message}`);
    }
  }

  // If we have errors but also some successful parses, throw with details
  if (errors.length > 0) {
    if (configurations.length === 0) {
      // All rows failed
      throw new Error(`Failed to parse any configurations:\n${errors.join('\n')}`);
    } else {
      // Some rows succeeded, some failed - include both counts in error
      throw new Error(
        `Parsed ${configurations.length} configuration(s) with ${errors.length} error(s):\n${errors.join('\n')}`
      );
    }
  }

  return configurations;
}

/**
 * Parse a single CSV row into a ParsedConfiguration
 */
function parseRowToConfiguration(row: Record<string, string>, rowNumber: number): ParsedConfiguration {
  // Helper to parse boolean
  const parseBool = (val: string): boolean => {
    return val.toLowerCase() === 'true' || val === '1';
  };

  // Helper to parse number (returns null for empty strings)
  const parseNum = (val: string): number | null => {
    if (!val || val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  // Extract configuration name (required)
  const configuration_name = row.configuration_name?.trim();
  if (!configuration_name) {
    throw new Error('Missing required field: configuration_name');
  }

  // Parse GPU config
  const gpuConfig: GpuConfig = {
    gpuModel: (row.gpu_model || 'RTX 5090') as GpuConfig['gpuModel'],
    numberOfGpus: parseNum(row.number_of_gpus) ?? 100,
    rentalPricePerHour: parseNum(row.rental_price_per_hour) ?? 5.2,
    powerPerGpu: parseNum(row.power_per_gpu_kw) ?? undefined,
    utilization: parseNum(row.utilization_pct) ?? undefined,
    gpuPurchaseCost: parseNum(row.gpu_purchase_cost_cad) ?? undefined,
    systemLifetime: parseNum(row.system_lifetime_years) ?? undefined,
    discountRate: parseNum(row.discount_rate_pct) ?? undefined,
    fixedAnnualOM: parseNum(row.fixed_annual_om_cad) ?? undefined,
    deploymentCost: parseNum(row.deployment_cost_cad) ?? undefined,
  };

  // Map CSV battery_preset to TypeScript BatteryPreset type
  const mapBatteryPreset = (csvPreset: string): BatteryConfig['preset'] => {
    if (csvPreset === 'minimal') {
      return 'small';
    }
    return csvPreset as BatteryConfig['preset'];
  };

  // Parse Battery config
  const includeBattery = parseBool(row.include_battery ?? 'false');
  const batteryConfig: BatteryConfig = {
    includeBattery,
    preset: mapBatteryPreset(row.battery_preset || 'medium'),
    batterySize: parseNum(row.battery_size_mwh) ?? 0,
    batteryPower: parseNum(row.battery_power_mw),
    roundTripEfficiency: parseNum(row.round_trip_efficiency_pct) ?? 90,
    batteryLifetime: parseNum(row.battery_lifetime_years) ?? 12,
    batteryEnergyCost: parseNum(row.battery_energy_cost_cad_per_kwh) ?? 400,
    batteryPowerSystemCost: parseNum(row.battery_power_system_cost_cad_per_kw) ?? 200,
    fixedAnnualOM: parseNum(row.battery_annual_om_cad) ?? 0,
  };

  // Map CSV priority_rule to TypeScript PriorityRule type
  const mapPriorityRule = (csvRule: string): GridSupplyConfig['priorityRule'] => {
    if (csvRule === 'curtailment_first' || csvRule === 'balanced') {
      return 'cheapest_first';
    }
    return csvRule as GridSupplyConfig['priorityRule'];
  };

  // Parse Grid config
  const gridConfig: GridSupplyConfig = {
    gridPowerLimit: parseNum(row.grid_power_limit_mw) ?? 0,
    gridPriceOverride: parseNum(row.grid_price_override_cad_per_mwh),
    btfPowerLimit: parseNum(row.btf_power_limit_mw) ?? 0,
    btfPrice: parseNum(row.btf_price_cad_per_mwh) ?? 0,
    curtailmentValue: parseNum(row.curtailment_value_cad_per_mwh) ?? 10,
    allowPartialGridSupply: parseBool(row.allow_partial_grid_supply ?? 'false'),
    allowPartialBtfSupply: parseBool(row.allow_partial_btf_supply ?? 'true'),
    priceEscalationRate: parseNum(row.price_escalation_rate_pct) ?? 0,
    priorityRule: mapPriorityRule(row.priority_rule || 'cheapest_first'),
  };

  return {
    configuration_name,
    gpuConfig,
    batteryConfig,
    gridConfig,
  };
}
