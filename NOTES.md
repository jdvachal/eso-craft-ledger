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

A web application for tracking Elder Scrolls Online crafting profitability. Currently runs locally (React + FastAPI + SQLite). Planned for cloud deployment as a Patreon-gated SaaS product for ESO players.

---

## Business Model

Three subscription tiers gated via Patreon OAuth:

| Feature                        | Free | Basic | Premium |
|-------------------------------|------|-------|---------|
| Browse shared recipe database  | ✓    | ✓     | ✓       |
| Known/unknown tracking         | ✓    | ✓     | ✓       |
| Material prices (community)    | ✓    | ✓     | ✓       |
| Quick Calc                     | ✓    | ✓     | ✓       |
| Per-trait sell prices          | ✓    | ✓     | ✓       |
| Characters supported           | 1    | 1     | Unlimited |
| Addon LUA import               | —    | ✓     | ✓       |
| Sales log import               | —    | ✓     | ✓       |
| Sales history retention        | —    | 30 days | Unlimited |
| TTC price import               | —    | —     | ✓       |
| Price history charts           | —    | —     | ✓       |
| Batch calculator               | —    | —     | ✓       |
| Shopping list generator        | —    | —     | ✓       |

---

## Multi-User Architecture (planned)

- **Recipes and materials** are shared across all users (admin-maintained)
- **known/unknown** status moves from `recipes.known` → `user_known_recipes` join table
- **Material prices** have a shared community baseline + per-user overrides
- **Sales log, trait prices, price overrides** are fully private per user
- **Auth** via Supabase Auth + Patreon OAuth for tier verification
- **Characters** tracked per user via a `characters` table (user_id + character_name + account_name)

### Planned schema additions for multi-user:
```
users                ← id, email, patreon_id, tier, created_at
characters           ← id, user_id, name, account, server
user_known_recipes   ← user_id, recipe_id, character_id, known
user_material_prices ← user_id, material_id, price, updated_at
user_trait_prices    ← user_id, recipe_id, trait_id, sell_price
sales_log            ← (add user_id, character_id columns)
```

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Query v5, Recharts, Axios |
| Backend   | Python, FastAPI, SQLAlchemy, Pydantic v2 |
| Database  | SQLite (local) → PostgreSQL/Supabase (cloud) |
| Auth      | Supabase Auth + Patreon OAuth (planned) |
| Hosting   | Railway or Render (backend), Vercel (frontend) |
| Styling   | CSS Modules, custom ESO dark theme (CSS variables) |

---

## Project Structure

```
eso-craft-ledger/
├── start.bat                  ← Windows launcher
├── start.sh                   ← Mac/Linux launcher
├── README.md
├── NOTES.md                   ← This file
├── CHANGELOG.md
│
├── EsoCraftLedger/            ← ESO addon (separate from web app)
│   ├── EsoCraftLedger.txt     ← Addon manifest (APIVersion, SavedVariables)
│   ├── EsoCraftLedger.lua     ← Addon code
│   └── README.md
│
├── backend/
│   ├── main.py                ← FastAPI app, all route definitions
│   ├── database.py            ← SQLAlchemy engine (reads DATABASE_URL env var)
│   ├── models.py              ← ORM table definitions
│   ├── schemas.py             ← Pydantic request/response schemas
│   ├── crud.py                ← All database read/write logic
│   ├── seed.py                ← Sample data with correct TTC IDs
│   ├── migrate_traits.py      ← Migration: adds traits tables
│   ├── migrate_ttc.py         ← Migration: adds TTC ID columns
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── vite.config.js         ← Proxies /api → localhost:8000
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx            ← Shell layout, sidebar nav, page routing
        ├── index.css          ← Global CSS variables (ESO dark theme)
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── ProfessionPage.jsx   ← Reused for all 7 professions
        │   ├── MasterSheet.jsx
        │   ├── Materials.jsx        ← Inline price editing
        │   ├── SalesLog.jsx
        │   └── QuickCalc.jsx        ← Live cost breakdown with ingredient picker
        ├── components/
        │   ├── UI.jsx               ← Shared component library
        │   ├── RecipeForm.jsx       ← Add/edit recipe with ingredient slots
        │   └── TraitPricePanel.jsx  ← Collapsible per-trait pricing on recipes
        └── utils/
            ├── api.js
            └── helpers.js
```

---

## Database Schema (current)

