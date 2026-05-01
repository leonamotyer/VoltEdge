/**
 * Unified Configuration Types
 * Consolidated from individual module type files for better maintainability
 */

// ============================================================================
// Behind-the-Fence (BTF) Configuration Types
// BTF represents on-site energy generation (e.g., solar, wind) that doesn't go through the grid
// ============================================================================

export interface BtfConfig {
  /** BTF generation capacity in MW (0 = disabled) */
  capacity: number;
  /** Price of BTF energy in CAD/MWh */
  price: number;
}

export const DEFAULT_BTF_CONFIG: BtfConfig = {
  capacity: 0, // Disabled by default
  price: 50    // CAD/MWh - reasonable default for renewable BTF
};

/**
 * Calculate derived BTF metrics
 */
export function getBtfDerivedMetrics(
  config: BtfConfig,
  totalComputePowerMW: number
) {
  const isEnabled = config.capacity > 0;
  const capacityUtilization = totalComputePowerMW > 0 
    ? (config.capacity / totalComputePowerMW) * 100 
    : 0;
  
  // Guardrail: BTF capacity exceeding compute load suggests over-provisioning
  const hasOverProvisioningRisk = config.capacity > totalComputePowerMW * 1.5;

  return {
    isEnabled,
    capacityUtilizationPercent: capacityUtilization,
    hasOverProvisioningRisk
  };
}

// ============================================================================
// Financial Parameters Configuration Types
// Used for NPV/IRR calculations and multi-year cash flow projections
// ============================================================================

export interface FinancialParams {
  /** Discount rate for NPV calculations (percentage, e.g., 10 = 10%) */
  discountRate: number;
  /** Project lifetime in years for cash flow projections */
  projectLifeYears: number;
}

export const DEFAULT_FINANCIAL_PARAMS: FinancialParams = {
  discountRate: 10,      // 10% - typical for energy infrastructure projects
  projectLifeYears: 10   // 10 years - standard project horizon
};

/**
 * Validate financial parameters
 */
export function validateFinancialParams(params: FinancialParams): string | null {
  if (params.discountRate < 0 || params.discountRate > 30) {
    return 'Discount rate must be between 0% and 30%';
  }
  if (params.projectLifeYears < 5 || params.projectLifeYears > 30) {
    return 'Project life must be between 5 and 30 years';
  }
  return null;
}

/**
 * Calculate derived financial metrics
 */
export function getFinancialDerivedMetrics(params: FinancialParams) {
  // Present value factor for single year
  const pvFactor = 1 / Math.pow(1 + params.discountRate / 100, 1);
  
  // Annuity factor (useful for levelized cost calculations)
  const annuityFactor = params.discountRate > 0
    ? ((params.discountRate / 100) * Math.pow(1 + params.discountRate / 100, params.projectLifeYears)) /
      (Math.pow(1 + params.discountRate / 100, params.projectLifeYears) - 1)
    : 1 / params.projectLifeYears;

  return {
    pvFactor,
    annuityFactor,
    totalDiscountFactor: Math.pow(1 + params.discountRate / 100, params.projectLifeYears)
  };
}

// ============================================================================
// GPU Configuration Types
// Based on src/backend/src/analytics/gpu_config.py
// ============================================================================

export type GpuModelType = "RTX 3090" | "RTX 5090" | "A6000" | "PRO 6000" | "Custom";

export interface GpuPreset {
  readonly power_kw: number;
  readonly unit_price_cad: number;
  readonly rental_hr_cad: number;
  readonly label: string;
}

/**
 * GPU presets matching backend GPU_SPECS
 */
export const GPU_PRESETS: Record<Exclude<GpuModelType, "Custom">, GpuPreset> = {
  "RTX 3090": {
    power_kw: 0.35,
    unit_price_cad: 900,
    rental_hr_cad: 0.13,
    label: "RTX 3090 (Entry / Inference)",
  },
  "RTX 5090": {
    power_kw: 0.58,
    unit_price_cad: 2_000,
    rental_hr_cad: 0.37,
    label: "RTX 5090 (Mid-tier / AI)",
  },
  "A6000": {
    power_kw: 0.3,
    unit_price_cad: 6_000,
    rental_hr_cad: 0.37,
    label: "A6000 (Pro / Data Science)",
  },
  "PRO 6000": {
    power_kw: 0.6,
    unit_price_cad: 8_000,
    rental_hr_cad: 0.8,
    label: "PRO 6000 (High-perf / LLM)",
  },
} as const;

