/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#ff7a00',
          gray: '#1f1f20'
        }
      }
    }
  },
  plugins: []
};
