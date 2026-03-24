@echo off
echo ========================================
echo Merchant Digital Twin Simulation Platform
echo 1000+ Concurrent Merchant Architecture
echo ========================================
echo.

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

rem Default scaling values
set SIM_WORKER_COUNT=20
set MAX_CONTEXTS_PER_WORKER=50

rem Override from .env if it exists
if exist .env (
    for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
        if "%%A"=="SIM_WORKER_COUNT" set SIM_WORKER_COUNT=%%B
        if "%%A"=="MAX_CONTEXTS_PER_WORKER" set MAX_CONTEXTS_PER_WORKER=%%B
    )
)

echo Scaling config:
echo   Workers:         %SIM_WORKER_COUNT%
echo   Contexts/worker: %MAX_CONTEXTS_PER_WORKER%
echo.

echo [1/4] Starting Appium server (for app simulation)...
set ANDROID_HOME=C:\Users\Jane\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Jane\AppData\Local\Android\Sdk
start "Appium" cmd /k "set ANDROID_HOME=C:\Users\Jane\AppData\Local\Android\Sdk && set ANDROID_SDK_ROOT=C:\Users\Jane\AppData\Local\Android\Sdk && appium --address 0.0.0.0 --port 4723"

echo [2/4] Starting Docker services (Redis, Queue, Workers, Backend, Mock Portal)...
start "Docker Compose" cmd /k "docker compose up --build --scale simulation-worker=%SIM_WORKER_COUNT%"

echo Waiting for backend to be ready...
timeout /t 15 /nobreak >nul

echo [3/4] Starting Frontend (port 3003)...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo All services starting:
echo   Backend API    : http://localhost:3000
echo   Frontend UI    : http://localhost:3003
echo   Merchant Gen   : http://localhost:3001
echo   Queue Stats    : http://localhost:3005/stats
echo   Mock Portal    : http://localhost:8888
echo   Appium         : http://localhost:4723
echo ========================================
echo.
echo Close the opened terminal windows to stop services.
