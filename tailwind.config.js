/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mint: {
          DEFAULT: '#62C58F',
          50: '#EAF9F1',
          100: '#D3F2E1',
          200: '#A7E5C3',
          300: '#7BD8A5',
          400: '#62C58F',
          500: '#4CAE79',
          600: '#3B8C60',
          700: '#2C6A48',
          800: '#1D4730',
          900: '#0F2518',
        },
        charcoal: {
          DEFAULT: '#1A1D1F',
          soft: '#2C3033',
        },
        asphalt: {
          DEFAULT: '#5C6470',
          light: '#8A919B',
        },
        warmwhite: '#FBF9F6',
        cardgray: '#F1EFEC',
        amber: {
          DEFAULT: '#B8791A',
          bg: '#FCEED9',
        },
        danger: {
          DEFAULT: '#C43D3D',
          bg: '#FBE4E4',
        },
        dark: {
          bg: '#121415',
          surface: '#1C1F21',
          card: '#242829',
          border: '#33383B',
          text: '#F2F0EC',
          textSecondary: '#A7ADB3',
        },
      },
      borderRadius: {
        xl: '20px',
        '2xl': '28px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
