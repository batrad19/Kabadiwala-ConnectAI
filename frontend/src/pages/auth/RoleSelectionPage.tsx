import React from 'react'
import { Link } from 'react-router-dom'

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-4">Select Your Role</h1>
        <p className="text-sage mb-6">Please <Link to="/register" className="text-forest font-semibold">register</Link> to choose your role.</p>
      </div>
    </div>
  )
}
