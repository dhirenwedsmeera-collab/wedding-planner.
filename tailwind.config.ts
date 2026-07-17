import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        emerald: {
          50: "#ecfbf3", 100: "#d1f5e2", 200: "#a3ebc8", 300: "#6dd9ab",
          400: "#3cc08d", 500: "#1fa373", 600: "#0f7a56", 700: "#0c5f45",
          800: "#0a4a37", 900: "#08392b", 950: "#042018",
        },
        gold: {
          50: "#fdf9ec", 100: "#faf0c9", 200: "#f4dd8e", 300: "#eec455",
          400: "#e8ab30", 500: "#d18f1e", 600: "#b06f16", 700: "#8c5215",
          800: "#734317", 900: "#623918", 950: "#391d0a",
        },
        mehendi: { DEFAULT: "#4a7c3f", light: "#7fae5f" },
        haldi: { DEFAULT: "#e8ab30", light: "#f4cc6b" },
        nikah: { DEFAULT: "#0f7a56", light: "#d18f1e" },
        reception: { DEFAULT: "#c9a44d", light: "#e8d9b5" },
        ivory: "#fffdf7",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.25rem",
        "2xl": "1.75rem",
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(15, 122, 86, 0.08)",
        "soft-lg": "0 8px 40px -8px rgba(15, 122, 86, 0.15)",
        "gold-glow": "0 0 0 1px rgba(209, 143, 30, 0.35), 0 8px 24px -8px rgba(209, 143, 30, 0.35)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-glow": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backgroundImage: {
        "emerald-gold": "linear-gradient(135deg, #0f7a56 0%, #1fa373 45%, #d18f1e 100%)",
        "mehendi-gradient": "linear-gradient(135deg, #2d4a24 0%, #4a7c3f 55%, #7fae5f 100%)",
        "haldi-gradient": "linear-gradient(135deg, #b06f16 0%, #e8ab30 55%, #f4dd8e 100%)",
        "nikah-gradient": "linear-gradient(135deg, #0a4a37 0%, #0f7a56 50%, #d18f1e 100%)",
        "reception-gradient": "linear-gradient(135deg, #8c5215 0%, #c9a44d 55%, #e8d9b5 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
