// Shared stat card component used across all dashboards
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string; value: string | number; icon: React.ReactNode;
  trend?: number; color?: string; subtitle?: string;
}

export function StatCard({ title, value, icon, trend, color = 'emerald', subtitle }: StatCardProps) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald/10 text-emerald',
    forest: 'bg-forest/10 text-forest',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <motion.div whileHover={{ y: -2 }} className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color] || colors.emerald}`}>{icon}</div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold text-charcoal">{value}</div>
      <div className="text-sm text-sage font-medium mt-1">{title}</div>
      {subtitle && <div className="text-xs text-sage/70 mt-0.5">{subtitle}</div>}
    </motion.div>
  )
}

export default StatCard
