# AESO API Mapping Documentation

**Last Updated:** April 24, 2026  
**Status:** Complete - All 7 target APIs documented  
**Use Case:** Energy market analysis and curtailment assessment in Alberta

---

## Overview

The AESO (Alberta Electric System Operator) provides public REST APIs through an Azure API Management (APIM) gateway, offering free access to market data, generation statistics, and operational information critical for curtailment analysis and energy market assessment.

---

## Authentication & Access

### Registration
- **Developer Portal:** https://developer-apim.aeso.ca/
- **Sign-up URL:** https://developer-apim.aeso.ca/signup
- **Cost:** Free
- **Approval:** Automatic upon registration

### Authentication Method
All APIs use Azure APIM Subscription Key:
```http
Header: Ocp-Apim-Subscription-Key
Value: <your-subscription-key>
```

---

## API Base Information

| Property | Value |
|----------|-------|
| **Base URL** | https://api.aeso.ca/report/ |
| **Gateway** | Azure APIM |
| **Format** | JSON |
| **Protocol** | HTTPS |

---

## API Endpoints Summary

### 1. Current Supply Demand API

**Endpoints:**
- `GET /v2/csd/summary/current` - Real-time aggregate supply/demand
- `GET /v2/csd/generation/assets/current` - Per-asset real-time output

**Data:** Real-time generation (>5MW assets), updated continuously

**Note:** v1 deprecated Sept 30, 2025; use v2

**Response Fields (Assets endpoint):**
```json
{
  "return": {
    "timestamp_utc": "2026-04-24T14:30:00Z",
    "timestamp_mpt": "2026-04-24T08:30:00-06:00",
    "assets": [
      {
        "asset_id": "WIND123",
        "asset_name": "Example Wind Farm",
        "fuel_type": "WIND",
        "output_mw": 42.5,
        "mc_capability_mw": 150.0,
        "net_to_grid_mw": 42.3
      }
    ]
  }
}
```

---

### 2. Pool Price Report API

**Endpoint:**
- `GET /v1.1/price/poolPrice`

**Parameters:**
- `start_date` (YYYY-MM-DD, required) - Start of date range
- `end_date` (YYYY-MM-DD, required) - End of date range (inclusive)

**Response Fields:**
```json
{
  "return": {
    "Pool Price Report": [
      {
        "begin_datetime_utc": "2026-04-24T14:00:00Z",
        "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
        "pool_price": 45.23,
        "forecast_pool_price": 47.10,
        "rolling_30_day_avg": 52.15
      }
    ]
  }
}
```

**Historical Data:** January 1, 2001 to present (hourly)

**Critical for Curtailment:** Pool prices directly correlate with curtailment events (negative/low prices indicate oversupply)

---

### 3. System Marginal Price Report API

**Endpoints:**
- `GET /v1.1/price/systemMarginalPrice` - Historical SMP
- `GET /v1.1/price/systemMarginalPrice/current` - Current SMP

**Parameters (historical):**
- `start_date`, `end_date` (YYYY-MM-DD)

**Data:** System marginal prices for reserve operations (hourly, 2001-present)

**Response Fields:**
```json
{
  "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
  "system_marginal_price": 48.50
}
```

---

### 4. Actual Forecast Report API

**Endpoint:**
- `GET /v1/load/albertaInternalLoad`

**Parameters:** `start_date`, `end_date`

**Response Fields:**
```json
{
  "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
  "actual_posted_pool_demand": 9245.0,
  "forecast_pool_demand": 9180.0
}
```

**Data:** Actual vs. forecasted Alberta demand (hourly, ~2010-present)

---

### 5. Asset List API

**Endpoint:**
- `GET /v1/assetlist`

**Response Fields:**
```json
{
  "return": {
    "Asset List": [
      {
        "asset_id": "WIND123",
        "asset_name": "Example Wind Farm",
        "fuel_type": "WIND",
        "maximum_capability": 150.0,
        "pool_participant_name": "Company ABC",
        "commissioned_date": "2020-06-15",
        "retirement_date": null
      }
    ]
  }
}
```

**Data:** Complete registry of AIES assets >5MW (point-in-time snapshot)

**Use Case:** Identify wind farm assets and their maximum capacities for curtailment calculations

---

### 6. Metered Volume Report API

**Endpoint:**
- `GET /v1/meteredvolume/details`

**Parameters:** 
- `start_date`, `end_date` (required, YYYY-MM-DD)
- `asset_id` (optional filter for specific asset)

**Response Fields:**
```json
{
  "return": {
    "Metered Volume Details": [
      {
        "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
        "asset_id": "WIND123",
        "asset_name": "Example Wind Farm",
        "metered_volume": 42.5,
        "pool_participant_name": "Company ABC"
      }
    ]
  }
}
```

