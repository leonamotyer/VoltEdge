# voltEdge Architecture

## Overview

voltEdge is a Next.js 15 dashboard for wind energy analytics, built with strict separation of concerns and type safety.

## Directory Structure

```
src/
├── app/                      # Next.js App Router (routes only)
│   ├── curtailment/         # Curtailment intelligence page
│   │   ├── page.tsx        # Route component
│   │   └── data.ts         # Data loader
│   ├── load-and-storage/   # Battery sizing page
│   ├── network-and-fiber/  # Network latency page
│   ├── roi/                # ROI analysis page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
│
├── backend/                 # Python FastAPI backend
│   ├── src/
│   │   ├── main.py         # API entry point
│   │   ├── api/            # REST API endpoints
│   │   │   ├── curtailment.py
│   │   │   ├── load_storage.py
│   │   │   ├── network.py
│   │   │   ├── dispatch.py
│   │   │   └── optimization.py
│   │   ├── repositories/   # Data sources
│   │   │   ├── aeso.py    # AESO market data
│   │   │   ├── scada.py   # Site telemetry
│   │   │   └── turbine.py # Turbine database
│   │   ├── analytics/      # Business logic
│   │   │   ├── site_analytics.py
│   │   │   ├── financials.py
│   │   │   ├── optimization.py
│   │   │   ├── dispatch.py
│   │   │   └── gpu_config.py
│   │   ├── models/         # Pydantic schemas
│   │   │   ├── requests.py
│   │   │   └── responses.py
│   │   └── mocks/          # Mock data generation
│   │       └── generate_demo.py
│   ├── data/               # Static JSON data
│   ├── tests/              # Pytest tests
│   └── requirements.txt    # Python dependencies
│
└── frontend/               # TypeScript UI layer
    ├── components/         # Layout components
    │   ├── DashboardLayout.tsx
    │   ├── DataBoundPage.tsx
    │   ├── KpiGrid.tsx
    │   └── PanelBento.tsx
    ├── ui/                 # UI components
    │   ├── AppShell.tsx
    │   ├── chartTheme.ts
    │   ├── components/     # Primitives (KpiCard, charts, etc.)
    │   └── hooks/          # React hooks
    ├── dashboard/          # Type guards & validation
    │   └── guards.ts
    └── demoSite.ts         # Demo site configuration
```

## Core Principles

### 1. **Strict Separation of Concerns**
- `app/` contains **only** Next.js routes and page components
- `backend/` (Python) contains **all** data access and business logic
- `frontend/` (TypeScript) contains **all** UI components and utilities
- No business logic in route files

### Architecture Layers
- **Frontend (Next.js)**: Server-side rendered React pages
- **API (FastAPI)**: RESTful Python backend for analytics and data
- **Data Layer**: Repositories abstract data sources (AESO, SCADA, Turbine)
- **Analytics Layer**: Business logic and transformations in Python
- **UI Layer**: TypeScript React components with type safety

### 2. **Repository Pattern**
Each data source has a repository class implementing a standard interface.

**Python Backend** (`src/backend/src/repositories/`):
```python
# repositories/aeso.py
class AesoRepository:
    def get_hourly_market(self) -> List[AesoMarketRecord]:
        # Data access logic
        pass
```

**TypeScript Frontend** (calling the API):
```typescript
// app/curtailment/data.ts
export async function loadCurtailmentData() {
  const response = await fetch(`${API_URL}/api/curtailment/view`);
  return await response.json();
}
```

**Benefits**: Testable, swappable implementations, clear separation between Python backend and Next.js frontend

### 3. **Layout Component Composition**
Pages compose from atomic layout components:

```typescript
export default function DashboardPage() {
  return (
    <DataBoundPage loader={loadData} guard={isValidData} routeLabel="Dashboard">
      {(data) => (
        <DashboardLayout title="Dashboard">
          <KpiGrid>
            <KpiCard ... />
          </KpiGrid>
          <PanelBento>
            <section className="panel panel--chart">...</section>
          </PanelBento>
        </DashboardLayout>
      )}
    </DataBoundPage>
  );
}
```

**Components**:
- `DataBoundPage` - Handles data loading, validation, and error states
- `DashboardLayout` - Standard page wrapper with title/subtitle
- `KpiGrid` - Grid layout for KPI cards
- `PanelBento` - Container for chart panels

### 4. **Type Safety**
- TypeScript strict mode enabled
- Type guards for runtime validation (`guards.ts`)
- Repository interfaces for compile-time contracts
- Generic components for type inference

