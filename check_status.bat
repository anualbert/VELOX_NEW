@echo off
echo ==========================================
echo      VELOX SYSTEM STATUS CHECK
echo ==========================================
echo.

:: 1. Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is NOT installed or not in PATH.
) else (
    echo [OK] Python is installed.
)

:: 2. Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH.
) else (
    echo [OK] Node.js is installed.
)

:: 3. Check Backend Process
tasklist /FI "IMAGENAME eq python.exe" 2>NUL | find /I /N "python.exe" >NUL
if %errorlevel% neq 0 (
    echo [WARN] Backend Server (python.exe) is NOT running.
) else (
    echo [OK] Backend Server process detected.
)

:: 4. Check Database
if exist "backend\velox.db" (
    echo [OK] Database file found (backend\velox.db).
) else (
    echo [WARN] Database file NOT found. Run server first.
)

:: 5. Check EMOVELO Models
if exist "backend\emotion_svm.pkl" (
    echo [OK] EMOVELO Model found (emotion_svm.pkl).
) else (
    echo [ERROR] EMOVELO Model MISSING (backend\emotion_svm.pkl).
)

if exist "backend\label_encoder.pkl" (
    echo [OK] Label Encoder found (label_encoder.pkl).
) else (
    echo [ERROR] Label Encoder MISSING (backend\label_encoder.pkl).
)

echo.
echo ==========================================
echo      Check Complete.
echo ==========================================
pause
