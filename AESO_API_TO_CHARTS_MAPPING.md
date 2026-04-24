# AESO API to VoltEdge Charts Mapping

**Last Updated:** April 24, 2026  
**Purpose:** Map AESO API endpoints to specific charts in the VoltEdge application

---

## Overview

This document maps the specific data fields from AESO APIs to the charts currently displayed in the VoltEdge application. All charts currently use mock data and need to be connected to real AESO API data.

---

## Chart Inventory by Page

### 1. Load and Storage Page (`src/app/load-and-storage/page.tsx`)

#### Chart 1.1: Battery State of Charge (48h) - `SimpleLineChart`
**Purpose:** Show battery SOC percentage over 48-hour period

**Mock Data Structure:**
```typescript
socTimeSeries: Array<{
  timestamp: string;        // ISO 8601
  socPercent: number;       // 0-100
  capacityUsedMWh: number;  // Calculated from SOC
}>
```

**AESO API Mapping:**
- **Primary API:** Pool Price Report (`/v1.1/price/poolPrice`)
- **Supporting API:** Current Supply Demand Assets (`/v2/csd/generation/assets/current`)

**Required AESO Fields:**
| AESO Field | Maps To | Notes |
|------------|---------|-------|
| `begin_datetime_mpt` | `timestamp` | Convert to ISO 8601 |
| `pool_price` | Used to calculate SOC strategy | Charge when low, discharge when high |

**Calculation Logic:**
```
1. Fetch hourly pool prices for 48-hour window
2. Identify low-price periods (< $20/MWh) → Charge battery
3. Identify high-price periods (> $80/MWh) → Discharge battery
4. Calculate cumulative SOC based on charge/discharge decisions
5. Apply round-trip efficiency (85-90%)
```

---

#### Chart 1.2: Charge/Discharge Cycles vs Pool Price - `BatteryPowerVsPriceChart`
**Purpose:** Dual-axis chart showing battery power (MW) and pool price (CAD/MWh)

**Mock Data Structure:**
```typescript
chargeDischargeCycles: Array<{
  timestamp: string;
  chargeMw: number;      // Positive = charging
  dischargeMw: number;   // Positive = discharging
  poolPrice: number;     // CAD/MWh
}>
```

**AESO API Mapping:**
- **Primary API:** Pool Price Report (`/v1.1/price/poolPrice`)

**Required AESO Fields:**
| AESO Field | Maps To | Purpose |
|------------|---------|---------|
| `begin_datetime_mpt` | `timestamp` | Time axis |
| `pool_price` | `poolPrice` | Right Y-axis (price) |

**Derived Fields (from pool price + battery logic):**
| Derived Field | Calculation | Notes |
|---------------|-------------|-------|
| `chargeMw` | If `pool_price < threshold` → Charge at rated power | Battery charges during curtailment (low/negative prices) |
| `dischargeMw` | If `pool_price > threshold` → Discharge at rated power | Battery discharges during peak prices |

---

#### Chart 1.3: Energy Source Mix - `SimplePieChart`
**Purpose:** Show proportion of energy sources (curtailed wind, battery, grid, BTF)

**Mock Data:**
```typescript
energyMix: {
  curtailedWindMWh: number;
  batteryDischargeMWh: number;
  gridImportMWh: number;
  btfMWh: number;
  totalMWh: number;
}
```

**AESO API Mapping:**
- **Primary API:** Metered Volume Report (`/v1/meteredvolume/details`)
- **Supporting API:** Asset List (`/v1/assetlist`)

**Required AESO Fields:**
| AESO Field | Maps To | Purpose |
|------------|---------|---------|
| `asset_id` | Filter for wind assets | Identify wind farm |
| `metered_volume_mwh` | Calculate `curtailedWindMWh` | Actual wind generation vs capacity |
| `pool_price` | Determine curtailment periods | Negative/low prices indicate curtailment |

