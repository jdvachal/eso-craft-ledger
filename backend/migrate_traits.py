"""
Add traits support to ESO Craft Ledger.
Run this once to migrate an existing database:
  cd backend
  venv\Scripts\activate
  python migrate_traits.py
"""

from database import engine, SessionLocal, Base
import models
from sqlalchemy import text

def migrate():
    # Create new tables
    Base.metadata.create_all(bind=engine)
    print("✦ Tables created / verified")

    db = SessionLocal()

    # Check if traits already seeded
    if db.query(models.Trait).count() > 0:
        print("✦ Traits already seeded — skipping")
        db.close()
        return

    TRAITS = [
        # Weapon traits
        (0,  "Powered",       "Weapon"),
        (1,  "Charged",       "Weapon"),
        (2,  "Precise",       "Weapon"),
        (3,  "Infused",       "Any"),       # Weapon + Armor
        (4,  "Defending",     "Weapon"),
        (5,  "Training",      "Any"),       # Weapon + Armor
        (6,  "Sharpened",     "Weapon"),
        (7,  "Decisive",      "Weapon"),
        # Armor traits
        (8,  "Sturdy",        "Armor"),
        (9,  "Impenetrable",  "Armor"),
        (10, "Reinforced",    "Armor"),
        (11, "Well-Fitted",   "Armor"),
        (12, "Invigorating",  "Armor"),
        (13, "Divines",       "Armor"),
        (14, "Nirnhoned",     "Any"),       # Weapon + Armor
        (15, "Intricate",     "Any"),       # Weapon + Armor
        (16, "Ornate",        "Any"),       # Weapon + Armor
        # Jewelry traits
        (17, "Arcane",        "Jewelry"),
        (18, "Healthy",       "Jewelry"),
        (19, "Robust",        "Jewelry"),
        # ID 20 is unused/gap in ESO data
        (21, "Bloodthirsty",  "Jewelry"),
        (22, "Harmony",       "Jewelry"),
        (23, "Protective",    "Jewelry"),
        (24, "Swift",         "Jewelry"),
        (25, "Triune",        "Jewelry"),
        # Companion gear traits
        (26, "Aggressive",    "Companion"),
        (27, "Augmented",     "Companion"),
        (28, "Bolstered",     "Companion"),
        (29, "Focused",       "Companion"),
        (30, "Prolific",      "Companion"),
        (31, "Quickened",     "Companion"),
        (32, "Shattering",    "Companion"),
        (33, "Soothing",      "Companion"),
        (34, "Vigorous",      "Companion"),
    ]

    for trait_id, name, trait_type in TRAITS:
        trait = models.Trait(id=trait_id, name=name, trait_type=trait_type)
        db.add(trait)

    db.commit()
    print(f"✦ Seeded {len(TRAITS)} traits")

    # Add trait_id column to sales_log if it doesn't exist yet
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE sales_log ADD COLUMN trait_id INTEGER REFERENCES traits(id)"))
            conn.commit()
        print("✦ Added trait_id column to sales_log")
    except Exception:
        print("✦ trait_id column already exists in sales_log — skipping")

    db.close()
    print("✦ Migration complete")

if __name__ == "__main__":
    migrate()
