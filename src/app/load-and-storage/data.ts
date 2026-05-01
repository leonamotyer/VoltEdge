/**
 * Load and storage data loader — mock series shaped by sidebar configuration
 * until the Python backend drives this route.
 */
import type { BatteryConfig, GridSupplyConfig } from "@/frontend/types/config";

export interface LoadAndStoragePageParams {
  batteryConfig: BatteryConfig;
  gridConfig: GridSupplyConfig;
  /** MW cap used to scale charge/discharge (0 when battery storage is off). */
  effectiveBatteryPowerMw: number;
  /** For energy-mix heuristics vs grid/BTF limits. */
  totalComputePowerMw: number;
}

/** Reference mock plant (100 MWh, ~4 MW peak discharge in the synthetic hourly profile). */
const REF_BATTERY_MWH = 100;
const REF_PEAK_DISCHARGE_MW = 4;
const REF_CAPTURED_MWH = 847.3;
const REF_RELEASED_MWH = 719.2;
const REF_REVENUE_CAD = 48750;
const REF_CURTAILED = 1250.5;
const REF_GRID = 342.8;
// Reference implied compute load behind the original mock energyMix.
// 2312.5 MWh / 48h ≈ 48.18 MW average.
const REF_COMPUTE_MW = 48.18;

function twist(hour: number): number {
  return Math.sin(hour * 0.73) * 1.5 + Math.cos(hour * 0.31) * 0.8;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function loadLoadAndStoragePageData(params: LoadAndStoragePageParams) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const { batteryConfig, gridConfig, effectiveBatteryPowerMw, totalComputePowerMw } = params;
  const includeBattery = batteryConfig.includeBattery;
  const batteryMwh = Math.max(0.1, batteryConfig.batterySize || 0.1);
  const rte = Math.max(1, Math.min(100, batteryConfig.roundTripEfficiency)) / 100;

  const sizeRatio = includeBattery ? batteryMwh / REF_BATTERY_MWH : 0;
  const capturedMWh = includeBattery ? REF_CAPTURED_MWH * sizeRatio : 0;
  const releasedMWh = includeBattery ? capturedMWh * rte : 0;
  const spread = Math.max(5, 75 - gridConfig.curtailmentValue);
  const spreadRef = 55;
  const estimatedGrossRevenueCad = includeBattery
    ? Math.round(REF_REVENUE_CAD * sizeRatio * (spread / spreadRef) * (rte / 0.9))
    : 0;

  const socTimeSeries = generateSocTimeSeries({
    includeBattery,
    batteryMwh,
    gridConfig,
    totalComputePowerMw,
  });

  const chargeDischargeCycles = generateChargeDischargeCycles({
    includeBattery,
    effectiveBatteryPowerMw,
    gridConfig,
  });

  const energyMix = buildEnergyMix({
    includeBattery,
    releasedMWh,
    gridConfig,
    totalComputePowerMw,
  });

  return {
    capturedMWh: Math.round(capturedMWh * 10) / 10,
    releasedMWh: Math.round(releasedMWh * 10) / 10,
    estimatedGrossRevenueCad,
    socTimeSeries,
    chargeDischargeCycles,
    energyMix,
    rawDataByRepository: {
      aeso: { recordCount: 8760, source: "mock" },
      turbine: { count: 10, model: "V150-4.2" },
      scada: { recordCount: 8760, source: "mock" },
    },
  };
}

/**
 * 48-hour SOC: shape follows the same daily pattern; capacity scales with configured MWh.
 */
function generateSocTimeSeries(opts: {
  includeBattery: boolean;
  batteryMwh: number;
  gridConfig: GridSupplyConfig;
  totalComputePowerMw: number;
}) {
  const { includeBattery, batteryMwh, gridConfig, totalComputePowerMw } = opts;
  const backupRatio =
    totalComputePowerMw > 0
      ? (gridConfig.gridPowerLimit + gridConfig.btfPowerLimit) / totalComputePowerMw
      : 0;
  // Lower external backup pushes deeper battery swings; larger backup keeps SOC steadier.
  const socVolatility = clamp(1.15 - backupRatio * 0.3, 0.75, 1.35);
  const btfBias =
    gridConfig.btfPowerLimit > 0 && gridConfig.btfPrice < (gridConfig.gridPriceOverride ?? 55) ? -2 : 0;
  const partialSupplyBias = gridConfig.allowPartialGridSupply || gridConfig.allowPartialBtfSupply ? 1 : -1;
  const baseDate = new Date("2026-01-01T00:00:00Z");
  const data: Array<{ timestamp: string; socPercent: number; capacityUsedMWh: number }> = [];

  for (let hour = 0; hour < 48; hour++) {
    const timestamp = new Date(baseDate.getTime() + hour * 60 * 60 * 1000).toISOString();
    const tw = twist(hour);

    if (!includeBattery) {
      data.push({ timestamp, socPercent: 0, capacityUsedMWh: 0 });
      continue;
    }

    const hourOfDay = hour % 24;
    let socPercent: number;

    if (hourOfDay >= 0 && hourOfDay < 6) {
      socPercent = 30 + (hourOfDay / 6) * (55 * socVolatility) + tw;
    } else if (hourOfDay >= 6 && hourOfDay < 9) {
      socPercent = 85 - ((hourOfDay - 6) / 3) * (25 * socVolatility) + tw * 0.5;
    } else if (hourOfDay >= 9 && hourOfDay < 16) {
      socPercent = 58 + Math.sin((hourOfDay - 9) / 2) * (7 * socVolatility) + tw * 0.4;
    } else if (hourOfDay >= 16 && hourOfDay < 21) {
      socPercent = 65 - ((hourOfDay - 16) / 5) * (30 * socVolatility) + tw * 0.5;
    } else {
      socPercent = 35 + ((hourOfDay - 21) / 3) * (10 * socVolatility) + tw * 0.4;
    }

    if (hour >= 24) {
      socPercent = Math.max(20, socPercent - 5);
    }

    socPercent = Math.max(20, Math.min(95, socPercent + btfBias + partialSupplyBias));
    const capacityUsedMWh = (socPercent / 100) * batteryMwh;

    data.push({
      timestamp,
      socPercent: Math.round(socPercent * 10) / 10,
      capacityUsedMWh: Math.round(capacityUsedMWh * 10) / 10,
    });
  }

  return data;
}

