import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // iPhone SE and small devices
        'fold': '600px',  // Foldable devices
      },
      colors: {
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
