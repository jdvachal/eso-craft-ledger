# ESO Craft Ledger — Project Notes

> Paste this file at the start of any new Claude session to restore full context.
>
> **GitHub repo:** https://github.com/jdvachal/eso-craft-ledger
>
> **Raw URLs for Claude:**
> - https://raw.githubusercontent.com/jdvachal/eso-craft-ledger/main/NOTES.md
> - https://raw.githubusercontent.com/jdvachal/eso-craft-ledger/main/CHANGELOG.md

---

## What This Is

A local web application for tracking Elder Scrolls Online crafting profitability. Built with React + FastAPI + SQLite. Designed to eventually support cloud sync via PostgreSQL (Supabase).

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Query v5, Recharts, Axios |
| Backend   | Python, FastAPI, SQLAlchemy, Pydantic v2 |
| Database  | SQLite (local) → PostgreSQL (future cloud) |
| Styling   | CSS Modules, custom ESO dark theme (CSS variables) |

---

## Project Structure

```
eso-craft-ledger/
├── start.bat                  ← Windows launcher (installs deps + starts both servers)
├── start.sh                   ← Mac/Linux launcher
├── README.md
├── NOTES.md                   ← This file
├── CHANGELOG.md
│
├── backend/
│   ├── main.py                ← FastAPI app, all route definitions
│   ├── database.py            ← SQLAlchemy engine setup (reads DATABASE_URL env var)
│   ├── models.py              ← ORM table definitions
│   ├── schemas.py             ← Pydantic request/response schemas
│   ├── crud.py                ← All database read/write logic
│   ├── seed.py                ← Sample data: 41 materials, 49 recipes, 20 sales
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── vite.config.js         ← Proxies /api → localhost:8000
    ├── package.json
    └── src/
        ├── main.jsx           ← React entry point, QueryClient setup
        ├── App.jsx            ← Shell layout, sidebar nav, page routing
        ├── App.module.css
        ├── index.css          ← Global CSS variables (ESO dark theme)
        ├── pages/
        │   ├── Dashboard.jsx          ← Summary metrics, line/bar charts, top items
        │   ├── Dashboard.module.css
        │   ├── ProfessionPage.jsx     ← Reused for all 7 professions
        │   ├── ProfessionPage.module.css
        │   ├── MasterSheet.jsx        ← All recipes, sortable/filterable
        │   ├── MasterSheet.module.css
        │   ├── Materials.jsx          ← Material price list, inline price editing
        │   ├── Materials.module.css
        │   ├── SalesLog.jsx           ← Sales history, add/delete entries
        │   ├── SalesLog.module.css
        │   ├── QuickCalc.jsx          ← On-the-fly profit calc with ingredient picker
        │   └── QuickCalc.module.css
        ├── components/
        │   ├── UI.jsx                 ← Shared: Card, Badge, KnownToggle, Btn, Modal, Table, etc.
        │   ├── UI.module.css
        │   ├── RecipeForm.jsx         ← Add/edit recipe modal with dynamic ingredient slots
        │   └── RecipeForm.module.css
        └── utils/
            ├── api.js                 ← All Axios API calls (materials, recipes, sales, dashboard)
            └── helpers.js             ← fmtGold, fmtPct, PROFESSIONS, PROFESSION_COLORS, etc.
```

---

## Database Schema

### `materials`
| Column        | Type    | Notes                            |
|---------------|---------|----------------------------------|
| id            | int PK  |                                  |
| name          | string  | unique                           |
| category      | string  | e.g. Metal, Reagent, Rune        |
| current_price | float   | used in all recipe cost calcs    |
| notes         | text    |                                  |
| created_at    | datetime|                                  |
| updated_at    | datetime|                                  |

### `price_history`
| Column      | Type     | Notes                            |
|-------------|----------|----------------------------------|
| id          | int PK   |                                  |
| material_id | int FK   | → materials.id                   |
| price       | float    |                                  |
| recorded_at | datetime |                                  |

