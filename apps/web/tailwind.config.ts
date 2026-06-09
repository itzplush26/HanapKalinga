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
          50: "#ecf8f6",
          100: "#d0efe9",
          200: "#a3dfd4",
          300: "#6ec9b9",
          400: "#3aad9a",
          500: "#0D7C6E",
          600: "#0b6a5e",
          700: "#09574d",
          800: "#07443c",
          900: "#05312b"
        },
        navy: {
          50: "#e8edf3",
          100: "#c5d0de",
          200: "#8fa3bd",
          300: "#5a769c",
          400: "#2d4f7b",
          500: "#0B1F3A",
          600: "#091a31",
          700: "#071528",
          800: "#05101f",
          900: "#030b16"
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
