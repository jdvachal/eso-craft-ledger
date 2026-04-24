"""
Migration: Add TTC (Tamriel Trade Centre) IDs to materials and recipes.
Run AFTER migrate_traits.py:
  cd backend
  venv\Scripts\activate
  python migrate_ttc.py
"""

from database import engine, SessionLocal, Base
from sqlalchemy import text, inspect
import models

def column_exists(conn, table, column):
    result = conn.execute(text(
        f"SELECT COUNT(*) FROM pragma_table_info('{table}') WHERE name='{column}'"
    ))
    return result.scalar() > 0

def migrate():
    Base.metadata.create_all(bind=engine)
    print("✦ Tables created / verified")

    with engine.connect() as conn:
        # materials: add ttc_item_id, ttc_category_id
        if not column_exists(conn, 'materials', 'ttc_item_id'):
            conn.execute(text("ALTER TABLE materials ADD COLUMN ttc_item_id INTEGER"))
            print("✦ Added ttc_item_id to materials")
        else:
            print("✦ ttc_item_id already exists in materials")

        if not column_exists(conn, 'materials', 'ttc_category_id'):
            conn.execute(text("ALTER TABLE materials ADD COLUMN ttc_category_id INTEGER"))
            print("✦ Added ttc_category_id to materials")
        else:
            print("✦ ttc_category_id already exists in materials")

        # recipes: add ttc_category_id (sell-side category)
        if not column_exists(conn, 'recipes', 'ttc_category_id'):
            conn.execute(text("ALTER TABLE recipes ADD COLUMN ttc_category_id INTEGER"))
            print("✦ Added ttc_category_id to recipes")
        else:
            print("✦ ttc_category_id already exists in recipes")

        conn.commit()

    print("✦ Migration complete — run seed endpoint or restart to reload data")

if __name__ == "__main__":
    migrate()
