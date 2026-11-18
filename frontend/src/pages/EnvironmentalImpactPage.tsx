import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Zap, Wind, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import api from '../services/api'

// ─── Conversion factors (industry-estimated averages) ─────────────────────────
// CO2 factor: 2.1 kg CO2 equivalent saved per kg of e-waste properly recycled
//   Source basis: European Environment Agency e-waste recycling estimates
// Energy factor: 15 kWh saved per kg of e-waste via material recovery vs. mining
//   Source basis: UN E-waste Coalition 2023 annual report estimates
const CO2_FACTOR = 2.1
const ENERGY_FACTOR = 15

// ─── Types ───────────────────────────────────────────────────────────────────
interface ImpactData {
  total_ewaste_kg: number
  co2_saved_kg: number
  energy_saved_kwh: number
}

const MOCK: ImpactData = {
  total_ewaste_kg: 287,
  co2_saved_kg: 603,
  energy_saved_kwh: 4305,
}

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1600, start = false) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!start || target === 0) return
    const startTime = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration, start])

  return count
}

// ─── Big stat card with count-up ─────────────────────────────────────────────
function HeroStat({
  icon, label, target, suffix, color, delay, started,
}: {
  icon: React.ReactNode; label: string; target: number; suffix: string;
  color: string; delay: number; started: boolean
}) {
  const val = useCountUp(target, 1800, started)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="glass-card p-6 text-center flex flex-col items-center gap-3"
    >
      <div className="p-4 rounded-2xl" style={{ backgroundColor: `${color}18` }}>
        <div style={{ color }} className="w-8 h-8">{icon}</div>
      </div>
      <div className="text-4xl font-extrabold" style={{ color }}>
        {val.toLocaleString('en-IN')}
        <span className="text-lg font-semibold text-sage ml-1">{suffix}</span>
      </div>
      <p className="text-sm font-medium text-charcoal/70">{label}</p>
    </motion.div>
  )
}

