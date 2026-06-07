import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dcecff",
          200: "#b8d9ff",
          300: "#85beff",
          400: "#4a98ff",
          500: "#1f6fff",
          600: "#1455e0",
          700: "#113fb3",
          800: "#0f2f85",
          900: "#0d2466"
        }
      },
      borderRadius: {
        xl: "0.9rem"
      }
    }
  },
  plugins: []
};

export default config;