**Calculation Logic:**
```
1. Fetch metered volumes for specific wind asset(s)
2. Identify curtailment periods (metered < capacity when price < threshold)
3. curtailedWindMWh = Sum of unused capacity during curtailment
4. batteryDischargeMWh = Sum of discharge events from Chart 1.2
5. gridImportMWh = Total load - (curtailedWind + battery)
```

---

### 2. Curtailment Page (`src/app/curtailment/page.tsx`)

#### Chart 2.1: Hourly Curtailment Gap - `SimpleLineChart`
**Purpose:** Show curtailment gap (MWh) over time

**Mock Data Structure:**
```typescript
rows: Array<{
  timestamp: string;
  poolPriceCadPerMWh: number;
  curtailmentGapMWh: number;
}>
```

**AESO API Mapping:**
- **Primary APIs:** 
  - Pool Price Report (`/v1.1/price/poolPrice`)
  - Metered Volume Report (`/v1/meteredvolume/details`)
- **Supporting API:** Asset List (`/v1/assetlist`) to get wind asset capacity

**Required AESO Fields:**
| AESO Field | API | Maps To | Purpose |
|------------|-----|---------|---------|
| `begin_datetime_mpt` | Pool Price | `timestamp` | Time axis |
| `pool_price` | Pool Price | `poolPriceCadPerMWh` | Price indicator |
| `metered_volume_mwh` | Metered Volume | Used in calculation | Actual generation |
| `capacity_mw` | Asset List | Used in calculation | Maximum capacity |

**Calculation Logic:**
```
curtailmentGapMWh = MAX(0, asset_capacity_mw - metered_volume_mwh)
  WHERE pool_price < curtailment_threshold (e.g., $10/MWh)
```

---

#### Chart 2.2: Monthly Curtailment Profile - `SimpleGroupedBarChart`
**Purpose:** Compare monthly total curtailment gap vs unused energy

**Mock Data:** Currently hardcoded in page component

**AESO API Mapping:**
- **Primary API:** Metered Volume Report (`/v1/meteredvolume/details`)
- **Time Range:** Monthly aggregation over historical period

**Required AESO Fields:**
| AESO Field | Maps To | Aggregation |
|------------|---------|-------------|
| `metered_volume_mwh` | Calculate curtailment | Sum by month |
| `begin_datetime_mpt` | Group by month | Extract YYYY-MM |

**Calculation Logic:**
```
For each month:
  curtailment_events_count = Count(hours where gap > 0)
  total_gap_mwh = Sum(curtailmentGapMWh)
  unused_energy_mwh = Sum(potential_energy - metered_energy)
```

---

#### Chart 2.3: Event Duration Distribution - `SimpleBarChart`
**Purpose:** Show distribution of curtailment event durations

**AESO API Mapping:**
- **Primary API:** Pool Price Report + Metered Volume Report
- **Processing:** Identify continuous curtailment periods

**Required AESO Fields:**
| AESO Field | Purpose |
|------------|---------|
| `begin_datetime_mpt` | Identify continuous periods |
| `pool_price` | Detect curtailment threshold crossings |
| `metered_volume_mwh` | Confirm actual curtailment |

**Calculation Logic:**
```
1. Identify curtailment periods (consecutive hours where gap > 0)
2. Calculate duration of each event in hours
3. Group into buckets: <30min, 30-60min, 1-2hr, 2-4hr, 4-6hr, >6hr
4. Count events in each bucket
```

---

#### Chart 2.4: Hourly Wind Profile - `SimpleLineChart`
**Purpose:** Show average wind speed by hour of day

**Note:** This requires SCADA data, NOT available from AESO API
**Alternative:** Use metered volume as proxy for wind conditions

**AESO API Alternative:**
- **API:** Metered Volume Report (`/v1/meteredvolume/details`)
- **Field:** `metered_volume_mwh` for wind assets

**Calculation:**
```
For each hour of day (0-23):
  avg_output_mwh = Average(metered_volume_mwh) for that hour across all days
  normalized_output = avg_output_mwh / asset_capacity_mw * 100
```

