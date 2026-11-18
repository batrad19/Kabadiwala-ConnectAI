import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, Zap, MapPin, Shield, ArrowRight, Recycle, TrendingUp, Users, ChevronRight, Scan, Package, Star } from 'lucide-react'

const stats = [
  { label: 'Cities Covered', value: '25+' },
  { label: 'E-Waste Categories', value: '12' },
  { label: 'Verified Recyclers', value: '50+' },
  { label: 'Transactions', value: '1,200+' },
]

const features = [
  { icon: <Zap className="w-6 h-6" />, title: 'AI-Powered Classification', desc: 'Deep learning models (CNN, MobileNetV3, EfficientNet) identify your e-waste in seconds with real confidence scores.' },
  { icon: <TrendingUp className="w-6 h-6" />, title: 'Fair Price Estimation', desc: 'Transparent, ML-driven pricing based on category, condition, age, and region. No more unfair deals.' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Verified Recycler Network', desc: 'Connect with authorised, verified e-waste recyclers on an interactive map. Compare offers and book pickups.' },
]

const steps = [
  { n: '01', title: 'Photograph', desc: 'Snap or upload a photo of your discarded electronic device.' },
  { n: '02', title: 'Identify', desc: 'Our AI classifies the item and assesses its condition.' },
  { n: '03', title: 'Value', desc: 'Get an indicative price range from our pricing engine.' },
  { n: '04', title: 'Connect & Recycle', desc: 'Find a nearby verified recycler and schedule a pickup.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ivory font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-white/80 border-b border-sage/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-forest">
            <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" />
            </div>
            <span>Kabadiwala <span className="text-emerald">Connect AI</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-charcoal/70">
            <Link to="/about" className="hover:text-forest transition-colors">About</Link>
            <Link to="/marketplace" className="hover:text-forest transition-colors">Recyclers</Link>
            <Link to="/analytics" className="hover:text-forest transition-colors">Impact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-forest font-semibold text-sm hover:text-emerald transition-colors">Sign In</Link>
            <Link to="/register" className="eco-btn text-sm py-2 px-5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 hero-pattern overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald/5 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-forest/5 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-emerald/10 text-emerald font-medium px-4 py-2 rounded-full text-sm mb-6">
                <Leaf className="w-4 h-4" /> AI-Powered Circular E-Waste Platform
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-charcoal leading-tight tracking-tight mb-6">
                <span className="text-gradient">Identify. Understand.</span>
                <br />
                <span className="text-gradient">Value. Connect. Recycle.</span>
              </h1>
              <p className="text-lg text-charcoal/60 mb-10 leading-relaxed">
                AI-powered e-waste intelligence platform. Photograph any discarded electronic device,
                get an instant classification and fair price estimate, then connect with verified
                recyclers near you — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/register')} className="eco-btn flex items-center justify-center gap-2 text-base py-3.5">
                  <Scan className="w-5 h-5" /> Start Scanning Free
                </button>
                <button onClick={() => navigate('/marketplace')} className="eco-btn-outline flex items-center justify-center gap-2 text-base py-3.5">
                  Find Recyclers <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Stats strip */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-5 text-center">
                <div className="text-3xl font-extrabold text-forest">{s.value}</div>
                <div className="text-sm text-sage mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-charcoal">Why Kabadiwala Connect AI?</h2>
            <p className="text-charcoal/50 mt-3 max-w-xl mx-auto">We solve real problems in India's fragmented e-waste ecosystem using cutting-edge supervised machine learning.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="glass-card p-8 group hover:shadow-eco-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-eco-gradient flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-charcoal mb-3">{f.title}</h3>
                <p className="text-charcoal/60 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-charcoal">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="relative">
                {i < steps.length - 1 && <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-emerald/50 to-transparent z-0" />}
                <div className="glass-card p-6 relative z-10">
                  <div className="text-4xl font-black text-gradient mb-4">{s.n}</div>
                  <h3 className="font-bold text-charcoal mb-2">{s.title}</h3>
                  <p className="text-sm text-charcoal/60">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-eco-gradient">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-extrabold text-white mb-4">Ready to responsibly recycle your e-waste?</h2>
            <p className="text-white/80 mb-8">Join thousands of collectors, households, and recyclers building a cleaner India.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-forest font-bold px-8 py-4 rounded-xl hover:bg-ivory transition-colors shadow-lg">
              Create Free Account <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white/60 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Recycle className="w-5 h-5 text-emerald" /> Kabadiwala Connect AI
          </div>
          <p className="text-sm">Kabadiwala Connect AI · AI-Powered E-Waste Recycling Platform · © 2026</p>
          <div className="flex gap-4 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/analytics" className="hover:text-white transition-colors">Impact</Link>
            <Link to="/marketplace" className="hover:text-white transition-colors">Recyclers</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
