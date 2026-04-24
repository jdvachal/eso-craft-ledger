import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import ProfessionPage from './pages/ProfessionPage'
import MasterSheet from './pages/MasterSheet'
import Materials from './pages/Materials'
import SalesLog from './pages/SalesLog'
import QuickCalc from './pages/QuickCalc'
import { PROFESSIONS, PROFESSION_COLORS } from './utils/helpers'
import styles from './App.module.css'

const NAV = [
  { id: 'dashboard',   label: '⚒ Dashboard' },
  ...PROFESSIONS.map(p => ({ id: p, label: p })),
  { id: 'master',      label: '📋 Master Sheet' },
  { id: 'materials',   label: '💎 Materials' },
  { id: 'sales',       label: '📊 Sales Log' },
  { id: 'quickcalc',  label: '⚡ Quick Calc' },
]

export default function App() {
  const [active, setActive] = useState('dashboard')

  function renderPage() {
    if (active === 'dashboard') return <Dashboard onNavigate={setActive} />
    if (active === 'master')    return <MasterSheet />
    if (active === 'materials') return <Materials />
    if (active === 'sales')     return <SalesLog />
    if (active === 'quickcalc') return <QuickCalc />
    if (PROFESSIONS.includes(active)) return <ProfessionPage profession={active} />
    return null
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⚒</span>
          <div>
            <div className={styles.logoTitle}>ESO Craft Ledger</div>
            <div className={styles.logoSub}>Crafting Profitability Calculator</div>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <nav className={styles.nav}>
          {NAV.map(item => {
            const color = PROFESSION_COLORS[item.id]
            return (
              <button
                key={item.id}
                className={`${styles.navBtn} ${active === item.id ? styles.navActive : ''}`}
                style={active === item.id && color ? { color, borderLeftColor: color } : {}}
                onClick={() => setActive(item.id)}
              >
                {color && (
                  <span className={styles.navDot} style={{ background: color }} />
                )}
                {item.label}
              </button>
            )
          })}
        </nav>

        <main className={styles.main}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