---

### 3. Network and Fiber Page (`src/app/network-and-fiber/page.tsx`)

#### Chart 3.1: Latency Threshold Comparison - `SimpleBarChart`
**Purpose:** Compare estimated latency vs workload thresholds

**AESO API:** NOT APPLICABLE - This is infrastructure data, not market data

---

### 4. ROI Page (`src/app/roi/page.tsx`)

#### Chart 4.1: CAPEX Breakdown - `SimplePieChart`
**Purpose:** Show capital expenditure by component

**AESO API:** NOT APPLICABLE - Internal financial modeling

---

#### Chart 4.2: Cumulative Cash Position - `SimpleLineChart`
**Purpose:** Show cumulative cash flow over project lifetime

**AESO API Dependency (Indirect):**
- **Revenue Calculation:** Requires pool price data for arbitrage revenue
- **API:** Pool Price Report (`/v1.1/price/poolPrice`)

**How AESO Data Informs This Chart:**
```
1. Historical pool prices → Estimate annual arbitrage revenue
2. Price volatility → Risk adjustment for revenue projections
3. Curtailment frequency → Estimate charge opportunities
```

---

#### Chart 4.3: Annual P&L Lines - `SimpleBarChart`
**Purpose:** Show revenue, costs, and net profit

**AESO API Dependency (Indirect):**
- Pool prices drive revenue estimates
- Same as Chart 4.2

---

## Summary: AESO API Endpoints by Priority

### Critical (Tier 1) - Required for Core Functionality

#### 1. Pool Price Report (`/v1.1/price/poolPrice`)
**Why Critical:** Foundation for all curtailment analysis and battery arbitrage
**Used By:**
- Chart 1.2: Battery Power vs Price
- Chart 2.1: Hourly Curtailment Gap
- Chart 4.2/4.3: ROI calculations

**Data Requirements:**
- Historical: Last 12-24 months for baseline
- Real-time: Hourly updates for current operations
- Fields: `begin_datetime_mpt`, `pool_price`

---

#### 2. Metered Volume Report (`/v1/meteredvolume/details`)
**Why Critical:** Identifies actual wind generation and curtailment events
**Used By:**
- Chart 1.3: Energy Source Mix
- Chart 2.1: Curtailment Gap calculation
- Chart 2.2: Monthly curtailment profile
- Chart 2.3: Event duration distribution

**Data Requirements:**
- Historical: Last 24 months
- Filter: Specific wind asset ID(s)
- Fields: `metered_volume_mwh`, `begin_datetime_mpt`, `asset_id`

---

#### 3. Asset List (`/v1/assetlist`)
**Why Critical:** Identify wind assets and their capacities
**Used By:** All curtailment calculations (capacity reference)

**Data Requirements:**
- One-time fetch, update quarterly
- Filter: `asset_type = 'WIND'`
- Fields: `asset_id`, `asset_name`, `capacity_mw`, `asset_type`

---

### Secondary (Tier 2) - Enhanced Features

#### 4. Current Supply Demand Assets (`/v2/csd/generation/assets/current`)
**Why Useful:** Real-time monitoring of wind generation
**Used By:** Live dashboard updates, Chart 1.1 real-time SOC

**Data Requirements:**
- Real-time: Poll every 5-15 minutes
- Fields: `asset_id`, `output_mw`, `mc_capability_mw`

---

#### 5. System Marginal Price Report (`/v1.1/price/systemMarginalPrice`)
**Why Useful:** Alternative price signal for dispatch optimization
**Used By:** Advanced battery dispatch strategies

---

### Optional (Tier 3) - Future Enhancements

#### 6. Actual Forecast Report (`/v1/load/albertaInternalLoad`)
**Why Useful:** Demand forecasting for price prediction
**Used By:** Predictive battery dispatch models

#### 7. Energy Merit Order Report (`/v1/meritOrder/energy`)
**Why Useful:** Understanding market dynamics and dispatch order
**Used By:** Market analysis features

