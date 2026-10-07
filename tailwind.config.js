/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finance: {
          emerald: '#10b981',
          rose: '#f43f5e',
          indigo: '#6366f1',
          slate: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