/**
 * Charge/discharge vs pool price: MW scaled by effective battery power; price series nudged by grid overrides.
 */
function generateChargeDischargeCycles(opts: {
  includeBattery: boolean;
  effectiveBatteryPowerMw: number;
  gridConfig: GridSupplyConfig;
}) {
  const { includeBattery, effectiveBatteryPowerMw, gridConfig } = opts;
  const powerScale =
    includeBattery && effectiveBatteryPowerMw > 0
      ? Math.min(3, effectiveBatteryPowerMw / REF_PEAK_DISCHARGE_MW)
      : 0;

  const gridPriceShift =
    gridConfig.gridPriceOverride != null && gridConfig.gridPriceOverride > 0
      ? (gridConfig.gridPriceOverride - 55) * 0.35
      : 0;
  const escalationNudge = (gridConfig.priceEscalationRate / 100) * 8;
  const baselineGridPrice = gridConfig.gridPriceOverride ?? 55;
  const btfPenalty = gridConfig.btfPowerLimit > 0 ? (gridConfig.btfPrice - baselineGridPrice) / 120 : 0;
  const curtailmentIncentive = clamp((55 - gridConfig.curtailmentValue) / 80, -0.2, 0.6);
  const partialSupplyFactor =
    (gridConfig.allowPartialGridSupply ? 0.06 : -0.04) + (gridConfig.allowPartialBtfSupply ? 0.05 : -0.03);
  const priorityFactor =
    gridConfig.priorityRule === "btf_first"
      ? -0.08
      : gridConfig.priorityRule === "grid_first"
        ? -0.04
        : 0.06;
  const dischargeFactor = clamp(1 - btfPenalty + priorityFactor + partialSupplyFactor, 0.45, 1.65);
  const chargeFactor = clamp(1 + curtailmentIncentive - priorityFactor * 0.25, 0.55, 1.75);

  const baseDate = new Date("2026-01-01T00:00:00Z");
  const data: Array<{
    timestamp: string;
    chargeMw: number;
    dischargeMw: number;
    poolPrice: number;
  }> = [];

  for (let hour = 0; hour < 48; hour++) {
    const timestamp = new Date(baseDate.getTime() + hour * 60 * 60 * 1000).toISOString();
    const hourOfDay = hour % 24;
    const tw = twist(hour);

    let chargeMw = 0;
    let dischargeMw = 0;
    let poolPrice = 0;

    if (hourOfDay >= 0 && hourOfDay < 6) {
      poolPrice = -25 + (tw + 3) * 5 + gridPriceShift + escalationNudge;
      chargeMw = (2.5 + tw * 0.25) * powerScale * chargeFactor;
      dischargeMw = 0;
    } else if (hourOfDay >= 6 && hourOfDay < 9) {
      poolPrice = 15 + (hourOfDay - 6) * 15 + tw * 2 + gridPriceShift + escalationNudge;
      chargeMw = 0;
      dischargeMw = (0.5 + tw * 0.08) * powerScale * dischargeFactor;
    } else if (hourOfDay >= 9 && hourOfDay < 16) {
      poolPrice = 45 + tw * 2 + gridPriceShift + escalationNudge;
      chargeMw = 0;
      dischargeMw = (1 + tw * 0.12) * powerScale * dischargeFactor;
    } else if (hourOfDay >= 16 && hourOfDay < 21) {
      poolPrice = 90 + tw * 3 + gridPriceShift + escalationNudge;
      chargeMw = 0;
      dischargeMw = (3 + tw * 0.2) * powerScale * dischargeFactor;
    } else {
      poolPrice = 30 - (hourOfDay - 21) * 8 + tw * 2 + gridPriceShift + escalationNudge;
      chargeMw = (1 + tw * 0.1) * powerScale * chargeFactor;
      dischargeMw = 0;
    }

    data.push({
      timestamp,
      chargeMw: Math.round(chargeMw * 100) / 100,
      dischargeMw: Math.round(dischargeMw * 100) / 100,
      poolPrice: Math.round(poolPrice * 100) / 100,
    });
  }

  return data;
}

