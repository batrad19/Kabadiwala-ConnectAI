import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Lazy-load pages
const LandingPage           = lazy(() => import('./pages/LandingPage'))
const AboutPage             = lazy(() => import('./pages/AboutPage'))
const LoginPage             = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage          = lazy(() => import('./pages/auth/RegisterPage'))
const RoleSelectionPage     = lazy(() => import('./pages/auth/RoleSelectionPage'))
const CollectorDashboard    = lazy(() => import('./pages/dashboards/CollectorDashboard'))
const RecyclerDashboard     = lazy(() => import('./pages/dashboards/RecyclerDashboard'))
const AggregatorDashboard   = lazy(() => import('./pages/dashboards/AggregatorDashboard'))
const HouseholdDashboard    = lazy(() => import('./pages/dashboards/HouseholdDashboard'))
const AdminDashboard        = lazy(() => import('./pages/AdminDashboard'))
const AIStudioPage          = lazy(() => import('./pages/AIStudioPage'))
const PredictionResultsPage = lazy(() => import('./pages/PredictionResultsPage'))
const MultiObjectDetection  = lazy(() => import('./pages/MultiObjectDetectionPage'))
const ConditionAssessment   = lazy(() => import('./pages/ConditionAssessmentPage'))
const ValuationPage         = lazy(() => import('./pages/ValuationPage'))
const InventoryPage         = lazy(() => import('./pages/InventoryPage'))
const MarketplacePage       = lazy(() => import('./pages/MarketplacePage'))
const RecyclerProfilePage   = lazy(() => import('./pages/RecyclerProfilePage'))
const CollectionManagement  = lazy(() => import('./pages/CollectionManagementPage'))
const TransactionHistory    = lazy(() => import('./pages/TransactionHistoryPage'))
const AnalyticsDashboard    = lazy(() => import('./pages/AnalyticsDashboardPage'))
const EnvironmentalImpact   = lazy(() => import('./pages/EnvironmentalImpactPage'))
const UserProfilePage       = lazy(() => import('./pages/UserProfilePage'))
const SettingsPage          = lazy(() => import('./pages/SettingsPage'))

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-ivory">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin" />
      <p className="text-sage font-medium">Loading Kabadiwala Connect AI…</p>
    </div>
  </div>
)

function DashboardRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const routes: Record<string, string> = {
    collector: '/dashboard/collector', recycler: '/dashboard/recycler',
    aggregator: '/dashboard/aggregator', household: '/dashboard/household',
    business: '/dashboard/household', admin: '/admin',
  }
  return <Navigate to={routes[user.role] || '/dashboard/household'} replace />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Loading />
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/role" element={<RoleSelectionPage />} />

            {/* Dashboard redirect */}
            <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

            {/* Role dashboards */}
            <Route path="/dashboard/collector"  element={<PrivateRoute><CollectorDashboard /></PrivateRoute>} />
            <Route path="/dashboard/recycler"   element={<PrivateRoute><RecyclerDashboard /></PrivateRoute>} />
            <Route path="/dashboard/aggregator" element={<PrivateRoute><AggregatorDashboard /></PrivateRoute>} />
            <Route path="/dashboard/household"  element={<PrivateRoute><HouseholdDashboard /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* AI Studio */}
            <Route path="/ai-studio"            element={<PrivateRoute><AIStudioPage /></PrivateRoute>} />
            <Route path="/ai-studio/results"    element={<PrivateRoute><PredictionResultsPage /></PrivateRoute>} />
            <Route path="/ai-studio/detect"     element={<PrivateRoute><MultiObjectDetection /></PrivateRoute>} />

            {/* Platform features */}
            <Route path="/condition"            element={<PrivateRoute><ConditionAssessment /></PrivateRoute>} />
            <Route path="/valuation"            element={<PrivateRoute><ValuationPage /></PrivateRoute>} />
            <Route path="/inventory"            element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
            <Route path="/marketplace"          element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
            <Route path="/marketplace/recycler/:id" element={<PrivateRoute><RecyclerProfilePage /></PrivateRoute>} />
            <Route path="/collections"          element={<PrivateRoute><CollectionManagement /></PrivateRoute>} />
            <Route path="/transactions"         element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
            <Route path="/analytics"            element={<PrivateRoute><AnalyticsDashboard /></PrivateRoute>} />
            <Route path="/impact"               element={<PrivateRoute><EnvironmentalImpact /></PrivateRoute>} />
            <Route path="/profile"              element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
            <Route path="/settings"             element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
