/**
 * Load and storage data loader - uses mock data until Python backend is running.
 */
export async function loadLoadAndStoragePageData() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Generate realistic 48-hour SOC time-series data with charge/discharge cycles
  const socTimeSeries = generateSocTimeSeries();

  // Generate 48-hour charge/discharge power and pool price correlation data
  const chargeDischargeCycles = generateChargeDischargeCycles();

  return {
    capturedMWh: 847.3,
    releasedMWh: 719.2,
    estimatedGrossRevenueCad: 48750,
    socTimeSeries,
    chargeDischargeCycles,
    energyMix: {
      curtailedWindMWh: 1250.5,
      batteryDischargeMWh: 719.2,
      gridImportMWh: 342.8,
      btfMWh: 0,
      totalMWh: 2312.5,
    },
    rawDataByRepository: {
      aeso: { recordCount: 8760, source: "mock" },
      turbine: { count: 10, model: "V150-4.2" },
      scada: { recordCount: 8760, source: "mock" },
    },
  };
}

/**
 * Generate realistic 48-hour battery SOC time-series with charge/discharge cycles.
 * Simulates typical battery operation:
 * - Charging during low-price/curtailment periods (night, high wind)
 * - Discharging during high-price periods (peak demand)
 * - Battery capacity: 100 MWh (example)
 */
function generateSocTimeSeries() {
  const baseDate = new Date("2026-01-01T00:00:00Z");
  const data: Array<{ timestamp: string; socPercent: number; capacityUsedMWh: number }> = [];
  const batteryCapacityMWh = 100;

  // Simulate 48 hours (2 days) with hourly data points
  for (let hour = 0; hour < 48; hour++) {
    const timestamp = new Date(baseDate.getTime() + hour * 60 * 60 * 1000).toISOString();

    const hourOfDay = hour % 24;
    let socPercent: number;

    if (hourOfDay >= 0 && hourOfDay < 6) {
      // Night charging: gradual increase from 30% to 85%
      socPercent = 30 + (hourOfDay / 6) * 55 + Math.random() * 3;
    } else if (hourOfDay >= 6 && hourOfDay < 9) {
      // Morning discharge: decrease from 85% to 60%
      socPercent = 85 - ((hourOfDay - 6) / 3) * 25 + Math.random() * 2;
    } else if (hourOfDay >= 9 && hourOfDay < 16) {
      // Midday moderate: stable around 55-65%
      socPercent = 58 + Math.sin((hourOfDay - 9) / 2) * 7 + Math.random() * 4;
    } else if (hourOfDay >= 16 && hourOfDay < 21) {
      // Evening peak discharge: decrease from 65% to 35%
      socPercent = 65 - ((hourOfDay - 16) / 5) * 30 + Math.random() * 2;
    } else {
      // Late evening recharge: increase from 35% to 45%
      socPercent = 35 + ((hourOfDay - 21) / 3) * 10 + Math.random() * 3;
    }

    // Apply day 2 offset (slightly lower SOC on average for day 2)
    if (hour >= 24) {
      socPercent = Math.max(20, socPercent - 5);
    }

    // Clamp to realistic range
    socPercent = Math.max(20, Math.min(95, socPercent));

    const capacityUsedMWh = (socPercent / 100) * batteryCapacityMWh;

    data.push({
      timestamp,
      socPercent: Math.round(socPercent * 10) / 10, // Round to 1 decimal
      capacityUsedMWh: Math.round(capacityUsedMWh * 10) / 10,
    });
  }

  return data;
}

/**
 * Generate 48-hour charge/discharge power data correlated with pool prices.
 * Shows realistic battery operation:
 * - Charging (positive chargeMw) during low/negative price periods (curtailment)
 * - Discharging (positive dischargeMw) during high price periods
 * - Pool price correlation demonstrates the economic arbitrage opportunity
 */
function generateChargeDischargeCycles() {
  const baseDate = new Date("2026-01-01T00:00:00Z");
  const data: Array<{
    timestamp: string;
    chargeMw: number;
    dischargeMw: number;
    poolPrice: number;
  }> = [];

  // Simulate 48 hours with hourly data points
  for (let hour = 0; hour < 48; hour++) {
    const timestamp = new Date(baseDate.getTime() + hour * 60 * 60 * 1000).toISOString();
    const hourOfDay = hour % 24;

    let chargeMw = 0;
    let dischargeMw = 0;
    let poolPrice = 0;

    // Night hours (0-6): Low/negative prices, battery charges from curtailed wind
    if (hourOfDay >= 0 && hourOfDay < 6) {
      poolPrice = -25 + Math.random() * 35; // -25 to 10 CAD/MWh (mostly negative)
      chargeMw = 2.5 + Math.random() * 1.5; // 2.5-4 MW charging
      dischargeMw = 0;
    }
    // Morning ramp (6-9): Prices rising, minimal activity
    else if (hourOfDay >= 6 && hourOfDay < 9) {
      poolPrice = 15 + (hourOfDay - 6) * 15 + Math.random() * 10; // 15-60 CAD/MWh
      chargeMw = 0;
      dischargeMw = 0.5 + Math.random() * 0.5; // Small discharge
    }
    // Midday (9-16): Moderate prices, some discharge
    else if (hourOfDay >= 9 && hourOfDay < 16) {
      poolPrice = 45 + Math.random() * 20; // 45-65 CAD/MWh
      chargeMw = 0;
      dischargeMw = 1 + Math.random() * 0.8; // 1-1.8 MW discharge
    }
    // Evening peak (16-21): High prices, maximum discharge
    else if (hourOfDay >= 16 && hourOfDay < 21) {
      poolPrice = 90 + Math.random() * 40; // 90-130 CAD/MWh (peak)
      chargeMw = 0;
      dischargeMw = 3 + Math.random() * 1.5; // 3-4.5 MW discharge (maximum)
    }
    // Late evening (21-24): Prices falling, battery starts charging
    else {
      poolPrice = 30 - (hourOfDay - 21) * 8 + Math.random() * 15; // Declining
      chargeMw = 1 + Math.random() * 1; // Starting to charge
      dischargeMw = 0;
    }

    data.push({
      timestamp,
      chargeMw: Math.round(chargeMw * 100) / 100, // Round to 2 decimals
      dischargeMw: Math.round(dischargeMw * 100) / 100,
      poolPrice: Math.round(poolPrice * 100) / 100,
    });
  }

  return data;
}
