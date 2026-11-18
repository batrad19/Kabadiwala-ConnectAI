import React from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import { Users, Package, Truck, TrendingUp } from 'lucide-react'

export default function AggregatorDashboard() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="section-title">Aggregator Dashboard</h1>
        <p className="text-sage text-sm">Manage your collection network</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Collectors" value="0" icon={<Users className="w-5 h-5" />} color="forest" />
        <StatCard title="Total Items" value="0" icon={<Package className="w-5 h-5" />} color="emerald" />
        <StatCard title="Deliveries" value="0" icon={<Truck className="w-5 h-5" />} color="amber" />
        <StatCard title="Revenue" value="₹0" icon={<TrendingUp className="w-5 h-5" />} color="blue" />
      </div>
      <div className="glass-card p-8 text-center text-sage">
        <p>Your aggregator network activity will appear here once you start collecting.</p>
      </div>
    </DashboardLayout>
  )
}
