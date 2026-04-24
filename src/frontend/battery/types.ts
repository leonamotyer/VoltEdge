/**
 * Battery Group Configuration Types
 * Based on GitHub Issue #3
 */

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

// Default values matching Issue #3
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
