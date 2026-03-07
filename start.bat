@echo off

echo ==========================================
echo   Idle Goods Exchange Platform - Starting
echo ==========================================
echo.

rem Jump to the directory where this bat file lives
pushd "%~dp0"

rem ---- Check Python ----
echo [Check] Looking for Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    echo   Check "Add Python to PATH" during install.
    echo   Download: https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version 2^>^&1') do echo   [OK] %%v

rem ---- Check Node.js ----
echo [Check] Looking for Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 16+
    echo   Download: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version 2^>^&1') do echo   [OK] Node.js %%v

rem ---- Check npm ----
echo [Check] Looking for npm...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Please reinstall Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm --version 2^>^&1') do echo   [OK] npm %%v
echo.

rem ---- Step 1: Install backend deps (relative path: .\backend) ----
echo [1/3] Installing backend Python dependencies...
pip install -r "backend\requirements.txt"
if errorlevel 1 (
    echo.
    echo [ERROR] pip install failed.
    pause
    exit /b 1
)
echo   [OK] Backend dependencies installed.
echo.

rem ---- Step 2: Install frontend deps (cd into .\frontend) ----
echo [2/3] Building frontend...
pushd "frontend"
if errorlevel 1 (
    echo [ERROR] Cannot enter frontend directory.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo   Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        popd
        pause
        exit /b 1
    )
    echo   [OK] Frontend dependencies installed.
)

echo   Building...
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed.
    popd
    pause
    exit /b 1
)
echo   [OK] Frontend built.
popd
echo.

rem ---- Step 3: Start server (cd into .\backend) ----
echo [3/3] Starting server...
echo.
echo ==========================================
echo   Server is running!
echo   Open: http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo   Press Ctrl+C to stop.
echo ==========================================
echo.

pushd "backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
popd

echo.
echo Server stopped.
pause
