@echo off
echo ===================================================
echo   FIXING VELOX DEPENDENCIES
echo ===================================================

echo 1. Activating Conda Environment...
call conda activate velox

echo 2. Fixing MediaPipe and Protobuf...
@REM MediaPipe often fails with newer Protobuf versions
pip install "protobuf<4"
pip install mediapipe --upgrade --force-reinstall

echo 3. Upgrading Scikit-Learn (to match model version)...
pip install scikit-learn --upgrade

echo.
echo ===================================================
echo   FIX COMPLETE
echo ===================================================
echo Please close ALL other Python windows and run "run_all.bat" again.
pause
