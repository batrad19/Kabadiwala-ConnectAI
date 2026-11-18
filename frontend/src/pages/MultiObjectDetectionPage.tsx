import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Scan, AlertCircle, Info, X, ChevronDown, Image } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

interface BoundingBox {
  x1: number; y1: number; x2: number; y2: number
  label: string; confidence: number; color?: string
}
interface DetectionResult {
  detections: BoundingBox[]
  image_width: number
  image_height: number
  count: number
}
interface CategorySummary {
  category: string; count: number; avgConfidence: number
}

const BOX_COLORS = [
  '#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#ec4899','#84cc16','#f97316','#14b8a6',
]

function categoryColor(label: string) {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash)
  return BOX_COLORS[Math.abs(hash) % BOX_COLORS.length]
}

function buildSummary(detections: BoundingBox[]): CategorySummary[] {
  const map: Record<string, { total: number; count: number }> = {}
  for (const d of detections) {
    if (!map[d.label]) map[d.label] = { total: 0, count: 0 }
    map[d.label].total += d.confidence
    map[d.label].count += 1
  }
  return Object.entries(map).map(([category, { total, count }]) => ({
    category,
    count,
    avgConfidence: total / count,
  })).sort((a, b) => b.count - a.count)
}

export default function MultiObjectDetectionPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageURL, setImageURL] = useState<string | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yoloUnavailable, setYoloUnavailable] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const drawBoxes = useCallback(() => {
    if (!result || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const img = imgRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.clientWidth
    canvas.height = img.clientHeight

    const scaleX = img.clientWidth / result.image_width
    const scaleY = img.clientHeight / result.image_height

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const det of result.detections) {
      const color = det.color || categoryColor(det.label)
      const x = det.x1 * scaleX
      const y = det.y1 * scaleY
      const w = (det.x2 - det.x1) * scaleX
      const h = (det.y2 - det.y1) * scaleY

      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.strokeRect(x, y, w, h)

      // Label background
      const label = `${det.label} ${Math.round(det.confidence * 100)}%`
      ctx.font = 'bold 11px Manrope, Inter, sans-serif'
      const textW = ctx.measureText(label).width + 10
      const textH = 20
      ctx.fillStyle = color
      ctx.fillRect(x, Math.max(0, y - textH), textW, textH)

      ctx.fillStyle = '#fff'
      ctx.fillText(label, x + 5, Math.max(textH, y) - 5)
    }
  }, [result])

  useEffect(() => {
    if (result && imageURL) {
      // Wait for image to load/render
      const timer = setTimeout(drawBoxes, 100)
      return () => clearTimeout(timer)
    }
  }, [result, imageURL, drawBoxes])

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    setResult(null)
    setError(null)
    setYoloUnavailable(false)
    setImageFile(file)
    setImageURL(URL.createObjectURL(file))
    runDetection(file)
  }

  async function runDetection(file: File) {
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<DetectionResult>('/ai/detect', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Enrich with colors
      const enriched = {
        ...data,
        detections: data.detections.map(d => ({ ...d, color: categoryColor(d.label) })),
      }
      setResult(enriched)
    } catch (err: any) {
      if (err?.response?.status === 503) {
        setYoloUnavailable(true)
      } else {
        setError(err?.response?.data?.detail || 'Detection failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const summary = result ? buildSummary(result.detections) : []

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="page-header">
          <h1 className="section-title flex items-center gap-2">
            <Scan className="w-6 h-6 text-emerald" /> Multi-Object Detection
          </h1>
          <p className="text-sm text-sage mt-1">
            Detect and locate multiple e-waste items in a single photo using YOLOv8.
          </p>
        </motion.div>

        {/* Upload Zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            onClick={() => !imageFile && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`glass-card border-2 border-dashed transition-all duration-200 cursor-pointer
              ${isDragging ? 'border-emerald bg-emerald/5 scale-[1.01]' : 'border-sage/40 hover:border-emerald/60'}
              ${imageFile ? 'p-4' : 'p-14 text-center'}`}
          >
            {!imageFile ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-eco-gradient flex items-center justify-center shadow-eco">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="font-semibold text-charcoal mb-1">Drop an image here or click to upload</p>
                <p className="text-sm text-sage">Supports JPG, PNG, WebP — up to 10 MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
              </>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-sage flex-shrink-0" />
                  <span className="text-sm text-charcoal font-medium truncate max-w-xs">{imageFile.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); setImageFile(null); setImageURL(null); setResult(null); setError(null); setYoloUnavailable(false) }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-sage hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Loading Spinner */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-card p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-sage/30 border-t-emerald animate-spin" />
                <Scan className="w-6 h-6 text-emerald absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-sage font-medium">Running YOLOv8 inference…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* YOLO Unavailable Info Card */}
        <AnimatePresence>
          {yoloUnavailable && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-6 border-l-4 border-sky-400">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-charcoal">YOLO Model Not Loaded</p>
                  <p className="text-sm text-sage mt-1 leading-relaxed">
                    The object detection model is currently unavailable on the server (service returned 503).
                    This usually means the YOLOv8 weights are still loading or the GPU instance is cold-starting.
                    Please try again in a minute. Classification via the AI Scanner remains available.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Image + Canvas Overlay */}
        {imageURL && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="glass-card overflow-hidden">
            <div className="p-4 border-b border-sage/20 flex items-center justify-between">
              <span className="font-semibold text-charcoal text-sm">Detection Output</span>
              {result && (
                <span className="badge badge-green">{result.count} object{result.count !== 1 ? 's' : ''} detected</span>
              )}
            </div>
            <div className="relative p-4">
              <div className="relative inline-block w-full">
                <img
                  ref={imgRef}
                  src={imageURL}
                  alt="Uploaded"
                  className="w-full rounded-xl max-h-[500px] object-contain bg-gray-50"
                  onLoad={drawBoxes}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full rounded-xl pointer-events-none"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Object Summary Panel */}
        {result && summary.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6">
            <h2 className="font-bold text-charcoal mb-5 flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-emerald" /> Detected Objects
            </h2>
            <div className="space-y-3">
              {summary.map(item => {
                const color = categoryColor(item.category)
                const pct = Math.round(item.avgConfidence * 100)
                return (
                  <div key={item.category} className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-semibold text-charcoal capitalize">{item.category.replace(/_/g, ' ')}</span>
                        <span className="text-sage text-xs">{item.count}× · avg {pct}%</span>
                      </div>
                      <div className="h-2 bg-sage/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Raw detection table */}
            {result.detections.length > 0 && (
              <details className="mt-5">
                <summary className="text-sm text-sage cursor-pointer hover:text-forest transition-colors">
                  Show all {result.detections.length} detections
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-sage/20">
                        <th className="pb-2 font-semibold text-sage">#</th>
                        <th className="pb-2 font-semibold text-sage">Label</th>
                        <th className="pb-2 font-semibold text-sage">Confidence</th>
                        <th className="pb-2 font-semibold text-sage">BBox (x1,y1,x2,y2)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage/10">
                      {result.detections.map((d, i) => (
                        <tr key={i} className="text-charcoal">
                          <td className="py-1.5 text-sage">{i + 1}</td>
                          <td className="py-1.5 font-medium capitalize">{d.label.replace(/_/g, ' ')}</td>
                          <td className="py-1.5">{Math.round(d.confidence * 100)}%</td>
                          <td className="py-1.5 text-sage font-mono">
                            {Math.round(d.x1)},{Math.round(d.y1)},{Math.round(d.x2)},{Math.round(d.y2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}
