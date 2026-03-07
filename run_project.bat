@echo off
echo Starting VELOX System...

start "VELOX Backend" cmd /k "cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload"
start "VELOX Frontend" cmd /k "cd frontend && npm run dev"

echo System launching... Please allow a few seconds for services to start.
echo Access the app at http://localhost:5173
