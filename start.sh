#!/bin/bash
set -e

echo ""
echo " ==================================================="
echo "  ESO CRAFT LEDGER - Starting up..."
echo " ==================================================="
echo ""

# ── Check Python ──────────────────────────────────────────
if ! command -v python3 &> /dev/null; then
    echo " [ERROR] Python 3 not found. Please install Python 3.10+"
    echo " Mac:    brew install python"
    echo " Ubuntu: sudo apt install python3 python3-venv"
    exit 1
fi

# ── Check Node ────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo " [ERROR] Node.js not found. Please install Node.js 18+"
    echo " Download: https://nodejs.org/"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Backend setup ─────────────────────────────────────────
echo " [1/4] Setting up Python environment..."
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

# ── Seed database on first run ────────────────────────────
if [ ! -f "eso_craft_ledger.db" ]; then
    echo " [2/4] Initializing database with ESO recipes..."
    python3 -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
from database import SessionLocal
from seed import seed_data
db = SessionLocal()
seed_data(db)
db.close()
print('Database ready.')
"
fi

# ── Start backend ─────────────────────────────────────────
echo " [3/4] Starting API server on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

cd "$SCRIPT_DIR/frontend"

# ── Frontend setup ────────────────────────────────────────
if [ ! -d "node_modules" ]; then
    echo " Installing frontend dependencies (first run only)..."
    npm install
fi

echo " [4/4] Starting frontend on http://localhost:5173 ..."

# Open browser after delay
(sleep 4 && open "http://localhost:5173" 2>/dev/null || xdg-open "http://localhost:5173" 2>/dev/null) &

npm run dev

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
