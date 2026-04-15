/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#f7f4ed',
        charcoal: '#1c1c1c',
        'off-white': '#fcfbf8',
        'cream-border': '#eceae4',
        muted: '#5f5f5d',
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'system-ui'],
        'sans-semibold': ['DMSans_600SemiBold', 'system-ui'],
      },
    },
  },
  plugins: [],
};
