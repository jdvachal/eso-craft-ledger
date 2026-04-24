import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMaterials } from '../utils/api'
import { Card, CardHeader, SectionTitle, Spinner } from '../components/UI'
import { fmtGoldFull, fmtPct, profitColor } from '../utils/helpers'
import styles from './QuickCalc.module.css'

const EMPTY_ING = { material_id: '', quantity: 1 }

export default function QuickCalc() {
  const [ingredients, setIngredients] = useState([{ ...EMPTY_ING }])
  const [sellPrice, setSellPrice]     = useState('')
  const [guildTax, setGuildTax]       = useState('3')
  const [listingFee, setListingFee]   = useState('0')

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })

  function setIng(i, key, val) {
    setIngredients(ings => ings.map((ing, idx) => idx === i ? { ...ing, [key]: val } : ing))
  }
  function addIng()    { setIngredients(ings => [...ings, { ...EMPTY_ING }]) }
  function removeIng(i){ setIngredients(ings => ings.filter((_, idx) => idx !== i)) }
  function clearAll()  { setIngredients([{ ...EMPTY_ING }]); setSellPrice(''); setGuildTax('3'); setListingFee('0') }

  const matCost = ingredients.reduce((sum, ing) => {
    const mat = materials.find(m => m.id === parseInt(ing.material_id))
    return sum + (mat ? mat.current_price * (parseFloat(ing.quantity) || 0) : 0)
  }, 0)

  const sell     = parseFloat(sellPrice) || 0
  const tax      = parseFloat(guildTax) || 0
  const fee      = parseFloat(listingFee) || 0
  const afterTax = sell * (1 - tax / 100)
  const gross    = sell - matCost
  const net      = afterTax - matCost - fee
  const margin   = sell > 0 ? net / sell : 0
  const roi      = matCost > 0 ? net / matCost : 0
  const breakEven = tax < 100 ? (matCost + fee) / (1 - tax / 100) : 0

  const matOptions = [
    { value: '', label: '— Select Material —' },
    ...materials.map(m => ({
      value: String(m.id),
      label: `${m.name} — ${m.current_price.toLocaleString()}g`
    }))
  ]

  if (isLoading) return <Spinner />

  return (
    <div className={styles.page}>
      <SectionTitle>Quick Profit Calculator</SectionTitle>
      <p className={styles.hint}>
        Select ingredients from your material price list to auto-fill costs. Great for testing new recipes before adding them.
      </p>

      <div className={styles.layout}>
        {/* Left: inputs */}
        <div className={styles.inputCol}>
          <Card>
            <CardHeader title="Ingredients">
              <button className={styles.addBtn} onClick={addIng}>+ Add</button>
            </CardHeader>

            <div className={styles.ingList}>
              {ingredients.map((ing, i) => {
                const mat = materials.find(m => m.id === parseInt(ing.material_id))
                const lineCost = mat ? mat.current_price * (parseFloat(ing.quantity) || 0) : 0
                return (
                  <div key={i} className={styles.ingRow}>
                    <select
                      value={ing.material_id}
                      onChange={e => setIng(i, 'material_id', e.target.value)}
                      className={styles.matSel}
                    >
                      {matOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={ing.quantity}
                      onChange={e => setIng(i, 'quantity', e.target.value)}
                      min="0"
                      step="1"
                      className={styles.qtyInput}
                      placeholder="Qty"
                    />
                    <span className={styles.lineCost}>
                      {lineCost > 0 ? fmtGoldFull(lineCost) : '—'}
                    </span>
                    <button className={styles.removeBtn} onClick={() => removeIng(i)}>✕</button>
                  </div>
                )
              })}
            </div>

            <div className={styles.totalMatRow}>
              <span className={styles.totalMatLabel}>Total Mat Cost</span>
              <span className={styles.totalMatVal}>{fmtGoldFull(matCost)}</span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Sale Details" />
            <div className={styles.inputRows}>
              <div className={styles.inputRow}>
                <label>Sell Price (g)</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={e => setSellPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={styles.numInput}
                />
              </div>
              <div className={styles.inputRow}>
                <label>Guild Tax %</label>
                <input
                  type="number"
                  value={guildTax}
                  onChange={e => setGuildTax(e.target.value)}
                  placeholder="3"
                  min="0"
                  max="100"
                  className={styles.numInput}
                />
              </div>
              <div className={styles.inputRow}>
                <label>Listing Fee (g)</label>
                <input
                  type="number"
                  value={listingFee}
                  onChange={e => setListingFee(e.target.value)}
                  placeholder="0"
                  min="0"
                  className={styles.numInput}
                />
              </div>
            </div>
            <button className={styles.clearBtn} onClick={clearAll}>Clear All</button>
          </Card>
        </div>

        {/* Right: results */}
        <div className={styles.resultsCol}>
          <Card>
            <CardHeader title="Results" />
            <div className={styles.resultsList}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Mat Cost</span>
                <span className={styles.resultVal} style={{ color: 'var(--text-dim)' }}>{fmtGoldFull(matCost)}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Gross Profit</span>
                <span className={styles.resultVal} style={{ color: profitColor(gross) }}>
                  {gross >= 0 ? '+' : ''}{fmtGoldFull(gross)}
                </span>
              </div>
              <div className={styles.resultDivider} />
              <div className={`${styles.resultRow} ${styles.resultMain}`}>
                <span className={styles.resultLabel}>Net Profit</span>
                <span className={styles.resultBig} style={{ color: profitColor(net) }}>
                  {net >= 0 ? '+' : ''}{fmtGoldFull(net)}
                </span>
              </div>
              <div className={styles.resultDivider} />
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>After Tax</span>
                <span className={styles.resultVal + ' gold'}>{fmtGoldFull(afterTax)}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Margin</span>
                <span className={styles.resultVal} style={{ color: profitColor(net) }}>{fmtPct(margin)}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>ROI</span>
                <span className={styles.resultVal} style={{ color: 'var(--teal)' }}>{fmtPct(roi)}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Break-Even Price</span>
                <span className={styles.resultVal} style={{ color: 'var(--amber)' }}>{fmtGoldFull(breakEven)}</span>
              </div>
            </div>
          </Card>

          {/* Ingredient breakdown */}
          {ingredients.some(i => i.material_id) && (
            <Card>
              <CardHeader title="Cost Breakdown" />
              <div className={styles.breakdown}>
                {ingredients
                  .filter(i => i.material_id)
                  .map((ing, i) => {
                    const mat = materials.find(m => m.id === parseInt(ing.material_id))
                    if (!mat) return null
                    const lineCost = mat.current_price * (parseFloat(ing.quantity) || 0)
                    const pct = matCost > 0 ? lineCost / matCost : 0
                    return (
                      <div key={i} className={styles.breakdownRow}>
                        <div className={styles.breakdownName}>
                          <span>{parseFloat(ing.quantity) || 0}× {mat.name}</span>
                          <span className="dim">{fmtGoldFull(mat.current_price)} each</span>
                        </div>
                        <div className={styles.breakdownBar}>
                          <div
                            className={styles.breakdownFill}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <span className="gold">{fmtGoldFull(lineCost)}</span>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
