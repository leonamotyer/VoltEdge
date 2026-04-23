# voltEdge Python Backend

Python FastAPI backend for voltEdge wind energy analytics.

## Quick Start

### 1. Install Dependencies

```bash
# Using pip
pip install -r requirements.txt

# Or using pip with virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Development Server

```bash
uvicorn src.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### 3. View API Documentation

FastAPI automatically generates interactive API docs:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── repositories/        # Data sources (AESO, SCADA, Turbine)
│   ├── analytics/           # Business logic (coming in Phase 3)
│   ├── models/              # Pydantic request/response models
│   │   ├── requests.py      # API request schemas
│   │   └── responses.py     # API response schemas
│   ├── api/                 # REST endpoints (coming in Phase 4)
│   └── mocks/               # Mock data
├── tests/                   # Pytest tests
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## API Endpoints

### Current (Phase 1)

- `GET /` - Health check
- `GET /health` - Detailed health status
- `GET /api/test/repositories` - Test repository connections

### Coming Soon (Phase 4)

- `POST /api/curtailment/view` - Curtailment analysis
- `POST /api/load-storage/view` - Battery storage analysis
- `POST /api/network/view` - Network/fiber analysis
- `POST /api/roi/view` - ROI calculations

## Development

### Run Tests

```bash
pytest
```

### Type Checking (optional)

```bash
mypy src/
```

## Integration with Next.js Frontend

The frontend will call this API over HTTP:

```typescript
// Next.js frontend (TypeScript)
const response = await fetch('http://localhost:8000/api/curtailment/view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData)
});
const data = await response.json();
```

## Migration Status

✅ **Phase 1 Complete**: Python API Foundation
- [x] Project structure created
- [x] Dependencies configured
- [x] FastAPI app initialized
- [x] AESO repository migrated
- [x] SCADA repository migrated
- [x] Turbine repository migrated
- [x] Pydantic models defined

🔄 **Phase 2**: Analytics Layer (Next)
- [ ] Migrate siteAnalytics.ts to site_analytics.py
- [ ] Migrate chartModels.ts transformations

⏳ **Phase 3**: API Routes
⏳ **Phase 4**: Next.js Integration
