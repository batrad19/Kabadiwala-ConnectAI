import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, IndianRupee, Info, AlertTriangle, ChevronRight } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

const CATEGORIES = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'mobile_phone', label: 'Mobile Phone' },
  { value: 'battery', label: 'Battery' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'pcb', label: 'PCB / Circuit Board' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'printer', label: 'Printer' },
  { value: 'television', label: 'Television' },
  { value: 'cables', label: 'Cables' },
  { value: 'charger_adapter', label: 'Charger / Adapter' },
  { value: 'other_ewaste', label: 'Other E-Waste' },
]

interface ValuationResult {
  price_min: number
  price_expected: number
  price_max: number
  currency: string
  factors: string[]
  unit?: string
}

interface FormState {
  category: string
  brand: string
  weight_kg: string
  age_years: string
  condition: string
  functionality: string
  missing_components: string
  region: string
}

const fadeInUp: any = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(value)
}

function PriceMeter({ min, expected, max }: { min: number; expected: number; max: number }) {
  const range = max - min || 1
  const expectedPct = ((expected - min) / range) * 100

  return (
    <div className="mt-6">
      <div className="relative h-8 bg-sage/15 rounded-full overflow-hidden">
        {/* Min segment */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-full"
          style={{ background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
          initial={{ width: 0 }}
          animate={{ width: `${((expected - min) / range) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
        {/* Expected to max segment */}
        <motion.div
          className="absolute top-0 h-full"
          style={{
            left: `${((expected - min) / range) * 100}%`,
            background: 'linear-gradient(90deg, #10b981, #1a4731)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${((max - expected) / range) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
        />
        {/* Expected marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-emerald rounded-full shadow-md z-10"
          style={{ left: `calc(${expectedPct}% - 8px)` }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-3 text-sm">
        <div className="text-left">
          <div className="text-xs text-sage font-medium">Minimum</div>
          <div className="font-bold text-charcoal">{formatINR(min)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-sage font-medium">Expected</div>
          <div className="font-extrabold text-emerald text-base">{formatINR(expected)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-sage font-medium">Maximum</div>
          <div className="font-bold text-charcoal">{formatINR(max)}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-sage">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} />
          Min–Expected range
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(90deg,#10b981,#1a4731)' }} />
          Expected–Max range
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-emerald bg-white" />
          Expected price
        </div>
      </div>
    </div>
  )
}

export default function ValuationPage() {
  const location = useLocation()
  const locationState = location.state as { category?: string } | null

  const [form, setForm] = useState<FormState>({
    category: locationState?.category ?? '',
    brand: '',
    weight_kg: '1',
    age_years: '',
    condition: '',
    functionality: '',
    missing_components: '0',
    region: 'metro',
  })
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (locationState?.category) {
      setForm(f => ({ ...f, category: locationState.category! }))
    }
  }, [locationState?.category])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        category: form.category,
        category_slug: form.category,
        brand: form.brand || undefined,
        weight_kg: parseFloat(form.weight_kg) || 1,
        age_years: parseFloat(form.age_years) || 0,
        condition: form.condition || 'good',
        functionality: form.functionality || 'working',
        missing_components: parseInt(form.missing_components, 10) || 0,
        region: form.region || 'metro',
      }
      const { data } = await api.post<ValuationResult>('/valuation/estimate', payload)
      setResult(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Valuation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="section-title flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald" /> Scrap Value Estimator
          </h1>
          <p className="text-sm text-sage mt-1">
            Get an indicative price range for your e-waste based on category, age, and condition.
          </p>
        </motion.div>

        {/* Demo data notice */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>DEMONSTRATION DATA</strong> — prices are illustrative only. Market prices vary significantly
            by location, buyer demand, and material composition.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category + Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select name="category" value={form.category} onChange={handleChange}
                  required className="input-field">
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">Brand</label>
                <input type="text" name="brand" value={form.brand} onChange={handleChange}
                  placeholder="e.g. Dell, Samsung…" className="input-field" />
              </div>
            </div>

            {/* Weight + Age */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">Weight (kg)</label>
                <input type="number" name="weight_kg" value={form.weight_kg} onChange={handleChange}
                  min={0.1} max={200} step={0.1} placeholder="1" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  Age (years) <span className="text-red-500">*</span>
                </label>
                <input type="number" name="age_years" value={form.age_years} onChange={handleChange}
                  required min={0} max={30} step={0.5} placeholder="e.g. 3" className="input-field" />
              </div>
            </div>

            {/* Condition + Functionality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select name="condition" value={form.condition} onChange={handleChange}
                  required className="input-field">
                  <option value="">Select…</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="non_functional">Non-Functional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  Functionality <span className="text-red-500">*</span>
                </label>
                <select name="functionality" value={form.functionality} onChange={handleChange}
                  required className="input-field">
                  <option value="">Select…</option>
                  <option value="working">Working</option>
                  <option value="partial">Partially Working</option>
                  <option value="non_working">Not Working</option>
                </select>
              </div>
            </div>

            {/* Missing components + Region */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">Missing Components</label>
                <input type="number" name="missing_components" value={form.missing_components}
                  onChange={handleChange} min={0} max={10} step={1} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">Region</label>
                <select name="region" value={form.region} onChange={handleChange} className="input-field">
                  <option value="metro">Metro (Mumbai/Delhi/Bangalore…)</option>
                  <option value="tier1">Tier-1 City</option>
                  <option value="tier2">Tier-2 City</option>
                  <option value="tier3">Tier-3 / Rural</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="eco-btn w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Estimating…</>
              ) : (
                <><IndianRupee className="w-4 h-4" /> Get Valuation</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" exit="hidden"
              className="glass-card p-6 sm:p-8 border border-emerald/20">

              {/* Price header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-eco-gradient flex items-center justify-center shadow-eco">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-sage font-semibold uppercase tracking-widest">Estimated Value</div>
                  <div className="text-2xl font-extrabold text-emerald">{formatINR(result.price_expected)}</div>
                </div>
                {result.unit && (
                  <div className="ml-auto badge badge-green text-xs">{result.unit}</div>
                )}
              </div>

              {/* Animated Price Meter */}
              <PriceMeter min={result.price_min} expected={result.price_expected} max={result.price_max} />

              {/* Factors */}
              {result.factors && result.factors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-charcoal mb-3 flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-emerald" /> Valuation Factors
                  </h3>
                  <ul className="space-y-2">
                    {result.factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-sage">
                        <span className="w-5 h-5 rounded-full bg-sage/15 flex items-center justify-center text-xs font-bold text-sage flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {typeof f === 'object' && f !== null ? `${(f as any).factor}: ${(f as any).value}` : String(f)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bold Disclaimer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-xl px-5 py-4">
                <p className="text-sm text-amber-800 font-bold leading-relaxed text-center">
                  ⚠️ DEMONSTRATION DATA — prices are illustrative only.<br />
                  Market prices vary significantly by location, demand, and material composition.
                  Do not use this for commercial transactions without independent verification.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