// ─── SDG Card ─────────────────────────────────────────────────────────────────
function SdgCard({ number, title, desc, color }: { number: string; title: string; desc: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card p-5 flex gap-4 items-start"
    >
      <div
        className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
        style={{ backgroundColor: color }}
      >
        {number}
      </div>
      <div>
        <p className="font-semibold text-forest">{title}</p>
        <p className="text-sm text-sage mt-1">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Accordion ───────────────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-sage/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-5 py-4 bg-white hover:bg-ivory transition-colors text-left"
      >
        <span className="font-semibold text-forest">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-sage" /> : <ChevronDown className="w-4 h-4 text-sage" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 text-sm text-charcoal/80 space-y-2 bg-ivory/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EnvironmentalImpactPage() {
  const [data, setData] = useState<ImpactData>(MOCK)
  const [started, setStarted] = useState(true)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const { data: res } = await api.get('/analytics/impact')
        setData({
          total_ewaste_kg: res.total_ewaste_kg ?? res.total_verified_ewaste_kg ?? MOCK.total_ewaste_kg,
          co2_saved_kg: res.co2_saved_kg ?? res.estimated_co2_saved_kg ?? (res.total_ewaste_kg ? res.total_ewaste_kg * CO2_FACTOR : MOCK.co2_saved_kg),
          energy_saved_kwh: res.energy_saved_kwh ?? res.estimated_energy_saved_kwh ?? (res.total_ewaste_kg ? res.total_ewaste_kg * ENERGY_FACTOR : MOCK.energy_saved_kwh),
        })
      } catch {
        // Fallback to demonstration benchmarks
        setData(MOCK)
      }
    }
    fetchImpact()
  }, [])

  // Start count-up animation once hero section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setStarted(true) },
      { threshold: 0.3 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  const heroStats = [
    {
      icon: <Leaf className="w-full h-full" />,
      label: 'Total E-Waste Properly Processed',
      target: data.total_ewaste_kg,
      suffix: 'kg',
      color: '#10b981',
      delay: 0,
    },
    {
      icon: <Wind className="w-full h-full" />,
      label: `Estimated CO₂ Saved (×${CO2_FACTOR} kg CO₂/kg)`,
      target: data.co2_saved_kg,
      suffix: 'kg CO₂',
      color: '#1a4731',
      delay: 0.1,
    },
    {
      icon: <Zap className="w-full h-full" />,
      label: `Energy Saved from Material Recovery (×${ENERGY_FACTOR} kWh/kg)`,
      target: data.energy_saved_kwh,
      suffix: 'kWh',
      color: '#f59e0b',
      delay: 0.2,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
            <Leaf className="w-6 h-6 text-emerald" />
            Environmental Impact
          </h1>
          <p className="text-sage text-sm mt-1">Your contribution to a greener planet, quantified</p>
        </div>

        {/* Hero stats with count-up */}
        <div ref={heroRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {heroStats.map(s => (
            <HeroStat key={s.label} {...s} started={started} />
          ))}
        </div>

        {/* Conversion factors info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-semibold">About these conversion factors</p>
            <p>
              <strong>CO₂ factor:</strong> {CO2_FACTOR} kg CO₂ equivalent saved per kg of e-waste.{' '}
              <strong>Energy factor:</strong> {ENERGY_FACTOR} kWh saved per kg of e-waste via material recovery vs. primary production.
            </p>
            <p className="italic">
              These are industry-estimated averages. Actual values vary based on waste composition, processing method, and regional grid.
            </p>
          </div>
        </div>

        {/* SDG Goals */}
        <div>
          <h2 className="text-lg font-bold text-forest mb-4">Contributing to UN Sustainable Development Goals</h2>
          <div className="space-y-3">
            <SdgCard
              number="12"
              title="SDG 12 — Responsible Consumption & Production"
              desc="Formalising e-waste collection diverts hazardous materials from landfills and feeds certified recycling streams, cutting virgin-resource demand."
              color="#bf8b2e"
            />
            <SdgCard
              number="13"
              title="SDG 13 — Climate Action"
              desc="Recycling metals like copper and aluminium from e-waste avoids the energy-intensive mining and smelting that emit significant greenhouse gases."
              color="#3f7e44"
            />
            <SdgCard
              number="11"
              title="SDG 11 — Sustainable Cities & Communities"
              desc="Door-step collection and transparent digital records make responsible disposal accessible for urban households and small businesses across all city tiers."
              color="#fd9d24"
            />
          </div>
        </div>

        {/* How we calculate — Accordion */}
        <div>
          <h2 className="text-lg font-bold text-forest mb-3">How We Calculate</h2>
          <div className="space-y-2">
            <Accordion title="CO₂ Savings Methodology">
              <p>
                Each kilogram of e-waste routed through certified recyclers is assumed to save <strong>{CO2_FACTOR} kg CO₂e</strong>. This accounts for:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Avoided landfill methane and leachate emissions</li>
                <li>Reduced need for primary metal mining (aluminium, copper, gold, rare earths)</li>
                <li>Offset energy from recovered material re-entry into the supply chain</li>
              </ul>
              <p className="mt-2 text-xs text-sage">Reference basis: European Environment Agency e-waste recycling carbon estimates (2022).</p>
            </Accordion>
            <Accordion title="Energy Savings Methodology">
              <p>
                Recovering materials from e-waste instead of mining them saves approximately <strong>{ENERGY_FACTOR} kWh per kg</strong>. For example:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Recycling aluminium uses ~95% less energy than smelting bauxite ore</li>
                <li>Copper recovery from PCBs saves roughly 80% of the energy of copper mining</li>
                <li>Precious metal recovery (Au, Ag) avoids highly energy-intensive hydrometallurgical processes</li>
              </ul>
              <p className="mt-2 text-xs text-sage">Reference basis: UN E-waste Coalition 2023 and IEA material energy intensity data.</p>
            </Accordion>
            <Accordion title="Data Sources & Limitations">
              <p>Figures are computed from submission data recorded in the Kabadiwala Connect AI platform. The platform:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Does <strong>not</strong> independently verify that all collected items reached certified recyclers</li>
                <li>Uses fixed conversion factors that do not vary by material composition or processing route</li>
                <li>Applies national-average emission factors, which may differ from local grid mixes</li>
              </ul>
            </Accordion>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-red-700">
            Environmental impact figures are estimates for demonstration purposes only. They are based on generalised industry conversion factors
            and do not represent independently verified or certified environmental claims.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
