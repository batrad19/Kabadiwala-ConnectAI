import 'leaflet/dist/leaflet.css'
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin, CheckCircle, Phone, Mail, ChevronLeft, Truck, Loader2,
  AlertCircle, X, Calendar, Package, Scale, Info, Star, Building2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── Fix Leaflet default icon ─────────────────────────────────────────────────
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface Recycler {
  id: string
  business_name: string
  city: string
  state: string
  latitude?: number | null
  longitude?: number | null
  is_verified: boolean
  accepted_categories: string[]
  service_areas?: string[]
  phone?: string
  email?: string
  description?: string
  registration_number?: string
}

interface CollectionRequestForm {
  pickup_address: string
  preferred_date: string
  item_description: string
  quantity: string
  weight_kg: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_CENTER: [number, number] = [20.5937, 78.9629]

const CAT_LABEL: Record<string, string> = {
  laptop: 'Laptop', mobile_phone: 'Mobile Phone', battery: 'Battery',
  keyboard: 'Keyboard', mouse: 'Mouse', pcb: 'PCB', monitor: 'Monitor',
  printer: 'Printer', television: 'Television', cables: 'Cables',
  charger_adapter: 'Charger/Adapter', other_ewaste: 'Other E-Waste',
}

const EMPTY_FORM: CollectionRequestForm = {
  pickup_address: '',
  preferred_date: '',
  item_description: '',
  quantity: '1',
  weight_kg: '',
}

// ─── Request Collection Modal ─────────────────────────────────────────────────

function RequestCollectionModal({
  recyclerId,
  recyclerName,
  onClose,
}: {
  recyclerId: string
  recyclerName: string
  onClose: () => void
}) {
  const [form, setForm] = useState<CollectionRequestForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (field: keyof CollectionRequestForm, val: string) =>
    setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post('/marketplace/requests', {
        recycler_id: recyclerId,
        pickup_address: form.pickup_address,
        preferred_date: form.preferred_date || null,
        item_description: form.item_description,
        quantity: parseInt(form.quantity) || 1,
        weight_kg: parseFloat(form.weight_kg) || null,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Today's date string for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-5 border-b border-sage/20 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-forest text-lg">Request Collection</h2>
            <p className="text-xs text-sage">{recyclerName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ivory text-sage hover:text-forest transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-forest text-lg mb-2">Request Submitted!</h3>
            <p className="text-sage text-sm mb-6">
              Your collection request has been sent to <strong>{recyclerName}</strong>.
              You can track its status in the Collections tab.
            </p>
            <button onClick={onClose} className="eco-btn">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-forest mb-1">Pickup Address *</label>
              <textarea required className="input-field resize-none" rows={3}
                placeholder="Enter your full pickup address…"
                value={form.pickup_address}
                onChange={e => set('pickup_address', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-forest mb-1">Preferred Pickup Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
                <input type="date" min={today} className="input-field pl-9"
                  value={form.preferred_date}
                  onChange={e => set('preferred_date', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-forest mb-1">Item Description *</label>
              <textarea required className="input-field resize-none" rows={3}
                placeholder="Describe the e-waste items (type, make/model, quantity…)"
                value={form.item_description}
                onChange={e => set('item_description', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-forest mb-1">Quantity (items)</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
                  <input type="number" min="1" className="input-field pl-9" placeholder="1"
                    value={form.quantity}
                    onChange={e => set('quantity', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-forest mb-1">Est. Weight (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
                  <input type="number" min="0" step="0.1" className="input-field pl-9" placeholder="2.5"
                    value={form.weight_kg}
                    onChange={e => set('weight_kg', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border border-sage/30 text-sage hover:bg-ivory transition-colors text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 eco-btn flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecyclerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [recycler, setRecycler] = useState<Recycler | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/recyclers/${id}`)
      .then(({ data }) => setRecycler(data))
      .catch(err => setError(err.response?.data?.detail || 'Recycler not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const mapCenter: [number, number] = recycler?.latitude && recycler?.longitude
    ? [recycler.latitude, recycler.longitude]
    : [20.5937, 78.9629]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-sage text-sm">Loading recycler profile…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !recycler) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-forest font-bold text-lg mb-2">Recycler Not Found</h2>
          <p className="text-sage text-sm mb-6">{error ?? 'The requested recycler could not be found.'}</p>
          <button onClick={() => navigate('/marketplace')} className="eco-btn flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Marketplace
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-1 text-sage hover:text-forest text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Marketplace
        </button>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-emerald-700 p-6 sm:p-8 text-white"
        >
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 400 200">
              <circle cx="350" cy="50" r="120" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
              <circle cx="350" cy="50" r="80" stroke="white" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          </div>
          <div className="relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{recycler.business_name}</h1>
                  {recycler.is_verified && (
                    <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full border border-white/30">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-white/80 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {recycler.city}{recycler.state ? `, ${recycler.state}` : ''}
                </p>
              </div>
            </div>
            {recycler.description && (
              <p className="text-white/80 text-sm max-w-2xl">{recycler.description}</p>
            )}
            <div className="mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-forest font-semibold px-5 py-2 rounded-xl hover:bg-ivory transition-colors flex items-center gap-2 text-sm"
              >
                <Truck className="w-4 h-4" /> Request Collection
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Accepted categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5"
            >
              <h2 className="font-semibold text-forest mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" /> Accepted Categories
              </h2>
              {recycler.accepted_categories?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recycler.accepted_categories.map(cat => (
                    <span key={cat} className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                      {CAT_LABEL[cat] ?? cat}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sage text-sm">No category information available.</p>
              )}
            </motion.div>

            {/* Service areas */}
            {recycler.service_areas && recycler.service_areas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card p-5"
              >
                <h2 className="font-semibold text-forest mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Service Areas
                </h2>
                <div className="space-y-1.5">
                  {recycler.service_areas.map((area, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-charcoal">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      {area}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5"
            >
              <h2 className="font-semibold text-forest mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" /> Contact Information
              </h2>
              {isAuthenticated ? (
                <div className="space-y-3">
                  {recycler.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-sage" />
                      <a href={`tel:${recycler.phone}`} className="text-forest hover:text-emerald-600 transition-colors">
                        {recycler.phone}
                      </a>
                    </div>
                  )}
                  {recycler.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-sage" />
                      <a href={`mailto:${recycler.email}`} className="text-forest hover:text-emerald-600 transition-colors">
                        {recycler.email}
                      </a>
                    </div>
                  )}
                  {!recycler.phone && !recycler.email && (
                    <p className="text-sage text-sm">No contact info on file.</p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Log in</strong> to view full contact details.
                  </span>
                </div>
              )}
              {recycler.registration_number && isAuthenticated && (
                <div className="mt-3 pt-3 border-t border-sage/10 text-xs text-sage">
                  Reg. #{recycler.registration_number}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column: map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 border-b border-sage/10">
              <h2 className="font-semibold text-forest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" /> Location
              </h2>
            </div>
            <div style={{ height: 300 }}>
              <MapContainer
                center={mapCenter}
                zoom={recycler.latitude ? 13 : 5}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {recycler.latitude && recycler.longitude && (
                  <Marker position={[recycler.latitude, recycler.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{recycler.business_name}</div>
                        <div className="text-gray-500">{recycler.city}{recycler.state ? `, ${recycler.state}` : ''}</div>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            {!recycler.latitude && (
              <div className="p-3 bg-amber-50 text-amber-700 text-xs flex items-center gap-1">
                <Info className="w-3 h-3" /> Exact location not available — showing approximate India centre.
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && id && (
          <RequestCollectionModal
            recyclerId={id}
            recyclerName={recycler.business_name}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
