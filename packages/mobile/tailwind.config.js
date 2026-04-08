/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fffaf9',
          100: '#ffe4e6',
          400: '#f43f5e',
          500: '#f43f5e',
          600: '#f43f5e',
          700: '#7e1631',
          800: '#7e1631',
          900: '#7e1631',
        },
        'text-primary': '#1e293b',
        'text-secondary': '#64748b',
        'text-muted': '#94a3b8',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};
