import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../utils/api'
import { Card, CardHeader, SectionTitle, Spinner, EmptyState, Btn, Modal } from '../components/UI'
import { fmtGold } from '../utils/helpers'
import styles from './Materials.module.css'

const CATEGORIES = [
  'Metal','Raw Metal','Temper','Leather','Fiber','Tannin','Resin','Wood',
  'Jewelry Metal','Jewelry Trait','Jewelry Solvent','Trait Mat','Set Mat',
  'Reagent','Solvent','Ingredient','Drink Ingredient','Spice','Fruit',
  'Aspect Rune','Potency Rune','Essence Rune','Recipe Scroll','Other'
]

function MaterialForm({ material, onSuccess, onCancel }) {
  const [name, setName]     = useState(material?.name ?? '')
  const [cat, setCat]       = useState(material?.category ?? 'Other')
  const [price, setPrice]   = useState(material?.current_price ?? '')
  const [notes, setNotes]   = useState(material?.notes ?? '')
  const [err, setErr]       = useState('')
  const isEdit = !!material

  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: d => isEdit ? updateMaterial(material.id, d) : createMaterial(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); onSuccess?.() },
    onError: e => setErr(e?.response?.data?.detail ?? 'Error saving material'),
  })

  function submit() {
    if (!name.trim()) return setErr('Name is required.')
    mut.mutate({ name, category: cat, current_price: parseFloat(price) || 0, notes })
  }

  return (
    <div className={styles.form}>
      {err && <div className={styles.error}>{err}</div>}
      <div className={styles.grid2}>
        <div className={styles.field}>
          <label>Material Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rubedite Ingot" />
        </div>
        <div className={styles.field}>
          <label>Category</label>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Current Price (g)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min="0" />
        </div>
        <div className={styles.field}>
          <label>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…" />
        </div>
      </div>
      <div className={styles.formActions}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Material'}
        </Btn>
      </div>
    </div>
  )
}

export default function Materials() {
  const qc = useQueryClient()
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editMat, setEditMat]   = useState(null)
  const [editingPrice, setEditingPrice] = useState({}) // id -> value

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateMaterial(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['materials'] }),
  })

  function commitPrice(mat) {
    const val = parseFloat(editingPrice[mat.id])
    if (!isNaN(val) && val !== mat.current_price) {
      updateMut.mutate({ id: mat.id, data: { current_price: val } })
    }
    setEditingPrice(p => { const n = {...p}; delete n[mat.id]; return n })
  }

  const categories = [...new Set(materials.map(m => m.category))].sort()

  const filtered = materials.filter(m => {
    if (filterCat && m.category !== filterCat) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (isLoading) return <Spinner />

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <SectionTitle>Material Prices</SectionTitle>
        <Btn variant="green" onClick={() => { setEditMat(null); setShowForm(true) }}>
          + Add Material
        </Btn>
      </div>
      <p className={styles.hint}>
        Update prices here — all recipe mat costs recalculate automatically. Click any price to edit inline.
      </p>

      <Card>
        <div className={styles.toolbar}>
          <input placeholder="Search materials…" value={search} onChange={e => setSearch(e.target.value)} className={styles.search} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={styles.sel}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <span className={styles.count}>{filtered.length} materials</span>
        </div>

        {filtered.length === 0 ? <EmptyState message="No materials found." /> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Category</th>
                  <th>Current Price (g)</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td className={styles.matName}>{m.name}</td>
                    <td><span className={styles.catTag}>{m.category}</span></td>
                    <td>
                      {editingPrice[m.id] !== undefined ? (
                        <input
                          type="number"
                          value={editingPrice[m.id]}
                          onChange={e => setEditingPrice(p => ({ ...p, [m.id]: e.target.value }))}
                          onBlur={() => commitPrice(m)}
                          onKeyDown={e => { if (e.key === 'Enter') commitPrice(m); if (e.key === 'Escape') setEditingPrice(p => { const n = {...p}; delete n[m.id]; return n }) }}
                          className={styles.priceInput}
                          autoFocus
                          min="0"
                        />
                      ) : (
                        <span
                          className={styles.priceCell}
                          onClick={() => setEditingPrice(p => ({ ...p, [m.id]: m.current_price }))}
                          title="Click to edit"
                        >
                          {fmtGold(m.current_price)}
                          <span className={styles.editHint}>✎</span>
                        </span>
                      )}
                    </td>
                    <td className="dim">{m.notes}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Btn variant="ghost" size="sm" onClick={() => { setEditMat(m); setShowForm(true) }}>✎</Btn>
                        <Btn variant="red" size="sm" onClick={() => confirm('Delete material?') && deleteMut.mutate(m.id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <Modal title={editMat ? 'Edit Material' : 'New Material'} onClose={() => { setShowForm(false); setEditMat(null) }}>
          <MaterialForm
            material={editMat}
            onSuccess={() => { setShowForm(false); setEditMat(null) }}
            onCancel={() => { setShowForm(false); setEditMat(null) }}
          />
        </Modal>
      )}
    </div>
  )
}
