/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saturnText: '#d6d6f5',
        cardBg: '#252525',
        cardHover: '#444444'
      },
      fontFamily: {
        luckiest: ['"Luckiest Guy"', 'cursive'],
        boogaloo: ['"Boogaloo"', 'sans-serif'],
      },
      backgroundImage: {
        'header-gradient': 'linear-gradient(135deg, #1e1e2e, #2c003e, #3b0d63)',
        'footer-gradient': 'linear-gradient(90deg, #af2896, #509bf5)',
      }
    },
  },
  plugins: [],
}