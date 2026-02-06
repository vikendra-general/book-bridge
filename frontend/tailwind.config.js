/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          600: '#1E3A8A',
          700: '#172E6E'
        },
        paper: '#F5F1E8',
        accent: {
          100: '#E7F3EC',
          600: '#2F855A',
          800: '#22543D'
        },
        amber: {
          100: '#FEF3C7',
          600: '#D97706',
          800: '#92400E'
        },
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        border: '#E5E7EB'
      },
    },
  },
  plugins: [],
}
