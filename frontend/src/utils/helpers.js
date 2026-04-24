export const PROFESSIONS = [
  'Blacksmithing',
  'Clothing',
  'Woodworking',
  'Jewelrycrafting',
  'Alchemy',
  'Enchanting',
  'Provisioning',
]

export const PROFESSION_COLORS = {
  Blacksmithing:   '#C97B30',
  Clothing:        '#A87AB5',
  Woodworking:     '#4A8B9B',
  Jewelrycrafting: '#C9A84C',
  Alchemy:         '#4A9B6F',
  Enchanting:      '#7A9AB5',
  Provisioning:    '#B57A5A',
}

export const QUALITIES = ['Normal', 'Fine', 'Superior', 'Epic', 'Legendary']

export const QUALITY_COLORS = {
  Normal:    '#8A7E68',
  Fine:      '#4A9B6F',
  Superior:  '#4A8B9B',
  Epic:      '#A87AB5',
  Legendary: '#C9A84C',
}

export function fmtGold(n) {
  if (n == null || isNaN(n)) return '0g'
  const abs = Math.abs(n)
  let str
  if (abs >= 1_000_000) str = (n / 1_000_000).toFixed(2) + 'M'
  else if (abs >= 1_000) str = (n / 1_000).toFixed(1) + 'k'
  else str = Math.round(n).toString()
  return str + 'g'
}

export function fmtPct(n) {
  if (n == null || isNaN(n)) return '0%'
  return (n * 100).toFixed(1) + '%'
}

export function fmtGoldFull(n) {
  if (n == null || isNaN(n)) return '0g'
  return Math.round(n).toLocaleString() + 'g'
}

export function profitColor(profit) {
  if (profit > 0) return 'var(--green)'
  if (profit < 0) return 'var(--red)'
  return 'var(--text-dim)'
}

export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max)
}
