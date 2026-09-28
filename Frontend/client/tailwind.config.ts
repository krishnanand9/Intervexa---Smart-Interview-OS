import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#070B14",
        surface: "#0D1422",
        card: "#111A2B",
        purple: {
          DEFAULT: "#7C5CFF",
          light: "#9A82FF",
          dark: "#5A3ED6",
        },
        cyan: {
          DEFAULT: "#00D4FF",
          light: "#5CE1FF",
          dark: "#00A3C4",
        }
      },
      boxShadow: {
        glow: "0 0 25px rgba(124, 92, 255, 0.35)",
        "glow-cyan": "0 0 25px rgba(0, 212, 255, 0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave-bar": "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { height: "20%" },
          "50%": { height: "90%" },
        }
      }
    }
  },
  plugins: []
} satisfies Config;