### `materials`
| Column          | Type     | Notes                                      |
|-----------------|----------|--------------------------------------------|
| id              | int PK   |                                            |
| name            | string   | unique, matches TTC ItemTable exactly      |
| category        | string   | derived from TTC category ID               |
| current_price   | float    |                                            |
| ttc_item_id     | int      | TTC ItemTable ItemId                       |
| ttc_category_id | int      | TTC ItemTable CategoryCode                 |
| notes           | text     |                                            |

### `price_history`
| Column      | Type     | Notes                     |
|-------------|----------|---------------------------|
| id          | int PK   |                           |
| material_id | int FK   | → materials.id            |
| price       | float    |                           |
| recorded_at | datetime |                           |

### `traits`
| Column     | Type   | Notes                                          |
|------------|--------|------------------------------------------------|
| id         | int PK | matches ESO TraitID exactly                    |
| name       | string |                                                |
| trait_type | string | Weapon / Armor / Jewelry / Companion / Any     |

### `recipes`
| Column          | Type    | Notes                               |
|-----------------|---------|-------------------------------------|
| id              | int PK  |                                     |
| name            | string  | matches TTC naming convention       |
| profession      | string  | one of 7 professions                |
| category        | string  |                                     |
| quality         | string  | Normal/Fine/Superior/Epic/Legendary |
| sell_price      | float   | base price (no trait)               |
| known           | bool    | to be moved to user_known_recipes   |
| ttc_category_id | int     | sell-side TTC category              |
| notes           | text    |                                     |

### `recipe_ingredients`
| Column      | Type   | Notes              |
|-------------|--------|--------------------|
| id          | int PK |                    |
| recipe_id   | int FK | → recipes.id       |
| material_id | int FK | → materials.id     |
| quantity    | float  |                    |

### `recipe_trait_prices`
| Column     | Type   | Notes              |
|------------|--------|--------------------|
| id         | int PK |                    |
| recipe_id  | int FK | → recipes.id       |
| trait_id   | int FK | → traits.id        |
| sell_price | float  |                    |
| notes      | text   |                    |

### `sales_log`
| Column     | Type     | Notes                  |
|------------|----------|------------------------|
| id         | int PK   |                        |
| recipe_id  | int FK   | nullable → recipes.id  |
| trait_id   | int FK   | nullable → traits.id   |
| item_name  | string   |                        |
| profession | string   |                        |
| sale_price | float    |                        |
| mat_cost   | float    |                        |
| sold_at    | datetime |                        |
| notes      | text     |                        |

---

## TTC Category Map (key entries)

| TTC Cat | Label                  | Side    |
|---------|------------------------|---------|
| 1500    | Ore                    | Buy     |
| 1550    | Ingot                  | Buy     |
| 1600    | Raw Wood               | Buy     |
| 1650    | Sanded Wood            | Buy     |
| 1700    | Raw Leather/Cloth      | Buy     |
| 1750    | Leather/Cloth          | Buy     |
| 1800    | Temper                 | Buy     |
| 1850    | Resin                  | Buy     |
| 1900    | Tannin                 | Buy     |
| 2300    | Aspect Rune            | Buy     |
| 2350    | Potency Rune           | Buy     |
| 2400    | Essence Rune           | Buy     |
| 2850    | Jewelry Material       | Buy     |
| 2900    | Jewelry Plating        | Buy     |
| 2950    | Jewelry Trait Gem      | Buy     |
| 1450    | Alchemy Solvent Potion | Buy     |
| 150-152 | Reagents               | Buy     |
| 40-48   | Provisioning Ingredients | Buy   |
| 250     | Weapons/Shields        | Sell    |
| 300     | Armor                  | Sell    |
| 0       | Jewelry                | Sell    |
| 950     | Weapon Glyphs          | Sell    |
| 1000    | Armor Glyphs           | Sell    |
| 1250    | Jewelry Glyphs         | Sell    |
| 8/27    | Food/Drink             | Sell    |
| 450     | Potions                | Sell    |

---

## ESO Addon (EsoCraftLedger)

