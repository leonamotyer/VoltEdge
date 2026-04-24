# AESO API Implementation Summary

**Date:** April 24, 2026  
**Purpose:** Executive summary of AESO API integration requirements for VoltEdge

---

## What We Have

### Current State
- **Frontend:** 4 dashboard pages with 11 charts displaying mock data
- **Backend:** Python FastAPI with `AesoRepository` using static JSON
- **Data:** Mock data in `src/backend/data/aeso_market_data.json`

### Chart Inventory
1. **Load and Storage (3 charts)**
   - Battery State of Charge (48h time series)
   - Charge/Discharge vs Pool Price (dual-axis)
   - Energy Source Mix (pie chart)

2. **Curtailment (4 charts)**
   - Hourly Curtailment Gap (line chart)
   - Monthly Curtailment Profile (grouped bar)
   - Event Duration Distribution (bar chart)
   - Hourly Wind Profile (line chart)

3. **Network and Fiber (1 chart)**
   - Latency Threshold Comparison (NOT AESO data)

4. **ROI (3 charts)**
   - CAPEX Breakdown (NOT direct AESO data)
   - Cumulative Cash Position (uses AESO for revenue calc)
   - Annual P&L Lines (uses AESO for revenue calc)

**AESO-Dependent Charts:** 7 out of 11 charts

---

## What We Need from AESO API

### Critical APIs (Must Have)

#### 1. Pool Price Report
- **Endpoint:** `GET /v1.1/price/poolPrice`
- **Why:** Foundation for curtailment detection and battery arbitrage
- **Data Volume:** 12-24 months historical, then hourly updates
- **Key Fields:**
  - `begin_datetime_mpt` - Timestamp (Mountain Prevailing Time)
  - `pool_price` - Price in CAD/MWh
  - `forecast_pool_price` - Optional, for predictive features

**Used By:** 5 charts (Battery Power vs Price, Curtailment Gap, ROI metrics)

---

#### 2. Metered Volume Report
- **Endpoint:** `GET /v1/meteredvolume/details`
- **Why:** Actual wind generation to calculate curtailment
- **Data Volume:** 12-24 months for specific wind asset(s)
- **Key Fields:**
  - `asset_id` - Wind farm identifier
  - `begin_datetime_mpt` - Timestamp
  - `metered_volume_mwh` - Actual generation

**Used By:** 4 charts (Energy Mix, Curtailment Gap, Event Duration, Monthly Profile)

---

#### 3. Asset List
- **Endpoint:** `GET /v1/assetlist`
- **Why:** Get wind farm capacity for curtailment calculations
- **Data Volume:** One-time fetch, ~quarterly updates
- **Key Fields:**
  - `asset_id` - Asset identifier
  - `asset_name` - Human-readable name
  - `capacity_mw` - Maximum capacity
  - `asset_type` - Filter for 'WIND'

**Used By:** All curtailment calculations (capacity baseline)

---

### Secondary APIs (Nice to Have)

#### 4. Current Supply Demand Assets
- **Endpoint:** `GET /v2/csd/generation/assets/current`
- **Why:** Real-time generation monitoring
- **Frequency:** Poll every 5-15 minutes for live dashboards

#### 5. System Marginal Price Report
- **Endpoint:** `GET /v1.1/price/systemMarginalPrice`
- **Why:** Alternative price signal for optimization

---

## Implementation Roadmap

### Phase 1: API Access Setup (Week 1)
- [ ] Register at https://developer-apim.aeso.ca/signup
- [ ] Obtain API subscription key
- [ ] Test API connectivity with sample requests
- [ ] Store API key securely (environment variable)

### Phase 2: Historical Data Import (Week 1-2)
- [ ] Download bulk CSV files from AESO Data Requests page (2001-2024)
- [ ] Parse CSV data into database schema
- [ ] Fetch recent data (2025-present) via API to fill gap
- [ ] Validate data continuity and completeness

**Alternative:** Skip bulk CSV and fetch all via API (slower but simpler)

### Phase 3: Backend Implementation (Week 2-3)
- [ ] Update `AesoRepository` class:
  ```python
  # Replace mock data methods with API calls
  def get_pool_prices(start_date, end_date) -> List[PoolPrice]
  def get_metered_volumes(asset_id, start_date, end_date) -> List[MeteredVolume]
  def get_wind_assets() -> List[Asset]
  ```
