# VoltEdge Calculation Service

Minimal Python backend for heavy numerical calculations using NumPy and SciPy.

## Installation

```bash
pip install -r requirements.txt
```

## Running the Service

```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /` - Health check
- `GET /gpu-specs` - Available GPU specifications
- `POST /calculate/dispatch` - Run dispatch simulation
- `POST /calculate/capex` - Calculate CAPEX
- `POST /calculate/financials` - Calculate financial metrics
- `POST /calculate/battery-sweep` - Battery sizing optimization
- `POST /calculate/npv` - Net Present Value
- `POST /calculate/irr` - Internal Rate of Return

## Architecture

This service handles ONLY heavy calculations:
- **dispatch.py**: NumPy-based dispatch simulation
- **gpu_config.py**: CAPEX calculations
- **financials.py**: IRR/NPV using SciPy
- **optimization.py**: Battery sizing sweeps
- **main.py**: Minimal FastAPI endpoints

All data persistence and business logic is handled by the TypeScript/Next.js frontend.
