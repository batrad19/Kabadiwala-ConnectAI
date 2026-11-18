import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Recycle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const roles = [
  { value: 'household', label: '🏠 Household', desc: 'I want to recycle my home electronics' },
  { value: 'collector', label: '🏍️ Collector', desc: 'I collect e-waste from households' },
  { value: 'recycler', label: '🏭 Recycler', desc: 'I operate an e-waste recycling facility' },
  { value: 'aggregator', label: '🏗️ Aggregator', desc: 'I aggregate e-waste from collectors' },
  { value: 'business', label: '💼 Business', desc: 'Business/corporate e-waste disposal' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', role: 'household' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await register(form); navigate('/dashboard') }
    catch (err: any) { setError(err?.response?.data?.detail || 'Registration failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="absolute inset-0 hero-pattern pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-forest mb-2">
            <div className="w-10 h-10 rounded-xl bg-eco-gradient flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal">Create Account</h1>
          <p className="text-sage text-sm mt-1">Join the e-waste recycling network</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1">Full Name</label>
            <input type="text" required value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={e => set('password', e.target.value)}
              className="input-field" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1">Phone (optional)</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              className="input-field" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-2">I am a…</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map(r => (
                <button key={r.value} type="button" onClick={() => set('role', r.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${form.role === r.value ? 'border-emerald bg-emerald/5' : 'border-sage/30 hover:border-sage'}`}>
                  <div className="font-semibold text-charcoal">{r.label}</div>
                  <div className="text-xs text-sage mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="eco-btn w-full flex items-center justify-center gap-2 mt-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-charcoal/60 mt-4">
          Already have an account? <Link to="/login" className="text-forest font-semibold hover:text-emerald">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
