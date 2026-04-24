/**
 * GPU configuration types matching backend Pydantic models
 * Based on src/backend/src/analytics/gpu_config.py
 */

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
