import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getSalesOverTime, getProfitByProfession, getTopItems, seedDatabase } from '../utils/api'
import { MetricCard, Card, CardHeader, SectionTitle, Spinner, ProfBadge, Btn } from '../components/UI'
import { fmtGold, fmtPct, profitColor, PROFESSION_COLORS } from '../utils/helpers'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import styles from './Dashboard.module.css'

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#1A1814',
  border: '1px solid #3A3428',
  borderRadius: 4,
  color: '#E8DFC8',
  fontFamily: "'Crimson Pro', serif",
}

export default function Dashboard({ onNavigate }) {
  const { data: summary, isLoading: loadingSum, refetch: refetchSum } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })
  const { data: salesTime = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales-over-time'],
    queryFn: () => getSalesOverTime(30),
  })
  const { data: byProf = [] } = useQuery({
    queryKey: ['profit-by-profession'],
    queryFn: getProfitByProfession,
  })
  const { data: topItems = [] } = useQuery({
    queryKey: ['top-items'],
    queryFn: () => getTopItems(10),
  })

  async function handleSeed() {
    await seedDatabase()
    refetchSum()
    window.location.reload()
  }

  if (loadingSum) return <Spinner />

  const noData = !summary || summary.total_sales === 0

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <SectionTitle>Dashboard</SectionTitle>
        {noData && (
          <Btn variant="primary" onClick={handleSeed}>
            ✦ Seed Sample Data
          </Btn>
        )}
      </div>

      <div className={styles.metrics}>
        <MetricCard label="Known Recipes"   value={summary?.known_recipes ?? 0}               sub={`of ${summary?.total_recipes ?? 0} total`} />
        <MetricCard label="All-Time Revenue" value={fmtGold(summary?.total_revenue)}           color="var(--gold)" />
        <MetricCard label="All-Time Profit"  value={fmtGold(summary?.total_profit)}            color="var(--green)" />
        <MetricCard label="Avg Margin"       value={fmtPct(summary?.avg_margin)}               color="var(--teal)" />
        <MetricCard label="7-Day Revenue"    value={fmtGold(summary?.week_revenue)}            color="var(--gold)" sub={`${summary?.week_transactions ?? 0} transactions`} />
        <MetricCard label="7-Day Profit"     value={fmtGold(summary?.week_profit)}             color="var(--green)" />
      </div>

      <div className={styles.charts}>
        <Card className={styles.chartCard}>
          <CardHeader title="Sales & Profit — Last 30 Days" />
          {loadingSales || salesTime.length === 0 ? (
            <div className={styles.noChart}>No sales data yet. Log some sales to see trends.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3A3428" />
                <XAxis dataKey="date" tick={{ fill: '#8A7E68', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#8A7E68', fontSize: 11 }} tickFormatter={v => fmtGold(v)} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v, n) => [fmtGold(v), n]} />
                <Legend wrapperStyle={{ color: '#8A7E68', fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="profit"  stroke="#4A9B6F" strokeWidth={2} dot={false} name="Profit" strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className={styles.chartCard}>
          <CardHeader title="Profit by Profession" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byProf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3A3428" />
              <XAxis dataKey="profession" tick={{ fill: '#8A7E68', fontSize: 10 }} tickFormatter={p => p.slice(0,4)} />
              <YAxis tick={{ fill: '#8A7E68', fontSize: 11 }} tickFormatter={v => fmtGold(v)} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v, n) => [fmtGold(v), n]} />
              <Bar dataKey="profit" name="Profit" radius={[3,3,0,0]}
                fill="#4A9B6F"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top 10 Items by Profit" />
        {topItems.length === 0 ? (
          <div className={styles.noChart}>No sales logged yet.</div>
        ) : (
          <div className={styles.topTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Profession</th>
                  <th>Total Revenue</th>
                  <th>Total Profit</th>
                  <th>Sales</th>
                  <th>Margin</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td className={styles.rank}>{i + 1}</td>
                    <td className={styles.itemName}>{item.item_name}</td>
                    <td><ProfBadge profession={item.profession} /></td>
                    <td className="gold">{fmtGold(item.total_revenue)}</td>
                    <td style={{ color: profitColor(item.total_profit) }}>{fmtGold(item.total_profit)}</td>
                    <td className="dim">{item.sales_count}</td>
                    <td style={{ color: profitColor(item.total_profit) }}>{fmtPct(item.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
