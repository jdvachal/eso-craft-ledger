from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
import models, schemas


# ── TRAITS ────────────────────────────────────────────────────────────────────

def get_traits(db: Session) -> List[models.Trait]:
    return db.query(models.Trait).order_by(models.Trait.trait_type, models.Trait.name).all()

def get_trait(db: Session, trait_id: int) -> Optional[models.Trait]:
    return db.query(models.Trait).filter(models.Trait.id == trait_id).first()


# ── RECIPE TRAIT PRICES ───────────────────────────────────────────────────────

def get_recipe_trait_prices(db: Session, recipe_id: int) -> List[models.RecipeTraitPrice]:
    return (db.query(models.RecipeTraitPrice)
            .filter(models.RecipeTraitPrice.recipe_id == recipe_id)
            .all())

def upsert_recipe_trait_prices(
    db: Session,
    recipe_id: int,
    prices: List[schemas.RecipeTraitPriceCreate]
) -> List[models.RecipeTraitPrice]:
    for p in prices:
        existing = (db.query(models.RecipeTraitPrice)
                    .filter_by(recipe_id=recipe_id, trait_id=p.trait_id)
                    .first())
        if existing:
            existing.sell_price = p.sell_price
            existing.notes      = p.notes
        else:
            db.add(models.RecipeTraitPrice(
                recipe_id=recipe_id,
                trait_id=p.trait_id,
                sell_price=p.sell_price,
                notes=p.notes,
            ))
    db.commit()
    return get_recipe_trait_prices(db, recipe_id)

def delete_recipe_trait_price(db: Session, recipe_id: int, trait_id: int) -> bool:
    row = (db.query(models.RecipeTraitPrice)
           .filter_by(recipe_id=recipe_id, trait_id=trait_id)
           .first())
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


# ── MATERIALS ──────────────────────────────────────────────────────────────────

def get_materials(db: Session) -> List[models.Material]:
    return db.query(models.Material).order_by(models.Material.category, models.Material.name).all()

def get_material_by_name(db: Session, name: str) -> Optional[models.Material]:
    return db.query(models.Material).filter(models.Material.name == name).first()

def create_material(db: Session, material: schemas.MaterialCreate) -> models.Material:
    db_mat = models.Material(**material.model_dump())
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    _record_price_history(db, db_mat.id, db_mat.current_price)
    return db_mat

def update_material(db: Session, material_id: int, material: schemas.MaterialUpdate) -> Optional[models.Material]:
    db_mat = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_mat:
        return None
    data = material.model_dump(exclude_unset=True)
    old_price = db_mat.current_price
    for k, v in data.items():
        setattr(db_mat, k, v)
    db.commit()
    db.refresh(db_mat)
    if "current_price" in data and data["current_price"] != old_price:
        _record_price_history(db, db_mat.id, db_mat.current_price)
    return db_mat

def delete_material(db: Session, material_id: int) -> bool:
    db_mat = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not db_mat:
        return False
    db.delete(db_mat)
    db.commit()
    return True

def _record_price_history(db: Session, material_id: int, price: float):
    entry = models.PriceHistory(material_id=material_id, price=price)
    db.add(entry)
    db.commit()

def add_price_history(db: Session, material_id: int, entry: schemas.PriceHistoryCreate) -> models.PriceHistory:
    ph = models.PriceHistory(material_id=material_id, price=entry.price)
    db.add(ph)
    db.commit()
    db.refresh(ph)
    return ph

def get_price_history(db: Session, material_id: int) -> List[models.PriceHistory]:
    return (db.query(models.PriceHistory)
            .filter(models.PriceHistory.material_id == material_id)
            .order_by(models.PriceHistory.recorded_at)
            .all())


# ── RECIPES ────────────────────────────────────────────────────────────────────

def _enrich_recipe(recipe: models.Recipe) -> models.Recipe:
    mat_cost = sum(
        ing.quantity * (ing.material.current_price if ing.material else 0)
        for ing in recipe.ingredients
    )
    recipe.mat_cost = mat_cost
    recipe.profit   = recipe.sell_price - mat_cost
    recipe.margin   = (recipe.profit / recipe.sell_price) if recipe.sell_price > 0 else 0
    return recipe

