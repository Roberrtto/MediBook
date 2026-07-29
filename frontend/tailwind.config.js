/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Clinical calm" palette - deep pine/teal for trust & focus,
        // warm gold as the single warm accent, sage-white background.
        pine: {
          950: '#0D211F',
          900: '#12312F',
          800: '#1B453F',
          700: '#265950',
        },
        teal: {
          600: '#2F6F5E',
          500: '#3D8B76',
          400: '#5AA98F',
        },
        gold: {
          500: '#E8B04B',
          400: '#EFC275',
        },
        sage: {
          50: '#F5F7F6',
          100: '#ECF0EE',
        },
        ink: '#16201E',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
