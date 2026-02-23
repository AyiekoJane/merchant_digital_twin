@echo off
echo ═══════════════════════════════════════════════════════════════════
echo   Digital Twin Simulation - Install All Dependencies
echo ═══════════════════════════════════════════════════════════════════
echo.

call :install_deps "insight-service" "Insight Service"
call :install_deps "merchant-generator" "Merchant Generator"
call :install_deps "simulation-orchestrator" "Simulation Orchestrator"
call :install_deps "simulation-agent" "Simulation Agent"
call :install_deps "scenario-runner" "Scenario Runner"
call :install_deps "cli" "CLI Tools"
call :install_deps "frontend" "Frontend Dashboard"

echo ═══════════════════════════════════════════════════════════════════
echo ✅ All dependencies installed successfully!
echo ═══════════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo   1. Build Docker image: cd simulation-agent ^&^& docker build -t simulation-agent:latest .
echo   2. Follow QUICKSTART.md to run the system
echo.
goto :eof

:install_deps
set dir=%~1
set name=%~2

echo 📦 Installing %name%...
cd %dir%
call npm install
if %errorlevel% neq 0 (
  echo ❌ Failed to install %name%
  exit /b 1
)
echo ✅ %name% installed successfully
cd ..
echo.
goto :eof
