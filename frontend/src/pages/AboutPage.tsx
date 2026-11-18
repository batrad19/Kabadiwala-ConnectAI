import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Recycle, Leaf, Cpu, Database, Zap, Code2, Award, Users, ArrowLeft,
  GitBranch, Globe, Heart
} from 'lucide-react'

const fadeUp: any = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
}

const techStack = [
  {
    icon: <Code2 className="w-7 h-7" />,
    name: 'React 18 + TypeScript',
    desc: 'Modern frontend with type-safe components, Framer Motion animations, and Tailwind CSS.',
    color: '#61DAFB',
    bg: 'from-cyan-50 to-blue-50',
  },
  {
    icon: <Zap className="w-7 h-7" />,
    name: 'FastAPI (Python)',
    desc: 'High-performance async REST API with auto-generated OpenAPI docs and JWT auth.',
    color: '#059669',
    bg: 'from-emerald-50 to-green-50',
  },
  {
    icon: <Cpu className="w-7 h-7" />,
    name: 'PyTorch + YOLOv8',
    desc: 'Deep learning pipeline for e-waste classification, Grad-CAM explainability, and multi-object detection.',
    color: '#EE4C2C',
    bg: 'from-orange-50 to-red-50',
  },
  {
    icon: <Database className="w-7 h-7" />,
    name: 'PostgreSQL',
    desc: 'Relational database powering inventory, user management, transactions, and analytics.',
    color: '#336791',
    bg: 'from-blue-50 to-indigo-50',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ivory font-[Manrope,Inter,system-ui,sans-serif]">
      {/* Simple Navbar */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sage/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-forest">
            <div className="w-8 h-8 rounded-lg bg-eco-gradient flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm leading-tight">
              <span className="block text-forest">Kabadiwala</span>
              <span className="block text-emerald text-xs">Connect AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1 text-sm text-sage hover:text-forest transition-colors">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <Link to="/auth/login" className="eco-btn text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 hero-pattern">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 bg-emerald/10 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <Award className="w-4 h-4" /> Circular Economy Platform
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-charcoal mb-6 leading-tight">
            About{' '}
            <span className="text-gradient">Kabadiwala Connect AI</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg text-sage max-w-2xl mx-auto leading-relaxed">
            An AI-powered platform bridging informal e-waste collectors, aggregators, certified recyclers,
            and households — building a transparent, traceable, and sustainable urban e-waste ecosystem.
          </motion.p>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-forest/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Mission & Vision */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}
            className="glass-card p-8">
            <div className="w-12 h-12 rounded-xl bg-eco-gradient flex items-center justify-center mb-5">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-3">Our Mission</h2>
            <p className="text-sage leading-relaxed">
              To digitize and formalize the informal e-waste collection chain in India by giving every stakeholder —
              from the neighbourhood kabadiwala to certified recyclers — an intelligent, accessible tool that
              identifies, values, and routes e-waste responsibly. We aim to reduce toxic landfill dumping by
              creating economic incentives powered by AI-driven transparency.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            className="glass-card p-8">
            <div className="w-12 h-12 rounded-xl bg-eco-gradient flex items-center justify-center mb-5">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-charcoal mb-3">Our Vision</h2>
            <p className="text-sage leading-relaxed">
              A future where every piece of discarded electronics is recovered, categorised, and channelled into
              certified recycling streams — generating livelihoods, conserving critical raw materials, and
              measurably reducing India's growing e-waste burden of 3.2 million metric tonnes per year.
              Technology should not just solve problems; it should uplift communities along the way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Focus & Challenge */}
      <section className="py-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="glass-card p-8 border-l-4 border-emerald">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-3 bg-eco-gradient text-white px-5 py-2.5 rounded-xl shadow-eco">
              <Award className="w-5 h-5" />
              <div>
                <div className="text-xs font-semibold opacity-80">National Environmental Initiative</div>
                <div className="text-sm font-extrabold">Circular E-Waste Mission</div>
              </div>
            </div>
            <div className="text-sm text-sage">
              Focus Domain: <span className="font-semibold text-charcoal">Responsible Electronics Recovery</span>
            </div>
          </div>
          <h3 className="text-lg font-bold text-charcoal mb-3">The Challenge & Our Solution</h3>
          <p className="text-sage leading-relaxed mb-4">
            <strong className="text-charcoal">Challenge:</strong> India generates over 3.2 million metric tonnes of e-waste annually,
            yet less than 20% is channelled through certified recyclers. The informal sector handles the bulk —
            often using hazardous dismantling methods. There is no standardized system to assess, value, or trace
            e-waste as it moves from households through collectors to aggregators and recyclers.
          </p>
          <p className="text-sage leading-relaxed">
            <strong className="text-charcoal">Our Solution:</strong> An end-to-end AI platform that uses computer vision for
            e-waste classification (12 categories), provides rule-based condition assessment, generates indicative
            market valuations, and connects all stakeholders on a single traceable platform — with full audit trails
            for environmental compliance.
          </p>
        </motion.div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-charcoal mb-3">Technology Stack</h2>
          <p className="text-sage">Built with modern, production-grade open-source technologies.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {techStack.map((tech, i) => (
            <motion.div key={tech.name} variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true }} custom={i * 0.5}
              className={`glass-card p-6 hover:shadow-eco-lg hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${tech.bg}`}>
              <div className="mb-4" style={{ color: tech.color }}>{tech.icon}</div>
              <h3 className="font-bold text-charcoal mb-2 text-sm">{tech.name}</h3>
              <p className="text-xs text-sage leading-relaxed">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core Principles & Impact */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-charcoal mb-3">Core Operating Principles</h2>
          <p className="text-sage">Fostering responsible circular electronics recovery at scale.</p>
        </motion.div>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              title: 'Fair Scrap Pricing',
              desc: 'Algorithmic valuation eliminating predatory intermediary price deductions for informal collectors.',
              icon: '⚖️'
            },
            {
              title: 'Safe Decontamination',
              desc: 'Enforcing chain of custody so hazardous mercury, lead, and flame retardants never reach open soil.',
              icon: '🛡️'
            },
            {
              title: 'Formalization & ESG',
              desc: 'Empowering kabadiwalas with digital manifests, verifiable tax compliance, and carbon credit readiness.',
              icon: '🌱'
            }
          ].map((principle, i) => (
            <motion.div key={principle.title} variants={fadeUp} initial="hidden" whileInView="visible"
              viewport={{ once: true }} custom={i * 0.2}
              className="glass-card p-6 text-center hover:-translate-y-1 hover:shadow-eco transition-all duration-300">
              <div className="text-3xl mb-3">{principle.icon}</div>
              <h3 className="font-bold text-charcoal mb-2 text-base">{principle.title}</h3>
              <p className="text-xs text-sage leading-relaxed">{principle.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-sage/20 py-10 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-extrabold text-forest">
              <div className="w-7 h-7 rounded-lg bg-eco-gradient flex items-center justify-center">
                <Recycle className="w-3.5 h-3.5 text-white" />
              </div>
              Kabadiwala Connect AI
            </div>
            <div className="flex items-center gap-6 text-sm text-sage">
              <Link to="/" className="hover:text-forest transition-colors">Home</Link>
              <Link to="/auth/login" className="hover:text-forest transition-colors">Login</Link>
              <Link to="/auth/register" className="hover:text-forest transition-colors">Register</Link>
            </div>
            <div className="text-xs text-sage">© 2026 Kabadiwala Connect AI · All Rights Reserved</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
