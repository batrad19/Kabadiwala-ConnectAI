import 'leaflet/dist/leaflet.css'
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, CheckCircle, Search, X, Loader2, AlertCircle,
  Truck, Filter, Star, Building2
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

// ─── Fix Leaflet default marker icons ─────────────────────────────────────────
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Verified recycler icon (green tint)
const verifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
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
  phone?: string
  email?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_CENTER: [number, number] = [20.5937, 78.9629]

const ALL_CATEGORIES = [
  'laptop', 'mobile_phone', 'battery', 'keyboard', 'mouse',
  'pcb', 'monitor', 'printer', 'television', 'cables',
  'charger_adapter', 'other_ewaste',
]

const CAT_LABEL: Record<string, string> = {
  laptop: 'Laptop', mobile_phone: 'Mobile Phone', battery: 'Battery',
  keyboard: 'Keyboard', mouse: 'Mouse', pcb: 'PCB', monitor: 'Monitor',
  printer: 'Printer', television: 'Television', cables: 'Cables',
  charger_adapter: 'Charger/Adapter', other_ewaste: 'Other E-Waste',
}

const DEFAULT_RECYCLERS: Recycler[] = [
  {
    id: 'rec-001',
    business_name: 'GreenCycle Solutions [DEMO]',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    is_verified: true,
    accepted_categories: ['laptop', 'mobile_phone', 'battery', 'monitor'],
    phone: '+91 98110 12345',
    email: 'contact@greencycle.demo',
  },
  {
    id: 'rec-002',
    business_name: 'EcoTech Recyclers [DEMO]',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    is_verified: true,
    accepted_categories: ['pcb', 'laptop', 'television', 'printer'],
    phone: '+91 98200 67890',
    email: 'info@ecotechrecyclers.demo',
  },
  {
    id: 'rec-003',
    business_name: 'SafeDisposal India [DEMO]',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    is_verified: true,
    accepted_categories: ['cables', 'charger_adapter', 'keyboard', 'mouse', 'other_ewaste'],
    phone: '+91 98450 11223',
    email: 'hello@safedisposal.demo',
  },
]

// Random India coordinate fallback (bounded roughly to India)
function randomIndiaCoord(): [number, number] {
  return [
    8.4 + Math.random() * 29,  // lat 8.4 – 37.4
    68.7 + Math.random() * 29, // lng 68.7 – 97.7
  ]
}

function getCoords(r: Recycler): [number, number] {
  if (r.latitude != null && r.longitude != null) return [r.latitude, r.longitude]
  return randomIndiaCoord()
}

function isDemo(name: string) {
  return name.includes('Demo') || name.includes('DEMO')
}

// ─── RecyclerCard ─────────────────────────────────────────────────────────────

