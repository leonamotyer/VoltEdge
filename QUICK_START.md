# Quick Start: Testing Multi-Year Financial Modeling

## Prerequisites
- Python 3.11 or higher
- pip package manager

## Step-by-Step Testing

### 1. Install Dependencies (First Time Only)
```bash
cd src/backend
pip install -r requirements.txt
```

This installs:
- numpy 1.26.4 (numerical operations)
- scipy 1.12.0 (IRR calculation)
- All existing dependencies (FastAPI, pandas, etc.)

### 2. Run Unit Tests
```bash
cd src/backend
python test_npv_irr.py
```

**What This Tests**:
- NPV calculation with known cash flows
- IRR calculation (verifies NPV at IRR ≈ 0)
- 10-year cash flow projection with GPU degradation and OPEX escalation

**Expected Result**:
```
✓ All tests passed!
```

### 3. Start API Server
```bash
cd src/backend
uvicorn src.main:app --reload --port 8000
```

Server will start at: http://localhost:8000

### 4. Test API Endpoint

**Option A: Using Swagger UI** (Recommended)
1. Open http://localhost:8000/docs
2. Find `POST /api/financials/npv-irr`
3. Click "Try it out"
4. Use this sample request:
```json
{
  "gpu_mw": 1.0,
  "gpu_type": "RTX 5090",
  "batt_mwh": 5.0,
  "batt_p_mw": 5.0,
  "grid_cap_mw": 2.0,
  "btf_cap_mw": 0.0,
  "btf_price": 0.0,
  "curt_price": 10.0,
  "discount_rate": 0.08,
  "project_life": 12,
  "eta_c": 0.95,
  "eta_d": 0.95
}
```
5. Click "Execute"
6. Check response includes `npv`, `irr`, `cash_flows`, `yearly_details`

**Option B: Using curl**
```bash
curl -X POST http://localhost:8000/api/financials/npv-irr \
  -H "Content-Type: application/json" \
  -d '{
    "gpu_mw": 1.0,
    "gpu_type": "RTX 5090",
    "batt_mwh": 5.0,
    "batt_p_mw": 5.0,
    "grid_cap_mw": 2.0,
    "btf_cap_mw": 0.0,
    "btf_price": 0.0,
    "curt_price": 10.0,
    "discount_rate": 0.08,
    "project_life": 12,
    "eta_c": 0.95,
    "eta_d": 0.95
  }'
```

### 5. Verify Response

The response should contain:
- `npv`: Net Present Value (should be positive for profitable configs)
- `irr`: Internal Rate of Return (0.0 - 1.0, e.g., 0.15 = 15%)
- `cash_flows`: Array of 11 values (Year 0-10)
- `terminal_value`: Present value of terminal value
- `yearly_details`: Array of 10 objects with year-by-year breakdown

Example values for GPU=100 count, Battery=5MWh (from GAP plan):
- Cash flows should show Year 0 as large negative (CAPEX)
- Subsequent years should show positive cash flows
- NPV should be positive if the project is profitable

## What If Tests Fail?

### Import Error: No module named 'numpy' or 'scipy'
```
Solution: Run step 1 again (pip install -r requirements.txt)
```

### Import Error: No module named 'src'
```
Solution: Make sure you're in src/backend directory when running tests
```

### API Server Error: Port 8000 already in use
```
Solution: Use a different port:
uvicorn src.main:app --reload --port 8001
```

### API Error: 400 Bad Request
```
Solution: Check the request JSON matches the schema exactly
Common issues:
- Missing required fields
- Wrong GPU type (must be one of: "RTX 3090", "RTX 5090", "A6000", "PRO 6000")
- Negative values for MW/MWh fields
```

## Understanding the Results

### NPV (Net Present Value)
- **Positive NPV**: Project is profitable at the given discount rate
- **Negative NPV**: Project is not profitable at the given discount rate
- **Higher NPV**: More profitable project

### IRR (Internal Rate of Return)
- **IRR > discount_rate**: Project is profitable
- **IRR < discount_rate**: Project is not profitable
- **Typical range**: 5% - 20% for energy projects

### Cash Flows
- **Year 0**: Always negative (CAPEX investment)
- **Years 1-10**: Should be positive (revenue - operating costs)
- **Declining trend**: Normal due to GPU degradation

### Yearly Details
Check that:
- `capacity_factor` decreases over time (98%, 96%, 94%, ...)
- `opex_escalation_factor` increases over time (1.025, 1.051, 1.078, ...)
- `cash_flow_$` decreases slightly over time due to degradation

## Next Steps After Successful Testing

1. ✅ Unit tests pass
2. ✅ API server starts without errors
3. ✅ API endpoint returns valid NPV/IRR results

**Ready for Frontend Integration**:

