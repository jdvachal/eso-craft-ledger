from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Trait(Base):
    __tablename__ = "traits"

    id         = Column(Integer, primary_key=True, index=True)  # matches ESO TraitID
    name       = Column(String, unique=True, nullable=False)
    trait_type = Column(String, nullable=False)  # Weapon / Armor / Jewelry / Companion / Any

    trait_prices = relationship("RecipeTraitPrice", back_populates="trait")
    sales        = relationship("SaleLog", back_populates="trait")


class RecipeTraitPrice(Base):
    __tablename__ = "recipe_trait_prices"

    id         = Column(Integer, primary_key=True, index=True)
    recipe_id  = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    trait_id   = Column(Integer, ForeignKey("traits.id"), nullable=False)
    sell_price = Column(Float, nullable=False)
    notes      = Column(Text, default="")

    recipe = relationship("Recipe", back_populates="trait_prices")
    trait  = relationship("Trait", back_populates="trait_prices")


class Material(Base):
    __tablename__ = "materials"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, unique=True, index=True, nullable=False)
    category        = Column(String, nullable=False)
    current_price   = Column(Float, default=0)
    ttc_item_id     = Column(Integer, nullable=True, index=True)
    ttc_category_id = Column(Integer, nullable=True, index=True)
    notes           = Column(Text, default="")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    ingredients   = relationship("RecipeIngredient", back_populates="material")
    price_history = relationship("PriceHistory", back_populates="material", cascade="all, delete-orphan")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id          = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    price       = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("Material", back_populates="price_history")


class Recipe(Base):
    __tablename__ = "recipes"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False, index=True)
    profession      = Column(String, nullable=False, index=True)
    category        = Column(String, default="")
    quality         = Column(String, default="Normal")
    sell_price      = Column(Float, default=0)
    known           = Column(Boolean, default=False)
    ttc_category_id = Column(Integer, nullable=True)
    notes           = Column(Text, default="")
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    ingredients  = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    sales        = relationship("SaleLog", back_populates="recipe")
    trait_prices = relationship("RecipeTraitPrice", back_populates="recipe", cascade="all, delete-orphan")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id          = Column(Integer, primary_key=True, index=True)
    recipe_id   = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity    = Column(Float, default=1)

    recipe   = relationship("Recipe", back_populates="ingredients")
    material = relationship("Material", back_populates="ingredients")


class SaleLog(Base):
    __tablename__ = "sales_log"

    id         = Column(Integer, primary_key=True, index=True)
    recipe_id  = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    trait_id   = Column(Integer, ForeignKey("traits.id"), nullable=True)
    item_name  = Column(String, nullable=False)
    profession = Column(String, default="")
    sale_price = Column(Float, nullable=False)
    mat_cost   = Column(Float, default=0)
    sold_at    = Column(DateTime(timezone=True), server_default=func.now())
    notes      = Column(Text, default="")

    recipe = relationship("Recipe", back_populates="sales")
    trait  = relationship("Trait", back_populates="sales")
