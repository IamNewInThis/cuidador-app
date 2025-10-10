/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx", "./App.js",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7BA5F2",
          300: "#9CBCF5",
          400: "#8CB0F4",
          500: "#7BA5F2",
          600: "#5189EE",
          700: "#286CEA",
        },
        secondary: {
          DEFAULT: "#F9865B",
          300: "#FBA484",
          400: "#FA956F",
          500: "#F9865B",
          600: "#F86832",
          700: "#F64A09",
        },
        accent: {
          DEFAULT: "#D9625E",
          300: "#E38986",
          400: "#DE7672",
          500: "#D9625E",
          600: "#D2433F",
          700: "#BD312D",
        },
        background: {
          DEFAULT: "#FFF4E3",
          300: "#FFF7EA",
          400: "#FFF5E6",
          500: "#FFF4E3",
          600: "#FFDCA7",
          700: "#FFC56A",
        },
      },
    },
  },
  plugins: [],
}
