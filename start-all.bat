@echo off
echo ========================================
echo Merchant Digital Twin Simulation Platform
echo ========================================
echo.

echo Starting Appium (Android automation)...
start cmd /k "set ANDROID_HOME=C:\Users\Jane\AppData\Local\Android\Sdk&& set ANDROID_SDK_ROOT=C:\Users\Jane\AppData\Local\Android\Sdk&& C:\Users\Jane\AppData\Roaming\npm\appium"
timeout /t 3 /nobreak >nul

echo Starting Backend (Port 3000)...
start cmd /k "cd backend && npm install && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Frontend (Port 3001)...
start cmd /k "cd frontend && npm install && npm start"

echo.
echo ========================================
echo Services starting...
echo Appium:      http://localhost:4723
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:3001
echo.
echo Make sure MPESA_PIN is set in .env
echo ========================================
