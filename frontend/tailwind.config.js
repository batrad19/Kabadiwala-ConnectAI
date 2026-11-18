/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: '#1a4731', light: '#2d6a4f', dark: '#0d2b1e' },
        emerald: { DEFAULT: '#10b981', light: '#34d399', dark: '#059669' },
        sage:    { DEFAULT: '#84a98c', light: '#b7d8c0', dark: '#5a7a62' },
        ivory:   { DEFAULT: '#f8f7f4', dark: '#ede9e1' },
        lime:    { DEFAULT: '#bef264', dark: '#a3e635' },
        charcoal:{ DEFAULT: '#1c2b1f', light: '#3d5247' },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'eco-gradient': 'linear-gradient(135deg, #1a4731 0%, #2d6a4f 50%, #10b981 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(248,247,244,0.95) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        scan: { '0%': { top: '0%' }, '100%': { top: '100%' } },
      },
      boxShadow: {
        'eco': '0 4px 24px rgba(16, 185, 129, 0.15)',
        'eco-lg': '0 8px 40px rgba(16, 185, 129, 0.2)',
        'glass': '0 8px 32px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
