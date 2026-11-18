// Shared Navbar + Sidebar layout component
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Recycle, Scan, Package, MapPin, TrendingUp, Leaf, Settings, LogOut, User, Bell, Menu, X, BarChart3, Truck, Receipt, ShieldCheck, Home, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function navLinks(role: string) {
  const common = [
    { to: '/ai-studio', icon: <Scan className="w-4 h-4" />, label: 'AI Scanner' },
    { to: '/inventory', icon: <Package className="w-4 h-4" />, label: 'Inventory' },
    { to: '/marketplace', icon: <MapPin className="w-4 h-4" />, label: 'Marketplace' },
    { to: '/collections', icon: <Truck className="w-4 h-4" />, label: 'Collections' },
    { to: '/transactions', icon: <Receipt className="w-4 h-4" />, label: 'Transactions' },
    { to: '/analytics', icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics' },
    { to: '/impact', icon: <Leaf className="w-4 h-4" />, label: 'Impact' },
  ]
  if (role === 'admin') return [{ to: '/admin', icon: <ShieldCheck className="w-4 h-4" />, label: 'Admin Panel' }, ...common]
  return [{ to: '/dashboard', icon: <Home className="w-4 h-4" />, label: 'Dashboard' }, ...common]
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = navLinks(user?.role || '')
  const initials = user?.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sage/20">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-forest">
          <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center">
            <Recycle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-forest text-sm font-extrabold leading-tight">Kabadiwala</div>
            <div className="text-emerald text-xs font-semibold">Connect AI</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setSidebarOpen(false)}
            className={`nav-link ${location.pathname.startsWith(l.to) && l.to !== '/dashboard' ? 'active' : ''} ${location.pathname === l.to ? 'active' : ''}`}>
            {l.icon} {l.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-sage/20 space-y-1">
        <Link to="/profile" className="nav-link"><User className="w-4 h-4" /> Profile</Link>
        <Link to="/settings" className="nav-link"><Settings className="w-4 h-4" /> Settings</Link>
        <button onClick={handleLogout} className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-ivory overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-sage/20 shadow-sm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-56 bg-white z-50 lg:hidden shadow-2xl">
              <button className="absolute top-4 right-4" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-sage" /></button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-sage/20 px-4 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-charcoal" /></button>
            <span className="text-sm text-sage capitalize hidden sm:block">
              {user?.role} · {user?.full_name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="p-2 rounded-lg hover:bg-ivory transition-colors relative">
              <Bell className="w-5 h-5 text-charcoal/60" />
            </Link>
            <Link to="/profile" className="w-8 h-8 rounded-full bg-eco-gradient flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