/**
 * GPU configuration form data
 */
export interface GpuConfig {
  // Basic settings (required)
  gpuModel: GpuModelType;
  numberOfGpus: number;
  rentalPricePerHour: number; // CAD/GPU-hour

  // Advanced settings (optional with defaults)
  powerPerGpu?: number; // kW (auto-filled from preset)
  utilization?: number; // % (default 85)
  gpuPurchaseCost?: number; // CAD/GPU (auto-filled from preset)
  systemLifetime?: number; // years (default 12)
  discountRate?: number; // % (default 8)
  fixedAnnualOM?: number; // CAD/year (default 0)
  deploymentCost?: number; // CAD (default 0)

  // Custom pricing (optional)
  customPricingEnabled?: boolean; // Enable custom pricing overrides
  unitCostMultiplier?: number; // % of default (25-300, step=5)
  rentalRateMultiplier?: number; // % of default (10-300, step=5)
  rackCount?: number; // Number of racks (1-50)
}

/**
 * Derived metrics (calculated, not user inputs)
 */
export interface GpuDerivedMetrics {
  totalComputePowerMw: number; // GPUs × Power per GPU / 1000
  annualRevenueCad: number; // GPUs × Rental price × 8760 × Utilization
}

/**
 * Default values for advanced settings
 */
export const GPU_CONFIG_DEFAULTS = {
  utilization: 85, // %
  systemLifetime: 12, // years
  discountRate: 8, // %
  fixedAnnualOM: 0, // CAD/year
  deploymentCost: 0, // CAD
} as const;

/**
 * Calculate derived metrics from GPU configuration
 */
export function calculateGpuMetrics(config: GpuConfig): GpuDerivedMetrics {
  const powerPerGpu = config.powerPerGpu ?? 0;
  const utilization = (config.utilization ?? GPU_CONFIG_DEFAULTS.utilization) / 100;

  const totalComputePowerMw = (config.numberOfGpus * powerPerGpu) / 1000;
  const annualRevenueCad = config.numberOfGpus * config.rentalPricePerHour * 8760 * utilization;

  return {
    totalComputePowerMw,
    annualRevenueCad,
  };
}

// ============================================================================
// Battery Group Configuration Types
// Based on GitHub Issue #3
// ============================================================================

export type BatteryPreset = 'small' | 'medium' | 'large' | 'custom';

export interface BatteryConfig {
  // Basic Settings
  includeBattery: boolean;
  batterySize: number; // MWh
  batteryPower: number | null; // MW (null = use total compute power)

  // Preset selection
  preset: BatteryPreset;

  // Advanced Settings
  roundTripEfficiency: number; // % (0-100)
  batteryEnergyCost: number; // CAD/kWh
  batteryPowerSystemCost: number; // CAD/kW
  batteryLifetime: number; // Years
  fixedAnnualOM: number; // CAD/year
}

export interface BatteryPresetConfig {
  label: string;
  durationHours: number; // Hours of compute load to buffer
  description: string;
}

export const BATTERY_PRESETS: Record<BatteryPreset, BatteryPresetConfig | null> = {
  small: {
    label: 'Small Buffer (2 hours)',
    durationHours: 2,
    description: 'Short-term smoothing'
  },
  medium: {
    label: 'Medium Buffer (4 hours)',
    durationHours: 4,
    description: 'Daily shifting'
  },
  large: {
    label: 'Large Buffer (8 hours)',
    durationHours: 8,
    description: 'Deeper shifting / backup'
  },
  custom: null // User enters manually
};

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  includeBattery: false,
  batterySize: 0,
  batteryPower: null,
  preset: 'medium',
  roundTripEfficiency: 90,
  batteryEnergyCost: 300, // CAD/kWh - placeholder, will be replaced with backend constant
  batteryPowerSystemCost: 250, // CAD/kW - placeholder, will be replaced with backend constant
  batteryLifetime: 12,
  fixedAnnualOM: 0
};

