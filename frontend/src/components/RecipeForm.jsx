import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createRecipe, updateRecipe } from '../utils/api'
import { Btn, Select } from './UI'
import { PROFESSIONS, QUALITIES } from '../utils/helpers'
import styles from './RecipeForm.module.css'

const EMPTY_ING = { material_id: '', quantity: 1 }

export default function RecipeForm({ profession, recipe, materials, onSuccess }) {
  const isEdit = !!recipe

  const [form, setForm] = useState({
    name:        recipe?.name        ?? '',
    profession:  recipe?.profession  ?? profession ?? 'Blacksmithing',
    category:    recipe?.category    ?? '',
    quality:     recipe?.quality     ?? 'Normal',
    sell_price:  recipe?.sell_price  ?? '',
    known:       recipe?.known       ?? false,
    notes:       recipe?.notes       ?? '',
  })

  const [ingredients, setIngredients] = useState(
    recipe?.ingredients?.length
      ? recipe.ingredients.map(i => ({ material_id: String(i.material_id), quantity: i.quantity }))
      : [{ ...EMPTY_ING }]
  )

  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateRecipe(recipe.id, data) : createRecipe(data),
    onSuccess: () => onSuccess?.(),
    onError: (e) => setError(e?.response?.data?.detail ?? 'An error occurred'),
  })

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function setIng(i, key, val) {
    setIngredients(ings => ings.map((ing, idx) => idx === i ? { ...ing, [key]: val } : ing))
  }

  function addIng() {
    setIngredients(ings => [...ings, { ...EMPTY_ING }])
  }

  function removeIng(i) {
    setIngredients(ings => ings.filter((_, idx) => idx !== i))
  }

  function handleSubmit() {
    if (!form.name.trim()) return setError('Item name is required.')
    const validIngs = ingredients
      .filter(i => i.material_id !== '' && parseFloat(i.quantity) > 0)
      .map(i => ({ material_id: parseInt(i.material_id), quantity: parseFloat(i.quantity) }))

    mutation.mutate({
      ...form,
      sell_price: parseFloat(form.sell_price) || 0,
      ingredients: validIngs,
    })
  }

  // Compute live mat cost preview
  const liveCost = ingredients.reduce((sum, ing) => {
    const mat = materials.find(m => m.id === parseInt(ing.material_id))
    return sum + (mat ? mat.current_price * (parseFloat(ing.quantity) || 0) : 0)
  }, 0)

  const liveProfit = (parseFloat(form.sell_price) || 0) - liveCost

  const matOptions = [
    { value: '', label: '— Select Material —' },
    ...materials.map(m => ({ value: String(m.id), label: `${m.name} (${m.current_price.toLocaleString()}g)` }))
  ]

  return (
    <div className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid2}>
        <div className={styles.field}>
          <label>Item Name *</label>
          <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Briarheart Ring" />
        </div>
        <div className={styles.field}>
          <label>Profession</label>
          <select value={form.profession} onChange={e => setField('profession', e.target.value)}>
            {PROFESSIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Category / Set</label>
          <input value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Ring — Briarheart" />
        </div>
        <div className={styles.field}>
          <label>Quality</label>
          <select value={form.quality} onChange={e => setField('quality', e.target.value)}>
            {QUALITIES.map(q => <option key={q}>{q}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>Sell Price (g)</label>
          <input type="number" value={form.sell_price} onChange={e => setField('sell_price', e.target.value)} placeholder="0" min="0" />
        </div>
        <div className={styles.field}>
          <label>Known?</label>
          <select value={form.known ? 'yes' : 'no'} onChange={e => setField('known', e.target.value === 'yes')}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label>Notes</label>
        <input value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Optional notes…" />
      </div>

      <div className={styles.ingSection}>
        <div className={styles.ingHeader}>
          <span className={styles.ingTitle}>Ingredients</span>
          <Btn variant="ghost" size="sm" onClick={addIng}>+ Add Slot</Btn>
        </div>
        {ingredients.map((ing, i) => (
          <div key={i} className={styles.ingRow}>
            <select
              value={ing.material_id}
              onChange={e => setIng(i, 'material_id', e.target.value)}
              className={styles.matSelect}
            >
              {matOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input
              type="number"
              value={ing.quantity}
              onChange={e => setIng(i, 'quantity', e.target.value)}
              min="0.1"
              step="1"
              className={styles.qtyInput}
              placeholder="Qty"
            />
            <Btn variant="red" size="sm" onClick={() => removeIng(i)}>✕</Btn>
          </div>
        ))}
      </div>

      <div className={styles.preview}>
        <span>Mat Cost: <b className="gold">{liveCost.toLocaleString()}g</b></span>
        <span>Est. Profit: <b style={{ color: liveProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {liveProfit >= 0 ? '+' : ''}{liveProfit.toLocaleString()}g
        </b></span>
        <span className="dim">
          Margin: {form.sell_price > 0 ? ((liveProfit / parseFloat(form.sell_price)) * 100).toFixed(1) : 0}%
        </span>
      </div>

      <div className={styles.actions}>
        <Btn variant="primary" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Recipe'}
        </Btn>
      </div>
    </div>
  )
}
