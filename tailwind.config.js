/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0F",
        panel: "#111118",
        surface: "#1A1A24",
        surface2: "#20202E",
        border: "#2A2A3A",
        borderHover: "#3A3A5A",
        accent: "#4F8EF7",
        purple: "#A855F7",
        text: "#E8E8F0",
        textSec: "#8888A0",
        textDim: "#55556A",
      },
      borderRadius: {
        px6: '6px',
        px10: '10px',
        px14: '14px',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
