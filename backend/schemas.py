from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── TRAIT ─────────────────────────────────────────────────────────────────────

class Trait(BaseModel):
    id:         int
    name:       str
    trait_type: str

    class Config:
        from_attributes = True


# ── RECIPE TRAIT PRICE ────────────────────────────────────────────────────────

class RecipeTraitPriceBase(BaseModel):
    trait_id:   int
    sell_price: float
    notes:      str = ""

class RecipeTraitPriceCreate(RecipeTraitPriceBase):
    pass

class RecipeTraitPriceUpdate(BaseModel):
    sell_price: Optional[float] = None
    notes:      Optional[str]   = None

class RecipeTraitPrice(RecipeTraitPriceBase):
    id:        int
    recipe_id: int
    trait:     Optional[Trait] = None

    class Config:
        from_attributes = True


# ── MATERIAL ──────────────────────────────────────────────────────────────────

class MaterialBase(BaseModel):
    name:             str
    category:         str
    current_price:    float = 0
    ttc_item_id:      Optional[int] = None
    ttc_category_id:  Optional[int] = None
    notes:            str = ""

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name:             Optional[str]   = None
    category:         Optional[str]   = None
    current_price:    Optional[float] = None
    ttc_item_id:      Optional[int]   = None
    ttc_category_id:  Optional[int]   = None
    notes:            Optional[str]   = None

class Material(MaterialBase):
    id:         int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── PRICE HISTORY ─────────────────────────────────────────────────────────────

class PriceHistoryCreate(BaseModel):
    price: float

class PriceHistory(BaseModel):
    id: int
    material_id: int
    price: float
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── RECIPE INGREDIENT ─────────────────────────────────────────────────────────

class IngredientBase(BaseModel):
    material_id: int
    quantity: float = 1

class IngredientCreate(IngredientBase):
    pass

class IngredientWithMaterial(BaseModel):
    id: int
    material_id: int
    quantity: float
    material: Material

    class Config:
        from_attributes = True


# ── RECIPE ────────────────────────────────────────────────────────────────────

class RecipeBase(BaseModel):
    name:             str
    profession:       str
    category:         str = ""
    quality:          str = "Normal"
    sell_price:       float = 0
    known:            bool = False
    ttc_category_id:  Optional[int] = None
    notes:            str = ""

class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []

class RecipeUpdate(BaseModel):
    name:             Optional[str]               = None
    profession:       Optional[str]               = None
    category:         Optional[str]               = None
    quality:          Optional[str]               = None
    sell_price:       Optional[float]             = None
    known:            Optional[bool]              = None
    ttc_category_id:  Optional[int]               = None
    notes:            Optional[str]               = None
    ingredients:      Optional[List[IngredientCreate]] = None

class ToggleKnown(BaseModel):
    known: bool

class Recipe(RecipeBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecipeWithDetails(Recipe):
    ingredients:  List[IngredientWithMaterial] = []
    trait_prices: List[RecipeTraitPrice] = []
    mat_cost: float = 0
    profit:   float = 0
    margin:   float = 0

    class Config:
        from_attributes = True


# ── SALES LOG ─────────────────────────────────────────────────────────────────

class SaleBase(BaseModel):
    item_name:  str
    profession: str = ""
    sale_price: float
    mat_cost:   float = 0
    notes:      str = ""

class SaleCreate(SaleBase):
    recipe_id: Optional[int] = None
    trait_id:  Optional[int] = None
    sold_at:   Optional[datetime] = None

class SaleUpdate(BaseModel):
    item_name:  Optional[str]      = None
    profession: Optional[str]      = None
    sale_price: Optional[float]    = None
    mat_cost:   Optional[float]    = None
    trait_id:   Optional[int]      = None
    notes:      Optional[str]      = None
    sold_at:    Optional[datetime] = None

class SaleWithDetails(SaleBase):
    id:        int
    recipe_id: Optional[int]      = None
    trait_id:  Optional[int]      = None
    trait:     Optional[Trait]    = None
    sold_at:   Optional[datetime] = None
    profit:    float = 0
    margin:    float = 0

    class Config:
        from_attributes = True