/**
 * Calculate battery size based on preset and total compute power
 */
export function calculateBatterySize(
  preset: BatteryPreset,
  totalComputePowerMW: number
): number {
  const presetConfig = BATTERY_PRESETS[preset];
  if (!presetConfig) return 0; // Custom preset

  return totalComputePowerMW * presetConfig.durationHours;
}

/**
 * Calculate derived battery metrics
 */
export function getBatteryDerivedMetrics(
  config: BatteryConfig,
  totalComputePowerMW: number
) {
  if (!config.includeBattery || config.batterySize <= 0) {
    return null;
  }

  const effectivePower = config.batteryPower ?? totalComputePowerMW;
  const durationHours = effectivePower > 0 ? config.batterySize / effectivePower : 0;

  // CAPEX calculations
  const energyCapexCAD = config.batterySize * 1000 * config.batteryEnergyCost; // Convert MWh to kWh
  const powerSystemCapexCAD = effectivePower * 1000 * config.batteryPowerSystemCost; // Convert MW to kW
  const totalCapexCAD = energyCapexCAD + powerSystemCapexCAD;

  // Guardrail: Battery power should not exceed 3x compute power (Rule 7 from BatteryGroup.md)
  const hasHighPowerToComputeRatio = totalComputePowerMW > 0 && effectivePower > (3 * totalComputePowerMW);

  return {
    batteryDurationHours: durationHours,
    effectivePowerMW: effectivePower,
    energyCapexCAD,
    powerSystemCapexCAD,
    totalCapexCAD,
    hasHighPowerToComputeRatio
  };
}

// ============================================================================
// Grid Supply Configuration Types
// Based on GitHub Issue #4
// ============================================================================

export type PriorityRule = 'cheapest_first' | 'grid_first' | 'btf_first';

export interface GridSupplyConfig {
  // Basic Settings — names mirror mockup / backend `grid_cap_mw`, `btf_cap_mw`
  /** Maximum grid import (MW). Mockup: "Grid Import Cap". 0 = grid supply off. */
  gridPowerLimit: number;
  gridPriceOverride: number | null; // CAD/MWh (null = use pool price time series)
  btfPowerLimit: number; // MW (0 = disabled)
  btfPrice: number; // CAD/MWh
  curtailmentValue: number; // CAD/MWh (required)

  // Advanced Settings
  allowPartialGridSupply: boolean;
  allowPartialBtfSupply: boolean;
  priceEscalationRate: number; // %/year
  priorityRule: PriorityRule;
}

export const PRIORITY_RULES: Record<PriorityRule, string> = {
  cheapest_first: 'Cheapest First',
  grid_first: 'Grid First',
  btf_first: 'BTF First'
};

export const DEFAULT_GRID_SUPPLY_CONFIG: GridSupplyConfig = {
  gridPowerLimit: 0,
  gridPriceOverride: null,
  btfPowerLimit: 0,
  btfPrice: 0,
  curtailmentValue: 10, // CAD/MWh - placeholder
  allowPartialGridSupply: false,
  allowPartialBtfSupply: true,
  priceEscalationRate: 0,
  priorityRule: 'cheapest_first'
};

/**
 * Calculate derived grid supply metrics
 */
export function getGridSupplyDerivedMetrics(
  config: GridSupplyConfig,
  totalComputePowerMW: number
) {
  const totalBackupPowerMW = config.gridPowerLimit + config.btfPowerLimit;
  const hasUnmetDemandRisk = totalBackupPowerMW < totalComputePowerMW;

  // Guardrail: BTF price sanity check (Rule 9 from ElectricSupply&Prices.md)
  // When BTF price > grid price under cheapest-first rule, BTF will rarely be used
  const hasBtfPriceWarning =
    config.btfPowerLimit > 0 &&
    config.gridPriceOverride !== null &&
    config.btfPrice > config.gridPriceOverride &&
    config.priorityRule === 'cheapest_first';

  return {
    totalBackupPowerMW,
    hasUnmetDemandRisk,
    gridEnabled: config.gridPowerLimit > 0,
    btfEnabled: config.btfPowerLimit > 0,
    hasBtfPriceWarning
  };
}
