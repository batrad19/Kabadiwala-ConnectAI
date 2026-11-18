import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, TrendingUp, Package, CheckCircle, MapPin, ArrowRight } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/ui/StatCard'

export default function RecyclerDashboard() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="section-title">Recycler Dashboard</h1>
        <p className="text-sage text-sm">Manage incoming collection requests and transactions</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3 text-sm">
        <span className="text-amber-600 font-semibold">⚠️ Demo Account</span>
        <span className="text-amber-700">This recycler account is a demonstration account and has not been independently verified.</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Pending Requests" value="0" icon={<Truck className="w-5 h-5" />} color="amber" />
        <StatCard title="Completed This Month" value="0" icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
        <StatCard title="Total Weight (kg)" value="0" icon={<Package className="w-5 h-5" />} color="forest" />
        <StatCard title="Total Revenue" value="₹0" icon={<TrendingUp className="w-5 h-5" />} color="blue" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/collections', title: 'Collection Requests', desc: 'View and accept incoming pickup requests', icon: <Truck className="w-5 h-5" /> },
          { to: '/transactions', title: 'Transactions', desc: 'View your completed transactions', icon: <TrendingUp className="w-5 h-5" /> },
          { to: '/marketplace', title: 'My Profile', desc: 'Update your recycler profile and service areas', icon: <MapPin className="w-5 h-5" /> },
        ].map(item => (
          <Link key={item.to} to={item.to}>
            <motion.div whileHover={{ y: -2 }} className="glass-card p-5 cursor-pointer hover:shadow-eco transition-all">
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
