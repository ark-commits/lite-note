/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f2ec',
        ink: '#1f2937',
      },
    },
  },
  plugins: [typography],
}
