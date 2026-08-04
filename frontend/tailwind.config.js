/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        cyan: {
          400: '#00E5FF',
          500: '#00BCD4',
        },
        indigo: {
          500: '#4F46E5',
          600: '#4338CA',
        },
        violet: {
          500: '#7C3AED',
          600: '#6D28D9',
        },
        dark: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'aurora': {
          '0%': { transform: 'translate(0%, 0%) scale(1)', opacity: '0.5' },
          '25%': { transform: 'translate(10%, -10%) scale(1.1)', opacity: '0.7' },
          '50%': { transform: 'translate(-5%, 5%) scale(0.95)', opacity: '0.4' },
          '75%': { transform: 'translate(-10%, -5%) scale(1.05)', opacity: '0.6' },
          '100%': { transform: 'translate(0%, 0%) scale(1)', opacity: '0.5' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'counter-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'breathe': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 229, 255, 0.3)' },
        },
        'scan-line': {
          '0%': { top: '-2px', opacity: '1' },
          '100%': { top: '100%', opacity: '0' },
        },
        'particle-float': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) translateX(50px)', opacity: '0' },
        },
        'orb-drift-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        'orb-drift-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-25px, 20px) scale(1.05)' },
          '66%': { transform: 'translate(20px, -15px) scale(0.9)' },
        },
        'orb-drift-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, 25px) scale(0.95)' },
          '66%': { transform: 'translate(-15px, -20px) scale(1.05)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(0, 229, 255, 0.2)' },
          '50%': { borderColor: 'rgba(0, 229, 255, 0.6)' },
        },
        '3d-tilt': {
          '0%': { transform: 'perspective(1000px) rotateX(0) rotateY(0)' },
          '100%': { transform: 'perspective(1000px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))' },
        },
        'ripple': {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'slide-in-left': 'slide-in-left 0.5s ease-out both',
        'slide-in-right': 'slide-in-right 0.5s ease-out both',
        'slide-in-up': 'slide-in-up 0.5s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'pulse-ring': 'pulse-ring 1.4s ease-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'aurora': 'aurora 8s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'counter-up': 'counter-up 0.6s ease-out both',
        'spin-slow': 'spin-slow 3s linear infinite',
        'spin-reverse': 'spin-reverse 3s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'scan-line': 'scan-line 2s ease-out infinite',
        'particle-float': 'particle-float 8s linear infinite',
        'orb-drift-1': 'orb-drift-1 20s ease-in-out infinite',
        'orb-drift-2': 'orb-drift-2 25s ease-in-out infinite',
        'orb-drift-3': 'orb-drift-3 18s ease-in-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out both',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.3), 0 0 60px rgba(0, 229, 255, 0.1)',
        'neon-indigo': '0 0 20px rgba(79, 70, 229, 0.3), 0 0 60px rgba(79, 70, 229, 0.1)',
        'neon-violet': '0 0 20px rgba(124, 58, 237, 0.3), 0 0 60px rgba(124, 58, 237, 0.1)',
        'holographic': '0 0 30px rgba(0, 229, 255, 0.15), 0 0 60px rgba(79, 70, 229, 0.1), 0 0 90px rgba(124, 58, 237, 0.05)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        'aurora-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0, 229, 255, 0.15), transparent), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(79, 70, 229, 0.1), transparent), radial-gradient(ellipse 40% 30% at 10% 80%, rgba(124, 58, 237, 0.08), transparent)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'holographic-card': 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(79, 70, 229, 0.05) 50%, rgba(124, 58, 237, 0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}