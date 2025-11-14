/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#b3c7fb',
          400: '#8aa6f8',
          500: '#667eea',
          600: '#5161ce',
          700: '#3d49a5',
          800: '#2f3a7c',
          900: '#232d5a',
        },
      },
    },
  },
  plugins: [],
}
