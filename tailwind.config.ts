import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Blackstone Construction Brand Palette
        onyx: "#000000",
        alabaster: "#f2f0e6",
        slate: "#2d2d2f",
        "warm-gray": "#8c8c8c",

        // Functional accents
        "accent-green": "#2d8a4e",
        "accent-amber": "#d4a017",
        "accent-red": "#c0392b",

        // Surface variations
        "surface-primary": "#ffffff",
        "surface-secondary": "#f2f0e6",
        "surface-dark": "#000000",
        "surface-elevated": "#fafaf7",
      },
      fontFamily: {
        // Blackstone brand typography with web-safe fallbacks
        heading: [
          "Avenir",
          "Avenir Medium",
          "Arial",
          "Helvetica Neue",
          "sans-serif",
        ],
        body: [
          "Avenir Next LT Pro",
          "Avenir Next",
          "Calibri",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        // Mobile-optimized scale (18px minimum for field use)
        "field-sm": ["16px", { lineHeight: "1.4" }],
        "field-base": ["18px", { lineHeight: "1.5" }],
        "field-lg": ["20px", { lineHeight: "1.4" }],
        "field-xl": ["24px", { lineHeight: "1.3" }],
        "field-2xl": ["28px", { lineHeight: "1.2" }],
        "field-3xl": ["32px", { lineHeight: "1.15" }],
      },
      spacing: {
        // Touch target minimums (Apple HIG: 44pt minimum, we use 56px+)
        "touch-min": "44px",
        "touch-target": "56px",
        "touch-large": "72px",
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
      },
      borderRadius: {
        card: "12px",
        button: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover":
          "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
        "card-active": "0 0 0 2px rgba(0,0,0,0.15)",
        nav: "0 -1px 3px rgba(0,0,0,0.1)",
      },
      animation: {
        "press": "press 0.15s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        press: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.97)" },
          "100%": { transform: "scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
