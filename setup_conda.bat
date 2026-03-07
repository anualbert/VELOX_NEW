@echo off
echo ===================================================
echo   SETTING UP VELOX ANACONDA ENVIRONMENT
echo ===================================================

echo 1. Creating Conda Environment 'velox'...
call conda create -n velox python=3.10 -y

echo.
echo 2. Installing Backend Dependencies...
call conda activate velox
cd backend
pip install -r requirements.txt

echo.
echo ===================================================
echo   SETUP COMPLETE!
echo ===================================================
echo.
echo To run the system, open 3 Anaconda Prompts and run:
echo.
echo Terminal 1:
echo   conda activate velox
echo   cd backend
echo   python local_inference_service.py
echo.
echo Terminal 2:
echo   conda activate velox
echo   cd backend
echo   python server.py
echo.
echo Terminal 3:
echo   cd frontend
echo   npm run dev
echo.
pause
