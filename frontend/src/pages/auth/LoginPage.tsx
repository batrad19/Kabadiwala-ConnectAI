import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Recycle, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(email, password); navigate('/dashboard') }
    catch (err: any) { setError(err?.response?.data?.detail || 'Login failed. Check your credentials.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="absolute inset-0 hero-pattern pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 font-bold text-xl text-forest mb-2">
            <div className="w-10 h-10 rounded-xl bg-eco-gradient flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-charcoal">Welcome back</h1>
          <p className="text-sage text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal/80 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
              <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                className="input-field pl-10 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sage">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick demo logins */}
          <div className="bg-emerald/5 border border-emerald/20 rounded-xl p-3 text-xs text-charcoal/70">
            <strong>Demo accounts:</strong><br />
            Admin: admin@kabadiwala.local / Admin@123456<br />
            Recycler: demo_recycler1@kabadiwala.demo / Demo@123456
          </div>

          <button type="submit" disabled={loading} className="eco-btn w-full flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-forest font-semibold hover:text-emerald transition-colors">Create one</Link>
        </p>
      </motion.div>
    </div>
  )
}
