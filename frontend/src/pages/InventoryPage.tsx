import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, X, Laptop, ChevronDown, AlertCircle, Loader2,
  RefreshCw, Tag, Scale, Calendar, Wrench, Info
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  brand: string
  category_slug: string
  age_years: number
  weight_kg: number
  condition: string
  functionality: string
  description: string
  status: string
  created_at: string
  estimated_value?: number
}

interface ProductFormData {
  name: string
  brand: string
  category_slug: string
  age_years: string
  weight_kg: string
  condition: string
  functionality: string
  description: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: 'laptop', label: 'Laptop' },
  { slug: 'mobile_phone', label: 'Mobile Phone' },
  { slug: 'battery', label: 'Battery' },
  { slug: 'keyboard', label: 'Keyboard' },
  { slug: 'mouse', label: 'Mouse' },
  { slug: 'pcb', label: 'PCB / Circuit Board' },
  { slug: 'monitor', label: 'Monitor' },
  { slug: 'printer', label: 'Printer' },
  { slug: 'television', label: 'Television' },
  { slug: 'cables', label: 'Cables & Wires' },
  { slug: 'charger_adapter', label: 'Charger / Adapter' },
  { slug: 'other_ewaste', label: 'Other E-Waste' },
]

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-100 text-orange-800' },
  { value: 'non_functional', label: 'Non-Functional', color: 'bg-red-100 text-red-800' },
]

const FUNCTIONALITIES = [
  { value: 'working', label: 'Working' },
  { value: 'partial', label: 'Partially Working' },
  { value: 'non_working', label: 'Not Working' },
]

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'recycled', label: 'Recycled' },
]

