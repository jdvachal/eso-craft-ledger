import { PROFESSION_COLORS, QUALITY_COLORS, fmtGold, profitColor } from '../utils/helpers'
import styles from './UI.module.css'

export function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

export function CardHeader({ title, children }) {
  return (
    <div className={styles.cardHeader}>
      <span className={styles.cardTitle}>{title}</span>
      {children}
    </div>
  )
}

export function Badge({ label, color }) {
  return (
    <span className={styles.badge} style={{ color, borderColor: color + '55', background: color + '18' }}>
      {label}
    </span>
  )
}

export function ProfBadge({ profession }) {
  const color = PROFESSION_COLORS[profession] || '#888'
  return <Badge label={profession} color={color} />
}

export function QualityBadge({ quality }) {
  const color = QUALITY_COLORS[quality] || '#888'
  return <Badge label={quality} color={color} />
}

export function ProfitBadge({ profit, margin }) {
  const color = profitColor(profit)
  const sign  = profit >= 0 ? '+' : ''
  return (
    <span className={styles.badge} style={{ color, borderColor: color + '55', background: color + '18' }}>
      {sign}{fmtGold(profit)} {margin != null ? `(${(margin * 100).toFixed(1)}%)` : ''}
    </span>
  )
}

export function KnownToggle({ known, onChange }) {
  return (
    <button
      className={`${styles.toggle} ${known ? styles.toggleOn : ''}`}
      onClick={() => onChange(!known)}
      title={known ? 'Known — click to mark unknown' : 'Unknown — click to mark known'}
      aria-label={known ? 'Mark as unknown' : 'Mark as known'}
    >
      <span className={styles.toggleKnob} />
    </button>
  )
}

export function Btn({ children, variant = 'default', size = 'md', onClick, disabled, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[`btn-${variant}`]} ${styles[`btn-${size}`]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <input {...props} />
    </div>
  )
}

export function Select({ label, options, ...props }) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <select {...props}>
        {options.map(o =>
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  )
}

export function Spinner() {
  return <div className={styles.spinner} aria-label="Loading" />
}

export function EmptyState({ icon = '⚒', message }) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p>{message}</p>
    </div>
  )
}

export function SectionTitle({ children }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>
}

export function MetricCard({ label, value, sub, color }) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue} style={{ color: color || 'var(--gold)' }}>{value}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  )
}

export function Table({ headers, children, className = '' }) {
  return (
    <div className={`${styles.tableWrap} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
