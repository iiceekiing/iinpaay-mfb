/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary:   '#1A3C8F',
          dark:      '#0D1B3E',
          accent:    '#00C27C',
          'accent-dark':  '#009962',
          'accent-light': '#D6F5EA',
          coral:     '#FF6B35',
          gold:      '#F5A623',
          sky:       '#3B9EFF',
          purple:    '#7C4DFF',
        },
        ink: {
          primary:   '#0D1B3E',
          secondary: '#3D4F6E',
          muted:     '#7A8BA8',
        },
        surface: {
          light:  '#F4F6FB',
          cream:  '#F5F0EB',
          dark:   '#0D1B3E',
        },
        edge: {
          light:  '#E4E9F2',
          medium: '#CBD3E8',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-mic':  'pulseMic 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-ring':  'glowRing 2s ease-in-out infinite',
        'wave':       'wave 1.2s ease-in-out infinite',
        'wave-2':     'wave 1.2s ease-in-out 0.2s infinite',
        'wave-3':     'wave 1.2s ease-in-out 0.4s infinite',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.25s ease',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        pulseMic: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,194,124,0.4)' },
          '50%':      { boxShadow: '0 0 0 20px rgba(0,194,124,0)' },
        },
        glowRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%':      { transform: 'scale(1.15)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        slideUp: {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%':           { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
