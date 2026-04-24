import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipes, getMaterials, toggleKnown, deleteRecipe } from '../utils/api'
import {
  Card, CardHeader, SectionTitle, Spinner, EmptyState,
  KnownToggle, ProfBadge, QualityBadge, ProfitBadge, Btn, Modal
} from '../components/UI'
import RecipeForm from '../components/RecipeForm'
import { PROFESSIONS, fmtGold } from '../utils/helpers'
import styles from './MasterSheet.module.css'

export default function MasterSheet() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterProf, setFilterProf] = useState('')
  const [filterKnown, setFilterKnown] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRecipe, setEditRecipe] = useState(null)
  const [sortBy, setSortBy] = useState('profession')
  const [sortDir, setSortDir] = useState('asc')

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => getRecipes({}),
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

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const filtered = recipes
    .filter(r => {
      if (filterProf && r.profession !== filterProf) return false
      if (filterKnown === 'known' && !r.known) return false
      if (filterKnown === 'unknown' && r.known) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) &&
            !r.category.toLowerCase().includes(q) &&
            !r.profession.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const SortTh = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} className={styles.sortTh}>
      {label} {sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  if (isLoading) return <Spinner />

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <SectionTitle>Master Recipe Sheet</SectionTitle>
        <Btn variant="green" onClick={() => { setEditRecipe(null); setShowForm(true) }}>
          + Add Recipe
        </Btn>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <input
            placeholder="Search recipes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.search}
          />
          <select value={filterProf} onChange={e => setFilterProf(e.target.value)} className={styles.sel}>
            <option value="">All Professions</option>
            {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={filterKnown} onChange={e => setFilterKnown(e.target.value)} className={styles.sel}>
            <option value="all">All</option>
            <option value="known">Known Only</option>
            <option value="unknown">Unknown Only</option>
          </select>
          <span className={styles.count}>{filtered.length} of {recipes.length} recipes</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="No recipes match your filters." />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Known</th>
                  <SortTh col="name"       label="Item" />
                  <SortTh col="profession" label="Profession" />
                  <SortTh col="category"   label="Category" />
                  <SortTh col="quality"    label="Quality" />
                  <th>Ingredients</th>
                  <SortTh col="mat_cost"   label="Mat Cost" />
                  <SortTh col="sell_price" label="Sell Price" />
                  <SortTh col="profit"     label="Profit" />
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <KnownToggle
                        known={r.known}
                        onChange={known => toggleMut.mutate({ id: r.id, known })}
                      />
                    </td>
                    <td className={styles.recipeName}>{r.name}</td>
                    <td><ProfBadge profession={r.profession} /></td>
                    <td className="dim">{r.category}</td>
                    <td><QualityBadge quality={r.quality} /></td>
                    <td>
                      <div className={styles.ingList}>
                        {r.ingredients.map(i => (
                          <span key={i.id} className={styles.ingTag}>
                            {i.quantity}× {i.material?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="gold">{fmtGold(r.mat_cost)}</td>
                    <td>{fmtGold(r.sell_price)}</td>
                    <td><ProfitBadge profit={r.profit} margin={r.margin} /></td>
                    <td>
                      <div className={styles.actions}>
                        <Btn variant="ghost" size="sm" onClick={() => { setEditRecipe(r); setShowForm(true) }}>✎</Btn>
                        <Btn variant="red" size="sm" onClick={() => confirm('Delete this recipe?') && deleteMut.mutate(r.id)}>✕</Btn>
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
        <Modal
          title={editRecipe ? 'Edit Recipe' : 'New Recipe'}
          onClose={() => { setShowForm(false); setEditRecipe(null) }}
        >
          <RecipeForm
            profession={editRecipe?.profession ?? filterProf ?? 'Blacksmithing'}
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
