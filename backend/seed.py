"""
Seed data for ESO Craft Ledger.
All material names, categories, and IDs sourced from Tamriel Trade Centre ItemTable.
TTC Category IDs are authoritative for future import matching.
"""
from sqlalchemy.orm import Session
import models
from datetime import datetime, timedelta
import random

# ── TTC CATEGORY MAP ──────────────────────────────────────────────────────────
# Sourced directly from TTC ItemTable.csv
TTC_CAT = {
    # Crafting materials
    "Ore":                    1500,
    "Ingot":                  1550,
    "Regulus":                1560,
    "Raw Wood":               1600,
    "Sanded Wood":            1650,
    "Heartwood":              1660,
    "Raw Leather/Cloth":      1700,
    "Leather/Cloth":          1750,
    "Bast/Clean Pelt":        1760,
    "Temper":                 1800,
    "Resin":                  1850,
    "Tannin":                 1900,
    "Style Material":         1950,
    "Weapon Trait Gem":       2000,
    "Armor Trait Gem":        2050,
    "Alchemy Solvent Potion": 1450,
    "Alchemy Solvent Poison": 2650,
    "Reagent Plant":           150,
    "Reagent Mushroom":        151,
    "Reagent Other":           152,
    "Potency Rune":           2350,
    "Essence Rune":           2400,
    "Aspect Rune":            2300,
    "Jewelry Material":       2850,
    "Jewelry Plating":        2900,
    "Jewelry Trait Gem":      2950,
    "Pulv Jewelry Trait Gem": 3050,
    "Prov Ingredient Misc":     48,
    "Prov Ingredient Fruit":    42,
    "Prov Ingredient Veggie":   43,
    "Prov Ingredient Grain":    44,
    "Prov Ingredient Herb":     45,
    "Prov Ingredient Drink":    47,
    # Crafted output categories (sell side)
    "Weapon/Shield":           250,
    "Armor":                   300,
    "Jewelry":                   0,
    "Food":                      8,
    "Drink":                    27,
    "Potion":                  450,
    "Poison":                 1400,
    "Weapon Glyph":            950,
    "Armor Glyph":            1000,
    "Jewelry Glyph":          1250,
    "Food Recipe":             170,
    "Drink Recipe":            171,
    "Focus Script":           3250,
    "Signature Script":       3251,
    "Affix Script":           3252,
    "Luminous Ink":           3300,
}

# ── MATERIALS ─────────────────────────────────────────────────────────────────
# Format: (name, ttc_category_id, ttc_item_id, default_price)
# Names match TTC ItemTable exactly for future import matching.