### `recipes`
| Column     | Type    | Notes                             |
|------------|---------|-----------------------------------|
| id         | int PK  |                                   |
| name       | string  |                                   |
| profession | string  | one of 7 professions              |
| category   | string  | e.g. "Ring — Briarheart"          |
| quality    | string  | Normal/Fine/Superior/Epic/Legendary |
| sell_price | float   |                                   |
| known      | bool    | does the character know this?     |
| notes      | text    |                                   |

### `recipe_ingredients`
| Column      | Type   | Notes                             |
|-------------|--------|-----------------------------------|
| id          | int PK |                                   |
| recipe_id   | int FK | → recipes.id                      |
| material_id | int FK | → materials.id                    |
| quantity    | float  |                                   |

### `sales_log`
| Column     | Type     | Notes                            |
|------------|----------|----------------------------------|
| id         | int PK   |                                  |
| recipe_id  | int FK   | nullable → recipes.id            |
| item_name  | string   |                                  |
| profession | string   |                                  |
| sale_price | float    |                                  |
| mat_cost   | float    |                                  |
| sold_at    | datetime |                                  |
| notes      | text     |                                  |

---

## API Endpoints

| Method | Path                              | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /materials                        | All materials                    |
| POST   | /materials                        | Create material                  |
| PUT    | /materials/{id}                   | Update material (triggers price history) |
| DELETE | /materials/{id}                   | Delete material                  |
| GET    | /materials/{id}/price-history     | Price history for a material     |
| GET    | /recipes                          | All recipes (filter: profession, known_only) |
| GET    | /recipes/{id}                     | Single recipe with ingredients   |
| POST   | /recipes                          | Create recipe + ingredients      |
| PUT    | /recipes/{id}                     | Update recipe + replace ingredients |
| DELETE | /recipes/{id}                     | Delete recipe                    |
| PATCH  | /recipes/{id}/known               | Toggle known status              |
| GET    | /sales                            | Sales log (limit param)          |
| POST   | /sales                            | Log a sale                       |
| PUT    | /sales/{id}                       | Update sale                      |
| DELETE | /sales/{id}                       | Delete sale                      |
| GET    | /dashboard/summary                | Aggregate metrics                |
| GET    | /dashboard/sales-over-time        | Daily revenue/profit (days param)|
| GET    | /dashboard/profit-by-profession   | Revenue/profit per profession    |
| GET    | /dashboard/top-items              | Top items by profit (limit param)|
| POST   | /seed                             | Seed database with sample data   |
| GET    | /health                           | Health check                     |

---

## Key Design Decisions

- **Mat cost is computed at query time** in `crud.py` (`_enrich_recipe`), not stored in DB. This means updating a material price instantly affects all recipe costs.
- **Vite proxy** routes `/api/*` → `localhost:8000` so the frontend never hardcodes the backend URL.
- **SQLite by default**, swappable to PostgreSQL by setting `DATABASE_URL` env var — no code changes needed.
- **CSS Modules** used throughout to avoid style collisions. Global theme variables live in `index.css`.
- **React Query** handles all server state — mutations invalidate relevant query keys to keep UI in sync.

---

## Professions

Blacksmithing, Clothing, Woodworking, Jewelrycrafting, Alchemy, Enchanting, Provisioning

Each profession has a color defined in `frontend/src/utils/helpers.js` → `PROFESSION_COLORS`.

---

## Known Issues / TODO

- [ ] Build errors to be investigated and resolved
- [ ] Master Merchant / Arya CSV import not yet implemented
- [ ] Price history chart UI not yet built (data is captured in DB)
- [ ] No character/alt profile system yet
- [ ] Shopping list generator (batch crafting materials needed) not yet built
- [ ] No authentication — single user local app for now

---

## Environment

- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:5173`
- API docs (Swagger): `http://localhost:8000/docs`
- Database file: `backend/eso_craft_ledger.db`

---

## Cloud Migration Path (future)

1. Create a free PostgreSQL database on [Supabase](https://supabase.com)
2. Set environment variable: `DATABASE_URL=postgresql://user:pass@host/dbname`
3. Restart backend — SQLAlchemy handles the rest automatically