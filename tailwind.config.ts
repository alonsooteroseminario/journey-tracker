import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // F1 semantic tokens that are valid even if no source file uses them yet —
  // body/page wrappers may opt in later. Tests probe these classes too.
  safelist: ["bg-app", "text-app", "bg-overlay"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // iPhone SE and small devices
        'fold': '600px',  // Foldable devices
      },
      colors: {
        // ── F1 semantic tokens (light + dark via CSS variables) ─────────────
        // Components should prefer these over `bg-white`/`bg-gray-*`.
        // Variable values defined in src/app/globals.css.
        app: "rgb(var(--bg-app) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface-default) / <alpha-value>)",
          elevated: "rgb(var(--surface-elevated) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border-default) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
        },
        overlay: "rgb(var(--overlay) / <alpha-value>)",

        // ── Brand identity (literal in both themes) ─────────────────────────
        brand: {
          primary: "#5B50E8",
          secondary: "#7B6FFF",
          light: "#EAE8FF",
          dark: "#2D1B8E",
          accent: "#F08080",
          muted: "#8B85C1",
        },
        streak: {
          fire: "#FF9600",
          gold: "#FFC800",
          glow: "#FFE082",
        },
        progress: {
          start: "#58CC02",
          mid: "#78D608",
          end: "#89E219",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-subtle": "bounce 2s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "confetti": "confetti 0.5s ease-out forwards",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px #FF9600, 0 0 10px #FF9600" },
          "100%": { boxShadow: "0 0 20px #FFC800, 0 0 30px #FFC800" },
        },
        confetti: {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(180deg)", opacity: "0" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
