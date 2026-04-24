-- EsoCraftLedger.lua
-- Exports crafting recipe and known-recipe data for import into ESO Craft Ledger
--
-- USAGE:
--   Provisioning / Alchemy / Enchanting: run anywhere
--   Smithing (BS / Clothing / WW / JC):  must be AT a crafting station of that type
--
--   /craftledger             -- show help
--   /craftledger export      -- export everything possible
--   /craftledger provisioning
--   /craftledger smithing    -- must be at a station
--   /craftledger enchanting
--   /craftledger alchemy
--   /craftledger status
--   /reloadui                -- saves data to disk after export

local ADDON_NAME    = "EsoCraftLedger"
local ADDON_VERSION = "1.0.2"

EsoCraftLedgerData = EsoCraftLedgerData or {}

-- ── Helpers ───────────────────────────────────────────────────────────────────

local function safe(s)
    if s == nil then return "" end
    return tostring(s)
end

local function msg(text, color)
    color = color or "00CC66"
    d("|c" .. color .. "[CraftLedger]|r " .. tostring(text))
end

-- ── Crafting type constants (verified in-game) ────────────────────────────────
-- CRAFTING_TYPE_BLACKSMITHING   = 1
-- CRAFTING_TYPE_CLOTHIER        = 2
-- CRAFTING_TYPE_ENCHANTING      = 3
-- CRAFTING_TYPE_ALCHEMY         = 4
-- CRAFTING_TYPE_PROVISIONING    = 5
-- CRAFTING_TYPE_WOODWORKING     = 6
-- CRAFTING_TYPE_JEWELRYCRAFTING = 7

local SMITHING_NAMES = {
    [1] = "Blacksmithing",
    [2] = "Clothing",
    [6] = "Woodworking",
    [7] = "Jewelrycrafting",
}

-- ── Provisioning ──────────────────────────────────────────────────────────────
-- GetNumRecipeLists() -> integer
-- GetRecipeListInfo(listIdx) -> string listName, integer numRecipes
-- GetRecipeInfo(listIdx, recipeIdx)
--   -> bool known, string name, integer numIngredients,
--      integer levelReq, integer qualityReq, specialIngredientType
-- GetRecipeIngredientItemInfo(listIdx, recipeIdx, ingIdx)
--   -> string name, icon, integer requiredQty, bag, slot

local function exportProvisioning(results)
    local count = 0
    local numLists = GetNumRecipeLists()
    for listIdx = 1, numLists do
        local listName, numRecipes = GetRecipeListInfo(listIdx)
        for recipeIdx = 1, numRecipes do
            local known, name, numIngredients = GetRecipeInfo(listIdx, recipeIdx)
            if name and name ~= "" then
                local ings = {}
                for ingIdx = 1, numIngredients do
                    local ingName, _, qty = GetRecipeIngredientItemInfo(
                        listIdx, recipeIdx, ingIdx)
                    if ingName and ingName ~= "" then
                        table.insert(ings, { name = safe(ingName), quantity = qty or 1 })
                    end
                end
                table.insert(results, {
                    name        = safe(name),
                    profession  = "Provisioning",
                    category    = safe(listName or ""),
                    known       = known == true,
                    ingredients = ings,
                })
                count = count + 1
            end
        end
    end
    msg("Provisioning: " .. count .. " recipes")
    return count
end

-- ── Smithing ──────────────────────────────────────────────────────────────────
-- Must be called while AT a crafting station.
-- GetCraftingInteractionType() -> integer (1=BS, 2=Clothing, 6=WW, 7=JC)
-- GetNumSmithingPatterns() -> integer (patterns for CURRENT station)
-- GetSmithingPatternInfo(patternIndex)
--   -> string patternName, string baseName, icon,
--      integer numMaterials, integer numTraitsRequired, integer numTraitsKnown,
--      ItemFilterType resultItemFilterType
-- GetSmithingPatternMaterialItemInfo(patternIndex, materialIndex)
--   -> string name, icon, integer quantity, bag, slot

