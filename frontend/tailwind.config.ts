import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Edible Arrangements official brand colors
        edible: {
          red: "#E10700",
          "red-dark": "#C20600",
          "red-light": "#FF1A0D",
        },
        // Supporting palette
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // Accent colors for variety
        fruit: {
          strawberry: "#E10700",
          orange: "#FF6B35",
          lemon: "#FFD23F",
          kiwi: "#7CB518",
          grape: "#7B2D8E",
          melon: "#FF9F1C",
        },
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        body: ["Poppins", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-in": "slideIn 0.5s ease-out forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        "soft": "0 4px 20px rgba(0, 0, 0, 0.06)",
        "soft-lg": "0 8px 40px rgba(0, 0, 0, 0.08)",
        "red-glow": "0 4px 20px rgba(225, 7, 0, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