**Historical Data:** January 1, 2001 to present (hourly)

**Use:** Asset-level performance, wind curtailment detection. This is THE critical API for identifying actual wind generation.

---

### 7. Energy Merit Order Report API

**Endpoint:**
- `GET /v1/meritOrder/energy`

**Parameters:** `start_date`, `end_date`

**Response Fields:**
```json
{
  "snapshot_datetime_utc": "2026-04-24T14:00:00Z",
  "asset_id": "WIND123",
  "asset_name": "Example Wind Farm",
  "offer_price": 0.00,
  "offered_volume": 150.0,
  "merit_order_rank": 1
}
```

**Data:** Generator bids and dispatch order (multiple snapshots/day)

---

## Timestamp Handling

### Two Timestamp Representations

AESO APIs return both UTC and Mountain Prevailing Time (MPT):

```json
"begin_datetime_utc": "2026-04-24T14:30:00Z"
"begin_datetime_mpt": "2026-04-24T08:30:00-06:00"
```

**MPT Offsets:**
- **Standard Time (Nov 1 - Mar 8):** UTC-7:00
- **Daylight Saving (Mar 8 - Nov 1):** UTC-6:00

**Query Format:** Always use `YYYY-MM-DD` (no time component)

**Recommendation:** Use UTC internally, convert to MPT only for display to Alberta stakeholders

---

## Historical Data Availability

### Via API
- **Pool Prices:** January 1, 2001 to ~1 hour ago (hourly)
- **Metered Volumes:** January 1, 2001 to previous month-end (finalized by 5th of following month)
- **SMP/Load:** ~2010 to present (hourly)
- **Current Supply Demand:** Real-time only (no historical via this endpoint)

### Bulk Files (Alternative to API)
For large historical datasets, AESO provides bulk CSV downloads:

- **Location:** https://www.aeso.ca/market/market-and-system-reporting/data-requests/
- **Files Available:**
  - Hourly Metered Volumes 2001-2009
  - Hourly Metered Volumes 2010-2019
  - Hourly Metered Volumes 2020-2025
  - Pool Prices and Alberta Internal Load 2001-2025

**Advantage:** Faster initial data loading (download CSV vs. thousands of API calls)
**Disadvantage:** Need to parse CSV and handle incremental updates via API

**Data Lag:** Current month is provisional; finalized data available by 5th of following month

---

## Rate Limits & Access

- **Cost:** Free for all public APIs
- **Rate Limits:** No published limits; effectively unlimited for reasonable use
- **HTTPS:** Required
- **Data Settlement Lag:** ~1 hour for most real-time data

---

## API Version Status

### Current Supply Demand API Transition

| Version | Endpoint | Status | Action Required |
|---------|----------|--------|-----------------|
| v1 | `/v1/csd/summary/current` | **DEPRECATED** | Migrate by Sept 30, 2025 |
| v1 | `/v1/csd/generation/assets/current` | **DEPRECATED** | Migrate by Sept 30, 2025 |
| v2 | `/v2/csd/summary/current` | **ACTIVE** | Use this version |
| v2 | `/v2/csd/generation/assets/current` | **ACTIVE** | Use this version |

**Changes in v2:** Minor field name changes in response structure

### Other APIs
All other APIs are on stable versions with no announced deprecations as of April 2026.

---

## Implementation Examples

### Python: Fetch 7-Day Pool Prices

```python
import requests
from datetime import datetime, timedelta

API_KEY = "your-subscription-key"
BASE_URL = "https://api.aeso.ca/report"

def get_pool_prices(days=7):
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)

    headers = {"Ocp-Apim-Subscription-Key": API_KEY}
    params = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d")
    }

    response = requests.get(
        f"{BASE_URL}/v1.1/price/poolPrice",
        headers=headers,
        params=params,
        timeout=30
    )
    response.raise_for_status()

    data = response.json()
    return data["return"]["Pool Price Report"]

# Usage
prices = get_pool_prices(7)
for record in prices:
    print(f"{record['begin_datetime_mpt']}: ${record['pool_price']:.2f}/MWh")
```

---

### Python: Fetch Metered Volumes for Wind Asset

```python
def get_wind_metered_volumes(asset_id, start_date, end_date):
    headers = {"Ocp-Apim-Subscription-Key": API_KEY}
    params = {
        "start_date": start_date,  # "YYYY-MM-DD"
        "end_date": end_date,
        # Note: API may not support filtering by asset_id
        # You may need to fetch all and filter client-side
    }

    response = requests.get(
        f"{BASE_URL}/v1/meteredvolume/details",
        headers=headers,
        params=params,
        timeout=60  # Longer timeout for large datasets
    )
    response.raise_for_status()

    all_volumes = response.json()["return"]["Metered Volume Details"]

    # Filter for specific asset
    return [v for v in all_volumes if v["asset_id"] == asset_id]
```

