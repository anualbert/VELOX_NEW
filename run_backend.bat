@echo off
echo ===================================================
echo   STARTING VELOX BACKEND (DIAGNOSTIC MODE)
echo ===================================================

echo 1. Activating Conda Environment...
call conda activate velox

echo 2. Navigating to Backend...
cd backend

echo 3. Launching Server...
python server.py

echo.
echo ===================================================
echo   SERVER STOPPED / CRASHED
echo ===================================================
echo Please copy the error message above (if any).
pause
