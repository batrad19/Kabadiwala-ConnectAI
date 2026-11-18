import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Users, Recycle, MessageSquare, Search,
  CheckCircle, XCircle, Activity, AlertCircle, TrendingUp, Package
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AdminStats {
  total_users: number; total_recyclers: number; total_items: number; pending_verifications: number
  system_status: { api: string; ai_model: string; database: string }
}
interface AdminUser {
  id: string; full_name: string; email: string; role: string;
  is_active: boolean; is_verified: boolean; created_at: string
}
interface PendingRecycler {
  id: string; business_name: string; city: string; state: string
  owner_name: string; documents: string[]; created_at: string
}
interface FeedbackRecord {
  id: string; original_category: string; corrected_category: string
  correction_note: string; approved: boolean | null; created_at: string
}

// ─── Mock fallbacks ───────────────────────────────────────────────────────────
const MOCK_STATS: AdminStats = {
  total_users: 134, total_recyclers: 18, total_items: 642, pending_verifications: 5,
  system_status: { api: 'healthy', ai_model: 'healthy', database: 'healthy' },
}
const MOCK_USERS: AdminUser[] = [
  { id: '1', full_name: 'Priya Sharma', email: 'priya@example.com', role: 'household', is_active: true, is_verified: true, created_at: '2026-09-01T10:00:00Z' },
  { id: '2', full_name: 'Rahul Verma', email: 'rahul@example.com', role: 'collector', is_active: true, is_verified: false, created_at: '2026-09-15T10:00:00Z' },
  { id: '3', full_name: 'Sunita Patel', email: 'sunita@example.com', role: 'recycler', is_active: false, is_verified: true, created_at: '2026-10-01T10:00:00Z' },
]
const MOCK_RECYCLERS: PendingRecycler[] = [
  { id: 'r1', business_name: 'GreenTech Recyclers', city: 'Pune', state: 'Maharashtra', owner_name: 'Amit Kulkarni', documents: ['GST Certificate', 'CPCB Licence'], created_at: '2026-11-10T08:00:00Z' },
  { id: 'r2', business_name: 'EcoSafe Pvt Ltd', city: 'Hyderabad', state: 'Telangana', owner_name: 'Ravi Kumar', documents: ['Company Registration'], created_at: '2026-11-11T09:30:00Z' },
]
const MOCK_FEEDBACK: FeedbackRecord[] = [
  { id: 'f1', original_category: 'mobile_phone', corrected_category: 'charger_adapter', correction_note: 'Only the charger was submitted, not the phone.', approved: null, created_at: '2026-11-12T14:00:00Z' },
  { id: 'f2', original_category: 'pcb', corrected_category: 'laptop', correction_note: 'Laptop motherboard — should be classified as laptop.', approved: true, created_at: '2026-11-12T16:00:00Z' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { id: 'recyclers', label: 'Recycler Verification', icon: <Recycle className="w-4 h-4" /> },
  { id: 'feedback', label: 'AI Feedback', icon: <MessageSquare className="w-4 h-4" /> },
]

function StatusDot({ status }: { status: string }) {
  const green = status === 'healthy' || status === 'active'
  return <span className={`inline-block w-2 h-2 rounded-full ${green ? 'bg-emerald-500' : 'bg-red-400'}`} />
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    collector: 'bg-blue-100 text-blue-700',
    recycler: 'bg-emerald-100 text-emerald-700',
    aggregator: 'bg-amber-100 text-amber-700',
    household: 'bg-gray-100 text-gray-700',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[role] ?? 'bg-gray-100 text-gray-700'}`}>{role}</span>
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: AdminStats }) {
  const cards = [
    { label: 'Total Users', value: stats.total_users, icon: <Users className="w-5 h-5" />, color: '#10b981' },
    { label: 'Recyclers', value: stats.total_recyclers, icon: <Recycle className="w-5 h-5" />, color: '#1a4731' },
    { label: 'Total Items', value: stats.total_items, icon: <Package className="w-5 h-5" />, color: '#f59e0b' },
    { label: 'Pending Verifications', value: stats.pending_verifications, icon: <AlertCircle className="w-5 h-5" />, color: '#ef4444' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${c.color}18` }}>
              <div style={{ color: c.color }}>{c.icon}</div>
            </div>
            <div>
              <p className="text-xs text-sage uppercase tracking-wide">{c.label}</p>
              <p className="text-xl font-bold text-forest">{c.value.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Status */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-forest mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald" /> System Status
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.system_status).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-sage/10 last:border-0">
              <span className="text-sm font-medium text-charcoal capitalize">{key.replace('_', ' ')}</span>
              <div className="flex items-center gap-2">
                <StatusDot status={val} />
                <span className={`text-sm font-semibold ${val === 'healthy' ? 'text-emerald-600' : 'text-red-500'}`}>{val}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(Array.isArray(data) ? data : data.users ?? MOCK_USERS))
      .catch(() => setUsers(MOCK_USERS))
      .finally(() => setLoading(false))
  }, [])

  const toggleStatus = async (user: AdminUser) => {
    setActionLoading(user.id)
    try {
      await api.put(`/admin/users/${user.id}/status`, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch {
      // graceful no-op
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9 w-full max-w-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-sage">Loading users…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-sage">No users found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-sage/20">
          <table className="w-full text-sm">
            <thead className="bg-forest text-white">
              <tr>
                {['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10 bg-white">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-ivory/60 transition-colors">
                  <td className="px-4 py-3 text-sage text-xs font-mono">{u.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 font-medium text-charcoal">{u.full_name}</td>
                  <td className="px-4 py-3 text-charcoal/70">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                      <StatusDot status={u.is_active ? 'active' : 'inactive'} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(u)}
                      disabled={actionLoading === u.id}
                      className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                        u.is_active
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === u.id ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Recycler Verification Tab ─────────────────────────────────────────────────
function RecyclerVerificationTab() {
  const [recyclers, setRecyclers] = useState<PendingRecycler[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/recyclers/pending')
      .then(({ data }) => setRecyclers(Array.isArray(data) ? data : data.recyclers ?? MOCK_RECYCLERS))
      .catch(() => setRecyclers(MOCK_RECYCLERS))
      .finally(() => setLoading(false))
  }, [])

  const handleDecision = async (id: string, approve: boolean) => {
    setActionLoading(`${id}-${approve}`)
    try {
      await api.put(`/admin/recyclers/${id}/verify`, { approved: approve })
      setRecyclers(prev => prev.filter(r => r.id !== id))
    } catch {
      // graceful no-op
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-10 text-sage">Loading pending recyclers…</div>
  if (recyclers.length === 0) return (
    <div className="text-center py-16 text-sage">
      <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
      <p className="font-medium">All caught up — no pending verifications.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {recyclers.map(r => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-forest text-lg">{r.business_name}</h3>
              <p className="text-sm text-sage">{r.city}, {r.state} · Owner: {r.owner_name}</p>
              <p className="text-xs text-charcoal/50">Applied: {new Date(r.created_at).toLocaleDateString('en-IN')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {r.documents.map(doc => (
                  <span key={doc} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-lg">{doc}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => handleDecision(r.id, true)}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 eco-btn text-xs px-3 py-2 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {actionLoading === `${r.id}-true` ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => handleDecision(r.id, false)}
                disabled={!!actionLoading}
                className="flex items-center gap-1.5 bg-red-100 text-red-600 hover:bg-red-200 text-xs px-3 py-2 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                {actionLoading === `${r.id}-false` ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── AI Feedback Tab ──────────────────────────────────────────────────────────
function AIFeedbackTab() {
  const [records, setRecords] = useState<FeedbackRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/feedback')
      .then(({ data }) => setRecords(Array.isArray(data) ? data : data.feedback ?? MOCK_FEEDBACK))
      .catch(() => setRecords(MOCK_FEEDBACK))
      .finally(() => setLoading(false))
  }, [])

  const handleFeedback = async (id: string, approve: boolean) => {
    setActionLoading(`${id}-${approve}`)
    try {
      await api.put(`/admin/feedback/${id}`, { approved: approve })
      setRecords(prev => prev.map(f => f.id === id ? { ...f, approved: approve } : f))
    } catch {
      // graceful no-op
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="text-center py-10 text-sage">Loading feedback records…</div>
  if (records.length === 0) return <div className="text-center py-10 text-sage">No feedback records found.</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-sage/20">
      <table className="w-full text-sm">
        <thead className="bg-forest text-white">
          <tr>
            {['Original Category', 'Corrected Category', 'Note', 'Status', 'Date', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-sage/10 bg-white">
          {records.map(f => (
            <tr key={f.id} className="hover:bg-ivory/50 transition-colors">
              <td className="px-4 py-3 text-charcoal/70 font-mono text-xs">{f.original_category}</td>
              <td className="px-4 py-3 font-medium text-emerald-700 font-mono text-xs">{f.corrected_category}</td>
              <td className="px-4 py-3 text-charcoal/70 max-w-xs">
                <span className="line-clamp-2">{f.correction_note || '—'}</span>
              </td>
              <td className="px-4 py-3">
                {f.approved === true && <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>}
                {f.approved === false && <span className="text-red-500 font-semibold text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Rejected</span>}
                {f.approved === null && <span className="text-amber-500 font-semibold text-xs">Pending</span>}
              </td>
              <td className="px-4 py-3 text-charcoal/50 text-xs">{new Date(f.created_at).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3">
                {f.approved === null && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFeedback(f.id, true)}
                      disabled={!!actionLoading}
                      className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-semibold disabled:opacity-50"
                    >
                      {actionLoading === `${f.id}-true` ? '…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleFeedback(f.id, false)}
                      disabled={!!actionLoading}
                      className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold disabled:opacity-50"
                    >
                      {actionLoading === `${f.id}-false` ? '…' : 'Reject'}
                    </button>
                  </div>
                )}
                {f.approved !== null && <span className="text-xs text-sage italic">Decided</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<AdminStats>(MOCK_STATS)

  // Guard: redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats({ ...MOCK_STATS, ...data }))
      .catch(() => { /* use mock */ })
  }, [])

  if (!user || user.role !== 'admin') return null

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald" />
            Admin Dashboard
          </h1>
          <p className="text-sage text-sm mt-1">System management and oversight</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-sage/10 rounded-xl w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-forest shadow-sm'
                  : 'text-sage hover:text-forest hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'recyclers' && <RecyclerVerificationTab />}
          {activeTab === 'feedback' && <AIFeedbackTab />}
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
