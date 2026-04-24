import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipes, toggleKnown, deleteRecipe, getMaterials } from '../utils/api'
import {
  Card, CardHeader, SectionTitle, Spinner, EmptyState,
  KnownToggle, ProfitBadge, QualityBadge, Btn, Modal
} from '../components/UI'
import RecipeForm from '../components/RecipeForm'
import TraitPricePanel from '../components/TraitPricePanel'
import { fmtGold, fmtPct, fmtGoldFull, PROFESSION_COLORS } from '../utils/helpers'
import styles from './ProfessionPage.module.css'

export default function ProfessionPage({ profession }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterKnown, setFilterKnown] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRecipe, setEditRecipe] = useState(null)
  const [calcCost, setCalcCost] = useState('')
  const [calcSell, setCalcSell] = useState('')
  const [calcTax, setCalcTax] = useState('3')

  const color = PROFESSION_COLORS[profession]

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', profession],
    queryFn: () => getRecipes({ profession }),
  })

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, known }) => toggleKnown(id, known),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })

  const filtered = recipes.filter(r => {
    if (filterKnown === 'known' && !r.known) return false
    if (filterKnown === 'unknown' && r.known) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !r.category.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Quick calc
  const cost    = parseFloat(calcCost) || 0
  const sell    = parseFloat(calcSell) || 0
  const tax     = parseFloat(calcTax) || 0
  const afterTax = sell * (1 - tax / 100)
  const netProfit = afterTax - cost
  const margin  = sell > 0 ? netProfit / sell : 0
  const breakEven = tax < 100 ? cost / (1 - tax / 100) : 0

  // Summary
  const known   = recipes.filter(r => r.known)
  const best    = [...known].sort((a, b) => b.profit - a.profit)[0]
  const portProfit = known.reduce((sum, r) => sum + r.profit, 0)

  if (isLoading) return <Spinner />

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <SectionTitle style={{ color }}>{profession}</SectionTitle>
        <Btn variant="green" onClick={() => { setEditRecipe(null); setShowForm(true) }}>
          + Add Recipe
        </Btn>
      </div>

      <div className={styles.layout}>
        {/* Left: recipe table */}
        <div className={styles.tableSection}>
          <Card>
            <CardHeader title={`${filtered.length} Recipes`}>
              <div className={styles.controls}>
                <input
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles.search}
                />
                <select value={filterKnown} onChange={e => setFilterKnown(e.target.value)} className={styles.filterSel}>
                  <option value="all">All</option>
                  <option value="known">Known</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </CardHeader>

            {filtered.length === 0 ? (
              <EmptyState message="No recipes match. Add one above." />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Known</th>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Quality</th>
                      <th>Ingredients</th>
                      <th>Mat Cost</th>
                      <th>Sell Price</th>
                      <th>Profit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <React.Fragment key={r.id}>
                        <tr>
                          <td>
                            <KnownToggle
                              known={r.known}
                              onChange={known => toggleMut.mutate({ id: r.id, known })}
                            />
                          </td>
                          <td className={styles.recipeName}>{r.name}</td>
                          <td className="dim">{r.category}</td>
                          <td><QualityBadge quality={r.quality} /></td>
                          <td>
                            <div className={styles.ingList}>
                              {r.ingredients.map(ing => (
                                <span key={ing.id} className={styles.ingTag}>
                                  {ing.quantity}× {ing.material?.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="gold">{fmtGold(r.mat_cost)}</td>
                          <td>{fmtGold(r.sell_price)}</td>
                          <td><ProfitBadge profit={r.profit} margin={r.margin} /></td>
                          <td>
                            <div className={styles.rowActions}>
                              <Btn variant="ghost" size="sm" onClick={() => { setEditRecipe(r); setShowForm(true) }}>✎</Btn>
                              <Btn variant="red" size="sm" onClick={() => confirm('Delete this recipe?') && deleteMut.mutate(r.id)}>✕</Btn>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={9} style={{ padding: '0 10px 8px', background: 'var(--bg)' }}>
                            <TraitPricePanel recipe={r} />
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right: panels */}
        <div className={styles.sidebar}>
          {/* Quick Calc */}
          <Card>
            <CardHeader title="Quick Calc" />
            <div className={styles.calcRows}>
              <div className={styles.calcRow}>
                <label>Mat Cost</label>
                <input type="number" value={calcCost} onChange={e => setCalcCost(e.target.value)} placeholder="0" className={styles.calcInput} />
              </div>
              <div className={styles.calcRow}>
                <label>Sell Price</label>
                <input type="number" value={calcSell} onChange={e => setCalcSell(e.target.value)} placeholder="0" className={styles.calcInput} />
              </div>
              <div className={styles.calcRow}>
                <label>Guild Tax %</label>
                <input type="number" value={calcTax} onChange={e => setCalcTax(e.target.value)} placeholder="3" className={styles.calcInput} />
              </div>
            </div>
            <div className={styles.calcDivider} />
            <div className={styles.calcResults}>
              <div className={styles.calcResultMain}>
                <span className="dim">Net Profit</span>
                <span className={styles.calcBig} style={{ color: netProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {netProfit >= 0 ? '+' : ''}{fmtGoldFull(netProfit)}
                </span>
              </div>
              <div className={styles.calcResultSub}>
                <span>Margin: <b style={{ color: margin >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(margin)}</b></span>
                <span>After tax: <b className="gold">{fmtGoldFull(afterTax)}</b></span>
                <span>Break-even: <b className="gold">{fmtGoldFull(breakEven)}</b></span>
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader title="Summary" />
            <div className={styles.sumRows}>
              <div className={styles.sumRow}>
                <span className="dim">Known recipes</span>
                <span className="gold">{known.length} / {recipes.length}</span>
              </div>
              <div className={styles.sumRow}>
                <span className="dim">Portfolio profit</span>
                <span style={{ color: portProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtGold(portProfit)}</span>
              </div>
              {best && <>
                <div className={styles.sumRow}>
                  <span className="dim">Best item</span>
                  <span className={styles.bestName}>{best.name}</span>
                </div>
                <div className={styles.sumRow}>
                  <span className="dim">Best profit</span>
                  <span className="green">{fmtGold(best.profit)}</span>
                </div>
              </>}
            </div>
          </Card>
        </div>
      </div>

      {showForm && (
        <Modal
          title={editRecipe ? 'Edit Recipe' : `New ${profession} Recipe`}
          onClose={() => { setShowForm(false); setEditRecipe(null) }}
        >
          <RecipeForm
            profession={profession}
            recipe={editRecipe}
            materials={materials}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ['recipes'] })
              setShowForm(false)
              setEditRecipe(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}