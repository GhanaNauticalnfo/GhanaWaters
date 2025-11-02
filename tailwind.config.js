/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/*/src/**/*.{html,ts,css}",
    "./libs/**/src/**/*.{html,ts,css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}