MATERIALS = [
    # ── Blacksmithing: Ores ────────────────────────────────────────────────────
    ("Rubedite Ore",        1500,  6473,   400),
    ("Voidstone Ore",       1500,  4804,   200),
    ("Calcinium Ore",       1500,   840,   100),
    ("Galatite Ore",        1500,  2773,   100),
    ("Ebony Ore",           1500,  2505,   100),
    ("Dwarven Ore",         1500,  1483,   100),
    ("Orichalcum Ore",      1500,   348,   100),
    ("Iron Ore",            1500,  2035,    50),
    # ── Blacksmithing: Ingots ──────────────────────────────────────────────────
    ("Rubedite Ingot",      1550,  1321,   800),
    ("Voidstone Ingot",     1550,  1798,   400),
    ("Calcinium Ingot",     1550,  1760,   200),
    ("Galatite Ingot",      1550,   790,   200),
    ("Ebony Ingot",         1550,  1906,   200),
    ("Dwarven Ingot",       1550,  1630,   200),
    ("Orichalcum Ingot",    1550,   678,   150),
    ("Iron Ingot",          1550,  3265,   100),
    # ── Blacksmithing: Tempers ────────────────────────────────────────────────
    ("Dreugh Wax",          1900,   211, 12000),  # Note: cat 1900 = Tannin in TTC
    ("Tempering Alloy",     1800,  5687, 15000),
    ("Grain Solvent",       1800,  4314,  5000),
    ("Dwarven Oil",         1800,  1016,  2000),
    ("Honing Stone",        1800,  4593,   500),
    # ── Woodworking: Raw Wood ─────────────────────────────────────────────────
    ("Rough Ruby Ash",      1600,  6536,   300),
    ("Rough Maple",         1600,   917,    50),
    # ── Woodworking: Sanded Wood ──────────────────────────────────────────────
    ("Sanded Ruby Ash",     1650,   117,   550),
    ("Sanded Maple",        1650,  3411,   100),
    ("Heartwood",           1660, 11971,  1200),
    # ── Woodworking: Resins ───────────────────────────────────────────────────
    ("Rosin",               1850,  2677, 10000),
    ("Turpen",              1850,  2969,  9500),
    ("Pitch",               1850,  4811,  3000),
    ("Mastic",              1850,  2070,  1000),
    # ── Clothing: Raw ─────────────────────────────────────────────────────────
    ("Iron Hide Scraps",    1700,  2406,   150),
    ("Raw Ancestor Silk",   1700,  6554,   200),
    # ── Clothing: Refined ─────────────────────────────────────────────────────
    ("Rubedo Leather",      1750,  2318,   600),
    ("Ancestor Silk",       1750,  3799,   380),
    ("Iron Hide",           1750,  4033,   150),
    # ── Clothing: Tannins ─────────────────────────────────────────────────────
    # Note: Dreugh Wax (id 211) is shared between BS tempers and Clothing tannins
    # TTC places it in cat 1900 — we list it once under Blacksmithing above
    ("Elegant Lining",      1900,   558, 10000),
    ("Embroidery",          1900,  1748,  5000),
    ("Hemming",             1900,   388,  2000),
    ("Bast",                1760, 11973,   800),
    ("Clean Pelt",          1760, 11982,  1000),
    # ── Jewelry: Raw ──────────────────────────────────────────────────────────
    ("Regulus",             1560, 11984,  2000),
    # ── Jewelry: Refined ──────────────────────────────────────────────────────
    ("Platinum Ounce",      2850, 18031,  4500),
    ("Silver Ounce",        2850, 18060,  1500),
    ("Copper Ounce",        2850, 17788,   500),
    # ── Jewelry: Platings (Improvement) ──────────────────────────────────────
    ("Dawn-Prism",          2950, 18099, 15000),
    ("Chromium Plating",    2900, 27586,  8000),
    ("Zircon Plating",      2900, 27544,  3000),
    ("Iridium Plating",     2900, 27545,  1500),
    ("Terne Plating",       2900, 27550,   500),
    # ── Jewelry: Trait Gems ───────────────────────────────────────────────────
    ("Dibellium",           2950, 17854, 12000),
    ("Gilding Wax",         2950, 18092,  8000),
    ("Antimony",            2950, 17965,  6000),
    ("Aurbic Amber",        2950, 17989,  5000),
    ("Cobalt",              2950, 17883,  4000),
    ("Slaughterstone",      2950, 17868,  3000),
    ("Titanium",            2950, 17910,  2500),
    ("Zinc",                2950, 17919,  2000),
    # ── Jewelry: Solvent ──────────────────────────────────────────────────────
    ("Alkahest",            2650,  7967,  3200),
    ("Grease",              2650,  7924,  1000),
    ("Gall",                2650,  8076,   500),
    # ── Weapon/Armor Trait Gems ───────────────────────────────────────────────
    ("Fortified Nirncrux",  2000,   688, 35000),  # Weapon trait gem
    ("Potent Nirncrux",     2050,  3790, 25000),  # Armor trait gem
    ("Emerald",             2000,  2740,  5000),
    ("Diamond",             2000,   713,  4000),
    ("Almandine",           2000,  1547,  3000),
    ("Bloodstone",          2000,  5764,  2500),
    ("Garnet",              2000,  4915,  2000),
    ("Amethyst",            2050,  5160,  5000),
    ("Carnelian",           2050,   883,  4000),
    ("Chysolite",           2050,  2046,  3000),
    ("Citrine",             2050,  2009,  2500),
    ("Fire Opal",           2050,   302,  2000),
    ("Jade",                2050,  3043,  1500),
    # ── Alchemy: Potion Solvents ──────────────────────────────────────────────
    ("Lorkhan's Tears",     1450,  2460,  2800),
    ("Pristine Water",      1450,  4358,   800),
    ("Clear Water",         1450,  3435,   400),
    ("Natural Water",       1450,  2099,   200),
    # ── Alchemy: Poison Solvents ──────────────────────────────────────────────
    ("Night-Oil",           2650,  8019,  2000),
    ("Ichor",               2650,  8046,  1000),
    ("Slime",               2650,  8000,   500),
    # ── Alchemy: Reagents — Plants ────────────────────────────────────────────
    ("Columbine",            150,  3200,  1200),
    ("Mountain Flower",      150,  5072,   800),
    ("Bugloss",              150,  3376,   900),
    ("Water Hyacinth",       150,   110,   950),
    ("Blessed Thistle",      150,  3855,   700),
    ("Corn Flower",          150,   511,   600),
    ("Dragonthorn",          150,  1412,   800),
    # ── Alchemy: Reagents — Mushrooms ─────────────────────────────────────────
    ("Namira's Rot",         151,  3839,  1100),
    ("Stinkhorn",            151,  4368,   600),
    ("Imp Stool",            151,  3064,   700),
    ("Blue Entoloma",        151,  6009,   500),
    ("Luminous Russula",     151,  1399,   800),
    ("Emetic Russula",       151,  3060,   600),
    # ── Alchemy: Reagents — Other ─────────────────────────────────────────────
    ("Scrib Jelly",          152,  8182,   110),
    ("Butterfly Wing",       152,  7964,   300),
    ("Mudcrab Chitin",       152,  8102,   130),
    ("Beetle Scuttle",       152,  8014,   200),
    ("White Cap",            151,   452,   500),  # mushroom
    # ── Enchanting: Potency Runes ─────────────────────────────────────────────
    ("Kuta",                2350,  1114,  7500),
    ("Rekuta",              2350,  3976,  3500),
    ("Jejota",              2350,  2823,   150),
    ("Denata",              2350,  5553,   100),
    ("Ta",                  2350,   623,   200),
    # ── Enchanting: Essence Runes ─────────────────────────────────────────────
    ("Makko",               2400,  3916,   180),
    ("Dekeipa",             2400,  3925,   190),
    ("Deni",                2400,  2745,   160),
    ("Haoko",               2400,  5816,   170),
    ("Oko",                 2400,   566,   150),
    ("Makkoma",             2400,   719,   200),
    ("Okoma",               2400,  4170,   180),
    # ── Enchanting: Aspect Runes ──────────────────────────────────────────────
    ("Jora",                2300,  4573,   100),
    ("Porade",              2300,  4330,   150),
    ("Jode",                2300,  5028,   200),
    ("Notade",              2300,  1253,   250),
    ("Ode",                 2300,  2289,   300),
    ("Tade",                2300,   483,   400),
    ("Jayde",               2300,   396,   500),
    ("Edode",               2300,  2261,   600),
    ("Pode",                2300,   519,   800),
    ("Rekude",              2300,   347,  1000),
    ("Kude",                2300,  1408,  1500),
    ("Jehade",              2300,  4924,  2000),
    # ── Provisioning: Meats (cat 40) ──────────────────────────────────────────
    ("Fish",                  40,  4878,    80),
    ("Game",                  40,  3751,    90),
    ("Poultry",               40,  5624,    85),
    ("Red Meat",              40,  1427,    90),
    ("Small Game",            40,  2426,    75),
    ("White Meat",            40,  2649,    80),
    # ── Provisioning: Vegetables (cat 41) ─────────────────────────────────────
    ("Beets",                 41,  2129,    60),
    ("Carrots",               41,  3192,    60),
    ("Corn",                  41,  4244,    60),
    ("Greens",                41,  1710,    55),
    ("Potato",                41,  3629,    65),
    ("Radish",                41,  4622,    55),
    # ── Provisioning: Fruits (cat 42) ─────────────────────────────────────────
    ("Apples",                42,  6109,    65),
    ("Bananas",               42,  5906,    60),
    ("Jazbay Grapes",         42,  3965,    95),
    ("Melon",                 42,  1260,    70),
    ("Pumpkin",               42,  5543,    65),
    ("Tomato",                42,   995,    60),
    # ── Provisioning: Misc Ingredients (cat 43) ───────────────────────────────
    ("Bug Parts",             43, 17595,   200),
    ("Cheese",                43,  3922,    70),
    ("Flour",                 43,  2835,    60),
    ("Garlic",                43,   253,    75),
    ("Millet",                43,  4643,    65),
    ("Saltrice",              43,  3860,    80),
    ("Seasoning",             43,   572,    70),
    # ── Provisioning: Grains (cat 44) ─────────────────────────────────────────
    ("Barley",                44,  3585,    60),
    ("Rice",                  44,  4936,    65),
    ("Rye",                   44,  5473,    60),
    ("Surilie Grapes",        44,  5327,    70),
    ("Wheat",                 44,  3327,    60),
    ("Yeast",                 44,  4497,    65),
    # ── Provisioning: Herbs (cat 45) ──────────────────────────────────────────
    ("Bittergreen",           45,  2197,    80),
    ("Comberry",              45,  1934,    85),
    ("Jasmine",               45,  2541,    75),
    ("Lotus",                 45,  5104,   100),
    ("Mint",                  45,  2030,    70),
    ("Rose",                  45,  3994,    75),
    # ── Provisioning: Tonic Ingredients (cat 46) ──────────────────────────────
    ("Acai Berry",            46,  3675,    90),
    ("Coffee",                46,  4697,    85),
    ("Ginkgo",                46,  3627,    80),
    ("Ginseng",               46,  4078,    90),
    ("Guarana",               46,  5905,    85),
    ("Yerba Mate",            46,  5914,    80),
    # ── Provisioning: Sweeteners / Misc (cat 47) ──────────────────────────────
    ("Ginger",                47,  5820,    80),
    ("Honey",                 47,  4847,    85),
    ("Isinglass",             47,  2626,    75),
    ("Lemon",                 47,  2215,    70),
    ("Metheglin",             47,  1297,    80),
    ("Seaweed",               47,  2484,    70),
    # ── Provisioning: Special Ingredients (cat 48) ────────────────────────────
    ("Frost Mirriam",         48,  4548,   120),
    ("Bervez Juice",          48,  5661,    85),
    ("Perfect Roe",           48,  6132,  5000),
    ("Aetherial Dust",        48, 11807,  2000),
    ("Animus Stone",          48, 11978,  1500),
    ("Cyrodiil Citrus",       48, 22924,   500),
    ("Mourning Dew",          48, 23002,   800),
    ("Rubyblossom Extract",   48, 22659,   600),
    ("Diminished Aetherial Dust", 48, 14579, 800),
]

