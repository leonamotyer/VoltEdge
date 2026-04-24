# VoltEdge

Demo front end for wind-site analytics: curtailment intelligence, load and storage sizing, and network/fiber latency checks. Built with **Next.js 15** (App Router), **React 19**, **TypeScript**, and **Recharts**.

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Next.js default port).

## Features

### CSV Configuration Upload

VoltEdge supports bulk configuration import via CSV files. Upload configuration files through the **Configuration Sidebar** to quickly populate GPU, Battery, and Grid Supply settings.

#### CSV Format

The CSV file must contain the following 29 columns in this exact order:

| Column Name | Type | Description | Valid Values / Range |
|------------|------|-------------|----------------------|
| `configuration_name` | string | Name for the configuration | Any descriptive text |
| **GPU Configuration (10 columns)** |
| `gpu_model` | string | GPU model type | `RTX 3090`, `RTX 5090`, `A6000`, `PRO 6000`, `Custom` |
| `number_of_gpus` | integer | Number of GPU units | > 0 |
| `rental_price_per_hour` | number | Rental price per GPU-hour (CAD) | ≥ 0 |
| `power_per_gpu_kw` | number | Power consumption per GPU (kW) | ≥ 0 |
| `utilization_pct` | number | Expected GPU utilization (%) | 0-100 |
| `gpu_purchase_cost_cad` | number | Purchase cost per GPU (CAD) | ≥ 0 |
| `system_lifetime_years` | integer | Financial horizon (years) | ≥ 1 |
| `discount_rate_pct` | number | Annual discount rate (%) | ≥ 0 |
| `fixed_annual_om_cad` | number | Fixed annual O&M (CAD/year) | ≥ 0 |
| `deployment_cost_cad` | number | Infrastructure deployment cost (CAD) | ≥ 0 |
| **Battery Configuration (9 columns)** |
| `include_battery` | boolean | Include battery storage | `true`, `false` |
| `battery_preset` | string | Battery sizing preset | `minimal`, `medium`, `large`, `custom` |
| `battery_size_mwh` | number | Battery capacity (MWh) | ≥ 0 |
| `battery_power_mw` | number | Battery power rating (MW) | ≥ 0 or empty |
| `round_trip_efficiency_pct` | number | Round-trip efficiency (%) | 0-100 |
| `battery_lifetime_years` | integer | Battery lifetime (years) | ≥ 1 |
| `battery_energy_cost_cad_per_kwh` | number | Battery energy cost (CAD/kWh) | ≥ 0 |
| `battery_power_system_cost_cad_per_kw` | number | Power system cost (CAD/kW) | ≥ 0 |
| `battery_annual_om_cad` | number | Annual O&M cost (CAD/year) | ≥ 0 |
| **Grid Supply Configuration (8 columns)** |
| `grid_power_limit_mw` | number | Grid import capacity (MW) | ≥ 0 |
| `grid_price_override_cad_per_mwh` | number | Override grid price (CAD/MWh) | ≥ 0 or empty |
| `btf_power_limit_mw` | number | Behind-the-fence capacity (MW) | ≥ 0 |
| `btf_price_cad_per_mwh` | number | BTF energy price (CAD/MWh) | ≥ 0 |
| `curtailment_value_cad_per_mwh` | number | Curtailment value (CAD/MWh) | ≥ 0 |
| `allow_partial_grid_supply` | boolean | Allow partial grid supply | `true`, `false` |
| `allow_partial_btf_supply` | boolean | Allow partial BTF supply | `true`, `false` |
| `price_escalation_rate_pct` | number | Annual price escalation (%) | ≥ 0 |
| `priority_rule` | string | Power source priority | `curtailment_first`, `grid_first`, `btf_first`, `balanced` |

#### Sample CSV

A sample configuration file is available at `src/backend/data/sample-configurations.csv` with 15 pre-configured scenarios including:

- Small test deployments
- Medium and large production configurations
- Budget-optimized setups
- High-availability enterprise configs
- Grid-free curtailment-only scenarios
- BTF-heavy configurations

**Example CSV rows:**

```csv
configuration_name,gpu_model,number_of_gpus,rental_price_per_hour,power_per_gpu_kw,utilization_pct,gpu_purchase_cost_cad,system_lifetime_years,discount_rate_pct,fixed_annual_om_cad,deployment_cost_cad,include_battery,battery_preset,battery_size_mwh,battery_power_mw,round_trip_efficiency_pct,battery_lifetime_years,battery_energy_cost_cad_per_kwh,battery_power_system_cost_cad_per_kw,battery_annual_om_cad,grid_power_limit_mw,grid_price_override_cad_per_mwh,btf_power_limit_mw,btf_price_cad_per_mwh,curtailment_value_cad_per_mwh,allow_partial_grid_supply,allow_partial_btf_supply,price_escalation_rate_pct,priority_rule
Small Test Deployment,RTX 3090,50,3.5,0.35,85,1500,10,8,50000,250000,true,minimal,0.5,,90,12,400,200,25000,0.5,75,0.25,45,25,true,true,2,curtailment_first
Medium Production - RTX 5090,RTX 5090,100,5.2,0.575,90,2800,12,8,125000,500000,true,medium,2.0,,90,12,400,200,75000,1.0,80,0.5,45,25,true,true,2,curtailment_first
```

#### Upload Instructions

1. Navigate to the configuration sidebar in the VoltEdge application
2. Look for the **"Upload Configuration"** section at the top
3. Click the upload button or drag-and-drop your CSV file
4. The application will validate and load the first row of configuration data
5. All three configuration forms (GPU, Battery, Grid Supply) will update automatically

#### Error Handling

The CSV uploader provides detailed error messages for:
- Invalid file types (only `.csv` files accepted)
- Missing required columns
- Invalid data types or values out of range
- Malformed CSV structure

All errors are displayed in the upload panel with specific column and validation information.

## Scripts

### Frontend (Next.js)

| Command | Description |
| -------- | ----------- |
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` | Production build (`.next/`) |
| `npm run start` | Run the production server locally |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

### Backend (Python)

```bash
# From src/backend/ directory
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

API documentation available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

See [src/backend/README.md](./src/backend/README.md) for full backend documentation.

## Project Structure

```
voltEdge/
├── src/
│   ├── app/              # Next.js App Router (routes only)
│   │   ├── curtailment/
│   │   ├── load-and-storage/
│   │   ├── network-and-fiber/
│   │   ├── roi/
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── backend/          # Python FastAPI backend
│   │   ├── src/
│   │   │   ├── main.py           # API entry point
│   │   │   ├── api/              # REST endpoints
│   │   │   ├── repositories/     # Data sources (AESO, SCADA, Turbine)
│   │   │   ├── analytics/        # Business logic & analytics
│   │   │   ├── models/           # Pydantic request/response schemas
│   │   │   └── mocks/            # Mock data generation
│   │   ├── data/                 # Static JSON data files
│   │   ├── tests/                # Pytest tests
│   │   └── requirements.txt      # Python dependencies
│   │
│   └── frontend/         # TypeScript UI layer
│       ├── components/   # Layout components (DashboardLayout, KpiGrid, etc.)
│       ├── ui/          # AppShell, charts, KPI cards, hooks
│       └── dashboard/   # Type guards & validation
│
├── ARCHITECTURE.md       # Architecture documentation
└── package.json         # Node.js dependencies
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural patterns and design principles.

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source this repo.