local function exportSmithing(results)
    local craftType = GetCraftingInteractionType()
    local profName  = craftType and SMITHING_NAMES[craftType]

    if not profName then
        msg("Not at a smithing station. Open a BS/Clothing/WW/JC station first.", "FF8800")
        return 0
    end

    local numPatterns = GetNumSmithingPatterns()
    if not numPatterns or numPatterns == 0 then
        msg(profName .. ": 0 patterns found at this station.", "FF8800")
        return 0
    end

    local count = 0
    for patIdx = 1, numPatterns do
        local patName, baseName, _, numMaterials, numTraitsReq, numTraitsKnown =
            GetSmithingPatternInfo(patIdx)

        if patName and patName ~= "" then
            -- Collect all material tiers; highest index = CP160 material
            local ings = {}
            local topMat, topQty = nil, 1
            for matIdx = 1, (numMaterials or 1) do
                local mn, _, mq = GetSmithingPatternMaterialItemInfo(patIdx, matIdx)
                if mn and mn ~= "" then
                    topMat = mn
                    topQty = mq or 1
                    table.insert(ings, { name = safe(mn), quantity = mq or 1 })
                end
            end

            -- Use only the highest-tier ingredient (CP160) as recipe ingredient
            local cp160Ings = {}
            if topMat then
                table.insert(cp160Ings, { name = safe(topMat), quantity = topQty })
            end

            table.insert(results, {
                name           = safe(patName),
                baseName       = safe(baseName or ""),
                profession     = profName,
                category       = safe(patName),
                known          = true,
                traitsRequired = numTraitsReq or 0,
                traitsKnown    = numTraitsKnown or 0,
                ingredients    = cp160Ings,
                allMaterials   = ings,
            })
            count = count + 1
        end
    end

    msg(profName .. ": " .. count .. " patterns")
    return count
end

-- ── Enchanting ────────────────────────────────────────────────────────────────
-- The ESO API has no GetNumEnchantingRunes() function.
-- Instead we scan the player's bags and craft bag for rune items by item type.
-- This approach is used by CraftStore and works anywhere (no station required).
--
-- Item type constants (verified in-game via /script d()):
--   ITEMTYPE_ENCHANTING_RUNE_POTENCY = 51
--   ITEMTYPE_ENCHANTING_RUNE_ESSENCE = 53
--   ITEMTYPE_ENCHANTING_RUNE_ASPECT  = 52
--
-- Rune classification constants (verified in-game):
--   ENCHANTING_RUNE_POTENCY = 3
--   ENCHANTING_RUNE_ESSENCE = 2
--   ENCHANTING_RUNE_ASPECT  = 1
--
-- GetItemLinkEnchantingRuneClassification(itemLink) -> integer (1, 2, or 3)

local RUNE_ITEMTYPE_POTENCY = 51
local RUNE_ITEMTYPE_ESSENCE = 53
local RUNE_ITEMTYPE_ASPECT  = 52

local RUNE_CLASS_POTENCY = 3
local RUNE_CLASS_ESSENCE = 2
local RUNE_CLASS_ASPECT  = 1

