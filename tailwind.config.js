/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary: deep clinical teal — trust, calm, clinical authority
        primary: {
          50: '#EAF2F2',
          100: '#D2E5E4',
          200: '#A6CBC9',
          300: '#79B1AE',
          400: '#4D9793',
          500: '#267A76',
          600: '#0F4C4C',
          700: '#0C3D3D',
          800: '#092E2E',
          900: '#061F1F',
        },
        // Accent: warm terracotta — human warmth against clinical cold, used for primary actions & alerts
        accent: {
          50: '#FDF1EA',
          100: '#FBE0D0',
          200: '#F6C0A1',
          300: '#F0A172',
          400: '#EA8857',
          500: '#E0703B',
          600: '#C1582A',
          700: '#9A4621',
          800: '#733418',
          900: '#4D230F',
        },
        // Surface: soft sage tint for backgrounds, distinct from sterile white
        surface: {
          DEFAULT: '#F4F8F6',
          card: '#FFFFFF',
          border: '#DCE7E3',
        },
        ink: {
          DEFAULT: '#16221F',
          muted: '#54635F',
          faint: '#8A9A95',
        },
        status: {
          confirmed: '#267A76',
          pending: '#C1582A',
          cancelled: '#B4453F',
          completed: '#54635F',
        },
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Cambria', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Calibri', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22,34,31,0.06), 0 1px 12px rgba(22,34,31,0.04)',
        popover: '0 8px 30px rgba(22,34,31,0.12)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
