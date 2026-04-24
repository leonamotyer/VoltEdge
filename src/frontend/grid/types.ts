/**
 * Grid Supply Configuration Types
 * Based on GitHub Issue #4
 */

export type PriorityRule = 'cheapest_first' | 'grid_first' | 'btf_first';

export interface GridSupplyConfig {
  // Basic Settings
  gridPowerLimit: number; // MW (0 = disabled)
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

// Default values matching Issue #4
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
