import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Empire Marine AI — chartplotter palette
        abyss: "#060D14", // app background
        deep: "#0B1A26", // section background
        hull: "#11283A", // card surface
        ridge: "#1B3B52", // elevated surface / borders
        foam: "#E9F4F6", // primary text
        mist: "#8FA9B8", // secondary text
        sonar: {
          DEFAULT: "#2DE0BE", // primary accent (sea-glass teal)
          dim: "#1A8A77",
          glow: "rgba(45, 224, 190, 0.18)",
        },
        risk: {
          green: "#34D399",
          yellow: "#FBBF24",
          red: "#F87171",
        },
      },
      fontFamily: {
        display: ["var(--font-saira)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        instrument: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(2, 8, 14, 0.55)",
        sonar: "0 0 24px rgba(45, 224, 190, 0.25)",
      },
      backgroundImage: {
        "ocean-fade":
          "radial-gradient(120% 90% at 50% 0%, #11283A 0%, #0B1A26 45%, #060D14 100%)",
        "card-sheen":
          "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 40%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-sonar": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(45,224,190,0.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(45,224,190,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "pulse-sonar": "pulse-sonar 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