---

### TypeScript: Type Definitions

```typescript
// Pool Price Response
interface AesoPoolPriceRecord {
  begin_datetime_utc: string;
  begin_datetime_mpt: string;
  pool_price: number;
  forecast_pool_price: number;
  rolling_30_day_avg: number;
}

// Metered Volume Response
interface AesoMeteredVolumeRecord {
  begin_datetime_mpt: string;
  asset_id: string;
  asset_name: string;
  metered_volume: number;
  pool_participant_name: string;
}

// Asset List Response
interface AesoAsset {
  asset_id: string;
  asset_name: string;
  fuel_type: string;
  maximum_capability: number;
  pool_participant_name: string;
  commissioned_date: string;
  retirement_date: string | null;
}

// Current Supply Demand Response
interface AesoCSDAsset {
  asset_id: string;
  asset_name: string;
  fuel_type: string;
  output_mw: number;
  mc_capability_mw: number;
  net_to_grid_mw: number;
}
```

---

## Key Resources

| Resource | URL |
|----------|-----|
| **Developer Portal** | https://developer-apim.aeso.ca/ |
| **API Documentation** | https://www.aeso.ca/market/market-and-system-reporting/aeso-application-programming-interface-api |
| **Data Request Files** | https://www.aeso.ca/market/market-and-system-reporting/data-requests/ |
| **API Changes Notice** | https://www.aeso.ca/market/market-updates/2025/notification-of-api-changes |
| **Swagger/OpenAPI (deprecated)** | ~~https://api.aeso.ca/swagger~~ (shut down March 31, 2025) |

---

## For VoltEdge Curtailment Analysis

### Essential APIs (Priority Order)

1. **Pool Price Report** - Foundation for all curtailment and arbitrage analysis
2. **Metered Volume Report** - Actual wind generation to identify curtailment
3. **Asset List** - Wind farm capacities for curtailment gap calculations
4. **Current Supply Demand** - Real-time monitoring (optional but useful)

### Data Strategy

**Historical Baseline:**
- Option A: Download bulk CSV files (2001-2024), use API for 2025+
- Option B: Fetch all via API (simpler but slower initial load)

**Real-time Updates:**
- Poll Current Supply Demand API every 5-15 minutes
- Fetch latest Pool Prices hourly (after settlement lag)
- Maintain 48-hour rolling window for operational dashboards

**Timezone Handling:**
- Store all data in UTC internally
- Convert to Mountain Prevailing Time only for UI display
- Be aware of DST transitions (March and November)

---

## Common Pitfalls

### 1. Asset ID Confusion
**Problem:** Asset IDs are alphanumeric strings, not human-readable names
**Solution:** Use Asset List API to map asset_id ↔ asset_name

### 2. Data Settlement Lag
**Problem:** Current hour data may not be available for ~1 hour
**Solution:** Document expected lag; use forecast values if available

### 3. Timestamp Timezone Mistakes
**Problem:** Mixing UTC and MPT can cause off-by-7-hours errors
**Solution:** Always parse with timezone, convert consistently

### 4. Missing Data Periods
**Problem:** Some assets have gaps in metered volume data
**Solution:** Implement gap detection and interpolation strategy

### 5. Large Query Results
**Problem:** Fetching months of metered volumes for all assets = huge response
**Solution:**
- Limit date ranges to days/weeks per request
- Filter by specific asset IDs if API supports it
- Use bulk CSV files for initial historical load

---

## Next Steps for VoltEdge Integration

1. **Register for API Access** (5 min)
   - Visit https://developer-apim.aeso.ca/signup
   - Verify email and obtain subscription key

2. **Test API Connectivity** (15 min)
   - Test Pool Price API with 1-week date range
   - Verify response structure matches documentation

3. **Identify Wind Assets** (30 min)
   - Fetch Asset List
   - Filter for fuel_type = "WIND"
   - Identify target wind farm(s) for analysis

4. **Fetch Sample Data** (1 hour)
   - Get 1 month of pool prices
   - Get 1 month of metered volumes for target asset
   - Validate data quality and completeness

5. **Implement AesoRepository** (4 hours)
   - Update `src/backend/src/repositories/aeso.py`
   - Replace mock data with API calls
   - Add error handling and caching

---

**Version:** 1.0
**Date:** April 24, 2026
**Next Review:** October 2026

**Related Documentation:**
- **`AESO_API_TO_CHARTS_MAPPING.md`** - Maps AESO APIs to specific VoltEdge charts
- **`AESO_API_IMPLEMENTATION_SUMMARY.md`** - Executive summary and implementation roadmap
- **`voltedge_data_sources.md`** - Overall data source strategy