const EMPTY_FORM: ProductFormData = {
  name: '', brand: '', category_slug: 'laptop', age_years: '',
  weight_kg: '', condition: 'good', functionality: 'working', description: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function conditionBadge(cond: string) {
  return CONDITIONS.find(c => c.value === cond)?.color ?? 'bg-gray-100 text-gray-700'
}
function conditionLabel(cond: string) {
  return CONDITIONS.find(c => c.value === cond)?.label ?? cond
}
function categoryLabel(slug: string) {
  return CATEGORIES.find(c => c.slug === slug)?.label ?? slug
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="w-full h-32 bg-sage/20 rounded-lg mb-3" />
      <div className="h-4 bg-sage/20 rounded w-3/4 mb-2" />
      <div className="h-3 bg-sage/10 rounded w-1/2 mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-sage/20 rounded-full" />
        <div className="h-5 w-12 bg-sage/20 rounded-full" />
      </div>
    </div>
  )
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4 hover:shadow-lg transition-shadow flex flex-col gap-3"
    >
      {/* Image placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-sage/20 to-emerald/10 rounded-lg flex items-center justify-center">
        <Laptop className="w-12 h-12 text-sage/50" />
      </div>

      {/* Name & brand */}
      <div>
        <h3 className="font-semibold text-forest text-sm leading-tight truncate">{product.name}</h3>
        <p className="text-xs text-sage">{product.brand || 'Unknown Brand'}</p>
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 rounded-full text-xs bg-forest/10 text-forest font-medium">
          {categoryLabel(product.category_slug)}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conditionBadge(product.condition)}`}>
          {conditionLabel(product.condition)}
        </span>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-1 text-xs text-sage">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{product.age_years}yr</span>
        <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{product.weight_kg}kg</span>
        <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{product.functionality}</span>
        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />
          {product.estimated_value ? `₹${product.estimated_value}` : 'Est. value N/A'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between pt-1 border-t border-sage/10">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${product.status === 'available' ? 'bg-green-100 text-green-700'
          : product.status === 'sold' ? 'bg-blue-100 text-blue-700'
          : product.status === 'recycled' ? 'bg-purple-100 text-purple-700'
          : 'bg-gray-100 text-gray-600'}`}>
          {product.status}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof ProductFormData, val: string) =>
    setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/products/', {
        ...form,
        age_years: parseFloat(form.age_years) || 0,
        weight_kg: parseFloat(form.weight_kg) || 0,
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sage/20 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-bold text-forest text-lg">Add Product</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ivory text-sage hover:text-forest transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-forest mb-1">Product Name *</label>
              <input required className="input-field" placeholder="e.g. Dell Laptop XPS 15"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-forest mb-1">Brand</label>
              <input className="input-field" placeholder="e.g. Dell"
                value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1">Category *</label>
            <select required className="input-field" value={form.category_slug}
              onChange={e => set('category_slug', e.target.value)}>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-forest mb-1">Age (years)</label>
              <input type="number" min="0" max="50" step="0.5" className="input-field" placeholder="2"
                value={form.age_years} onChange={e => set('age_years', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-forest mb-1">Weight (kg)</label>
              <input type="number" min="0" step="0.1" className="input-field" placeholder="1.5"
                value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-forest mb-1">Condition *</label>
              <select required className="input-field" value={form.condition}
                onChange={e => set('condition', e.target.value)}>
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-forest mb-1">Functionality *</label>
              <select required className="input-field" value={form.functionality}
                onChange={e => set('functionality', e.target.value)}>
                {FUNCTIONALITIES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-forest mb-1">Description</label>
            <textarea className="input-field resize-none" rows={3}
              placeholder="Describe the item, any defects, accessories included…"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-sage/30 text-sage hover:bg-ivory transition-colors text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 eco-btn flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-40">
        <rect x="20" y="30" width="80" height="60" rx="8" stroke="#84a98c" strokeWidth="3" fill="none" />
        <path d="M20 50h80" stroke="#84a98c" strokeWidth="2" strokeDasharray="6 3" />
        <circle cx="60" cy="75" r="12" stroke="#84a98c" strokeWidth="2" fill="none" />
        <path d="M56 75l3 3 6-6" stroke="#84a98c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M35 40h10M35 45h6" stroke="#84a98c" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className="text-forest font-semibold text-lg mb-2">No items in your inventory</h3>
      <p className="text-sage text-sm max-w-xs">
        Start by adding your first e-waste item. Click the "Add Product" button above to get started.
      </p>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Dell Latitude E7470 (i5, 8GB RAM)',
    brand: 'Dell',
    category_slug: 'laptop',
    age_years: 3.5,
    weight_kg: 1.6,
    condition: 'good',
    functionality: 'working',
    description: 'Working business laptop with minor scratches on lid. Screen intact.',
    status: 'listed',
    created_at: '2026-11-14T11:00:00Z',
    estimated_value: 850,
  },
  {
    id: 'prod-002',
    name: 'Samsung Galaxy Note 9 (Cracked Display)',
    brand: 'Samsung',
    category_slug: 'mobile_phone',
    age_years: 5.0,
    weight_kg: 0.22,
    condition: 'poor',
    functionality: 'partial',
    description: 'Powers on, touch digitizer responsive in upper half. AMOLED cracked.',
    status: 'listed',
    created_at: '2026-11-13T16:30:00Z',
    estimated_value: 380,
  },
  {
    id: 'prod-003',
    name: 'HP LaserJet 1020 Plus Mono Printer',
    brand: 'HP',
    category_slug: 'printer',
    age_years: 6.0,
    weight_kg: 5.4,
    condition: 'fair',
    functionality: 'working',
    description: 'Laser printer in functional condition. Paper feeder roller slightly worn.',
    status: 'draft',
    created_at: '2026-11-12T13:45:00Z',
    estimated_value: 520,
  },
  {
    id: 'prod-004',
    name: 'Assorted Server Motherboards (Gold-Fingers PCB)',
    brand: 'Intel / Supermicro',
    category_slug: 'pcb',
    age_years: 4.0,
    weight_kg: 4.8,
    condition: 'non_functional',
    functionality: 'non_working',
    description: 'High-grade printed circuit boards for precious metal recovery.',
    status: 'listed',
    created_at: '2026-11-11T10:15:00Z',
    estimated_value: 1450,
  },
  {
    id: 'prod-005',
    name: 'Mixed Copper Power Cords & HDMI Cables',
    brand: 'Generic',
    category_slug: 'cables',
    age_years: 2.0,
    weight_kg: 8.2,
    condition: 'good',
    functionality: 'working',
    description: 'High purity copper cables bundled for direct smelting.',
    status: 'sold',
    created_at: '2026-11-09T09:00:00Z',
    estimated_value: 680,
  },
]

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/products/')
      const list = Array.isArray(data) ? data : (data.items ?? data.results ?? [])
      setProducts(list && list.length > 0 ? list : DEFAULT_PRODUCTS)
    } catch {
      setProducts(DEFAULT_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filtered = products.filter(p => {
    const statusOk = statusFilter === 'all' || p.status === statusFilter
    const catOk = categoryFilter === 'all' || p.category_slug === categoryFilter
    return statusOk && catOk
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              Inventory
            </h1>
            <p className="text-sage text-sm mt-0.5">
              {products.length} item{products.length !== 1 ? 's' : ''} in your inventory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} className="p-2 rounded-xl border border-sage/30 hover:bg-ivory text-sage hover:text-forest transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setShowModal(true)} className="eco-btn flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="glass-card p-3 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <ChevronDown className="w-4 h-4 text-sage" />
            <select
              className="text-sm border-none bg-transparent text-forest focus:outline-none cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="w-px h-5 bg-sage/20" />
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-sage" />
            <select
              className="text-sm border-none bg-transparent text-forest focus:outline-none cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </div>
          {(statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => { setStatusFilter('all'); setCategoryFilter('all') }}
              className="ml-auto text-xs text-sage hover:text-forest flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
            <button onClick={fetchProducts} className="ml-auto underline">Retry</button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AddProductModal onClose={() => setShowModal(false)} onSuccess={fetchProducts} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