def get_recipes(db: Session, profession: Optional[str] = None, known_only: Optional[bool] = None) -> List[models.Recipe]:
    q = db.query(models.Recipe)
    if profession:
        q = q.filter(models.Recipe.profession == profession)
    if known_only is True:
        q = q.filter(models.Recipe.known == True)
    recipes = q.order_by(models.Recipe.profession, models.Recipe.name).all()
    return [_enrich_recipe(r) for r in recipes]

def get_recipe(db: Session, recipe_id: int) -> Optional[models.Recipe]:
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if recipe:
        _enrich_recipe(recipe)
    return recipe

def create_recipe(db: Session, recipe: schemas.RecipeCreate) -> models.Recipe:
    data = recipe.model_dump(exclude={"ingredients"})
    db_recipe = models.Recipe(**data)
    db.add(db_recipe)
    db.flush()
    for ing in recipe.ingredients:
        db_ing = models.RecipeIngredient(recipe_id=db_recipe.id, **ing.model_dump())
        db.add(db_ing)
    db.commit()
    db.refresh(db_recipe)
    return _enrich_recipe(db_recipe)

def update_recipe(db: Session, recipe_id: int, recipe: schemas.RecipeUpdate) -> Optional[models.Recipe]:
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return None
    data = recipe.model_dump(exclude_unset=True, exclude={"ingredients"})
    for k, v in data.items():
        setattr(db_recipe, k, v)
    if recipe.ingredients is not None:
        db.query(models.RecipeIngredient).filter(
            models.RecipeIngredient.recipe_id == recipe_id
        ).delete()
        for ing in recipe.ingredients:
            db_ing = models.RecipeIngredient(recipe_id=recipe_id, **ing.model_dump())
            db.add(db_ing)
    db.commit()
    db.refresh(db_recipe)
    return _enrich_recipe(db_recipe)

def delete_recipe(db: Session, recipe_id: int) -> bool:
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return False
    db.delete(db_recipe)
    db.commit()
    return True

def set_recipe_known(db: Session, recipe_id: int, known: bool) -> Optional[models.Recipe]:
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        return None
    db_recipe.known = known
    db.commit()
    db.refresh(db_recipe)
    return _enrich_recipe(db_recipe)


# ── SALES LOG ─────────────────────────────────────────────────────────────────

def _enrich_sale(sale: models.SaleLog) -> models.SaleLog:
    sale.profit = sale.sale_price - sale.mat_cost
    sale.margin = (sale.profit / sale.sale_price) if sale.sale_price > 0 else 0
    return sale

def get_sales(db: Session, limit: int = 200) -> List[models.SaleLog]:
    sales = (db.query(models.SaleLog)
             .order_by(desc(models.SaleLog.sold_at))
             .limit(limit)
             .all())
    return [_enrich_sale(s) for s in sales]

def create_sale(db: Session, sale: schemas.SaleCreate) -> models.SaleLog:
    data = sale.model_dump()
    if data.get("sold_at") is None:
        data["sold_at"] = datetime.utcnow()
    db_sale = models.SaleLog(**data)
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return _enrich_sale(db_sale)

def update_sale(db: Session, sale_id: int, sale: schemas.SaleUpdate) -> Optional[models.SaleLog]:
    db_sale = db.query(models.SaleLog).filter(models.SaleLog.id == sale_id).first()
    if not db_sale:
        return None
    for k, v in sale.model_dump(exclude_unset=True).items():
        setattr(db_sale, k, v)
    db.commit()
    db.refresh(db_sale)
    return _enrich_sale(db_sale)

def delete_sale(db: Session, sale_id: int) -> bool:
    db_sale = db.query(models.SaleLog).filter(models.SaleLog.id == sale_id).first()
    if not db_sale:
        return False
    db.delete(db_sale)
    db.commit()
    return True


# ── DASHBOARD ─────────────────────────────────────────────────────────────────

