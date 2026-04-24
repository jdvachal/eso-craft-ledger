@echo off
title ESO Craft Ledger

echo.
echo  ===================================================
echo   ESO CRAFT LEDGER - Starting up...
echo  ===================================================
echo.

REM ── Check Python ─────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Please install Python 3.12
    echo  Download: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM ── Check Node ────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Please install Node.js 18+
    echo  Download: https://nodejs.org/
    pause
    exit /b 1
)

REM ── Backend setup ─────────────────────────────────────
echo  [1/4] Setting up Python environment...
cd backend

if not exist venv (
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

REM ── Seed database on first run ─────────────────────────
if not exist eso_craft_ledger.db (
    echo  [2/4] Initializing database with ESO recipes...
    python -c "from database import engine; from models import Base; Base.metadata.create_all(bind=engine); from database import SessionLocal; from seed import seed_data; db = SessionLocal(); seed_data(db); db.close()"
)

REM ── Start backend ─────────────────────────────────────
echo  [3/4] Starting API server on http://localhost:8000 ...
start "ESO Craft Ledger - API" cmd /k "cd /d %~dp0backend && venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

cd ..

REM ── Frontend setup ────────────────────────────────────
echo  [4/4] Starting frontend on http://localhost:5173 ...
cd frontend

if not exist node_modules (
    echo  Installing frontend dependencies - this may take a minute...
    call npm install
)

start "" cmd /c "timeout /t 4 >nul && start http://localhost:5173"

call npm run dev

cd ..