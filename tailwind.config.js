/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f7',
          100: '#dbf0ec',
          200: '#bae1db',
          300: '#8dcbc2',
          400: '#5bb1a4',
          500: '#407e6d',
          600: '#347361',
          700: '#2d5f51',
          800: '#274d42',
          900: '#234038',
        }
      }
    },
  },
  plugins: [],
}
