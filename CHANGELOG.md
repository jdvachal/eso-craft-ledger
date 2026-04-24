# ESO Craft Ledger — Changelog

All notable changes to this project are documented here.
Format: `## [version] — YYYY-MM-DD` with Added / Changed / Fixed / Removed sections.

---

## [Unreleased] — In Progress

### Planned
- [ ] TTC (Tamriel Trade Centre) LUA file upload — parse and import item prices directly
      from TTC's saved variables file, matching on ttc_item_id and updating material
      current_price automatically
- [ ] TTC item data file upload — import the full TTC item database to populate material
      names, ttc_item_id, and ttc_category_id
- [ ] Master Merchant / Arya CSV import for bulk sales log population
- [ ] Price history chart per material (data already being captured in price_history table)
- [ ] Shopping list generator — pick recipes + batch size, output total materials needed
- [ ] Batch profit calculator — total outlay and expected return across a batch of crafts
- [ ] Character / alt profile system
- [ ] Profit threshold alerts
- [ ] Furnishing recipes — add to profession tabs following same model as provisioning

---

## [0.2.0] — 2026-04-24

### Added
- **Traits system** — `traits` table seeded with all 34 ESO traits, each with correct
  `trait_type` (Weapon / Armor / Jewelry / Companion / Any) and ESO TraitID
- **Per-trait sell prices** — `recipe_trait_prices` table allows each recipe to store
  a different sell price per trait; mat cost and profit calculated live against base mat cost
- **TraitPricePanel component** — collapsible panel on each recipe row in profession tabs;
  click any trait to set a price, profit displays inline; auto-filters traits by profession
- **`trait_id` on sales log** — sales can now record which trait was on the sold item;
  trait dropdown added to Log Sale form; Trait column added to sales table
- **TTC category map** — full mapping of all 100+ Tamriel Trade Centre category IDs
  documented and embedded in seed data; covers both material (buy-side) and
  equipment/consumable (sell-side) categories
- **`ttc_item_id` and `ttc_category_id` on materials** — every material now stores its
  exact TTC item ID and category ID sourced from TTC ItemTable.csv; foundation for
  future LUA file importer
- **`ttc_category_id` on recipes** — sell-side TTC category stored on each recipe so
  the importer knows which category to look in when updating sell prices
- **Full provisioning ingredient set** — all 9 sub-categories now seeded:
  Meats (cat 40), Vegetables (41), Fruits (42), Misc Ingredients (43), Grains (44),
  Herbs (45), Tonic Ingredients (46), Sweeteners/Misc (47), Special Ingredients (48)
- **Full enchanting rune set** — all aspect runes (cat 2300), potency runes (2350),
  and essence runes (2400) seeded with correct TTC IDs
- **`migrate_traits.py`** — migration script for adding traits to an existing database
- **`migrate_ttc.py`** — migration script for adding TTC ID columns to an existing database
- **.gitignore** — comprehensive ignore rules for Python venv, SQLite DB, node_modules,
  OS files, IDE files, and environment variables

### Changed
- All material names corrected to match TTC ItemTable exactly for future import matching:
  - `Ruby Ash Wood` → `Sanded Ruby Ash` (TTC name)
  - `Witchmother's Brew` → `Witchmother's Potent Brew` (TTC name)
  - `Nirncrux` split into `Fortified Nirncrux` (Weapon Trait Gem, cat 2000, id 688)
    and `Potent Nirncrux` (Armor Trait Gem, cat 2050, id 3790)
  - `SweetSoy` removed — does not exist in TTC; replaced with `Saltrice` in affected recipes
- Recipe names updated to TTC slot-based naming convention:
  - `Julianos Robe` → `Robe of Julianos`, `Arm Cops of Julianos`, etc.
  - `Briarheart Ring` → `Briarheart Band`
  - `Infallible Mage Bow` → `Infallible Aether Bow`
  - `Alkosh Shield` → `Arm Cops of Alkosh`
  - `Witchmother's Brew` → `Witchmother's Potent Brew`
- Material categories now use TTC-sourced labels derived from `ttc_category_id`
  rather than manually invented category names
- Seed data expanded from 41 → 90+ materials

### Fixed
- `start.bat` — removed stray bash brace expansion syntax (`{backend,frontend/...}`)
  that caused `... was unexpected at this time` error on Windows cmd
- `start.bat` — changed `activate` to `activate.bat` for reliable venv activation
  on Windows; backend now correctly navigates to `backend/` folder before starting uvicorn
- `ProfessionPage.jsx` — adjacent JSX elements error caused by two `<tr>` elements in
  `.map()` without a wrapper; fixed by using `<React.Fragment key={r.id}>` to wrap
  both the recipe row and the TraitPricePanel row

---

## [0.1.0] — 2026-04-24

### Initial Build

**Backend**
- FastAPI application with full CRUD for materials, recipes, ingredients, and sales
- SQLAlchemy ORM with SQLite; swappable to PostgreSQL via `DATABASE_URL` env var
- Pydantic v2 schemas for all request/response models
- Recipe mat cost computed dynamically at query time from live material prices
- Price history table — automatically records a new entry whenever a material price changes
- Dashboard aggregation endpoints: summary metrics, sales over time, profit by profession,
  top items
- `/seed` endpoint populates 41 materials, 49 recipes across 7 professions, 20 sample sales
- `start.bat` and `start.sh` launchers handle venv creation, pip install, DB init,
  and both server starts

**Frontend**
- React 18 + Vite + React Query v5
- ESO dark theme with CSS custom properties (gold, deep browns, green/red profit colors)
- Cinzel + Crimson Pro Google Fonts
- Sidebar navigation with profession color dots
- **Dashboard** — 6 metric cards, sales/profit line chart (Recharts),
  profit-by-profession bar chart, top 10 items table, seed sample data button
- **7 Profession pages** — recipe table with ingredients, mat cost (live from DB),
  profit/margin, known toggle, quick calc panel, summary panel
- **Master Sheet** — all recipes across all professions, sortable by any column,
  filterable by profession/known status/search
- **Materials page** — full CRUD, inline price editing (click to edit), category filter
- **Sales Log** — log sales with item/profession/price/cost/date, running totals, delete
- **Quick Calc** — ingredient picker with live cost breakdown bar chart, net profit,
  ROI, break-even
- **RecipeForm** component — add/edit recipes with dynamic ingredient slots,
  live cost preview
- Shared UI component library: Card, Badge, ProfBadge, QualityBadge, ProfitBadge,
  KnownToggle, Btn, Modal, Table, MetricCard, Spinner, EmptyState

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