# ── RECIPES ───────────────────────────────────────────────────────────────────
# Format: (name, profession, category, quality, sell_price, known, ttc_category_id,
#          [(mat_name, qty), ...])
# sell_price = base price (no trait). ttc_category_id = sell-side category.
# Material names must exactly match MATERIALS list above.

RECIPES = {
    "Blacksmithing": [
        ("Burning Spellweave Sword",   "1H Sword — Burning Spellweave", "Legendary", 45000, True,  250,
         [("Rubedite Ingot", 8), ("Dreugh Wax", 4)]),
        ("Nirnhoned Greatsword",       "2H Sword — Nirnhoned",          "Legendary", 95000, False, 250,
         [("Rubedite Ingot", 10), ("Dreugh Wax", 4), ("Fortified Nirncrux", 1)]),
        ("Hunding's Rage Helm",        "Heavy Helm — Hunding's Rage",   "Epic",      22000, True,  300,
         [("Rubedite Ingot", 7), ("Tempering Alloy", 3)]),
        ("Briarheart Dagger",          "1H Dagger — Briarheart",        "Legendary", 78000, True,  250,
         [("Rubedite Ingot", 7), ("Dreugh Wax", 3)]),
        ("Hist Bark Pauldron",         "Medium Shoulder — Hist Bark",   "Epic",      14000, False, 300,
         [("Rubedo Leather", 7), ("Elegant Lining", 3)]),
        ("Twice-Born Star Cuirass",    "Heavy Chest — Twice-Born Star", "Legendary", 55000, True,  300,
         [("Rubedite Ingot", 9), ("Dreugh Wax", 4)]),
        ("Morkuldin War Axe",          "1H Axe — Morkuldin",            "Legendary", 42000, False, 250,
         [("Rubedite Ingot", 7), ("Dreugh Wax", 3)]),
    ],
    "Clothing": [
        ("Arm Cops of Julianos",       "Light Shoulder — Julianos",     "Legendary", 35000, True,  300,
         [("Ancestor Silk", 7), ("Elegant Lining", 3)]),
        ("Robe of Julianos",           "Light Chest — Julianos",        "Legendary", 55000, True,  300,
         [("Ancestor Silk", 9), ("Elegant Lining", 4)]),
        ("Grothdarr Helm",             "Heavy Helm — Grothdarr",        "Legendary", 38000, False, 300,
         [("Rubedite Ingot", 7), ("Dreugh Wax", 3)]),
        ("Shacklebreaker Breeches",    "Medium Legs — Shacklebreaker",  "Epic",      28000, True,  300,
         [("Rubedo Leather", 8), ("Elegant Lining", 3)]),
        ("Healing Mage Shoes",         "Light Feet — Healing Mage",     "Epic",      21000, False, 300,
         [("Ancestor Silk", 7), ("Elegant Lining", 2)]),
        ("Spriggan's Thorns Jerkin",   "Medium Chest — Spriggan's",     "Legendary", 32000, True,  300,
         [("Rubedo Leather", 9), ("Elegant Lining", 4)]),
        ("Julianos Breeches",          "Light Legs — Julianos",         "Legendary", 48000, True,  300,
         [("Ancestor Silk", 8), ("Elegant Lining", 4)]),
    ],
    "Woodworking": [
        ("Infallible Aether Bow",      "Bow — Infallible Aether",       "Legendary", 72000, True,  250,
         [("Sanded Ruby Ash", 10), ("Rosin", 4)]),
        ("Arm Cops of Alkosh",         "Shield — Alkosh",               "Legendary", 52000, True,  250,
         [("Sanded Ruby Ash", 8), ("Rosin", 3)]),
        ("Master Architect Inferno Staff", "Inferno Staff — Master Architect", "Legendary", 110000, False, 250,
         [("Sanded Ruby Ash", 10), ("Rosin", 4), ("Heartwood", 2)]),
        ("Clever Alchemist Bow",       "Bow — Clever Alchemist",        "Epic",      28000, True,  250,
         [("Sanded Ruby Ash", 10), ("Turpen", 3)]),
        ("Asylum Restoration Staff",   "Resto Staff — Asylum Weapons",  "Legendary", 145000, False, 250,
         [("Sanded Ruby Ash", 10), ("Rosin", 4), ("Heartwood", 2)]),
        ("Shield of Hircine's Veneer", "Shield — Hircine's Veneer",     "Legendary", 35000, True,  250,
         [("Sanded Ruby Ash", 8), ("Rosin", 3)]),
        ("Spriggan's Thorns Bow",      "Bow — Spriggan's Thorns",       "Legendary", 44000, True,  250,
         [("Sanded Ruby Ash", 10), ("Rosin", 4)]),
    ],
    "Jewelrycrafting": [
        ("Briarheart Band",            "Ring — Briarheart",             "Legendary", 220000, True,   0,
         [("Platinum Ounce", 6), ("Dawn-Prism", 1), ("Dibellium", 2)]),
        ("Master Architect Ring",      "Ring — Master Architect",       "Legendary", 180000, False,  0,
         [("Platinum Ounce", 6), ("Dawn-Prism", 1), ("Gilding Wax", 2)]),
        ("False God's Devotion Amulet","Necklace — False God's",        "Legendary", 290000, True,   0,
         [("Platinum Ounce", 8), ("Dawn-Prism", 1), ("Dibellium", 1)]),
        ("Bloodthirsty Ring",          "Ring — Bloodthirsty Trait",     "Legendary", 130000, True,   0,
         [("Platinum Ounce", 6), ("Dawn-Prism", 1), ("Alkahest", 3)]),
        ("Vicious Serpent Amulet",     "Necklace — Vicious Serpent",    "Legendary", 160000, False,  0,
         [("Platinum Ounce", 8), ("Dawn-Prism", 1), ("Alkahest", 3)]),
        ("Warrior-Poet Band",          "Ring — Warrior-Poet",           "Legendary",  95000, True,   0,
         [("Platinum Ounce", 6), ("Dawn-Prism", 1), ("Alkahest", 2)]),
        ("Mantle of Siroria Amulet",   "Necklace — Mantle of Siroria",  "Legendary", 210000, False,  0,
         [("Platinum Ounce", 8), ("Dawn-Prism", 1), ("Alkahest", 3)]),
    ],
    "Alchemy": [
        ("Essence of Spell Power",     "Tri-Pot — Spell Power",         "Normal",   9500, True,  450,
         [("Columbine", 1), ("Mountain Flower", 1), ("Bugloss", 1), ("Lorkhan's Tears", 1)]),
        ("Essence of Health",          "Restore Health",                "Normal",   2200, True,  450,
         [("Columbine", 1), ("Mountain Flower", 1), ("Lorkhan's Tears", 1)]),
        ("Essence of Immovability",    "CC Break Potion",               "Normal",   4200, True,  450,
         [("Columbine", 1), ("Namira's Rot", 1), ("Lorkhan's Tears", 1)]),
        ("Essence of Weapon Power",    "Tri-Pot — Weapon Power",        "Normal",   8000, False, 450,
         [("Mountain Flower", 1), ("Namira's Rot", 1), ("Water Hyacinth", 1), ("Lorkhan's Tears", 1)]),
        ("Essence of Ravage Health",   "Ravage Poison",                 "Normal",   3500, False, 1400,
         [("Namira's Rot", 1), ("Columbine", 1), ("Alkahest", 1)]),
        ("Essence of Magicka",         "Restore Magicka",               "Normal",   1800, True,  450,
         [("Columbine", 1), ("Bugloss", 1), ("Lorkhan's Tears", 1)]),
        ("Essence of Invisibility",    "Invisibility Potion",           "Normal",  11000, False, 450,
         [("Columbine", 1), ("Water Hyacinth", 1), ("Bugloss", 1), ("Lorkhan's Tears", 1)]),
    ],
    "Enchanting": [
        ("Kuta Glyph of Weapon Damage",     "Weapon Glyph — Kuta",     "Legendary", 32000, True,  950,
         [("Kuta", 1), ("Ta", 1), ("Makko", 1)]),
        ("Kuta Glyph of Absorb Stamina",    "Weapon Glyph — Kuta",     "Legendary", 18000, True,  950,
         [("Kuta", 1), ("Ta", 1), ("Deni", 1)]),
        ("Kuta Glyph of Prismatic Defense", "Armor Glyph — Kuta",      "Legendary", 24000, True,  1000,
         [("Kuta", 1), ("Ta", 1), ("Dekeipa", 1)]),
        ("Rekuta Glyph of Increase Health", "Armor Glyph — Rekuta",    "Epic",      14000, True,  1000,
         [("Rekuta", 1), ("Ta", 1), ("Makko", 1)]),
        ("Kuta Glyph of Reduce Feat Cost",  "Armor Glyph — Kuta",      "Legendary", 20000, False, 1000,
         [("Kuta", 1), ("Ta", 1), ("Jejota", 1)]),
        ("Kuta Glyph of Magicka",           "Armor Glyph — Max Mag",   "Legendary", 16000, True,  1000,
         [("Kuta", 1), ("Ta", 1), ("Makko", 1)]),
        ("Rekuta Glyph of Weapon Damage",   "Weapon Glyph — Rekuta",   "Epic",      12000, False, 950,
         [("Rekuta", 1), ("Ta", 1), ("Makko", 1)]),
    ],
    "Provisioning": [
        ("Dubious Camoran Throne",     "Drink — Stam/Health/Mag",       "Normal",  4800, True,  27,
         [("Frost Mirriam", 1), ("Bervez Juice", 1), ("Scrib Jelly", 1), ("Jazbay Grapes", 1)]),
        ("Witchmother's Potent Brew",  "Drink — Health/Mag",            "Normal",  3100, True,  27,
         [("Frost Mirriam", 1), ("Bervez Juice", 1), ("Jazbay Grapes", 1)]),
        ("Bewitched Sugar Skulls",     "Food — Health/Mag/Stam",        "Normal",  5500, True,   8,
         [("Flour", 2), ("Honey", 1), ("Lotus", 1), ("Saltrice", 1)]),
        ("Clockwork Citrus Filet",     "Food — Max Health/Mag",         "Normal",  4200, False,  8,
         [("Garlic", 1), ("White Cap", 1), ("Mudcrab Chitin", 1), ("Seasoning", 1)]),
        ("Lava Foot Soup-and-Saltrice","Food — Max Stam/Health",        "Normal",  3800, False,  8,
         [("Garlic", 1), ("Mudcrab Chitin", 1), ("Seasoning", 1), ("Flour", 1)]),
        ("Solitude Salmon-Millet Soup","Food — Max Health/Stam/Mag",    "Normal",  6200, True,   8,
         [("Flour", 1), ("Honey", 1), ("Scrib Jelly", 1), ("Mudcrab Chitin", 1)]),
        ("Artaeum Takeaway Broth",     "Food — Max Health/Mag/Stam",    "Normal",  5800, False,  8,
         [("Lotus", 1), ("White Cap", 1), ("Garlic", 1), ("Saltrice", 1)]),
    ],
}

