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
        background: "#080B11",
        surface: "#0F1523",
        "surface-raised": "#172033",
        "surface-card": "#121A2C",
        primary: {
          DEFAULT: "#E50914",
          hover: "#B80710",
          glow: "rgba(229, 9, 20, 0.35)",
        },
        accent: {
          gold: "#F59E0B",
          emerald: "#10B981",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(229, 9, 20, 0.4)",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-cinema": "linear-gradient(180deg, rgba(8, 11, 17, 0) 0%, rgba(8, 11, 17, 0.9) 70%, #080B11 100%)",
        "hero-glow": "radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.22), transparent 70%)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s infinite ease-in-out",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
