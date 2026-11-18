import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, MapPin, Shield, Edit3, Save, X, Lock, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string; full_name: string; email: string; role: string
  phone?: string; city?: string; state?: string
  is_active: boolean; is_verified: boolean
  created_at: string; last_login?: string
}

interface Toast { id: number; message: string; type: 'success' | 'error' }

// ─── Toast component ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto cursor-pointer ${
              t.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
            }`}
            onClick={() => remove(t.id)}
          >
            {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    collector: 'bg-blue-100 text-blue-700 border-blue-200',
    recycler: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    aggregator: 'bg-amber-100 text-amber-700 border-amber-200',
    household: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${colors[role] ?? 'bg-gray-100 text-gray-700'}`}>
      {role}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', city: '', state: '' })
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwLoading, setPwLoading] = useState(false)

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => {
        const p: UserProfile = data.user ?? data
        setProfile(p)
        setForm({ full_name: p.full_name, phone: p.phone ?? '', city: p.city ?? '', state: p.state ?? '' })
      })
      .catch(() => {
        // Provide a sensible fallback for demo
        const demo: UserProfile = {
          id: 'demo', full_name: 'Demo User', email: 'demo@kabadiwala.app',
          role: 'household', phone: '+91 98765 43210', city: 'Mumbai', state: 'Maharashtra',
          is_active: true, is_verified: true,
          created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
          last_login: new Date().toISOString(),
        }
        setProfile(demo)
        setForm({ full_name: demo.full_name, phone: demo.phone ?? '', city: demo.city ?? '', state: demo.state ?? '' })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.full_name.trim()) { addToast('Name cannot be empty.', 'error'); return }
    setSaving(true)
    try {
      const { data } = await api.put('/users/me', form)
      const updated = data.user ?? { ...profile, ...form }
      setProfile(prev => prev ? { ...prev, ...updated } : prev)
      setEditing(false)
      addToast('Profile updated successfully!', 'success')
    } catch (err: any) {
      addToast(err?.response?.data?.detail ?? 'Failed to save profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!pwForm.current_password || !pwForm.new_password) {
      addToast('Please fill in all password fields.', 'error'); return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      addToast('New passwords do not match.', 'error'); return
    }
    if (pwForm.new_password.length < 8) {
      addToast('New password must be at least 8 characters.', 'error'); return
    }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
      addToast('Password changed successfully!', 'success')
    } catch (err: any) {
      const msg = err?.response?.status === 404
        ? 'Password change endpoint not available yet.'
        : err?.response?.data?.detail ?? 'Failed to change password.'
      addToast(msg, 'error')
    } finally {
      setPwLoading(false)
    }
  }

  const initials = profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-eco-gradient flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-forest">{profile?.full_name}</h1>
                {profile?.role && <RoleBadge role={profile.role} />}
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-sage">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{profile?.email}</span>
                {profile?.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>}
                {(profile?.city || profile?.state) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />{[profile.city, profile.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-sage/70">
                {profile?.created_at && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
                {profile?.last_login && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Last login {new Date(profile.last_login).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </div>

            {/* Edit toggle */}
            <button
              onClick={() => editing ? setEditing(false) : setEditing(true)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                editing ? 'bg-sage/20 text-sage hover:bg-sage/30' : 'eco-btn'
              }`}
            >
              {editing ? <><X className="w-4 h-4" />Cancel</> : <><Edit3 className="w-4 h-4" />Edit Profile</>}
            </button>
          </div>
        </motion.div>

        {/* Edit form */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card p-6 space-y-4 overflow-hidden"
            >
              <h2 className="font-semibold text-forest flex items-center gap-2"><Edit3 className="w-4 h-4 text-emerald" />Edit Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="input-field w-full"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g. Maharashtra"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="eco-btn flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-forest flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald" />
            Change Password
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">Current Password</label>
              <input
                type="password"
                value={pwForm.current_password}
                onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                className="input-field w-full"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">New Password</label>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                className="input-field w-full"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-sage mb-1 uppercase tracking-wide">Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirm_password}
                onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                className="input-field w-full"
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={pwLoading}
            className="flex items-center gap-2 bg-forest text-white px-5 py-2.5 rounded-xl hover:bg-forest/90 font-semibold text-sm transition-colors disabled:opacity-60"
          >
            <Lock className="w-4 h-4" />
            {pwLoading ? 'Changing…' : 'Change Password'}
          </button>
        </motion.div>

        {/* Account info (non-editable) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
          <h2 className="font-semibold text-forest flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-emerald" /> Account Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-sage/10">
              <span className="text-sage font-medium">Account Status</span>
              <span className={`font-semibold ${profile?.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                {profile?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-sage/10">
              <span className="text-sage font-medium">Verification</span>
              <span className={`font-semibold ${profile?.is_verified ? 'text-emerald-600' : 'text-amber-500'}`}>
                {profile?.is_verified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sage font-medium">Account ID</span>
              <span className="text-charcoal/50 font-mono text-xs">{profile?.id.slice(0, 16)}…</span>
            </div>
          </div>
        </motion.div>
      </div>

      <ToastContainer toasts={toasts} remove={removeToast} />
    </DashboardLayout>
  )
}
