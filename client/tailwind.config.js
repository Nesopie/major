/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "hero-bg":
          "url('./icons/gridSquare.svg'), url('./icons/hero.png'), linear-gradient(to top right, #0b1120, #6366f1)",
        "grid-square": "url('/icons/gridSquare.svg')",
      },
      colors: {
        primary: "#0b1120",
        secondary: "#0ea5e9",
        ternary: "#6366f1",
        pink: "#f472b6",
        "dark-grey": "#1e293b",
      },
    },
  },
  plugins: [],
};
