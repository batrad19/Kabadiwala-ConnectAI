import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scan, Package, Truck, TrendingUp, MapPin, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import api from '../../services/api'

export default function CollectorDashboard() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => setStats(r.data)).catch(() => {})
  }, [])

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="section-title">Collector Dashboard</h1>
        <p className="text-sage text-sm mt-1">Manage your e-waste collection activities</p>
      </div>

      {/* Quick scan CTA */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-eco-gradient rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold mb-1">Ready to scan e-waste?</h2>
          <p className="text-white/80 text-sm mb-4">Use our AI to instantly identify and value your electronic items.</p>
          <Link to="/ai-studio" className="inline-flex items-center gap-2 bg-white text-forest font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-ivory transition-colors">
            <Scan className="w-4 h-4" /> Open AI Scanner <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Items Scanned" value={stats?.total_scans ?? '—'} icon={<Scan className="w-5 h-5" />} color="emerald" />
        <StatCard title="My Products" value={stats?.total_products ?? '—'} icon={<Package className="w-5 h-5" />} color="forest" />
        <StatCard title="Transactions" value={stats?.total_transactions ?? '—'} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
        <StatCard title="Total Users" value={stats?.total_users ?? '—'} icon={<CheckCircle className="w-5 h-5" />} color="amber" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/inventory', icon: <Package className="w-5 h-5" />, title: 'My Inventory', desc: 'View and manage your listed e-waste' },
          { to: '/marketplace', icon: <MapPin className="w-5 h-5" />, title: 'Find Recyclers', desc: 'Locate verified recyclers near you' },
          { to: '/collections', icon: <Truck className="w-5 h-5" />, title: 'Collections', desc: 'Track your pickup requests' },
          { to: '/transactions', icon: <TrendingUp className="w-5 h-5" />, title: 'Transactions', desc: 'View your earnings and history' },
          { to: '/valuation', icon: <TrendingUp className="w-5 h-5" />, title: 'Price Estimator', desc: 'Get instant price estimates' },
          { to: '/impact', icon: <CheckCircle className="w-5 h-5" />, title: 'My Impact', desc: 'See your environmental contribution' },
        ].map((item) => (
          <Link key={item.to} to={item.to}>
            <motion.div whileHover={{ y: -2 }} className="glass-card p-5 hover:shadow-eco transition-all duration-300 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-eco-gradient flex items-center justify-center text-white mb-3">{item.icon}</div>
              <div className="font-bold text-charcoal text-sm">{item.title}</div>
              <div className="text-xs text-sage mt-1">{item.desc}</div>
            </motion.div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  )
}
