/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // M-Soho design tokens (shared dark palette, blue accent)
        bg: { primary: "#0b0d12", card: "#151823", elevated: "#1a1d27" },
        accent: {
          blue: "#3b82f6",
          blueHover: "#2563eb",
          blueSoft: "rgba(59,130,246,0.12)",
        },
        ink: { primary: "#f1f5f9", secondary: "#cbd5e1", muted: "#94a3b8" },
        line: "#242838",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
        glow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 30px rgba(59,130,246,0.15)",
        lift: "0 10px 40px -10px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15), transparent 60%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
