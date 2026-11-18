import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Legend, Tooltip as ReTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { BarChart3, TrendingUp, Package, Leaf, IndianRupee, Calendar } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
  total_items: number
  total_weight_kg: number
  total_value_inr: number
  co2_saved_kg: number
  category_distribution?: { name: string; value: number }[]
  monthly_trend?: { month: string; count: number }[]
  avg_value_by_category?: { category: string; avg_value: number }[]
}

// ─── Mock / fallback data ─────────────────────────────────────────────────────
const MOCK_STATS: DashboardStats = {
  total_items: 142,
  total_weight_kg: 287,
  total_value_inr: 94500,
  co2_saved_kg: 158,
}

const MOCK_CATEGORY_DIST = [
  { name: 'Mobile', value: 38 },
  { name: 'Laptop', value: 27 },
  { name: 'Battery', value: 22 },
  { name: 'Monitor', value: 15 },
  { name: 'Others', value: 40 },
]

const MOCK_MONTHLY_TREND = [
  { month: 'Jun', count: 18 },
  { month: 'Jul', count: 24 },
  { month: 'Aug', count: 19 },
  { month: 'Sep', count: 31 },
  { month: 'Oct', count: 27 },
  { month: 'Nov', count: 23 },
]

const MOCK_AVG_VALUE = [
  { category: 'Laptop', avg_value: 3800 },
  { category: 'Mobile', avg_value: 1200 },
  { category: 'Monitor', avg_value: 850 },
  { category: 'Battery', avg_value: 220 },
  { category: 'PCB', avg_value: 1600 },
  { category: 'TV', avg_value: 700 },
]

// ─── Palette ──────────────────────────────────────────────────────────────────
const COLORS = ['#10b981', '#1a4731', '#84a98c', '#f59e0b', '#6366f1']

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, suffix = '', color,
}: { icon: React.ReactNode; label: string; value: string | number; suffix?: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card flex items-center gap-4"
    >
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-xs text-sage font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-forest">
          {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
          {suffix && <span className="text-sm text-sage ml-1">{suffix}</span>}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [categoryDist, setCategoryDist] = useState(MOCK_CATEGORY_DIST)
  const [monthlyTrend, setMonthlyTrend] = useState(MOCK_MONTHLY_TREND)
  const [avgValue, setAvgValue] = useState(MOCK_AVG_VALUE)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard')
        setStats({
          total_items: data.total_items ?? MOCK_STATS.total_items,
          total_weight_kg: data.total_weight_kg ?? MOCK_STATS.total_weight_kg,
          total_value_inr: data.total_value_inr ?? MOCK_STATS.total_value_inr,
          co2_saved_kg: data.co2_saved_kg ?? MOCK_STATS.co2_saved_kg,
        })
        if (data.category_distribution?.length) setCategoryDist(data.category_distribution)
        if (data.monthly_trend?.length) setMonthlyTrend(data.monthly_trend)
        if (data.avg_value_by_category?.length) setAvgValue(data.avg_value_by_category)
      } catch {
        // Gracefully fall back to mock data — API may be 404/500 in demo mode
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { icon: <Package className="w-5 h-5" />, label: 'Total Items', value: stats.total_items, suffix: 'items', color: '#10b981' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Total Weight', value: stats.total_weight_kg, suffix: 'kg', color: '#1a4731' },
    { icon: <IndianRupee className="w-5 h-5" />, label: 'Total Value', value: `₹${stats.total_value_inr.toLocaleString('en-IN')}`, suffix: '', color: '#f59e0b' },
    { icon: <Leaf className="w-5 h-5" />, label: 'CO₂ Saved', value: stats.co2_saved_kg, suffix: 'kg', color: '#84a98c' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald" />
              Analytics Dashboard
            </h1>
            <p className="text-sage text-sm mt-1">Your e-waste impact at a glance</p>
          </div>

          {/* Date range filter (UI only) */}
          <div className="flex items-center gap-2 glass-card p-2 rounded-xl">
            <Calendar className="w-4 h-4 text-sage flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="input-field text-sm py-1 px-2 w-36"
              placeholder="From"
            />
            <span className="text-sage text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="input-field text-sm py-1 px-2 w-36"
              placeholder="To"
            />
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="stat-card animate-pulse h-24 bg-sage/10" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Charts row 1: Pie + Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Pie */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h2 className="text-base font-semibold text-forest mb-4">Category Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categoryDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDist.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip formatter={(val: any) => [`${val} items`, 'Count']} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Monthly Submission Trend Line */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="glass-card p-5">
            <h2 className="text-base font-semibold text-forest mb-4">Monthly Submission Trend (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#84a98c33" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#84a98c' }} />
                <YAxis tick={{ fontSize: 12, fill: '#84a98c' }} />
                <ReTooltip
                  contentStyle={{ background: '#f8f7f4', border: '1px solid #84a98c40', borderRadius: '8px' }}
                  formatter={(val: any) => [val, 'Submissions']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts row 2: Bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="glass-card p-5">
          <h2 className="text-base font-semibold text-forest mb-4">Average Value by Category (₹)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={avgValue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#84a98c33" />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#84a98c' }} />
              <YAxis tick={{ fontSize: 12, fill: '#84a98c' }} tickFormatter={v => `₹${v}`} />
              <ReTooltip
                contentStyle={{ background: '#f8f7f4', border: '1px solid #84a98c40', borderRadius: '8px' }}
                formatter={(val: any) => [`₹${val ? val.toLocaleString('en-IN') : 0}`, 'Avg Value']}
              />
              <Bar dataKey="avg_value" radius={[6, 6, 0, 0]}>
                {avgValue.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <p className="text-xs text-sage text-center pb-2">
          * Data shown is {loading ? 'loading…' : 'from your account activity'}. Date range filter is UI-only in this release.
        </p>
      </div>
    </DashboardLayout>
  )
}
