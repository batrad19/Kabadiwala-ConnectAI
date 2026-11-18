import React from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Scan, MapPin, Package } from 'lucide-react'

export default function HouseholdDashboard() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="section-title">My E-Waste Hub</h1>
        <p className="text-sage text-sm">Identify, value and recycle your household electronics</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { to: '/ai-studio', icon: <Scan className="w-8 h-8 text-white" />, title: 'Scan E-Waste', desc: 'Take a photo and let AI identify your item' },
          { to: '/marketplace', icon: <MapPin className="w-8 h-8 text-white" />, title: 'Find Recycler', desc: 'Locate verified recyclers near you' },
          { to: '/inventory', icon: <Package className="w-8 h-8 text-white" />, title: 'My Items', desc: 'View your registered e-waste items' },
        ].map(card => (
          <Link key={card.to} to={card.to} className="glass-card p-8 text-center hover:shadow-eco-lg hover:-translate-y-1 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-eco-gradient flex items-center justify-center mx-auto mb-4">{card.icon}</div>
            <h3 className="font-bold text-charcoal mb-2">{card.title}</h3>
            <p className="text-sm text-sage">{card.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  )
}
