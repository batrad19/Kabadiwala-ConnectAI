import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Eye, EyeOff, Send, ArrowRight, Wrench, DollarSign, MapPin, ChevronDown } from 'lucide-react'
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

interface Top3Item { label: string; score: number }
interface Prediction {
  category: string
  confidence: number
  top3: Top3Item[]
  gradcam_url?: string
  model_used?: string
}

const CIRCUMFERENCE = 2 * Math.PI * 52 // r=52

export default function PredictionResultsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { prediction?: Prediction } | null

  const [showGradcam, setShowGradcam] = useState(false)
  const [feedbackCategory, setFeedbackCategory] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE)

  const defaultPrediction: Prediction = {
    category: 'laptop',
    confidence: 94.8,
    model_used: 'efficientnet_b0_transfer',
    top3: [
      { label: 'laptop', score: 94.8 },
      { label: 'monitor', score: 3.8 },
      { label: 'pcb', score: 1.4 },
    ],
  }

  const prediction = state?.prediction ?? defaultPrediction

  useEffect(() => {
    // Animate confidence ring after mount
    const timer = setTimeout(() => {
      setDashOffset(CIRCUMFERENCE * (1 - prediction.confidence / 100))
    }, 300)
    return () => clearTimeout(timer)
  }, [prediction])

  const confidenceColor =
    prediction.confidence >= 80 ? '#10b981' :
    prediction.confidence >= 55 ? '#f59e0b' : '#ef4444'

  const categoryLabel = CATEGORIES.find(c => c.value === prediction.category)?.label ?? prediction.category

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!feedbackCategory || !prediction) return
    setFeedbackLoading(true)
    setFeedbackError('')
    try {
      await api.post('/ai/feedback', {
        predicted_category: prediction.category,
        correct_category: feedbackCategory,
        confidence: prediction.confidence,
      })
      setFeedbackSubmitted(true)
    } catch {
      setFeedbackError('Could not submit feedback. Please try again.')
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="page-header">
          <h1 className="section-title">AI Prediction Results</h1>
          <p className="text-sm text-sage mt-1">
            Model: <span className="font-semibold text-charcoal">{prediction.model_used ?? 'ResNet-50 Fine-tuned'}</span>
          </p>
        </motion.div>

        {/* Confidence + Category */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-8">

          {/* Circular Confidence SVG */}
          <div className="flex-shrink-0 relative">
            <svg width="140" height="140" className="rotate-[-90deg]">
              <circle cx="70" cy="70" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <motion.circle
                cx="70" cy="70" r="52" fill="none"
                stroke={confidenceColor} strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                initial={{ strokeDashoffset: CIRCUMFERENCE }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold" style={{ color: confidenceColor }}>
                {Math.round(prediction.confidence)}%
              </span>
              <span className="text-xs text-sage font-medium">confidence</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs text-sage font-semibold uppercase tracking-widest mb-1">Detected Category</div>
            <div className="text-3xl font-extrabold text-charcoal mb-2">{categoryLabel}</div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className={`badge ${prediction.confidence >= 80 ? 'badge-green' : prediction.confidence >= 55 ? 'badge-orange' : 'badge-red'}`}>
                {prediction.confidence >= 80 ? 'High Confidence' : prediction.confidence >= 55 ? 'Medium Confidence' : 'Low Confidence'}
              </span>
              <span className="badge badge-blue">{prediction.category.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </motion.div>

        {/* Top-3 Predictions */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6">
          <h2 className="font-bold text-charcoal mb-5 flex items-center gap-2">
            <ChevronDown className="w-4 h-4 text-emerald" /> Top-3 Predictions
          </h2>
          <div className="space-y-4">
            {prediction.top3.map((item, i) => {
              const label = CATEGORIES.find(c => c.value === item.label)?.label ?? item.label
              const pct = Math.round(item.score * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className={`font-semibold ${i === 0 ? 'text-forest' : 'text-charcoal'}`}>{label}</span>
                    <span className="text-sage">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-sage/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? 'linear-gradient(90deg,#1a4731,#10b981)' : i === 1 ? '#84a98c' : '#d1d5db' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Grad-CAM */}
        {prediction.gradcam_url && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-charcoal flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald" /> Grad-CAM Heatmap
              </h2>
              <button onClick={() => setShowGradcam(v => !v)}
                className="eco-btn-outline text-xs py-1.5 px-4 flex items-center gap-1.5">
                {showGradcam ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
              </button>
            </div>
            <AnimatePresence>
              {showGradcam && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}>
                  <img src={prediction.gradcam_url} alt="Grad-CAM heatmap"
                    className="rounded-xl w-full max-w-sm mx-auto border border-sage/30 shadow-sm" />
                  <p className="text-xs text-sage text-center mt-3">
                    Highlighted regions show which parts of the image influenced the model's decision.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Feedback form */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
          className="glass-card p-6">
          <h2 className="font-bold text-charcoal mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" /> Correct This Prediction
          </h2>
          {feedbackSubmitted ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald/10 rounded-xl px-4 py-3 text-sm font-medium">
              <CheckCircle className="w-5 h-5" /> Thank you! Your feedback helps improve the model.
            </div>
          ) : (
            <form onSubmit={handleFeedback} className="flex flex-col sm:flex-row gap-3">
              <select value={feedbackCategory} onChange={e => setFeedbackCategory(e.target.value)}
                className="input-field flex-1">
                <option value="">Select correct category…</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button type="submit" disabled={!feedbackCategory || feedbackLoading}
                className="eco-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-4 h-4" />
                {feedbackLoading ? 'Sending…' : 'Submit'}
              </button>
            </form>
          )}
          {feedbackError && <p className="text-red-500 text-sm mt-2">{feedbackError}</p>}
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
          className="glass-card p-6">
          <h2 className="font-bold text-charcoal mb-5">What would you like to do next?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <button onClick={() => navigate('/condition', { state: { category: prediction.category } })}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-sage/30 hover:border-forest hover:bg-forest/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-forest/10 flex items-center justify-center group-hover:bg-forest/20 transition-colors">
                <Wrench className="w-6 h-6 text-forest" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-charcoal text-sm">Assess Condition</div>
                <div className="text-xs text-sage mt-0.5">Rate wear & functionality</div>
              </div>
              <ArrowRight className="w-4 h-4 text-sage group-hover:text-forest transition-colors" />
            </button>

            <button onClick={() => navigate('/valuation', { state: { category: prediction.category } })}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-sage/30 hover:border-emerald hover:bg-emerald/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center group-hover:bg-emerald/20 transition-colors">
                <DollarSign className="w-6 h-6 text-emerald" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-charcoal text-sm">Get Valuation</div>
                <div className="text-xs text-sage mt-0.5">Estimate scrap value</div>
              </div>
              <ArrowRight className="w-4 h-4 text-sage group-hover:text-emerald transition-colors" />
            </button>

            <button onClick={() => navigate('/marketplace')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-sage/30 hover:border-sky-500 hover:bg-sky-50 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                <MapPin className="w-6 h-6 text-sky-600" />
              </div>
              <div className="text-center">
                <div className="font-semibold text-charcoal text-sm">Find Recyclers</div>
                <div className="text-xs text-sage mt-0.5">Nearby certified handlers</div>
              </div>
              <ArrowRight className="w-4 h-4 text-sage group-hover:text-sky-500 transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
