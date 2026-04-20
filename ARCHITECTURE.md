# voltEdge Architecture

## Overview

voltEdge is a Next.js 15 dashboard for wind energy analytics, built with strict separation of concerns and type safety.

## Directory Structure

```
src/
├── app/                      # Next.js App Router (routes only)
│   ├── curtailment/
│   ├── load-and-storage/
│   ├── network-and-fiber/
│   ├── roi/
│   ├── layout.tsx
│   └── globals.css
│
└── lib/                      # Business logic (no routing)
    ├── backend/              # Data layer
    │   ├── aeso/            # AESO market data repository
    │   ├── scada/           # Site telemetry repository
    │   ├── turbine/         # Turbine database repository
    │   ├── derived/         # Analytics & transformations
    │   ├── dashboardMocks/  # Chart mock data
    │   ├── repositories/    # Repository interfaces
    │   └── transforms/      # Data-to-chart transformations
    │
    └── frontend/            # UI layer
        ├── components/      # Reusable layout components
        ├── ui/             # AppShell, charts, KPI cards
        └── dashboard/      # Type guards & validation
```

## Core Principles

### 1. **Strict Separation of Concerns**
- `app/` contains **only** Next.js routes and page components
- `lib/backend/` contains **all** data access and business logic
- `lib/frontend/` contains **all** UI components and utilities
- No business logic in route files

### 2. **Repository Pattern**
Each data source has a repository class implementing a standard interface:

```typescript
// Interface definition
export interface IAesoRepository {
  getDemoHourlyMarket(): AesoHourlyMarketRecord[];
  getExportSnapshot(): {...};
}

// Implementation
export class AesoRepository implements IAesoRepository {
  // Data access logic
}
```

**Benefits**: Testable, swappable implementations, clear contracts

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
Route Page
  ↓ calls
Data Loader (data.ts)
  ↓ uses
Repository (aesoRepository, scadaRepository, turbineRepository)
  ↓ returns
Raw Data
  ↓ transforms via
Analytics (siteAnalytics.ts)
  ↓ shapes via
Chart Models (chartModels.ts)
  ↓ validates via
Type Guard (guards.ts)
  ↓ renders in
Page Component
```

## Key Files

### Routes (`src/app/`)
- `*/page.tsx` - Route components (minimal, delegates to loaders)
- `*/data.ts` - Data loading functions (composes repositories)

### Backend (`src/lib/backend/`)
- `*/repository.ts` - Data source implementations
- `repositories/interfaces.ts` - Repository contracts
- `derived/siteAnalytics.ts` - Core analytics engine
- `transforms/chartModels.ts` - Data-to-chart transformations
- `dashboardMocks/` - Mock data for charts

### Frontend (`src/lib/frontend/`)
- `components/` - Layout components (DashboardLayout, KpiGrid, etc.)
- `ui/components/` - UI primitives (KpiCard, charts)
- `dashboard/guards.ts` - Runtime type validation

## Design Patterns

### Repository Pattern
Abstracts data access behind interfaces for testability and flexibility.

### Render Props (DataBoundPage)
Validates data before rendering, providing type-safe props to children.

### Composition over Inheritance
Small, focused components composed into larger layouts.

### Domain Co-location
Types live with the domain that owns them (repository types with repositories, chart types with charts).

## Testing Strategy

- **Unit tests**: Business logic (`siteAnalytics.test.ts`, `chartModels.test.ts`)
- **Integration tests**: Repository + analytics workflows
- **Type guards**: Runtime validation ensures data contracts

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Recharts
- **Testing**: Vitest
- **Styling**: CSS modules + global styles

## Best Practices

1. **Keep routes thin** - Delegate to data loaders and components
2. **Use type guards** - Validate external data at boundaries
3. **Implement interfaces** - All repositories follow contracts
4. **Compose layouts** - Build pages from reusable components
5. **Co-locate types** - Keep types with their domain logic
6. **Test business logic** - Focus tests on analytics and transformations