function buildEnergyMix(args: {
  includeBattery: boolean;
  releasedMWh: number;
  gridConfig: GridSupplyConfig;
  totalComputePowerMw: number;
}) {
  const { includeBattery, releasedMWh, gridConfig, totalComputePowerMw } = args;

  if (!includeBattery) {
    // Scale energy sourcing with compute load so the mix stays plausible when GPU MW changes.
    // If we don't have a compute signal yet, keep the legacy fixed mix.
    const computeScale =
      totalComputePowerMw > 0 ? clamp(totalComputePowerMw / REF_COMPUTE_MW, 0.05, 6) : 1;

    const gridExtra = REF_RELEASED_MWH + REF_CAPTURED_MWH * 0.12;
    const gridRatio =
      gridConfig.gridPowerLimit > 0 && totalComputePowerMw > 0
        ? 1 + Math.min(0.45, gridConfig.gridPowerLimit / totalComputePowerMw) * 0.2
        : 1;

    const partialGridFactor = gridConfig.allowPartialGridSupply ? 1.06 : 0.94;
    const priorityGridFactor = gridConfig.priorityRule === "grid_first" ? 1.12 : 1;

    const partialBtfFactor = gridConfig.allowPartialBtfSupply ? 1.08 : 0.9;
    const priorityBtfFactor = gridConfig.priorityRule === "btf_first" ? 1.18 : 1;

    const curtailedWindMWh = Math.max(150, (REF_CURTAILED - 100) * computeScale);
    const gridImportMWh = Math.max(
      0,
      (REF_GRID + gridExtra) * computeScale * gridRatio * partialGridFactor * priorityGridFactor,
    );
    const btfMWh =
      gridConfig.btfPowerLimit > 0
        ? Math.max(
            0,
            Math.min(350, (28 + gridConfig.btfPowerLimit * 5.5) * computeScale) *
              partialBtfFactor *
              priorityBtfFactor,
          )
        : 0;
    const totalMWh = curtailedWindMWh + gridImportMWh + btfMWh;
    return {
      curtailedWindMWh: Math.round(curtailedWindMWh * 10) / 10,
      batteryDischargeMWh: 0,
      gridImportMWh: Math.round(gridImportMWh * 10) / 10,
      btfMWh: Math.round(btfMWh * 10) / 10,
      totalMWh: Math.round(totalMWh * 10) / 10,
    };
  }

  const r = Math.max(0.15, releasedMWh / REF_RELEASED_MWH);
  const batteryDischargeMWh = releasedMWh;
  const gridRatio =
    gridConfig.gridPowerLimit > 0 && totalComputePowerMw > 0
      ? 1 + Math.min(0.45, gridConfig.gridPowerLimit / totalComputePowerMw) * 0.2
      : 1;
  const partialGridFactor = gridConfig.allowPartialGridSupply ? 1.06 : 0.94;
  const priorityGridFactor = gridConfig.priorityRule === "grid_first" ? 1.12 : 1;
  const gridImportMWh = Math.max(
    100,
    REF_GRID * gridRatio * (2 - Math.min(1.4, r)) * partialGridFactor * priorityGridFactor,
  );
  const curtailedWindMWh = Math.max(
    200,
    REF_CURTAILED / Math.pow(r, 0.35) - batteryDischargeMWh * 0.12,
  );
  const btfPriceScore =
    gridConfig.gridPriceOverride != null ? clamp((gridConfig.gridPriceOverride - gridConfig.btfPrice) / 80, -0.5, 0.8) : 0;
  const partialBtfFactor = gridConfig.allowPartialBtfSupply ? 1.08 : 0.9;
  const priorityBtfFactor = gridConfig.priorityRule === "btf_first" ? 1.18 : 1;
  const btfMWh =
    gridConfig.btfPowerLimit > 0
      ? Math.min(
          380,
          (35 + gridConfig.btfPowerLimit * 4.8) * (1 + btfPriceScore) * partialBtfFactor * priorityBtfFactor,
        )
      : 0;
  const totalMWh = curtailedWindMWh + batteryDischargeMWh + gridImportMWh + btfMWh;

  return {
    curtailedWindMWh: Math.round(curtailedWindMWh * 10) / 10,
    batteryDischargeMWh: Math.round(batteryDischargeMWh * 10) / 10,
    gridImportMWh: Math.round(gridImportMWh * 10) / 10,
    btfMWh: Math.round(btfMWh * 10) / 10,
    totalMWh: Math.round(totalMWh * 10) / 10,
  };
}
