/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bullish: {
          blue:  '#052EF0',
          black: '#000000',
          navy:  '#020A52',
          'navy-deep': '#010525',
          cream: '#F5F0EB',
          'gray-dark': '#333333',
          'gray-light': '#EEEEEE',
        },
      },
      fontFamily: {
        sans:      ['DM Sans', 'system-ui', 'sans-serif'],
        display:   ['Oswald', 'Impact', 'sans-serif'],
        editorial: ['Spectral', 'Georgia', 'serif'],
      },
      letterSpacing: {
        widest2: '0.3em',
      },
    },
  },
  plugins: [],
}