function RecyclerCard({
  recycler,
  selected,
  onSelect,
  onRequestCollection,
}: {
  recycler: Recycler
  selected: boolean
  onSelect: () => void
  onRequestCollection: () => void
}) {
  const navigate = useNavigate()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onSelect}
      className={`p-4 rounded-xl cursor-pointer border transition-all ${
        selected ? 'border-emerald-400 bg-emerald-50 shadow-md' : 'border-sage/20 bg-white hover:border-sage/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-forest text-sm truncate">{recycler.business_name}</h3>
            {recycler.is_verified && (
              <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
            {isDemo(recycler.business_name) && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-medium">
                DEMO
              </span>
            )}
          </div>
          <p className="text-xs text-sage flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {recycler.city}{recycler.state ? `, ${recycler.state}` : ''}
          </p>
        </div>
        <Building2 className="w-8 h-8 text-sage/30 flex-shrink-0" />
      </div>

      {/* Accepted categories */}
      {recycler.accepted_categories?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {recycler.accepted_categories.slice(0, 4).map(cat => (
            <span key={cat} className="text-xs bg-forest/8 text-forest px-2 py-0.5 rounded-full border border-forest/10">
              {CAT_LABEL[cat] ?? cat}
            </span>
          ))}
          {recycler.accepted_categories.length > 4 && (
            <span className="text-xs text-sage">+{recycler.accepted_categories.length - 4} more</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); navigate(`/recyclers/${recycler.id}`) }}
          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-forest/20 text-forest hover:bg-forest/5 transition-colors font-medium"
        >
          View Profile
        </button>
        <button
          onClick={e => { e.stopPropagation(); onRequestCollection() }}
          className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-1"
        >
          <Truck className="w-3 h-3" /> Request
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const navigate = useNavigate()
  const [recyclers, setRecyclers] = useState<Recycler[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/recyclers/')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.items ?? data.results ?? [])
        setRecyclers(list.length > 0 ? list : DEFAULT_RECYCLERS)
      })
      .catch(() => setRecyclers(DEFAULT_RECYCLERS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return recyclers.filter(r => {
      const cityOk = !cityFilter || r.city?.toLowerCase().includes(cityFilter.toLowerCase())
      const catOk = selectedCategories.length === 0 ||
        selectedCategories.some(cat => r.accepted_categories?.includes(cat))
      return cityOk && catOk
    })
  }, [recyclers, cityFilter, selectedCategories])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const selectedRecycler = recyclers.find(r => r.id === selectedId)

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full -m-4 sm:-m-6">
        {/* Top bar */}
        <div className="p-4 sm:px-6 flex items-center justify-between gap-3 bg-white border-b border-sage/20 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-forest flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Recycler Marketplace
            </h1>
            <p className="text-xs text-sage mt-0.5">{filtered.length} recyclers found</p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters ? 'bg-forest text-white border-forest' : 'border-sage/30 text-sage hover:border-forest hover:text-forest'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {selectedCategories.length > 0 && (
              <span className="bg-emerald-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-sage/20 bg-ivory"
            >
              <div className="p-4 sm:px-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-sage" />
                  <input
                    className="input-field py-1.5 text-sm flex-1"
                    placeholder="Filter by city…"
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                  />
                  {cityFilter && (
                    <button onClick={() => setCityFilter('')} className="text-sage hover:text-forest">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-forest mb-2">Categories accepted:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          selectedCategories.includes(cat)
                            ? 'bg-forest text-white border-forest'
                            : 'border-sage/30 text-sage hover:border-forest hover:text-forest'
                        }`}
                      >
                        {CAT_LABEL[cat]}
                      </button>
                    ))}
                  </div>
                </div>
                {(cityFilter || selectedCategories.length > 0) && (
                  <button
                    onClick={() => { setCityFilter(''); setSelectedCategories([]) }}
                    className="text-xs text-sage hover:text-forest flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-panel main area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: recycler list */}
          <div className="w-full lg:w-96 flex-shrink-0 overflow-y-auto border-r border-sage/20 bg-ivory">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : error ? (
              <div className="p-4">
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <Star className="w-12 h-12 text-sage/30 mb-3" />
                <p className="text-forest font-medium">No recyclers found</p>
                <p className="text-sage text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filtered.map(r => (
                  <RecyclerCard
                    key={r.id}
                    recycler={r}
                    selected={selectedId === r.id}
                    onSelect={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    onRequestCollection={() => navigate(`/recyclers/${r.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Leaflet map */}
          <div className="hidden lg:block flex-1 relative">
            <MapContainer
              center={INDIA_CENTER}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map(r => {
                const [lat, lng] = getCoords(r)
                return (
                  <Marker
                    key={r.id}
                    position={[lat, lng]}
                    icon={r.is_verified ? verifiedIcon : new L.Icon.Default()}
                    eventHandlers={{ click: () => setSelectedId(r.id) }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <div className="font-semibold text-forest mb-1">{r.business_name}</div>
                        {r.is_verified && (
                          <div className="flex items-center gap-1 text-emerald-600 text-xs mb-1">
                            <CheckCircle className="w-3 h-3" /> Verified Recycler
                          </div>
                        )}
                        <div className="text-gray-500 text-xs flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" /> {r.city}{r.state ? `, ${r.state}` : ''}
                        </div>
                        <button
                          onClick={() => navigate(`/recyclers/${r.id}`)}
                          className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 w-full"
                        >
                          View Profile
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