- [ ] Implement API client with:
  - Retry logic for transient failures
  - Rate limiting/throttling
  - Response caching (hourly data doesn't change)
  - Error handling and logging

- [ ] Create curtailment calculation service:
  ```python
  def calculate_curtailment_gaps(
      pool_prices: List[PoolPrice],
      metered_volumes: List[MeteredVolume],
      asset_capacity_mw: float,
      price_threshold: float = 10.0
  ) -> List[CurtailmentGap]
  ```

### Phase 4: Frontend Integration (Week 3-4)
- [ ] Update TypeScript interfaces to match AESO data:
  ```typescript
  interface AesoHourlyMarketRecord {
    timestamp: string;  // ISO 8601
    poolPriceCadPerMWh: number;
    actualGenerationMWh: number;
  }
  ```
- [ ] Modify data loaders (`*/data.ts`) to call Python API
- [ ] Update type guards in `src/frontend/dashboard/guards.ts`
- [ ] Test all charts with real data

### Phase 5: Real-time Features (Week 4-5)
- [ ] Implement background polling service for Current Supply Demand API
- [ ] Add WebSocket or Server-Sent Events for live dashboard updates
- [ ] Create 48-hour rolling window for operational charts
- [ ] Add data freshness indicators to UI

---

## Technical Requirements

### Authentication
All AESO API calls require a subscription key:
```http
GET https://api.aeso.ca/report/v1.1/price/poolPrice?start_date=2026-01-01&end_date=2026-01-31
Ocp-Apim-Subscription-Key: YOUR_KEY_HERE
```

### Rate Limits
- **Free tier:** Effectively unlimited for public data
- **Best practice:** Cache responses, avoid redundant calls

### Data Formats
- **Request:** Query parameters (start_date, end_date in YYYY-MM-DD)
- **Response:** JSON with nested structure
- **Timestamps:** Two formats provided - UTC and Mountain Prevailing Time

### Storage Requirements
- **12 months of hourly data:**
  - Pool Prices: ~8,760 rows × 5 fields = ~350 KB
  - Metered Volumes: ~8,760 rows × 10 assets × 5 fields = ~3.5 MB
- **Total:** ~4 MB per year (minimal storage needs)

---

## Key Calculations

### Curtailment Gap
```
Curtailment occurs when:
  pool_price < threshold (e.g., $10/MWh) AND
  metered_volume_mwh < asset_capacity_mw

curtailment_gap_mwh = asset_capacity_mw - metered_volume_mwh
```

### Battery Charge/Discharge Decision
```
IF pool_price < $20/MWh:
  action = CHARGE at rated_power_mw
ELSE IF pool_price > $80/MWh:
  action = DISCHARGE at rated_power_mw
ELSE:
  action = IDLE
```

### Battery State of Charge
```
soc(t) = soc(t-1) + (charge_mw(t) × efficiency - discharge_mw(t)) / capacity_mwh
where efficiency = 0.85-0.90 (round-trip)
```

---

## Success Criteria

### Data Quality
- [ ] All timestamps in consistent timezone (recommend UTC internally)
- [ ] No gaps in hourly time series
- [ ] Curtailment events validated against known historical events
- [ ] Pool price data matches AESO public reports

### Performance
- [ ] Historical data loads in < 2 seconds
- [ ] Chart rendering in < 500ms
- [ ] Real-time updates every 5-15 minutes
- [ ] API response caching reduces duplicate calls

### User Experience
- [ ] All 7 AESO-dependent charts display real data
- [ ] Data freshness indicators show last update time
- [ ] Graceful degradation if API unavailable (show cached/stale data with warning)
- [ ] Loading states for slow network conditions

---

## Risks and Mitigations

### Risk 1: API Availability
**Impact:** Charts cannot load if AESO API is down  
**Mitigation:** 
- Cache recent data in local database
- Fall back to cached data with staleness warning
- Monitor API uptime, alert on failures

### Risk 2: Data Lag
**Impact:** Settlement lag means current hour not available  
**Mitigation:**
- Document expected ~1 hour lag
- Use forecast data for current hour if available
- Show provisional status for recent data

### Risk 3: Asset ID Identification
**Impact:** Need to identify specific wind farm asset IDs  
**Mitigation:**
- Use Asset List API to browse available assets
- Filter by `asset_type = 'WIND'` and location
- May need to contact wind farm operator for exact asset mapping

---

## Next Immediate Steps

1. **Register for API access** (5 minutes)
2. **Test Pool Price API** with sample date range (15 minutes)
3. **Identify target wind asset(s)** using Asset List API (30 minutes)
4. **Update AesoRepository** with real API calls (2-4 hours)
5. **Test curtailment calculation** with 1 week of real data (1 hour)

---

**Related Documentation:**
- `AESO_API_MAPPING.md` - Complete API reference
- `AESO_API_TO_CHARTS_MAPPING.md` - Detailed chart-to-API mapping (this doc's companion)
- `voltedge_data_sources.md` - Overall data strategy

