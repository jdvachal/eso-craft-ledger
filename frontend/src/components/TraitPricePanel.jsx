import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTraits, getRecipeTraitPrices, upsertRecipeTraitPrices, deleteRecipeTraitPrice } from '../utils/api'
import { Btn, Spinner } from './UI'
import { fmtGold, profitColor } from '../utils/helpers'
import styles from './TraitPricePanel.module.css'

// Traits that don't apply to craftable gear — hide these by default
const NON_CRAFT_TRAITS = new Set([15, 16]) // Intricate, Ornate (research/deconstruct only)

const TYPE_ORDER = ['Weapon', 'Armor', 'Jewelry', 'Any', 'Companion']

export default function TraitPricePanel({ recipe, defaultOpen = false }) {
  const qc = useQueryClient()
  const [open, setOpen]       = useState(defaultOpen)
  const [editing, setEditing] = useState({}) // traitId -> string value being edited
  const [filter, setFilter]   = useState('all') // all | weapon | armor | jewelry | companion

  const { data: allTraits = [], isLoading: loadingTraits } = useQuery({
    queryKey: ['traits'],
    queryFn: getTraits,
    enabled: open,
  })

  const { data: traitPrices = [], isLoading: loadingPrices } = useQuery({
    queryKey: ['recipe-trait-prices', recipe.id],
    queryFn: () => getRecipeTraitPrices(recipe.id),
    enabled: open,
  })

  const upsertMut = useMutation({
    mutationFn: (prices) => upsertRecipeTraitPrices(recipe.id, prices),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipe-trait-prices', recipe.id] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })

  const deleteMut = useMutation({
    mutationFn: (traitId) => deleteRecipeTraitPrice(recipe.id, traitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipe-trait-prices', recipe.id] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })

  function getPriceForTrait(traitId) {
    return traitPrices.find(p => p.trait_id === traitId)
  }

  function startEdit(traitId, currentVal) {
    setEditing(e => ({ ...e, [traitId]: currentVal != null ? String(currentVal) : '' }))
  }

  function commitEdit(traitId) {
    const val = parseFloat(editing[traitId])
    if (!isNaN(val) && val > 0) {
      upsertMut.mutate([{ trait_id: traitId, sell_price: val, notes: '' }])
    } else if (editing[traitId] === '' || val === 0) {
      const existing = getPriceForTrait(traitId)
      if (existing) deleteMut.mutate(traitId)
    }
    setEditing(e => { const n = {...e}; delete n[traitId]; return n })
  }

  function handleKey(e, traitId) {
    if (e.key === 'Enter') commitEdit(traitId)
    if (e.key === 'Escape') setEditing(e2 => { const n = {...e2}; delete n[traitId]; return n })
  }

  // Filter traits to relevant types based on recipe profession
  function relevantTraits() {
    const prof = recipe.profession
    let filtered = allTraits.filter(t => !NON_CRAFT_TRAITS.has(t.id))

    if (filter !== 'all') {
      filtered = filtered.filter(t =>
        t.trait_type.toLowerCase() === filter || t.trait_type === 'Any'
      )
    } else {
      // Auto-filter by profession when showing all
      if (prof === 'Jewelrycrafting') {
        filtered = filtered.filter(t => ['Jewelry', 'Any'].includes(t.trait_type))
      } else if (['Blacksmithing', 'Clothing', 'Woodworking'].includes(prof)) {
        filtered = filtered.filter(t => ['Weapon', 'Armor', 'Any'].includes(t.trait_type))
      }
      // Alchemy, Enchanting, Provisioning don't use traits — show nothing by default
    }

    // Group by type
    const groups = {}
    for (const t of filtered) {
      const key = t.trait_type === 'Any' ? 'Any (Weapon+Armor)' : t.trait_type
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return groups
  }

  const noTraitProfessions = ['Alchemy', 'Enchanting', 'Provisioning']
  if (noTraitProfessions.includes(recipe.profession)) return null

  const setPriceCount = traitPrices.length
  const groups = open ? relevantTraits() : {}

  return (
    <div className={styles.panel}>
      <button className={styles.toggle} onClick={() => setOpen(o => !o)}>
        <span className={styles.toggleIcon}>{open ? '▾' : '▸'}</span>
        <span className={styles.toggleLabel}>Trait Prices</span>
        {setPriceCount > 0 && (
          <span className={styles.count}>{setPriceCount} set</span>
        )}
      </button>

      {open && (
        <div className={styles.body}>
          {loadingTraits || loadingPrices ? <Spinner /> : (
            <>
              <div className={styles.toolbar}>
                <span className={styles.hint}>
                  Click any price to edit. Leave blank to use the base recipe price ({fmtGold(recipe.sell_price)}).
                </span>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className={styles.filterSel}
                >
                  <option value="all">Auto-filter</option>
                  <option value="weapon">Weapon</option>
                  <option value="armor">Armor</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="companion">Companion</option>
                </select>
              </div>

              {Object.keys(groups).length === 0 ? (
                <p className={styles.empty}>No applicable traits for this profession.</p>
              ) : (
                Object.entries(groups).map(([groupName, traits]) => (
                  <div key={groupName} className={styles.group}>
                    <div className={styles.groupLabel}>{groupName}</div>
                    <div className={styles.traitGrid}>
                      {traits.map(trait => {
                        const existing  = getPriceForTrait(trait.id)
                        const isEditing = editing[trait.id] !== undefined
                        const traitSell = existing?.sell_price
                        const profit    = traitSell != null ? traitSell - recipe.mat_cost : null

                        return (
                          <div
                            key={trait.id}
                            className={`${styles.traitRow} ${existing ? styles.traitSet : ''}`}
                          >
                            <span className={styles.traitName}>{trait.name}</span>

                            {isEditing ? (
                              <input
                                type="number"
                                value={editing[trait.id]}
                                onChange={e => setEditing(ed => ({ ...ed, [trait.id]: e.target.value }))}
                                onBlur={() => commitEdit(trait.id)}
                                onKeyDown={e => handleKey(e, trait.id)}
                                className={styles.priceInput}
                                autoFocus
                                min="0"
                                placeholder="price"
                              />
                            ) : (
                              <span
                                className={styles.priceDisplay}
                                onClick={() => startEdit(trait.id, traitSell ?? recipe.sell_price)}
                                title="Click to set price"
                              >
                                {traitSell != null ? fmtGold(traitSell) : <span className={styles.noPrice}>— set price —</span>}
                              </span>
                            )}

                            {profit != null && !isEditing && (
                              <span
                                className={styles.profit}
                                style={{ color: profitColor(profit) }}
                              >
                                {profit >= 0 ? '+' : ''}{fmtGold(profit)}
                              </span>
                            )}

                            {existing && !isEditing && (
                              <button
                                className={styles.clearBtn}
                                onClick={() => deleteMut.mutate(trait.id)}
                                title="Clear price"
                              >✕</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
