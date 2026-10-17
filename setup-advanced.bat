@echo off
echo ================================
echo AgriConnect Advanced Features Setup
echo ================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend dependencies installation failed
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend dependencies installation failed
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [3/4] Checking Docker services...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Docker not found. Please install Docker to use Redis and Elasticsearch.
    echo You can still run the app with these features disabled.
) else (
    echo ✓ Docker is installed
)
echo.

echo [4/4] Setup complete!
echo.
echo ================================
echo Next Steps:
echo ================================
echo.
echo 1. Start infrastructure (optional):
echo    docker-compose up -d redis elasticsearch
echo.
echo 2. Start backend:
echo    cd backend
echo    npm run dev
echo.
echo 3. Start frontend (in new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Test the advanced features:
echo    - WebSocket: Real-time price updates on /prices
echo    - Redis: Faster API responses (check logs)
echo    - Elasticsearch: Advanced search on /marketplace
echo.
echo ================================
echo.

cd ..
pause
