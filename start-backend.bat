@echo off
echo.
echo ========================================
echo   VoltEdge Python Backend
echo ========================================
echo.
echo Installing dependencies (first time only)...
pip install --quiet -r src\backend\calculations\requirements.txt
echo.
echo Starting backend server...
echo   - Backend: http://localhost:8001
echo   - API Docs: http://localhost:8001/docs
echo.
echo Press Ctrl+C to stop
echo.
python -m uvicorn --app-dir src\backend calculations.main:app --reload --port 8001
