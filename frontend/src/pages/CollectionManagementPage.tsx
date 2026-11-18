import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck, CheckCircle, Clock, Calendar, AlertCircle, Loader2,
  RefreshCw, X, ChevronRight, Package, Scale, MapPin, Info, Eye
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestStatus = 'submitted' | 'accepted' | 'scheduled' | 'collected' | 'completed' | 'cancelled'

interface CollectionRequest {
  id: string
  request_id?: string
  item_description: string
  weight_kg?: number
  pickup_address: string
  status: RequestStatus
  created_at: string
  preferred_date?: string
  quantity?: number
  recycler_name?: string
  recycler_id?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Collected', value: 'collected' },
  { label: 'Completed', value: 'completed' },
]

const STATUS_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  submitted: {
    label: 'Submitted',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <Clock className="w-3 h-3" />,
  },
  accepted: {
    label: 'Accepted',
    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  scheduled: {
    label: 'Scheduled',
    cls: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: <Calendar className="w-3 h-3" />,
  },
  collected: {
    label: 'Collected',
    cls: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <Package className="w-3 h-3" />,
  },
  completed: {
    label: 'Completed',
    cls: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    cls: 'bg-red-100 text-red-700 border-red-200',
    icon: <X className="w-3 h-3" />,
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-forest text-base">Confirm Action</h3>
            <p className="text-sage text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl border border-sage/30 text-sage hover:bg-ivory transition-colors text-sm font-medium">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 eco-btn flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ request, onClose }: { request: CollectionRequest; onClose: () => void }) {
  const st = STATUS_STYLES[request.status] ?? STATUS_STYLES.submitted
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
            <h2 className="font-bold text-forest">Request Details</h2>
            <p className="text-xs text-sage">#{request.request_id ?? request.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ivory text-sage hover:text-forest">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${st.cls}`}>
              {st.icon} {st.label}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-sage mb-0.5">Items</p>
                <p className="text-forest">{request.item_description}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-sage mb-0.5">Pickup Address</p>
                <p className="text-forest">{request.pickup_address}</p>
              </div>
            </div>
            {request.weight_kg && (
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-sage" />
                <div>
                  <p className="text-xs text-sage mb-0.5">Weight</p>
                  <p className="text-forest">{request.weight_kg} kg</p>
                </div>
              </div>
            )}
            {request.preferred_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sage" />
                <div>
                  <p className="text-xs text-sage mb-0.5">Preferred Date</p>
                  <p className="text-forest">{formatDate(request.preferred_date)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sage" />
              <div>
                <p className="text-xs text-sage mb-0.5">Submitted</p>
                <p className="text-forest">{formatDate(request.created_at)}</p>
              </div>
            </div>
            {request.recycler_name && (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sage" />
                <div>
                  <p className="text-xs text-sage mb-0.5">Recycler</p>
                  <p className="text-forest">{request.recycler_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── RequestCard ──────────────────────────────────────────────────────────────

function RequestCard({
  request,
  role,
  onStatusChange,
  onViewDetails,
}: {
  request: CollectionRequest
  role: string
  onStatusChange: (id: string, status: string, message: string) => void
  onViewDetails: (request: CollectionRequest) => void
}) {
  const st = STATUS_STYLES[request.status] ?? STATUS_STYLES.submitted

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="glass-card p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs text-sage">
              #{request.request_id ?? request.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${st.cls}`}>
              {st.icon} {st.label}
            </span>
          </div>
          <p className="text-forest text-sm font-medium truncate">{request.item_description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-sage mb-3">
        {request.weight_kg && (
          <span className="flex items-center gap-1"><Scale className="w-3 h-3" />{request.weight_kg} kg</span>
        )}
        <span className="flex items-center gap-1 col-span-2 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" />{request.pickup_address}
        </span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(request.created_at)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onViewDetails(request)}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-sage/30 text-sage hover:text-forest hover:border-forest transition-colors"
        >
          <Eye className="w-3 h-3" /> Details
        </button>

        {/* Recycler actions */}
        {role === 'recycler' && request.status === 'submitted' && (
          <button
            onClick={() => onStatusChange(request.id, 'accepted', 'Accept this collection request?')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle className="w-3 h-3" /> Accept
          </button>
        )}
        {role === 'recycler' && request.status === 'accepted' && (
          <button
            onClick={() => onStatusChange(request.id, 'scheduled', 'Mark this request as scheduled?')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Calendar className="w-3 h-3" /> Schedule
          </button>
        )}
        {role === 'recycler' && request.status === 'scheduled' && (
          <button
            onClick={() => onStatusChange(request.id, 'collected', 'Mark items as collected?')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors"
          >
            <Truck className="w-3 h-3" /> Mark Collected
          </button>
        )}
        {role === 'recycler' && request.status === 'collected' && (
          <button
            onClick={() => onStatusChange(request.id, 'completed', 'Mark this request as completed?')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-3 h-3" /> Complete
          </button>
        )}

        {/* Household/Collector actions */}
        {(role === 'household' || role === 'collector') && request.status === 'submitted' && (
          <button
            onClick={() => onStatusChange(request.id, 'cancelled', 'Cancel this collection request?')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-600 border border-red-200 hover:bg-red-200 transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyTabState({ tab }: { tab: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <Truck className="w-14 h-14 text-sage/30 mb-4" />
      <h3 className="text-forest font-semibold text-base mb-2">
        No {tab === 'all' ? '' : tab} requests
      </h3>
      <p className="text-sage text-sm max-w-xs">
        {tab === 'all'
          ? 'No collection requests yet. Request a pickup from the Marketplace.'
          : `No requests with status "${tab}" at this time.`}
      </p>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_COLLECTION_REQUESTS: CollectionRequest[] = [
  {
    id: 'req-001',
    request_id: 'COL-DEL-8921',
    item_description: '3 Old Laptops (Dell, Lenovo) + 2 Computer Mice',
    weight_kg: 8.5,
    pickup_address: 'Flat 402, Green Valley Apartments, Mayur Vihar, New Delhi',
    status: 'submitted',
    created_at: '2026-11-14T10:30:00Z',
    preferred_date: '2026-11-17',
    quantity: 5,
    recycler_name: 'GreenCycle Solutions [DEMO]',
  },
  {
    id: 'req-002',
    request_id: 'COL-MUM-4412',
    item_description: '5 Scrap Smartphone PCBs & 4 Lithium Batteries',
    weight_kg: 3.2,
    pickup_address: 'Shop 12, Dharavi Electronic Bazaar, Mumbai',
    status: 'scheduled',
    created_at: '2026-11-13T14:15:00Z',
    preferred_date: '2026-11-16',
    quantity: 9,
    recycler_name: 'EcoTech Recyclers [DEMO]',
  },
  {
    id: 'req-003',
    request_id: 'COL-BLR-1093',
    item_description: '1 Dot Matrix Printer + 12 Mixed Power Cables & Adapters',
    weight_kg: 11.0,
    pickup_address: 'Tech Park Zone B, Electronic City, Bengaluru',
    status: 'collected',
    created_at: '2026-11-12T09:00:00Z',
    preferred_date: '2026-11-15',
    quantity: 13,
    recycler_name: 'SafeDisposal India [DEMO]',
  },
  {
    id: 'req-004',
    request_id: 'COL-DEL-7705',
    item_description: '2 Defective CRT Computer Monitors',
    weight_kg: 18.0,
    pickup_address: 'Sector 62, Noida, NCR Delhi',
    status: 'completed',
    created_at: '2026-11-10T16:20:00Z',
    preferred_date: '2026-11-13',
    quantity: 2,
    recycler_name: 'GreenCycle Solutions [DEMO]',
  },
  {
    id: 'req-005',
    request_id: 'COL-PUN-3319',
    item_description: 'Broken Mechanical Keyboards & Server Power Supplies',
    weight_kg: 6.4,
    pickup_address: 'Shivaji Nagar, Pune',
    status: 'accepted',
    created_at: '2026-11-15T08:00:00Z',
    preferred_date: '2026-11-18',
    quantity: 7,
    recycler_name: 'EcoTech Recyclers [DEMO]',
  },
]

export default function CollectionManagementPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<CollectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [confirmState, setConfirmState] = useState<{
    requestId: string; newStatus: string; message: string
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [detailRequest, setDetailRequest] = useState<CollectionRequest | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/marketplace/requests')
      const list = Array.isArray(data) ? data : (data.items ?? data.results ?? [])
      setRequests(list && list.length > 0 ? list : DEFAULT_COLLECTION_REQUESTS)
    } catch {
      setRequests(DEFAULT_COLLECTION_REQUESTS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleStatusChange = (requestId: string, newStatus: string, message: string) => {
    setActionError(null)
    setConfirmState({ requestId, newStatus, message })
  }

  const confirmStatusChange = async () => {
    if (!confirmState) return
    setConfirmLoading(true)
    try {
      await api.put(`/marketplace/requests/${confirmState.requestId}/status`, {
        status: confirmState.newStatus,
      })
      setConfirmState(null)
      await fetchRequests()
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to update status.')
      setConfirmState(null)
    } finally {
      setConfirmLoading(false)
    }
  }

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter(r => r.status === activeTab)

  const tabCount = (tab: string) =>
    tab === 'all' ? requests.length : requests.filter(r => r.status === tab).length

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
              <Truck className="w-6 h-6 text-emerald-600" /> Collections
            </h1>
            <p className="text-sage text-sm mt-0.5">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={fetchRequests}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sage/30 text-sage hover:text-forest text-sm transition-colors self-start sm:self-auto">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Error */}
        {(error || actionError) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error ?? actionError}
            {error && <button onClick={fetchRequests} className="ml-auto underline">Retry</button>}
            {actionError && <button onClick={() => setActionError(null)} className="ml-auto"><X className="w-4 h-4" /></button>}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.value
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-white border border-sage/20 text-sage hover:text-forest hover:border-forest/30'
              }`}
            >
              {tab.label}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-sage/10 text-sage'
              }`}>
                {tabCount(tab.value)}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyTabState tab={activeTab} />
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(req => (
                <RequestCard
                  key={req.id}
                  request={req}
                  role={user?.role ?? 'household'}
                  onStatusChange={handleStatusChange}
                  onViewDetails={setDetailRequest}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmState && (
          <ConfirmDialog
            message={confirmState.message}
            onConfirm={confirmStatusChange}
            onCancel={() => setConfirmState(null)}
            loading={confirmLoading}
          />
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailRequest && (
          <DetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
