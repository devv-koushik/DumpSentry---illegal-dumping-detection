/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── Landing page tokens (unchanged) ──
        ink: "#16241d",
        muted: "#5c665d",
        paper: "#eff2ea",
        paper2: "#e6eae0",
        accent: "#e2a33b",
        "accent-deep": "#b97f22",
        surface: "#0e1712",
        surface2: "#16241c",
        line: "rgba(22,36,29,.14)",
        warning: "#e2a33b",
        danger: "#c94b3f",
        success: "#3f8a5c",

        // ── Command center tokens ──
        "cmd-bg": "#0a100d",
        "cmd-surface": "#111c16",
        "cmd-surface2": "#182620",
        "cmd-surface3": "#1f3029",
        "cmd-border": "rgba(226,163,59,0.12)",
        "cmd-text": "#e8ede9",
        "cmd-muted": "#7a8a7e",
        "cmd-info": "#5ba4c9",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        cmd: ["Inter", "IBM Plex Sans", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 6px 24px rgba(22,36,29,.06)",
        pop: "0 10px 30px rgba(0,0,0,.15)",
        "cmd-glow": "0 0 20px rgba(226,163,59,0.08)",
        "cmd-glow-lg": "0 0 40px rgba(226,163,59,0.12)",
        "cmd-panel": "0 8px 32px rgba(0,0,0,0.4), 0 0 1px rgba(226,163,59,0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "drone-pulse": "dronePulse 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-right": "slideRight 0.4s ease-out",
      },
      keyframes: {
        dronePulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.6)", opacity: "0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
