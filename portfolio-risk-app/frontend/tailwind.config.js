/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        // "dark" namespace inverted to light surfaces so existing utility
        // usages (bg-dark-900, bg-dark-950, etc.) automatically reskin.
        // 950 = body bg, 900 = card, 800 = elevated/hover, 700 = border,
        // 400-50 progressively deepen into text colors.
        dark: {
          50: '#060912',   // deepest text
          100: '#0F172A',
          200: '#1F2937',
          300: '#374151',
          400: '#6B7280',  // muted text
          500: '#9AA3B2',
          600: '#CBD2DE',
          700: '#E4E8F0',  // hairline border
          800: '#EEF1F7',  // elevated / hover
          900: '#FFFFFF',  // card surface
          950: '#F5F7FB',  // page background (soft lavender-white)
        },
        // Neutral rebalanced so text-neutral-400 stays readable on white
        neutral: {
          50: '#FAFBFD',
          100: '#F1F3F8',
          200: '#E4E8F0',
          300: '#CBD2DE',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#1F2937',
          800: '#111827',
          900: '#0B0E14',
          950: '#050711',
        },
        // Primary — vivid indigo/violet (Revolut-ish)
        primary: {
          50: '#EEF0FF',
          100: '#DFE3FF',
          200: '#C2C8FE',
          300: '#9AA1FC',
          400: '#7C7AF8',
          500: '#5B5BF6',
          600: '#4B46E8',
          700: '#3E38CC',
          800: '#342FA3',
          900: '#2B287F',
          950: '#1A184F',
        },
        // Accent — mint / teal (Robinhood-ish green)
        accent: {
          50: '#E6FBF5',
          100: '#C7F5E7',
          200: '#91ECD0',
          300: '#56DDB5',
          400: '#24CA9A',
          500: '#00D4A8',
          600: '#00A988',
          700: '#008870',
          800: '#026958',
          900: '#05554A',
        },
        // Warm peach — Apple Card iridescent warmth
        peach: {
          50:  '#FFF4EE',
          100: '#FFE2D3',
          200: '#FFC2A3',
          300: '#FF9F72',
          400: '#FF7A59',
          500: '#F76343',
          600: '#E14A2E',
        },
        // Success (semantic)
        success: {
          50:  '#E6FBF2',
          100: '#C7F5E0',
          200: '#91ECC2',
          300: '#56DDA0',
          400: '#24CA80',
          500: '#00B36A',
          600: '#009457',
          700: '#007545',
          800: '#015635',
          900: '#044428',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-left': 'slideLeft 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'aurora': 'aurora 18s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(91, 91, 246, 0.25)' },
          '100%': { boxShadow: '0 0 40px rgba(91, 91, 246, 0.45)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // Apple-Card iridescent hero gradient
        'hero-iridescent': 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 35%, #34D399 70%, #FCD34D 100%)',
        // Revolut-style primary gradient (punchy violet → coral)
        'primary-gradient': 'linear-gradient(135deg, #5B5BF6 0%, #8B5CF6 50%, #F76343 100%)',
        // Soft page background wash
        'page-wash':       'linear-gradient(180deg, #FAFBFF 0%, #F3F5FC 100%)',
        // Card subtle gradient (barely visible)
        'card-wash':       'linear-gradient(135deg, rgba(91,91,246,0.04) 0%, rgba(0,212,168,0.04) 100%)',
        // Aurora shimmering background (animated via aurora keyframes)
        'aurora':          'linear-gradient(120deg, #EEF0FF 0%, #E6FBF5 25%, #FFF4EE 50%, #E6FBF5 75%, #EEF0FF 100%)',
      },
      boxShadow: {
        // Soft Apple-style elevation, never harsh
        'soft':        '0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.04)',
        'soft-md':     '0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'soft-lg':     '0 4px 8px rgba(15, 23, 42, 0.05), 0 16px 48px rgba(15, 23, 42, 0.08)',
        'soft-xl':     '0 8px 16px rgba(15, 23, 42, 0.06), 0 24px 64px rgba(15, 23, 42, 0.10)',
        'primary':     '0 8px 24px rgba(91, 91, 246, 0.28)',
        'primary-lg':  '0 12px 40px rgba(91, 91, 246, 0.35)',
        'accent':      '0 8px 24px rgba(0, 212, 168, 0.28)',
        // Backwards-compat names used in existing components
        'card':        '0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(15, 23, 42, 0.04)',
        'card-hover':  '0 4px 8px rgba(15, 23, 42, 0.05), 0 16px 48px rgba(15, 23, 42, 0.08)',
        'revolut':     '0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
        'revolut-lg':  '0 4px 8px rgba(15, 23, 42, 0.05), 0 16px 48px rgba(15, 23, 42, 0.08)',
        'revolut-glow':'0 0 40px rgba(91, 91, 246, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
};
