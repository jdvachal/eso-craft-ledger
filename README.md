# ⚒ ESO Craft Ledger

A full-featured Elder Scrolls Online crafting profitability calculator. Track recipe costs, material prices, sales history, and profit across all seven crafting professions.

---

## Features

- **7 Profession Tabs** — Blacksmithing, Clothing, Woodworking, Jewelrycrafting, Alchemy, Enchanting, Provisioning
- **Master Recipe Sheet** — all recipes in one filterable, sortable view
- **Material Price List** — update prices once, all recipe costs recalculate instantly
- **Ingredient System** — each recipe stores its components with quantities
- **Sales Log** — track every guild trader sale with profit/margin
- **Dashboard** — charts for sales over time, profit by profession, top items
- **Quick Calc** — calculate profit for any item on the fly using live material prices
- **Known/Unknown toggle** — track which recipes your character actually knows
- **SQLite database** — all data persists locally; easy to migrate to cloud later

---

## Requirements

- **Python 3.10+** — https://www.python.org/downloads/
- **Node.js 18+** — https://nodejs.org/

---

## Quick Start (Windows)

1. Unzip the project folder anywhere you like
2. Double-click **`start.bat`**
3. First run will install all dependencies automatically (takes ~1-2 minutes)
4. Browser opens automatically at **http://localhost:5173**
5. Click **"✦ Seed Sample Data"** on the Dashboard if you want pre-loaded ESO recipes

> On subsequent runs, `start.bat` launches instantly — dependencies are already installed.

---

## Quick Start (Mac / Linux)

```bash
# Make the start script executable (one time only)
chmod +x start.sh

# Run it
./start.sh
```

---

## Manual Start (if the scripts don't work)

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

---

## Seeding the Database

On first load, click **"✦ Seed Sample Data"** on the Dashboard to populate:
- 41 materials with current approximate market prices
- 49 recipes across all 7 professions with ingredients
- 20 sample sales log entries

You can also call the seed endpoint directly:
```
POST http://localhost:8000/seed
```

---

## Project Structure

```
eso-craft-ledger/
├── start.bat              ← Windows double-click launcher
├── start.sh               ← Mac/Linux launcher
│
├── backend/
│   ├── main.py            ← FastAPI app + all routes
│   ├── database.py        ← SQLAlchemy connection (SQLite by default)
│   ├── models.py          ← Database table definitions
│   ├── schemas.py         ← Pydantic request/response models
│   ├── crud.py            ← All database operations
│   ├── seed.py            ← Sample data (recipes, materials, sales)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx         ← App shell + navigation
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── ProfessionPage.jsx   ← Used for all 7 professions
    │   │   ├── MasterSheet.jsx
    │   │   ├── Materials.jsx
    │   │   ├── SalesLog.jsx
    │   │   └── QuickCalc.jsx
    │   ├── components/
    │   │   ├── UI.jsx      ← Shared components (buttons, modals, tables...)
    │   │   └── RecipeForm.jsx
    │   └── utils/
    │       ├── api.js      ← All API calls
    │       └── helpers.js  ← Formatting, constants
    └── package.json
```

---

## Switching to Cloud / PostgreSQL

When you're ready to sync across devices, swap the database by setting an environment variable before starting the backend:

```bash
# .env file in /backend or set directly:
DATABASE_URL=postgresql://user:password@host:5432/eso_craft_ledger
```

Recommended free host: **Supabase** (https://supabase.com) — free PostgreSQL with a web dashboard.

The rest of the app is unchanged — no code modifications needed.

---

## API Documentation

With the backend running, visit:
- **http://localhost:8000/docs** — Interactive Swagger UI for all endpoints
- **http://localhost:8000/redoc** — Alternative API docs

---

## Planned Features (future iterations)

- [ ] Master Merchant / Arya CSV import for bulk sales log
- [ ] Price history charts per material
- [ ] Character profiles (multiple alts)
- [ ] Shopping list generator (calculate total mats needed for a batch)
- [ ] Profit alerts (flag items where margins drop below threshold)
- [ ] DLC recipe packs (auto-import new sets)

---

## Troubleshooting

**Port already in use:**
- Backend (8000): `netstat -ano | findstr :8000` then kill that PID
- Frontend (5173): Change port in `frontend/vite.config.js`

**Database reset:**
```bash
cd backend
del eso_craft_ledger.db   # Windows
rm eso_craft_ledger.db    # Mac/Linux
```
Then restart — it will re-seed automatically.

**Python venv issues on Windows:**
```
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
