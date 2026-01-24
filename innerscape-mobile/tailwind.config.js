// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          dark: '#3730A3',
          light: '#818CF8',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FCD34D',
        },
        surface: {
          background: '#FAFAFA',
          card: '#FFFFFF',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        outfit: ["Outfit"],
        satoshi: ["Satoshi"],
      }
    },
  },
  plugins: [],
}