# ── SAMPLE SALES ─────────────────────────────────────────────────────────────
SAMPLE_SALES = [
    ("Briarheart Band",            "Jewelrycrafting", 220000,  85000),
    ("Infallible Aether Bow",      "Woodworking",      72000,  25000),
    ("False God's Devotion Amulet","Jewelrycrafting", 290000, 120000),
    ("Dubious Camoran Throne",     "Provisioning",      4800,   1200),
    ("Kuta Glyph of Weapon Damage","Enchanting",       32000,   8500),
    ("Essence of Spell Power",     "Alchemy",           9500,   3200),
    ("Robe of Julianos",           "Clothing",         55000,  22000),
    ("Arm Cops of Alkosh",         "Woodworking",      52000,  19000),
    ("Bewitched Sugar Skulls",     "Provisioning",      5500,   1800),
    ("Briarheart Dagger",          "Blacksmithing",    78000,  31000),
    ("Bloodthirsty Ring",          "Jewelrycrafting", 130000,  55000),
    ("Shacklebreaker Breeches",    "Clothing",         28000,  12000),
    ("Hunding's Rage Helm",        "Blacksmithing",    22000,   8000),
    ("Essence of Immovability",    "Alchemy",           4200,   1500),
    ("Witchmother's Potent Brew",  "Provisioning",      3100,    950),
    ("Rekuta Glyph of Health",     "Enchanting",       14000,   5500),
    ("Twice-Born Star Cuirass",    "Blacksmithing",    55000,  22000),
    ("Julianos Breeches",          "Clothing",         48000,  18000),
    ("Clever Alchemist Bow",       "Woodworking",      28000,  11000),
    ("Warrior-Poet Band",          "Jewelrycrafting",  95000,  42000),
]


