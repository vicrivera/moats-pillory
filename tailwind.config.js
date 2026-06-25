/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand palette ──────────────────────────────────────────────────
        // Deep navy base — the Moats ecosystem dark foundation
        navy: {
          950: '#060810',
          900: '#0b0e1a',
          800: '#111527',
          700: '#181d35',
          600: '#202845',
        },
        // Gold — loyalty, prestige, the untarnished
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#d97706',
          600: '#b45309',
        },
        // Betrayal red — early exits, damage
        betrayal: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Muted text hierarchy
        slate: {
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        },
      },
      fontFamily: {
        // Display: cinzel for the medieval proclamation feel
        display: ['Cinzel', 'Georgia', 'serif'],
        // Body: inter for data clarity
        body: ['Inter', 'system-ui', 'sans-serif'],
        // Mono: for addresses, numbers, tx hashes
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'pillory-vignette': 'radial-gradient(ellipse at center, transparent 0%, rgba(6,8,16,0.8) 100%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.6' },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.4s ease-out both',
        'slide-in-right':'slide-in-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-gold':    'pulse-gold 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
