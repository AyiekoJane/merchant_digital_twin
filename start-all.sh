#!/bin/bash

echo "========================================"
echo "Merchant Digital Twin Simulation Platform"
echo "2-Port Architecture"
echo "========================================"
echo ""

echo "Building Docker Image for Simulation Agent..."
cd simulation-agent
docker build -t simulation-agent:latest .

if [ $? -ne 0 ]; then
    echo "ERROR: Docker build failed!"
    echo "Make sure Docker is running and try again."
    exit 1
fi

cd ..
echo "Docker image built successfully!"
echo ""

echo "Starting Backend (Port 3000)..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

echo ""
echo "Starting Frontend (Port 3001)..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Services starting..."
echo "Backend API: http://localhost:3000"
echo "Frontend UI: http://localhost:3001"
echo "Docker Image: simulation-agent:latest"
echo "========================================"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait
