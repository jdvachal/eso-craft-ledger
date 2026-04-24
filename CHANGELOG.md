# ESO Craft Ledger — Changelog

All notable changes to this project are documented here.
Format: `## [version] — YYYY-MM-DD` with Added / Changed / Fixed / Removed sections.

---

## [0.1.0] — 2026-04-24

### Initial Build

**Backend**
- FastAPI application with full CRUD for materials, recipes, ingredients, and sales
- SQLAlchemy ORM with SQLite; swappable to PostgreSQL via `DATABASE_URL` env var
- Pydantic v2 schemas for all request/response models
- Recipe mat cost computed dynamically at query time from live material prices
- Price history table — automatically records a new entry whenever a material price changes
- Dashboard aggregation endpoints: summary metrics, sales over time, profit by profession, top items
- `/seed` endpoint populates 41 materials, 49 recipes across 7 professions, 20 sample sales
- `start.bat` and `start.sh` launchers handle venv creation, pip install, DB init, and both server starts

**Frontend**
- React 18 + Vite + React Query v5
- ESO dark theme with CSS custom properties (gold, deep browns, green/red profit colors)
- Cinzel + Crimson Pro Google Fonts
- Sidebar navigation with profession color dots
- **Dashboard** — 6 metric cards, sales/profit line chart (Recharts), profit-by-profession bar chart, top 10 items table
- **7 Profession pages** — recipe table with ingredients, mat cost (live from DB), profit/margin, known toggle, quick calc panel, summary panel
- **Master Sheet** — all recipes across all professions, sortable by any column, filterable by profession/known status/search
- **Materials page** — full CRUD, inline price editing (click to edit), category filter
- **Sales Log** — log sales with item/profession/price/cost/date, running totals, delete
- **Quick Calc** — ingredient picker with live cost breakdown bar chart, net profit, ROI, break-even
- **RecipeForm** component — add/edit recipes with dynamic ingredient slots, live cost preview
- Shared UI component library: Card, Badge, ProfBadge, QualityBadge, ProfitBadge, KnownToggle, Btn, Modal, Table, MetricCard, Spinner, EmptyState

---

## [Unreleased] — In Progress

### To Fix
- Build errors under investigation

### Planned
- [ ] Master Merchant / Arya CSV import for bulk sales log population
- [ ] Price history chart per material (data already being captured in `price_history` table)
- [ ] Shopping list generator — pick recipes + batch size, output total materials needed
- [ ] Batch profit calculator — total outlay and expected return across a batch of crafts
- [ ] Character / alt profile system
- [ ] Profit threshold alerts
- [ ] TTC (Tamriel Trade Centre) LUA file upload — parse and import item 
      prices directly from TTC's saved variables file, matching on 
      ttc_item_id and updating material current_price automatically
- [ ] TTC item data file upload — import the full TTC item database to 
      populate material names, ttc_item_id, and ttc_category_id

---

<!-- 
TEMPLATE FOR FUTURE ENTRIES:

## [x.x.x] — YYYY-MM-DD

### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 
-->