Installed at: `Documents\Elder Scrolls Online\live\AddOns\EsoCraftLedger\`
Output file:  `Documents\Elder Scrolls Online\live\SavedVariables\EsoCraftLedgerData.lua`

### Commands
- `/craftledger export` — export all (provisioning anywhere, smithing needs station)
- `/craftledger provisioning` — provisioning only
- `/craftledger smithing` — gear patterns (must be AT station)
- `/craftledger enchanting` — rune combos from bags/craft bag
- `/craftledger alchemy` — reagent knowledge (at alchemy station)
- `/craftledger status` — last export summary
- `/reloadui` — saves to disk

### Verified ESO API constants
```
CRAFTING_TYPE_BLACKSMITHING   = 1
CRAFTING_TYPE_CLOTHIER        = 2
CRAFTING_TYPE_ENCHANTING      = 3
CRAFTING_TYPE_ALCHEMY         = 4
CRAFTING_TYPE_PROVISIONING    = 5
CRAFTING_TYPE_WOODWORKING     = 6
CRAFTING_TYPE_JEWELRYCRAFTING = 7

ITEMTYPE_ENCHANTING_RUNE_POTENCY = 51
ITEMTYPE_ENCHANTING_RUNE_ESSENCE = 53
ITEMTYPE_ENCHANTING_RUNE_ASPECT  = 52

ENCHANTING_RUNE_POTENCY = 3
ENCHANTING_RUNE_ESSENCE = 2
ENCHANTING_RUNE_ASPECT  = 1
```

### Known addon limitations
- Craft bag scanning uses `SHARED_INVENTORY:GenerateFullSlotData()` — works for enchanting runes
- Alchemy only exports at an alchemy station
- Smithing exports patterns for current station type only — run at each station type separately

---

## API Endpoints

| Method | Path                                  | Description                          |
|--------|---------------------------------------|--------------------------------------|
| GET    | /materials                            | All materials                        |
| POST   | /materials                            | Create material                      |
| PUT    | /materials/{id}                       | Update material                      |
| DELETE | /materials/{id}                       | Delete material                      |
| GET    | /materials/{id}/price-history         | Price history                        |
| GET    | /traits                               | All traits                           |
| GET    | /recipes                              | All recipes (filter: profession, known_only) |
| POST   | /recipes                              | Create recipe                        |
| PUT    | /recipes/{id}                         | Update recipe                        |
| DELETE | /recipes/{id}                         | Delete recipe                        |
| PATCH  | /recipes/{id}/known                   | Toggle known                         |
| GET    | /recipes/{id}/trait-prices            | Trait prices for recipe              |
| PUT    | /recipes/{id}/trait-prices            | Upsert trait prices                  |
| DELETE | /recipes/{id}/trait-prices/{trait_id} | Delete trait price                   |
| GET    | /sales                                | Sales log                            |
| POST   | /sales                                | Log a sale                           |
| PUT    | /sales/{id}                           | Update sale                          |
| DELETE | /sales/{id}                           | Delete sale                          |
| GET    | /dashboard/summary                    | Aggregate metrics                    |
| GET    | /dashboard/sales-over-time            | Daily revenue/profit                 |
| GET    | /dashboard/profit-by-profession       | Profit per profession                |
| GET    | /dashboard/top-items                  | Top items by profit                  |
| POST   | /seed                                 | Seed database                        |

---

## Key Design Decisions

- **Mat cost computed at query time** in `_enrich_recipe` — updating a price instantly affects all recipes
- **Shared recipes, personal known flags** — recipes are admin-maintained, users toggle known/unknown
- **TTC IDs on all materials** — every material has `ttc_item_id` and `ttc_category_id` for future import matching
- **Vite proxy** routes `/api/*` → `localhost:8000`
- **SQLite → PostgreSQL** switchable via `DATABASE_URL` env var, no code changes needed

---

## Planned Features (next sessions)

### Immediate priority
- [ ] Multi-user schema migration (users table, user_known_recipes, user_id on sales_log)
- [ ] Supabase Auth integration
- [ ] Patreon OAuth tier verification
- [ ] LUA file importer (EsoCraftLedgerData.lua → database)
- [ ] TTC LUA price file importer

### Features
- [ ] Price history chart per material
- [ ] Shopping list generator (recipe + batch size → total materials needed)
- [ ] Batch profit calculator
- [ ] Character/alt profile system
- [ ] Profit threshold alerts
- [ ] Furnishing recipes

---

## Environment

- Backend:  `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- DB file:  `backend/eso_craft_ledger.db`

---

## Cloud Deployment Path

1. Supabase — free PostgreSQL + Auth (`DATABASE_URL=postgresql://...`)
2. Railway or Render — FastAPI backend (free tier available)
3. Vercel — React frontend (free tier)
4. Patreon OAuth — tier-gate access at login