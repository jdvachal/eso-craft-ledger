import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSales, createSale, deleteSale, getTraits } from '../utils/api'
import { Card, SectionTitle, Spinner, EmptyState, ProfBadge, Btn, Modal } from '../components/UI'
import { fmtGold, fmtPct, PROFESSIONS, profitColor } from '../utils/helpers'
import styles from './SalesLog.module.css'

function SaleForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    item_name: '', profession: 'Blacksmithing',
    sale_price: '', mat_cost: '', notes: '', sold_at: '', trait_id: '',
  })
  const [err, setErr] = useState('')
  const qc = useQueryClient()

  const { data: traits = [] } = useQuery({ queryKey: ['traits'], queryFn: getTraits })

  const mut = useMutation({
    mutationFn: createSale,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }); onSuccess?.() },
    onError: e => setErr(e?.response?.data?.detail ?? 'Error saving sale'),
  })

  function submit() {
    if (!form.item_name.trim()) return setErr('Item name is required.')
    if (!form.sale_price)       return setErr('Sale price is required.')
    mut.mutate({
      ...form,
      sale_price: parseFloat(form.sale_price) || 0,
      mat_cost:   parseFloat(form.mat_cost) || 0,
      trait_id:   form.trait_id ? parseInt(form.trait_id) : null,
      sold_at:    form.sold_at ? new Date(form.sold_at).toISOString() : undefined,
    })
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className={styles.form}>
      {err && <div className={styles.error}>{err}</div>}
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label>Item Name *</label>
          <input value={form.item_name} onChange={f('item_name')} placeholder="e.g. Briarheart Ring" />
        </div>
        <div className={styles.field}>
          <label>Profession</label>
          <select value={form.profession} onChange={f('profession')}>
            {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Sale Price (g) *</label>
          <input type="number" value={form.sale_price} onChange={f('sale_price')} placeholder="0" min="0" />
        </div>
        <div className={styles.field}>
          <label>Mat Cost (g)</label>
          <input type="number" value={form.mat_cost} onChange={f('mat_cost')} placeholder="0" min="0" />
        </div>
        <div className={styles.field}>
          <label>Trait</label>
          <select value={form.trait_id} onChange={f('trait_id')}>
            <option value="">— No Trait —</option>
            {traits.map(t => <option key={t.id} value={t.id}>{t.name} ({t.trait_type})</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Date Sold</label>
          <input type="datetime-local" value={form.sold_at} onChange={f('sold_at')} />
        </div>
        <div className={styles.field}>
          <label>Notes</label>
          <input value={form.notes} onChange={f('notes')} placeholder="Optional…" />
        </div>
      </div>
      {form.sale_price && (
        <div className={styles.preview}>
          <span>Profit: <b style={{ color: profitColor((parseFloat(form.sale_price)||0) - (parseFloat(form.mat_cost)||0)) }}>
            {fmtGold((parseFloat(form.sale_price)||0) - (parseFloat(form.mat_cost)||0))}
          </b></span>
          <span>Margin: <b className="gold">
            {form.sale_price > 0 ? ((((parseFloat(form.sale_price)||0) - (parseFloat(form.mat_cost)||0)) / (parseFloat(form.sale_price)||1)) * 100).toFixed(1) : 0}%
          </b></span>
        </div>
      )}
      <div className={styles.formActions}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : 'Log Sale'}
        </Btn>
      </div>
    </div>
  )
}

export default function SalesLog() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterProf, setFilterProf] = useState('')
  const [search, setSearch] = useState('')

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: getSales,
  })

  const deleteMut = useMutation({
    mutationFn: deleteSale,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }) },
  })

  const filtered = sales.filter(s => {
    if (filterProf && s.profession !== filterProf) return false
    if (search && !s.item_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalRevenue = filtered.reduce((sum, s) => sum + s.sale_price, 0)
  const totalProfit  = filtered.reduce((sum, s) => sum + s.profit, 0)
  const avgMargin    = totalRevenue > 0 ? totalProfit / totalRevenue : 0

  if (isLoading) return <Spinner />

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <SectionTitle>Sales Log</SectionTitle>
        <Btn variant="green" onClick={() => setShowForm(true)}>+ Log Sale</Btn>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Transactions</div><div className={styles.sumVal}>{filtered.length}</div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Total Revenue</div><div className={styles.sumVal + ' gold'}>{fmtGold(totalRevenue)}</div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Total Profit</div><div className={styles.sumVal} style={{ color: profitColor(totalProfit) }}>{fmtGold(totalProfit)}</div></div>
        <div className={styles.sumCard}><div className={styles.sumLabel}>Avg Margin</div><div className={styles.sumVal} style={{ color: 'var(--teal)' }}>{fmtPct(avgMargin)}</div></div>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className={styles.search} />
          <select value={filterProf} onChange={e => setFilterProf(e.target.value)} className={styles.sel}>
            <option value="">All Professions</option>
            {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📊" message="No sales logged yet. Click '+ Log Sale' to add one." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Profession</th>
                  <th>Trait</th>
                  <th>Sale Price</th>
                  <th>Mat Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td className="dim">{s.sold_at ? new Date(s.sold_at).toLocaleDateString() : '—'}</td>
                    <td className={styles.itemName}>{s.item_name}</td>
                    <td>{s.profession ? <ProfBadge profession={s.profession} /> : '—'}</td>
                    <td>{s.trait ? <span className={styles.traitBadge}>{s.trait.name}</span> : <span className="dim">—</span>}</td>
                    <td className="gold">{fmtGold(s.sale_price)}</td>
                    <td className="dim">{fmtGold(s.mat_cost)}</td>
                    <td style={{ color: profitColor(s.profit) }}>{fmtGold(s.profit)}</td>
                    <td style={{ color: profitColor(s.profit) }}>{fmtPct(s.margin)}</td>
                    <td className="dim">{s.notes}</td>
                    <td><Btn variant="red" size="sm" onClick={() => confirm('Delete sale?') && deleteMut.mutate(s.id)}>✕</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title="Log a Sale" onClose={() => setShowForm(false)}>
          <SaleForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
