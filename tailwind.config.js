/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        fontFamily: {
        sans: ['Outfit-Regular'],
        semibold: ['Outfit-SemiBold'], 
        medium: ['Outfit-Medium'],
        bold: ['Outfit-Bold'],
      },
        mine: {
          bg: "#121212",
          surface: "#1E1E1E",
          card: "#252525",
          input: "#2A2A2A",
          primary: "#22C55E",
          "primary-dark": "#16A34A",
          white: "#FFFFFF",
          muted: "#A1A1AA",
          dim: "#71717A",
          border: "#3F3F46",
          "border-active": "#22C55E",
        },
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 197, 94, 0.35)",
      },
    },
  },
  plugins: [],
};
