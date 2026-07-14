import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        inface: {
          bg:           "#0f1117",
          surface:      "#1a1d27",
          border:       "#2a2d3a",
          accent:       "#6c6cff",
          "accent-hover": "#5a5ae8",
          muted:        "#6b7280",
          text:         "#e5e7eb",
          success:      "#10b981",
          warning:      "#f59e0b",
          danger:       "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