def get_dashboard_summary(db: Session) -> dict:
    total_recipes  = db.query(func.count(models.Recipe.id)).scalar()
    known_recipes  = db.query(func.count(models.Recipe.id)).filter(models.Recipe.known == True).scalar()
    total_sales    = db.query(func.count(models.SaleLog.id)).scalar()
    total_revenue  = db.query(func.sum(models.SaleLog.sale_price)).scalar() or 0
    total_mat_cost = db.query(func.sum(models.SaleLog.mat_cost)).scalar() or 0
    total_profit   = total_revenue - total_mat_cost

    cutoff       = datetime.utcnow() - timedelta(days=7)
    week_revenue  = db.query(func.sum(models.SaleLog.sale_price)).filter(models.SaleLog.sold_at >= cutoff).scalar() or 0
    week_mat_cost = db.query(func.sum(models.SaleLog.mat_cost)).filter(models.SaleLog.sold_at >= cutoff).scalar() or 0
    week_profit   = week_revenue - week_mat_cost
    week_tx       = db.query(func.count(models.SaleLog.id)).filter(models.SaleLog.sold_at >= cutoff).scalar()
    avg_margin    = (total_profit / total_revenue) if total_revenue > 0 else 0

    return {
        "total_recipes":     total_recipes,
        "known_recipes":     known_recipes,
        "total_sales":       total_sales,
        "total_revenue":     total_revenue,
        "total_mat_cost":    total_mat_cost,
        "total_profit":      total_profit,
        "avg_margin":        avg_margin,
        "week_revenue":      week_revenue,
        "week_profit":       week_profit,
        "week_transactions": week_tx,
    }

def get_sales_over_time(db: Session, days: int = 30) -> list:
    cutoff = datetime.utcnow() - timedelta(days=days)
    sales  = (db.query(models.SaleLog)
              .filter(models.SaleLog.sold_at >= cutoff)
              .order_by(models.SaleLog.sold_at)
              .all())
    by_day: dict = {}
    for s in sales:
        day = s.sold_at.strftime("%Y-%m-%d") if s.sold_at else "unknown"
        if day not in by_day:
            by_day[day] = {"date": day, "revenue": 0, "profit": 0, "transactions": 0}
        by_day[day]["revenue"]      += s.sale_price
        by_day[day]["profit"]       += (s.sale_price - s.mat_cost)
        by_day[day]["transactions"] += 1
    return list(by_day.values())

def get_profit_by_profession(db: Session) -> list:
    profs = ["Blacksmithing","Clothing","Woodworking","Jewelrycrafting","Alchemy","Enchanting","Provisioning"]
    results = []
    for prof in profs:
        revenue  = db.query(func.sum(models.SaleLog.sale_price)).filter(models.SaleLog.profession == prof).scalar() or 0
        mat_cost = db.query(func.sum(models.SaleLog.mat_cost)).filter(models.SaleLog.profession == prof).scalar() or 0
        count    = db.query(func.count(models.SaleLog.id)).filter(models.SaleLog.profession == prof).scalar()
        results.append({"profession": prof, "revenue": revenue, "profit": revenue - mat_cost, "transactions": count})
    return results

def get_top_items(db: Session, limit: int = 10) -> list:
    sales = (db.query(
                models.SaleLog.item_name,
                models.SaleLog.profession,
                func.sum(models.SaleLog.sale_price).label("total_revenue"),
                func.sum(models.SaleLog.sale_price - models.SaleLog.mat_cost).label("total_profit"),
                func.count(models.SaleLog.id).label("sales_count"),
             )
             .group_by(models.SaleLog.item_name, models.SaleLog.profession)
             .order_by(desc("total_profit"))
             .limit(limit)
             .all())
    return [
        {
            "item_name":     s.item_name,
            "profession":    s.profession,
            "total_revenue": s.total_revenue,
            "total_profit":  s.total_profit,
            "sales_count":   s.sales_count,
            "margin": (s.total_profit / s.total_revenue) if s.total_revenue > 0 else 0,
        }
        for s in sales
    ]
