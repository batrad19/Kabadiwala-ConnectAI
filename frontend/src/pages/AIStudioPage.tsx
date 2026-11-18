import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Webcam from 'react-webcam'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, History, X, RefreshCw, Zap, AlertTriangle, CheckCircle, Info, Eye, Edit3, ArrowRight } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { Link } from 'react-router-dom'

type Tab = 'camera' | 'upload' | 'history'
type Prediction = { predicted_category: string; confidence: number; top3_predictions: any[]; is_confident: boolean; uncertainty_message?: string; quality_assessment: any; suggested_action: string; prediction_id: string; image_url: string; model_version: string; }

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-charcoal/70 truncate capitalize">{label.replace(/_/g, ' ')}</span>
      <div className="flex-1 h-2 bg-sage/20 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <span className="w-10 text-right font-bold" style={{ color }}>{pct}%</span>
    </div>
  )
}

function PredictionCard({ pred, file, onCorrect }: { pred: Prediction; file: File | null; onCorrect: () => void }) {
  const [showGradcam, setShowGradcam] = useState(false)
  const [gradcam, setGradcam] = useState<string | null>(null)
  const [loadingGradcam, setLoadingGradcam] = useState(false)

  const fetchGradcam = async () => {
    if (gradcam) { setShowGradcam(true); return }
    setLoadingGradcam(true)
    try {
      const form = new FormData()
      form.append('prediction_id', pred.prediction_id)
      if (file) {
        form.append('file', file)
      }
      const r = await api.post('/ai/explain', form)
      if (r.data?.gradcam_image_base64) {
        setGradcam(r.data.gradcam_image_base64)
        setShowGradcam(true)
      } else {
        alert('Could not render Grad-CAM explanation for this item.')
      }
    } catch (e: any) {
      const errDetail = e?.response?.data?.detail
      const msg = typeof errDetail === 'string'
        ? errDetail
        : (Array.isArray(errDetail) ? errDetail.map((d: any) => d.msg).join(', ') : 'Grad-CAM generation failed.')
      alert(msg)
    }
    finally { setLoadingGradcam(false) }
  }

  const isConfident = pred.is_confident
  const pct = Math.round(pred.confidence * 100)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', damping: 20 }}
      className="glass-card p-6 mt-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-2 ${isConfident ? 'bg-emerald/15 text-emerald' : 'bg-amber-100 text-amber-700'}`}>
            {isConfident ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {isConfident ? 'Identified' : 'Uncertain'}
          </div>
          <h3 className="text-xl font-extrabold text-charcoal capitalize">{pred.predicted_category.replace(/_/g, ' ')}</h3>
          <p className="text-sage text-sm mt-0.5">Model: {pred.model_version}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black" style={{ color: pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444' }}>{pct}%</div>
          <div className="text-xs text-sage">Confidence</div>
        </div>
      </div>

      {pred.uncertainty_message && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {pred.uncertainty_message}
        </div>
      )}

      {/* Top 3 */}
      <div className="mb-5 space-y-2">
        <div className="text-xs font-semibold text-sage uppercase tracking-wide mb-2">Top Predictions</div>
        {pred.top3_predictions.map((p: any) => (
          <ConfidenceBar key={p.category} value={p.confidence} label={p.category} />
        ))}
      </div>

      {/* Quality */}
      {pred.quality_assessment && !pred.quality_assessment.is_acceptable && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          <strong>Image quality issues:</strong> {pred.quality_assessment.issues?.join(', ')}
        </div>
      )}

      <p className="text-sm text-charcoal/70 bg-sage/10 rounded-xl px-4 py-3 mb-5">
        <Info className="w-4 h-4 inline mr-1.5 text-sage" />{pred.suggested_action}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/valuation" state={{ category: pred.predicted_category }} className="eco-btn text-sm py-2 flex items-center gap-2">
          Get Valuation <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/inventory" className="eco-btn-outline text-sm py-2">Save to Inventory</Link>
        <button onClick={fetchGradcam} disabled={loadingGradcam}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sage/40 text-sm font-semibold text-charcoal/70 hover:border-forest hover:text-forest transition-all">
          {loadingGradcam ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Eye className="w-4 h-4" />}
          Explain AI
        </button>
        <button onClick={onCorrect}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sage/40 text-sm font-semibold text-charcoal/70 hover:border-amber-500 hover:text-amber-600 transition-all">
          <Edit3 className="w-4 h-4" /> Correct Label
        </button>
      </div>

      {/* Grad-CAM modal */}
      <AnimatePresence>
        {showGradcam && gradcam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowGradcam(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-charcoal">Grad-CAM Explanation</h3>
                <button onClick={() => setShowGradcam(false)}><X className="w-5 h-5 text-sage" /></button>
              </div>
              <img src={`data:image/jpeg;base64,${gradcam}`} alt="Grad-CAM heatmap" className="w-full rounded-xl" />
              <p className="text-xs text-sage mt-3">Red/orange regions show where the AI focused most. Left: original. Right: attention overlay.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AIStudioPage() {
  const [tab, setTab] = useState<Tab>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCorrect, setShowCorrect] = useState(false)
  const [correctCat, setCorrectCat] = useState('')
  const webcamRef = useRef<Webcam>(null)

  const categories = ['laptop','mobile_phone','battery','keyboard','mouse','pcb','monitor','printer','television','cables','charger_adapter','other_ewaste']

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return
    setPreview(imageSrc)
    // Convert base64 to file
    fetch(imageSrc).then(r => r.blob()).then(blob => {
      setFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (!accepted[0]) return
      setFile(accepted[0])
      setPreview(URL.createObjectURL(accepted[0]))
      setPrediction(null)
    },
  })

  const handleClassify = async () => {
    if (!file) return
    setLoading(true); setError(''); setPrediction(null)
    try {
      const form = new FormData(); form.append('file', file)
      const { data } = await api.post('/ai/classify', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPrediction(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Classification failed. Ensure the backend is running and a model is loaded.')
    } finally { setLoading(false) }
  }

  const handleCorrect = async () => {
    if (!prediction || !correctCat) return
    try {
      await api.post(`/ai/feedback?prediction_id=${prediction.prediction_id}&corrected_category=${correctCat}&note=User correction via UI`)
      alert('Thank you! Your correction has been submitted for admin review.')
      setShowCorrect(false)
    } catch {}
  }

  const reset = () => { setPreview(null); setFile(null); setPrediction(null); setError('') }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'camera', label: 'Camera', icon: <Camera className="w-4 h-4" /> },
  ]

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="section-title">AI Identification Studio</h1>
        <p className="text-sage text-sm">Upload or capture a photo to identify and classify e-waste using deep learning</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-sage/10 rounded-xl">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); reset() }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white shadow text-forest' : 'text-sage hover:text-charcoal'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Camera Tab */}
        {tab === 'camera' && (
          <div className="glass-card p-4">
            {!preview ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button onClick={handleCapture}
                    className="w-16 h-16 rounded-full bg-white border-4 border-emerald hover:scale-105 transition-transform flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-emerald" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <img src={preview} alt="Captured" className="w-full rounded-xl aspect-video object-cover" />
                <div className="flex gap-3 mt-4">
                  <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sage/40 text-sm font-semibold text-charcoal/70 hover:border-red-400 hover:text-red-500 transition-all">
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button onClick={handleClassify} disabled={loading} className="eco-btn flex items-center gap-2 text-sm flex-1 justify-center">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loading ? 'Analysing…' : 'Classify with AI'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {tab === 'upload' && (
          <div className="glass-card p-4">
            {!preview ? (
              <div {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-emerald bg-emerald/5' : 'border-sage/40 hover:border-emerald hover:bg-emerald/5'}`}>
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-2xl bg-eco-gradient flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <p className="font-semibold text-charcoal mb-1">{isDragActive ? 'Drop it here!' : 'Drag & drop your image'}</p>
                <p className="text-sm text-sage">or click to browse files</p>
                <p className="text-xs text-sage/60 mt-3">Supported: JPG, PNG, WebP · Max 10 MB</p>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full rounded-xl max-h-72 object-contain bg-sage/5" />
                  <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors">
                    <X className="w-4 h-4 text-charcoal/60" />
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-sage/40 text-sm font-semibold text-charcoal/70 hover:border-sage transition-all">
                    <RefreshCw className="w-4 h-4" /> Change
                  </button>
                  <button onClick={handleClassify} disabled={loading} className="eco-btn flex items-center gap-2 text-sm flex-1 justify-center">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                    {loading ? 'Analysing with AI…' : 'Classify with AI'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Error:</strong> {error}
              <div className="mt-1 text-xs text-red-500">Make sure the backend server is running and a trained model is available in ml/saved_models/</div>
            </div>
          </motion.div>
        )}

        {/* Prediction Result */}
        {prediction && (
          <>
            <PredictionCard pred={prediction} file={file} onCorrect={() => setShowCorrect(true)} />
            {showCorrect && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 glass-card p-5">
                <h4 className="font-bold text-charcoal mb-3 text-sm">Submit Correction</h4>
                <select value={correctCat} onChange={e => setCorrectCat(e.target.value)} className="input-field mb-3">
                  <option value="">Select correct category…</option>
                  {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={handleCorrect} className="eco-btn text-sm py-2">Submit Correction</button>
                  <button onClick={() => setShowCorrect(false)} className="eco-btn-outline text-sm py-2">Cancel</button>
                </div>
                <p className="text-xs text-sage/70 mt-2">Corrections are reviewed by admin before being used for model improvement.</p>
              </motion.div>
            )}
          </>
        )}

        {/* Info box */}
        <div className="mt-6 glass-card p-4 text-xs text-charcoal/60">
          <strong className="text-charcoal/80">ℹ️ About the AI Model:</strong> This scanner uses supervised deep learning (CNN / MobileNetV3 / EfficientNet) trained on the E-Tadweer and Kaggle E-Waste datasets.
          Confidence scores are actual model outputs. If no trained model is detected, the backend will return a 503 error with setup instructions.
          <Link to="/analytics" className="text-forest font-semibold ml-1">View model performance →</Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
