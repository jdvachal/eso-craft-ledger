from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, crud
from database import SessionLocal, engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ESO Craft Ledger API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── TRAITS ────────────────────────────────────────────────────────────────────

@app.get("/traits", response_model=List[schemas.Trait])
def list_traits(db: Session = Depends(get_db)):
    return crud.get_traits(db)

@app.get("/traits/{trait_id}", response_model=schemas.Trait)
def get_trait(trait_id: int, db: Session = Depends(get_db)):
    t = crud.get_trait(db, trait_id)
    if not t:
        raise HTTPException(status_code=404, detail="Trait not found")
    return t

# ── RECIPE TRAIT PRICES ───────────────────────────────────────────────────────

@app.get("/recipes/{recipe_id}/trait-prices", response_model=List[schemas.RecipeTraitPrice])
def list_recipe_trait_prices(recipe_id: int, db: Session = Depends(get_db)):
    return crud.get_recipe_trait_prices(db, recipe_id)

@app.put("/recipes/{recipe_id}/trait-prices", response_model=List[schemas.RecipeTraitPrice])
def upsert_recipe_trait_prices(
    recipe_id: int,
    prices: List[schemas.RecipeTraitPriceCreate],
    db: Session = Depends(get_db)
):
    return crud.upsert_recipe_trait_prices(db, recipe_id, prices)

@app.delete("/recipes/{recipe_id}/trait-prices/{trait_id}")
def delete_recipe_trait_price(recipe_id: int, trait_id: int, db: Session = Depends(get_db)):
    if not crud.delete_recipe_trait_price(db, recipe_id, trait_id):
        raise HTTPException(status_code=404, detail="Trait price not found")
    return {"ok": True}

# ── MATERIALS ──────────────────────────────────────────────────────────────────

@app.get("/materials", response_model=List[schemas.Material])
def list_materials(db: Session = Depends(get_db)):
    return crud.get_materials(db)

@app.post("/materials", response_model=schemas.Material)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    return crud.create_material(db, material)

@app.put("/materials/{material_id}", response_model=schemas.Material)
def update_material(material_id: int, material: schemas.MaterialUpdate, db: Session = Depends(get_db)):
    db_mat = crud.update_material(db, material_id, material)
    if not db_mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return db_mat

@app.delete("/materials/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    if not crud.delete_material(db, material_id):
        raise HTTPException(status_code=404, detail="Material not found")
    return {"ok": True}

@app.post("/materials/{material_id}/price-history", response_model=schemas.PriceHistory)
def add_price_history(material_id: int, entry: schemas.PriceHistoryCreate, db: Session = Depends(get_db)):
    return crud.add_price_history(db, material_id, entry)

@app.get("/materials/{material_id}/price-history", response_model=List[schemas.PriceHistory])
def get_price_history(material_id: int, db: Session = Depends(get_db)):
    return crud.get_price_history(db, material_id)

# ── RECIPES ───────────────────────────────────────────────────────────────────

@app.get("/recipes", response_model=List[schemas.RecipeWithDetails])
def list_recipes(
    profession: Optional[str] = None,
    known_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return crud.get_recipes(db, profession=profession, known_only=known_only)

@app.get("/recipes/{recipe_id}", response_model=schemas.RecipeWithDetails)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = crud.get_recipe(db, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@app.post("/recipes", response_model=schemas.RecipeWithDetails)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    return crud.create_recipe(db, recipe)

@app.put("/recipes/{recipe_id}", response_model=schemas.RecipeWithDetails)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = crud.update_recipe(db, recipe_id, recipe)
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe

@app.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    if not crud.delete_recipe(db, recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"ok": True}

@app.patch("/recipes/{recipe_id}/known", response_model=schemas.RecipeWithDetails)
def toggle_known(recipe_id: int, payload: schemas.ToggleKnown, db: Session = Depends(get_db)):
    recipe = crud.set_recipe_known(db, recipe_id, payload.known)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

# ── SALES LOG ─────────────────────────────────────────────────────────────────

@app.get("/sales", response_model=List[schemas.SaleWithDetails])
def list_sales(limit: int = 200, db: Session = Depends(get_db)):
    return crud.get_sales(db, limit=limit)

@app.post("/sales", response_model=schemas.SaleWithDetails)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    return crud.create_sale(db, sale)

@app.put("/sales/{sale_id}", response_model=schemas.SaleWithDetails)
def update_sale(sale_id: int, sale: schemas.SaleUpdate, db: Session = Depends(get_db)):
    db_sale = crud.update_sale(db, sale_id, sale)
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return db_sale

@app.delete("/sales/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    if not crud.delete_sale(db, sale_id):
        raise HTTPException(status_code=404, detail="Sale not found")
    return {"ok": True}

# ── DASHBOARD ─────────────────────────────────────────────────────────────────

@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return crud.get_dashboard_summary(db)

@app.get("/dashboard/sales-over-time")
def sales_over_time(days: int = 30, db: Session = Depends(get_db)):
    return crud.get_sales_over_time(db, days=days)

@app.get("/dashboard/profit-by-profession")
def profit_by_profession(db: Session = Depends(get_db)):
    return crud.get_profit_by_profession(db)

@app.get("/dashboard/top-items")
def top_items(limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_top_items(db, limit=limit)

# ── SEED ──────────────────────────────────────────────────────────────────────

@app.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    from seed import seed_data
    seed_data(db)
    return {"ok": True, "message": "Database seeded"}

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
