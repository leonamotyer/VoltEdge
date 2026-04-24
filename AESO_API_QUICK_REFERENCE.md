# AESO API Quick Reference

**For:** Developers implementing AESO integration in VoltEdge  
**Date:** April 24, 2026

---

## Getting Started (5 Minutes)

1. **Register:** https://developer-apim.aeso.ca/signup
2. **Get API Key:** Check your email for subscription key
3. **Test:** 
   ```bash
   curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
     "https://api.aeso.ca/report/v1.1/price/poolPrice?start_date=2026-04-01&end_date=2026-04-07"
   ```

---

## Essential Endpoints

### Pool Prices (MOST IMPORTANT)
```
GET https://api.aeso.ca/report/v1.1/price/poolPrice
  ?start_date=2026-04-01
  &end_date=2026-04-07
  
Returns: Hourly pool prices in CAD/MWh (2001-present)
```

### Metered Volumes (CRITICAL FOR CURTAILMENT)
```
GET https://api.aeso.ca/report/v1/meteredvolume/details
  ?start_date=2026-04-01
  &end_date=2026-04-07
  
Returns: Hourly generation by asset (2001-present)
```

### Asset List (ONE-TIME SETUP)
```
GET https://api.aeso.ca/report/v1/assetlist

Returns: All AESO assets with capacities
Filter: fuel_type = "WIND" for wind farms
```

### Real-time Generation (OPTIONAL)
```
GET https://api.aeso.ca/report/v2/csd/generation/assets/current

Returns: Current output of all assets >5MW
Poll: Every 5-15 minutes for live dashboards
```

---

## Key Response Fields

### Pool Price
```json
{
  "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
  "pool_price": 45.23,
  "forecast_pool_price": 47.10
}
```

### Metered Volume
```json
{
  "begin_datetime_mpt": "2026-04-24T08:00:00-06:00",
  "asset_id": "WIND123",
  "metered_volume": 42.5
}
```

### Asset
```json
{
  "asset_id": "WIND123",
  "asset_name": "Example Wind Farm",
  "fuel_type": "WIND",
  "maximum_capability": 150.0
}
```

---

## Curtailment Calculation (30 Seconds)

```python
# Step 1: Get wind asset capacity
asset_capacity_mw = 150.0  # From Asset List API

# Step 2: For each hour, calculate curtailment
for hour in data:
    pool_price = hour["pool_price"]
    metered_mwh = hour["metered_volume"]
    
    # Curtailment occurs when price is low and generation < capacity
    if pool_price < 10.0:  # Threshold for curtailment
        curtailment_gap = asset_capacity_mw - metered_mwh
    else:
        curtailment_gap = 0.0
```

---

## Common Queries

### "Show me last week's curtailment events"
```python
1. GET pool prices for last 7 days
2. GET metered volumes for target wind asset
3. Calculate: gap = capacity - metered WHERE price < $10/MWh
4. Filter: WHERE gap > 0
```

### "What's the current wind farm output?"
```python
1. GET /v2/csd/generation/assets/current
2. Filter: asset_id = "YOUR_WIND_ASSET"
3. Return: output_mw, mc_capability_mw
```

### "Calculate battery arbitrage revenue"
```python
1. GET pool prices for analysis period
2. Simulate:
   - Charge when price < $20/MWh
   - Discharge when price > $80/MWh
3. Calculate: revenue = Σ(discharge_mwh × high_price - charge_mwh × low_price)
4. Apply: 85% round-trip efficiency
```

---

## Data Ranges

| API | Earliest Date | Latest Date | Lag |
|-----|---------------|-------------|-----|
| Pool Prices | 2001-01-01 | ~1 hour ago | ~1 hr |
| Metered Volumes | 2001-01-01 | Last month | ~1 month |
| Asset List | Current | Current | Real-time |
| Current Supply Demand | Current | Current | Real-time |

---

## Error Handling

### API Returns 401 Unauthorized
**Cause:** Invalid or missing API key  
**Fix:** Check `Ocp-Apim-Subscription-Key` header

### API Returns 400 Bad Request
**Cause:** Invalid date format  
**Fix:** Use YYYY-MM-DD format for dates

### API Returns Empty Results
**Cause:** No data for requested asset/date range  
**Fix:** 
- Verify asset_id exists (check Asset List)
- Check date range is within available data

### Response Too Large / Timeout
**Cause:** Requesting too much data at once  
**Fix:** 
- Limit to 1-2 weeks per request
- Use bulk CSV for large historical downloads

---

## VoltEdge Chart Requirements

| Chart | APIs Needed | Key Fields |
|-------|-------------|------------|
| Battery Power vs Price | Pool Prices | `pool_price`, `timestamp` |
| SOC Time Series | Pool Prices | Same + battery logic |
| Curtailment Gap | Pool Prices + Metered Volumes + Asset List | `pool_price`, `metered_volume`, `capacity` |
| Energy Mix | Metered Volumes | `metered_volume` per source |
| Event Duration | Pool Prices + Metered Volumes | Identify continuous curtailment periods |

---

## Best Practices

### DO
✅ Use UTC internally, convert to MPT for display  
✅ Cache API responses (hourly data doesn't change)  
✅ Handle API errors gracefully (network issues, rate limits)  
✅ Use bulk CSV for initial historical data (faster than API)  
✅ Document expected ~1 hour data lag for users  

### DON'T
❌ Request same data repeatedly (cache it!)  
❌ Mix UTC and MPT timestamps (choose one)  
❌ Fetch months of data in single API call (paginate)  
❌ Hardcode asset IDs (use Asset List API to discover)  
❌ Assume current hour data is available (settlement lag)  

---

## Complete Documentation

- **`AESO_API_MAPPING.md`** - Full API reference with all endpoints
- **`AESO_API_TO_CHARTS_MAPPING.md`** - Detailed chart-to-API mapping
- **`AESO_API_IMPLEMENTATION_SUMMARY.md`** - Implementation roadmap
- **`AESO_API_QUICK_REFERENCE.md`** - This document

---

## Support

- **AESO Developer Portal:** https://developer-apim.aeso.ca/
- **AESO Support:** Via contact form on developer portal
- **VoltEdge Docs:** See related documentation above

**Version:** 1.0 | **Date:** April 24, 2026