local function exportEnchanting(results)
    -- runesByType[runeClass] = { [name] = runeEntry }
    -- Keys use verified integer values, not potentially-wrong constants
    local runesByType = {
        [RUNE_CLASS_POTENCY] = {},
        [RUNE_CLASS_ESSENCE] = {},
        [RUNE_CLASS_ASPECT]  = {},
    }

    -- Use SHARED_INVENTORY:GenerateFullSlotData to scan all bags including
    -- BAG_VIRTUAL (ESO+ craft bag), BAG_BANK, and BAG_BACKPACK in one call.
    -- This is the same approach used by CraftStore.
    local allSlots = SHARED_INVENTORY:GenerateFullSlotData(
        nil,
        BAG_BACKPACK,
        BAG_BANK,
        BAG_SUBSCRIBER_BANK,
        BAG_VIRTUAL
    )

    for _, slotData in pairs(allSlots) do
        local itemType = slotData.itemType
        if itemType == RUNE_ITEMTYPE_POTENCY or
           itemType == RUNE_ITEMTYPE_ESSENCE or
           itemType == RUNE_ITEMTYPE_ASPECT  then
            local bagId = slotData.bagId
            local slot  = slotData.slotIndex
            local name  = GetItemName(bagId, slot)
            if name and name ~= "" then
                local link = GetItemLink(bagId, slot, LINK_STYLE_DEFAULT)
                local runeClass = link and GetItemLinkEnchantingRuneClassification(link)
                if runeClass and not runesByType[runeClass][name] then
                    runesByType[runeClass][name] = {
                        name      = safe(name),
                        runeClass = runeClass,
                        link      = safe(link or ""),
                        bag       = bagId,
                        slot      = slot,
                    }
                end
            end
        end
    end

    local potRunes = {}
    local essRunes = {}
    local aspRunes = {}

    for _, r in pairs(runesByType[RUNE_CLASS_POTENCY]) do table.insert(potRunes, r) end
    for _, r in pairs(runesByType[RUNE_CLASS_ESSENCE]) do table.insert(essRunes, r) end
    for _, r in pairs(runesByType[RUNE_CLASS_ASPECT])  do table.insert(aspRunes, r) end

    -- Sort for consistency
    table.sort(potRunes, function(a,b) return a.name < b.name end)
    table.sort(essRunes, function(a,b) return a.name < b.name end)
    table.sort(aspRunes, function(a,b) return a.name < b.name end)

    -- Find the highest aspect rune we have (best quality glyph)
    -- Aspect runes in order: Jora < Porade < Jode < Notade < Ode < Tade <
    --                        Jayde < Edode < Pode < Rekude < Kude < Jehade
    -- We just use the last one alphabetically as a proxy for highest tier
    -- (In practice the player should have Kude or Rekude for Legendary/Epic)
    local bestAsp = aspRunes[#aspRunes]
    if not bestAsp then
        msg("Enchanting: No aspect runes found in bags. Make sure runes are in " ..
            "your backpack, bank, or craft bag.", "FFAA00")
        return 0
    end

    local count = 0
    for _, pot in ipairs(potRunes) do
        for _, ess in ipairs(essRunes) do
            -- Resolve actual glyph name using GetEnchantingResultingItemInfo
            -- Parameter order: potencyBag, potencySlot, essenceBag, essenceSlot,
            --                  aspectBag, aspectSlot
            local glyphName = GetEnchantingResultingItemInfo(
                pot.bag, pot.slot,
                ess.bag, ess.slot,
                bestAsp.bag, bestAsp.slot
            )

            -- Determine category from glyph name
            local category = "Armor Glyph"
            if glyphName then
                local lower = string.lower(glyphName)
                if lower:find("weapon") or lower:find("absorb") or
                   lower:find("flame") or lower:find("frost") or
                   lower:find("shock") or lower:find("foul") or
                   lower:find("crushing") or lower:find("weakening") or
                   lower:find("decrease") then
                    category = "Weapon Glyph"
                elseif lower:find("jewelry") or lower:find("reduce fee") or
                       lower:find("bashing") then
                    category = "Jewelry Glyph"
                end
            end

            -- Only export if the combination is valid for this character
            -- Empty result means skill level too low or invalid rune pairing
            if glyphName and glyphName ~= "" then
                -- Capitalize first letter (ESO returns e.g. "inferior Glyph of...")
                local capName = glyphName:sub(1,1):upper() .. glyphName:sub(2)
                table.insert(results, {
                    name        = safe(capName),
                    profession  = "Enchanting",
                    category    = category,
                    known       = true,
                    ingredients = {
                        { name = pot.name,      quantity = 1 },
                        { name = ess.name,      quantity = 1 },
                        { name = bestAsp.name,  quantity = 1 },
                    },
                })
                count = count + 1
            end
        end
    end

    -- Save full rune inventory separately for materials reference
    local allRunes = {}
    for _, r in ipairs(potRunes) do table.insert(allRunes, { name = r.name, type = "Potency" }) end
    for _, r in ipairs(essRunes) do table.insert(allRunes, { name = r.name, type = "Essence" }) end
    for _, r in ipairs(aspRunes) do table.insert(allRunes, { name = r.name, type = "Aspect"  }) end
    EsoCraftLedgerData.knownRunes = allRunes

    msg("Enchanting: " .. count .. " combinations from " ..
        #potRunes .. " potency, " .. #essRunes .. " essence, " ..
        #aspRunes .. " aspect runes")
    return count
end

-- ── Alchemy ───────────────────────────────────────────────────────────────────
-- GetNumAlchemyIngredients() -> integer  (only works at alchemy station)
-- GetAlchemyIngredientInfo(index)
--   -> string name, icon, integer stack, integer sellPrice,
--      bool meetsUsageRequirement, bool isKnown
-- GetAlchemyIngredientTraitInfo(ingredientIndex, traitIndex)
--   -> bool isKnown, string description

local function exportAlchemy()
    local ok, numIng = pcall(GetNumAlchemyIngredients)
    if not ok or not numIng or numIng == 0 then
        msg("Alchemy: Must be at an alchemy station. Skipping.", "FFAA00")
        return 0
    end

    local reagents = {}
    for i = 1, numIng do
        local name = GetAlchemyIngredientInfo(i)
        if name and name ~= "" then
            local traits = {}
            for t = 1, 4 do
                local traitKnown, traitDesc = GetAlchemyIngredientTraitInfo(i, t)
                if traitDesc and traitDesc ~= "" then
                    table.insert(traits, {
                        known       = traitKnown == true,
                        description = safe(traitDesc),
                    })
                end
            end
            table.insert(reagents, {
                name   = safe(name),
                traits = traits,
            })
        end
    end

    EsoCraftLedgerData.alchemyReagents = reagents
    msg("Alchemy: " .. #reagents .. " reagents with trait knowledge")
    return #reagents
end

-- ── Main export ───────────────────────────────────────────────────────────────

local function doExport(scope)
    scope = scope or "all"
    msg("Starting export (scope=" .. scope .. ")...")

    local results = {}
    local errors  = {}

    local function try(label, fn)
        local ok, err2 = pcall(fn)
        if not ok then
            local e = label .. ": " .. tostring(err2)
            table.insert(errors, e)
            msg(e, "FF4444")
        end
    end

    if scope == "all" or scope == "provisioning" then
        try("Provisioning", function() exportProvisioning(results) end)
    end
    if scope == "all" or scope == "smithing" then
        try("Smithing", function() exportSmithing(results) end)
    end
    if scope == "all" or scope == "enchanting" then
        try("Enchanting", function() exportEnchanting(results) end)
    end
    if scope == "all" or scope == "alchemy" then
        try("Alchemy", function() exportAlchemy() end)
    end

    EsoCraftLedgerData.version     = ADDON_VERSION
    EsoCraftLedgerData.exportedAt  = GetTimeString()
    EsoCraftLedgerData.character   = safe(GetUnitName("player"))
    EsoCraftLedgerData.account     = safe(GetDisplayName())
    EsoCraftLedgerData.recipeCount = #results
    EsoCraftLedgerData.errors      = errors
    EsoCraftLedgerData.recipes     = results

    msg("Done! " .. #results .. " recipes exported.")
    if #errors > 0 then
        msg(#errors .. " error(s) — check EsoCraftLedgerData.errors for details", "FFAA00")
    end
    msg("Type /reloadui to save to disk.")
end

-- ── Slash command ─────────────────────────────────────────────────────────────

SLASH_COMMANDS["/craftledger"] = function(args)
    local cmd = string.lower(string.gsub(args or "", "^%s*", ""))
    if cmd == "export" or cmd == "" then
        doExport("all")
    elseif cmd == "provisioning" or cmd == "prov" then
        doExport("provisioning")
    elseif cmd == "smithing" or cmd == "smith" then
        doExport("smithing")
    elseif cmd == "enchanting" or cmd == "ench" then
        doExport("enchanting")
    elseif cmd == "alchemy" or cmd == "alch" then
        doExport("alchemy")
    elseif cmd == "status" then
        if EsoCraftLedgerData and EsoCraftLedgerData.recipeCount then
            msg("Last export: " ..
                (EsoCraftLedgerData.recipeCount or 0) .. " recipes, " ..
                (EsoCraftLedgerData.exportedAt or "?") .. ", char: " ..
                (EsoCraftLedgerData.character or "?"))
        else
            msg("No data yet. Run /craftledger export", "FFAA00")
        end
    else
        msg("ESO Craft Ledger v" .. ADDON_VERSION)
        d("  /craftledger export       — export everything")
        d("  /craftledger provisioning — provisioning only (anywhere)")
        d("  /craftledger smithing     — gear patterns (must be AT a station)")
        d("  /craftledger enchanting   — rune combos from bags (anywhere)")
        d("  /craftledger alchemy      — reagent knowledge (at alchemy station)")
        d("  /craftledger status       — last export summary")
        d("  /reloadui                 — saves to disk after export")
    end
end

-- ── Loaded ────────────────────────────────────────────────────────────────────

local function onLoaded(_, addonName)
    if addonName ~= ADDON_NAME then return end
    msg("v" .. ADDON_VERSION .. " loaded. /craftledger for help.")
end

EVENT_MANAGER:RegisterForEvent(ADDON_NAME, EVENT_ADD_ON_LOADED, onLoaded)