---

## Implementation Strategy

### Phase 1: Historical Data Loading
1. Fetch 12-24 months of Pool Price data (bulk CSV or API)
2. Fetch 12-24 months of Metered Volume data for target wind assets
3. Fetch Asset List to get wind farm capacities
4. Store in local database/cache for fast access

### Phase 2: Curtailment Calculation
1. Join pool prices with metered volumes by timestamp
2. Calculate curtailment gap: `capacity_mw - metered_volume_mwh` when `pool_price < threshold`
3. Identify curtailment events (continuous periods)
4. Calculate event statistics (duration, frequency, total MWh)

### Phase 3: Battery Simulation
1. Use pool prices to simulate battery charge/discharge decisions
2. Apply battery parameters (capacity, power rating, efficiency)
3. Calculate SOC time series
4. Calculate revenue from arbitrage

### Phase 4: Real-time Updates
1. Poll Current Supply Demand API every 5-15 minutes
2. Fetch latest Pool Prices hourly
3. Update charts with real-time data
4. Maintain 48-hour rolling window for operational charts

---

## Data Transformation Examples

### Example 1: Pool Price to Battery Charge Decision
```typescript
interface AesoPoolPrice {
  begin_datetime_mpt: string;  // "2026-01-01T14:00:00-07:00"
  pool_price: number;           // 45.23
  forecast_pool_price: number;  // 47.10
}

function transformToChargeDecision(
  aesoData: AesoPoolPrice[],
  chargeThreshold: number = 20,
  dischargeThreshold: number = 80
) {
  return aesoData.map(row => ({
    timestamp: new Date(row.begin_datetime_mpt).toISOString(),
    poolPrice: row.pool_price,
    chargeMw: row.pool_price < chargeThreshold ? BATTERY_POWER_MW : 0,
    dischargeMw: row.pool_price > dischargeThreshold ? BATTERY_POWER_MW : 0,
  }));
}
```

---

### Example 2: Metered Volume to Curtailment Gap
```typescript
interface AesoMeteredVolume {
  begin_datetime_mpt: string;
  asset_id: string;
  metered_volume_mwh: number;
}

interface AssetCapacity {
  asset_id: string;
  capacity_mw: number;
}

function calculateCurtailmentGap(
  meteredData: AesoMeteredVolume[],
  capacities: AssetCapacity[]
) {
  const capacityMap = new Map(capacities.map(c => [c.asset_id, c.capacity_mw]));

  return meteredData.map(row => {
    const capacity = capacityMap.get(row.asset_id) || 0;
    const curtailmentGapMWh = Math.max(0, capacity - row.metered_volume_mwh);

    return {
      timestamp: new Date(row.begin_datetime_mpt).toISOString(),
      assetId: row.asset_id,
      actualGenerationMWh: row.metered_volume_mwh,
      capacityMW: capacity,
      curtailmentGapMWh,
    };
  });
}
```

---

## Next Steps

1. **Register for AESO API Access**
   - Visit: https://developer-apim.aeso.ca/signup
   - Obtain subscription key

2. **Update `AesoRepository` class** (`src/backend/src/repositories/aeso.py`)
   - Replace mock data with real API calls
   - Implement caching strategy
   - Handle API errors and rate limits

3. **Create Data Sync Service**
   - Background job to fetch historical data on first run
   - Incremental updates for recent data
   - Store in database for fast querying

4. **Update Frontend Data Models**
   - Modify TypeScript interfaces to match AESO response structures
   - Update type guards in `src/frontend/dashboard/guards.ts`

5. **Testing**
   - Verify data transformations with sample AESO responses
   - Test edge cases (missing data, API errors)
   - Validate curtailment calculations against known events

---

**Version:** 1.0
**Last Updated:** April 24, 2026
**Related Documents:**
- `AESO_API_MAPPING.md` - Detailed API documentation
- `voltedge_data_sources.md` - Data source overview
- `ARCHITECTURE.md` - System architecture

