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
        // ═══════════════════════════════════════════════════
        //  OBSIDIAN GLASS — FieldOps Dark Theme
        //  Inspired by Linear, Arc, Bloomberg Terminal
        // ═══════════════════════════════════════════════════

        // Background layers (darkest → lightest)
        obsidian: {
          DEFAULT: "#1a1a2e",
          deep: "#0f1525",
          light: "#16213e",
        },

        // Glass surface system
        glass: {
          DEFAULT: "rgba(255,255,255,0.04)",
          light: "rgba(255,255,255,0.06)",
          medium: "rgba(255,255,255,0.08)",
          heavy: "rgba(255,255,255,0.12)",
        },

        // Text hierarchy (remapped for dark backgrounds)
        onyx: "#e2e8f0",           // primary text (was #000000)
        slate: "#94a3b8",          // body / secondary text (was #2d2d2f)
        "warm-gray": "#64748b",    // muted / tertiary text (was #8c8c8c)

        // Functional accents — Obsidian Glass palette
        "accent-violet": "#8b5cf6",   // primary action / CTA
        "accent-teal": "#14b8a6",     // success / positive
        "accent-green": "#14b8a6",    // alias for teal (success)
        "accent-amber": "#eab308",    // warning
        "accent-red": "#ec4899",      // alert / danger (pink)

        // Surface semantic tokens
        "surface-primary": "#1a1a2e",
        "surface-secondary": "#16213e",
        "surface-dark": "#0f1525",
        "surface-elevated": "rgba(255,255,255,0.06)",

        // Glass border
        "glass-border": "rgba(255,255,255,0.06)",

        // Legacy aliases (for backward compat)
        alabaster: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        heading: [
          "Inter",
          "Avenir",
          "Arial",
          "Helvetica Neue",
          "sans-serif",
        ],
        body: [
          "Inter",
          "Avenir Next",
          "Calibri",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        // Mobile-optimized scale (18px minimum for field use)
        "field-xs": ["14px", { lineHeight: "1.4" }],
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
        card: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
        "card-hover":
          "0 4px 12px rgba(139,92,246,0.15), 0 2px 4px rgba(0,0,0,0.3)",
        "card-active": "0 0 0 2px rgba(139,92,246,0.3)",
        nav: "0 -1px 6px rgba(0,0,0,0.4)",
        "glass-glow": "0 4px 16px rgba(139,92,246,0.12), 0 0 1px rgba(255,255,255,0.06)",
        "glass-inner": "inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-card": "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "violet-glow": "0 0 20px rgba(139,92,246,0.15)",
        "teal-glow": "0 0 20px rgba(20,184,166,0.15)",
      },
      animation: {
        press: "press 0.15s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "border-shimmer": "borderShimmer 3s linear infinite",
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
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139,92,246,0.1)" },
          "50%": { boxShadow: "0 0 30px rgba(139,92,246,0.2)" },
        },
        borderShimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      backgroundImage: {
        "gradient-obsidian": "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        "gradient-violet": "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        "gradient-teal": "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
        "gradient-divider": "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(20,184,166,0.3), transparent)",
      },
    },
  },
  plugins: [],
};
export default config;
