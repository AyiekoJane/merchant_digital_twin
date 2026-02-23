@echo off
echo ========================================
echo Merchant Digital Twin Simulation Platform
echo 2-Port Architecture
echo ========================================
echo.
echo Building Docker Image for Simulation Agent...
cd simulation-agent
docker build -t simulation-agent:latest .
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed!
    echo Make sure Docker is running and try again.
    pause
    exit /b 1
)
cd ..
echo Docker image built successfully!
echo.
echo Starting Backend (Port 3000)...
start cmd /k "cd backend && npm install && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend (Port 3001)...
start cmd /k "cd frontend && npm install && npm start"
echo.
echo ========================================
echo Services starting...
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:3001
echo Docker Image: simulation-agent:latest
echo ========================================
