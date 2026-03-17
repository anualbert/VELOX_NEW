@echo off
echo ===================================================
echo   STARTING VELOX SYSTEM (FULL INTEGRATION)
echo ===================================================

echo 1. Starting Local Inference Microservice (Port 8001)...
start "VELOX AI Service" cmd /k "call C:\Users\fidha\anaconda3\Scripts\activate.bat velox && cd backend && python local_inference_service.py"

echo 2. Starting Main Backend (Port 8000)...
start "VELOX Backend" cmd /k "call C:\Users\fidha\anaconda3\Scripts\activate.bat velox && cd backend && python server.py"

echo 3. Starting Teacher Dashboard (Port 5173)...
start "VELOX Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   SYSTEM LAUNCHED
echo ===================================================
echo.
echo [INSTRUCTIONS]
echo 1. Open Chrome and go to: chrome://extensions
echo 2. Enable "Developer Mode" (top right).
echo 3. Click "Load unpacked" and select the "chrome_extension" folder.
echo 4. Go to https://meet.google.com (or any page if using popup) to test.
echo 5. Open http://localhost:5173 to view the Teacher Dashboard.
echo.
pause
