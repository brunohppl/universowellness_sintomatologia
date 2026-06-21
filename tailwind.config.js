/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1F2A2E',
        muted: '#64706F',
        canvas: '#F6F7F5',
        surface: '#FFFFFF',
        teal: {
          50: '#EAF4FD',
          100: '#CFE6FB',
          300: '#8FC4F0',
          500: '#63ADE9',
          600: '#4090D1',
          700: '#2C6FA8',
          900: '#163E5C'
        },
        coral: {
          50: '#FDEEE8',
          100: '#FAD8C8',
          300: '#F0A07C',
          500: '#E8714A',
          600: '#D45B36',
          700: '#B3492B'
        },
        leaf: {
          500: '#3A9D72',
          600: '#2F8060'
        }
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 61, 64, 0.06), 0 8px 24px rgba(16, 61, 64, 0.08)'
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' }
        },
        popIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        pulseRing: 'pulseRing 900ms ease-out',
        popIn: 'popIn 200ms ease-out'
      }
    }
  },
  plugins: []
}
