import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, CheckCircle, AlertTriangle, ChevronRight, Info } from 'lucide-react'
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

type ConditionBadge = 'excellent' | 'good' | 'fair' | 'poor' | 'non_functional'

interface AssessmentResult {
  condition: ConditionBadge
  reasoning: string[]
  recommended_action: string
  score?: number
}

interface FormState {
  category_slug: string
  age_years: string
  functionality: string
  condition_input: string
  missing_components: string
  observations: string
}

const conditionConfig: Record<ConditionBadge, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  excellent:     { label: 'Excellent',     color: 'text-emerald-700', bg: 'bg-emerald/10 border-emerald/30', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
  good:          { label: 'Good',          color: 'text-green-700',   bg: 'bg-green-50 border-green-200',   icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  fair:          { label: 'Fair',          color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
  poor:          { label: 'Poor',          color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200', icon: <AlertTriangle className="w-5 h-5 text-orange-500" /> },
  non_functional:{ label: 'Non-Functional',color: 'text-red-700',     bg: 'bg-red-50 border-red-200',       icon: <AlertTriangle className="w-5 h-5 text-red-500" /> },
}

const fadeInUp: any = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function ConditionAssessmentPage() {
  const location = useLocation()
  const locationState = location.state as { category?: string } | null

  const [form, setForm] = useState<FormState>({
    category_slug: locationState?.category ?? '',
    age_years: '',
    functionality: '',
    condition_input: '',
    missing_components: '0',
    observations: '',
  })
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update category if navigated with state
  useEffect(() => {
    if (locationState?.category) {
      setForm(f => ({ ...f, category_slug: locationState.category! }))
    }
  }, [locationState?.category])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {
        category_slug: form.category_slug,
        age_years: parseFloat(form.age_years) || 0,
        functionality: form.functionality,
        condition_input: form.condition_input,
        missing_components: parseInt(form.missing_components, 10) || 0,
        observations: form.observations,
      }
      const { data } = await api.post<AssessmentResult>('/condition/assess', payload)
      setResult(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Assessment failed. Please check your inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? conditionConfig[result.condition] ?? conditionConfig.fair : null

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="section-title flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald" /> Condition Assessment
          </h1>
          <p className="text-sm text-sage mt-1">
            Describe your e-waste item to get a rule-based condition rating.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">
                Item Category <span className="text-red-500">*</span>
              </label>
              <select name="category_slug" value={form.category_slug} onChange={handleChange}
                required className="input-field">
                <option value="">Select category…</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1.5">
                  Age (years) <span className="text-red-500">*</span>
                </label>
                <input type="number" name="age_years" value={form.age_years} onChange={handleChange}
                  required min={0} max={30} step={0.5} placeholder="e.g. 3"
                  className="input-field" />
              </div>

              {/* Functionality */}
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

            {/* Condition input */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">
                Physical Condition <span className="text-red-500">*</span>
              </label>
              <input type="text" name="condition_input" value={form.condition_input} onChange={handleChange}
                required placeholder="e.g. minor scratches, cracked screen, good overall…"
                className="input-field" />
            </div>

            {/* Missing components */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">
                Missing Components (0–10)
              </label>
              <input type="number" name="missing_components" value={form.missing_components}
                onChange={handleChange} min={0} max={10} step={1}
                className="input-field" />
              <p className="text-xs text-sage mt-1">Number of significant parts missing (e.g. battery, adapter, keys)</p>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-1.5">Additional Observations</label>
              <textarea name="observations" value={form.observations} onChange={handleChange}
                rows={3} placeholder="Any other details about condition, damage, or history…"
                className="input-field resize-none" />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="eco-btn w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Assessing…</>
              ) : (
                <><ClipboardList className="w-4 h-4" /> Assess Condition</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Result Card */}
        <AnimatePresence>
          {result && cfg && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" exit="hidden"
              className={`glass-card p-6 sm:p-8 border ${cfg.bg}`}>
              {/* Badge */}
              <div className="flex items-center gap-3 mb-6">
                {cfg.icon}
                <div>
                  <div className="text-xs text-sage font-semibold uppercase tracking-widest">Condition Rating</div>
                  <div className={`text-2xl font-extrabold ${cfg.color}`}>{cfg.label}</div>
                </div>
                {result.score !== undefined && (
                  <div className="ml-auto text-right">
                    <div className="text-xs text-sage">Score</div>
                    <div className="text-xl font-bold text-charcoal">{result.score}<span className="text-sm text-sage">/100</span></div>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              {result.reasoning.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-charcoal mb-3 flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-emerald" /> Assessment Reasoning
                  </h3>
                  <ul className="space-y-2">
                    {result.reasoning.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-sage">
                        <span className="w-5 h-5 rounded-full bg-sage/20 flex items-center justify-center text-xs font-bold text-sage flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended action */}
              <div className="bg-white/60 rounded-xl px-5 py-4 mb-5">
                <div className="text-xs font-semibold text-sage uppercase tracking-widest mb-1">Recommended Action</div>
                <div className="text-sm font-semibold text-charcoal">{result.recommended_action}</div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Disclaimer:</strong> This is a rule-based estimate, not a professional appraisal. Actual
                  condition may vary based on factors not captured in this form. For high-value items, seek
                  an in-person evaluation.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