### 5. **Data Flow**

```
Next.js Route Page (TypeScript)
  ↓ calls
Data Loader (data.ts)
  ↓ HTTP request
Python FastAPI Backend
  ↓ endpoint
API Route (api/curtailment.py)
  ↓ uses
Repository (repositories/aeso.py, scada.py, turbine.py)
  ↓ returns raw data
Analytics Layer (analytics/site_analytics.py)
  ↓ transforms data
Pydantic Response Model (models/responses.py)
  ↓ JSON response
Data Loader receives data
  ↓ validates via
Type Guard (guards.ts)
  ↓ renders in
Page Component
```

## Key Files

### Routes (`src/app/`)
- `*/page.tsx` - Route components (minimal, delegates to loaders)
- `*/data.ts` - Data loading functions (calls Python API)

### Python Backend (`src/backend/src/`)
- `main.py` - FastAPI application entry point
- `api/*.py` - REST API endpoint implementations
- `repositories/*.py` - Data source implementations (AESO, SCADA, Turbine)
- `analytics/*.py` - Business logic and analytics engines
- `models/requests.py` - Pydantic request schemas
- `models/responses.py` - Pydantic response schemas
- `mocks/generate_demo.py` - Mock data generation

### TypeScript Frontend (`src/frontend/`)
- `components/` - Layout components (DashboardLayout, KpiGrid, etc.)
- `ui/components/` - UI primitives (KpiCard, charts)
- `ui/hooks/` - React hooks (useMediaQuery, etc.)
- `dashboard/guards.ts` - Runtime type validation

## Design Patterns

### Repository Pattern
Abstracts data access behind interfaces for testability and flexibility. Implemented in both Python (backend) and TypeScript (frontend API calls).

### API-First Architecture
- **Backend**: Python FastAPI serves RESTful JSON APIs
- **Frontend**: Next.js Server Components fetch data from Python API
- **Contracts**: Pydantic models define API schemas, TypeScript types mirror them

### Render Props (DataBoundPage)
Validates data before rendering, providing type-safe props to children.

### Composition over Inheritance
Small, focused components composed into larger layouts.

### Domain Co-location
Types live with the domain that owns them (repository types with repositories, chart types with charts).

## Python Backend Integration

### API Communication
```typescript
// Frontend calls Python backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function loadCurtailmentData() {
  const response = await fetch(`${API_URL}/api/curtailment/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  return await response.json();
}
```

### Environment Variables
- `NEXT_PUBLIC_API_URL` - Python backend URL (default: http://localhost:8000)

### Development Setup
1. Start Python backend: `uvicorn src.main:app --reload --port 8000` (from `src/backend/`)
2. Start Next.js frontend: `npm run dev` (from root)
3. Frontend automatically connects to backend via `NEXT_PUBLIC_API_URL`

## Testing Strategy

### Backend (Python)
- **Unit tests**: Pytest for business logic and repositories
- **Integration tests**: API endpoint testing with FastAPI TestClient
- **Mock data**: Synthetic data generation for consistent testing

### Frontend (TypeScript)
- **Unit tests**: Vitest for component logic
- **Type guards**: Runtime validation ensures API contract compliance
- **Component tests**: React component testing

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Recharts
- **Testing**: Vitest
- **Styling**: CSS modules + global styles

### Backend
- **Framework**: FastAPI (async Python web framework)
- **Language**: Python 3.11+
- **Data Processing**: NumPy, Pandas
- **Validation**: Pydantic v2
- **Testing**: Pytest
- **API Documentation**: Auto-generated OpenAPI (Swagger/ReDoc)

## Best Practices

### General
1. **Keep routes thin** - Delegate to data loaders and API calls
2. **Separation of concerns** - Backend handles analytics, frontend handles presentation
3. **Type safety** - Pydantic schemas (backend) + TypeScript (frontend)
4. **Use type guards** - Validate API responses at boundaries
5. **Test business logic** - Focus tests on analytics and transformations

### Backend (Python)
- **Use Pydantic models** - Validate all requests and responses
- **Async/await** - Use async functions for I/O operations
- **Repository pattern** - Abstract data sources for testability
- **Document APIs** - FastAPI auto-generates OpenAPI docs

### Frontend (TypeScript)
- **Compose layouts** - Build pages from reusable components
- **Type guards** - Validate API data before use
- **Server components** - Leverage Next.js 15 Server Components
- **Error boundaries** - Handle API failures gracefully
