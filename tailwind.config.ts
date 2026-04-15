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
        // Paleta principal de Newsoft Sales
        navy: {
          DEFAULT: "#1B2A4A",
          50: "#EEF1F7",
          100: "#D4DCF0",
          200: "#A9B9E1",
          300: "#7E96D2",
          400: "#5373C3",
          500: "#3355AA",
          600: "#2A4489",
          700: "#1B2A4A", // primary
          800: "#131F38",
          900: "#0B1422",
        },
        orange: {
          DEFAULT: "#E8751A",
          50: "#FEF3E8",
          100: "#FDE0C4",
          200: "#FBC189",
          300: "#F9A24E",
          400: "#F08325",
          500: "#E8751A", // accent
          600: "#C4611A",
          700: "#9A4D18",
          800: "#713914",
          900: "#482410",
        },
        surface: {
          DEFAULT: "#F5F7FA",
          card: "#FFFFFF",
          border: "#D0D5DD",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
