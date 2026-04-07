/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: 'var(--soft-bg)',
          100: 'var(--theme-100)',
          400: 'var(--rose-main)',
          500: 'var(--rose-main)',
          600: 'var(--rose-main)',
          700: 'var(--nestly-burgundy)',
          800: 'var(--nestly-burgundy)',
          900: 'var(--nestly-burgundy)',
        }
      }
    }
  },
  plugins: [],
}
