# EsoCraftLedger ESO Addon

Exports crafting recipe data from Elder Scrolls Online for import into the ESO Craft Ledger app.

## Installation

1. Copy the `EsoCraftLedger` folder to your ESO addons directory:
   ```
   Documents\Elder Scrolls Online\live\AddOns\EsoCraftLedger\
   ```
   The folder should contain:
   - `EsoCraftLedger.txt`
   - `EsoCraftLedger.lua`

2. Launch ESO and enable the addon in the AddOns menu on the character select screen.

## Usage

1. Log in to the character whose recipes you want to export
2. Type in chat: `/craftledger export`
3. Wait for the green "Export complete!" message in chat
4. Type: `/reloadui`
5. Find the exported file at:
   ```
   Documents\Elder Scrolls Online\live\SavedVariables\EsoCraftLedgerData.lua
   ```
6. Upload that file to the ESO Craft Ledger app

## What Gets Exported

- **Provisioning** — all known food and drink recipes with ingredients
- **Blacksmithing** — all craftable set patterns with materials
- **Clothing** — all craftable set patterns with materials
- **Woodworking** — all craftable set patterns with materials
- **Jewelrycrafting** — all craftable set patterns with materials
- **Alchemy** — all discovered potion and poison combinations with reagents
- **Enchanting** — all known rune combinations producing Legendary glyphs

## Notes

- Run the export while logged into each character that has different known recipes
- The export captures the character name so the app can track per-character known recipes
- Alchemy exports discovered combinations only — undiscovered ones won't appear
- Gear set recipes export all slots (helm, chest, legs, etc.) for each known set
- Type `/craftledger status` to check when the last export was run