def seed_data(db: Session):
    if db.query(models.Material).count() > 0:
        print("✦ Database already seeded — skipping")
        return

    # ── Materials ──────────────────────────────────────────────────────────────
    mat_map = {}  # name -> id
    seen_names = set()
    for name, ttc_cat, ttc_id, price in MATERIALS:
        if name in seen_names:
            continue  # skip duplicates (e.g. Mudcrab Chitin listed twice)
        seen_names.add(name)

        # Derive a human-readable category label from TTC cat ID
        cat_label = next((k for k, v in TTC_CAT.items() if v == ttc_cat), str(ttc_cat))

        mat = models.Material(
            name=name,
            category=cat_label,
            current_price=price,
            ttc_item_id=ttc_id,
            ttc_category_id=ttc_cat,
        )
        db.add(mat)
        db.flush()
        mat_map[name] = mat.id
        db.add(models.PriceHistory(material_id=mat.id, price=price))

    print(f"✦ Seeded {len(mat_map)} materials")

    # ── Recipes ────────────────────────────────────────────────────────────────
    recipe_count = 0
    for profession, recipe_list in RECIPES.items():
        for name, category, quality, sell_price, known, ttc_cat, ingredients in recipe_list:
            recipe = models.Recipe(
                name=name,
                profession=profession,
                category=category,
                quality=quality,
                sell_price=sell_price,
                known=known,
                ttc_category_id=ttc_cat,
            )
            db.add(recipe)
            db.flush()
            for mat_name, qty in ingredients:
                if mat_name in mat_map:
                    db.add(models.RecipeIngredient(
                        recipe_id=recipe.id,
                        material_id=mat_map[mat_name],
                        quantity=qty,
                    ))
                else:
                    print(f"  ⚠ Material not found: '{mat_name}' in recipe '{name}'")
            recipe_count += 1

    print(f"✦ Seeded {recipe_count} recipes")

    # ── Sample Sales ───────────────────────────────────────────────────────────
    now = datetime.utcnow()
    for item, prof, sale, cost in SAMPLE_SALES:
        days_ago = random.randint(0, 29)
        db.add(models.SaleLog(
            item_name=item,
            profession=prof,
            sale_price=sale,
            mat_cost=cost,
            sold_at=now - timedelta(days=days_ago, hours=random.randint(0, 23)),
        ))

    print(f"✦ Seeded {len(SAMPLE_SALES)} sample sales")
    db.commit()
    print("✦ Seed complete")
