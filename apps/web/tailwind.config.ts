import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)"
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          soft: "var(--color-secondary-soft)"
        },
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          alt: "var(--color-surface-alt)"
        },
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        success: {
          DEFAULT: "var(--color-success)",
          bg: "var(--color-success-bg)",
          border: "var(--color-success-border)"
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          bg: "var(--color-warning-bg)",
          border: "var(--color-warning-border)"
        },
        error: {
          DEFAULT: "var(--color-error)",
          bg: "var(--color-error-bg)",
          border: "var(--color-error-border)"
        },
        info: {
          DEFAULT: "var(--color-info)",
          bg: "var(--color-info-bg)",
          border: "var(--color-info-border)"
        },
        border: {
          DEFAULT: "var(--color-border)",
          focus: "var(--color-border-focus)"
        },
        nav: {
          bg: "var(--color-nav-bg)",
          active: "var(--color-nav-active)",
          inactive: "var(--color-nav-inactive)",
          border: "var(--color-nav-border)"
        },
        brand: {
          50: "var(--color-primary-light)",
          100: "var(--color-primary-light)",
          200: "color-mix(in srgb, var(--color-primary) 35%, var(--color-surface))",
          300: "color-mix(in srgb, var(--color-primary) 55%, var(--color-surface))",
          400: "color-mix(in srgb, var(--color-primary) 75%, var(--color-surface))",
          500: "var(--color-primary)",
          600: "var(--color-primary-hover)",
          700: "var(--color-primary-hover)",
          800: "var(--color-secondary)",
          900: "var(--color-secondary)"
        },
        navy: {
          50: "var(--color-surface-alt)",
          100: "var(--color-surface-alt)",
          200: "var(--color-border)",
          300: "color-mix(in srgb, var(--color-secondary) 25%, var(--color-surface))",
          400: "color-mix(in srgb, var(--color-secondary) 45%, var(--color-surface))",
          500: "var(--color-secondary-soft)",
          600: "var(--color-secondary-soft)",
          700: "var(--color-secondary)",
          800: "var(--color-secondary)",
          900: "var(--color-text-primary)"
        },
        slate: {
          50: "var(--color-bg)",
          100: "var(--color-surface-alt)",
          200: "var(--color-border)",
          300: "var(--color-border)",
          400: "var(--color-text-muted)",
          500: "var(--color-text-muted)",
          600: "var(--color-text-secondary)",
          700: "var(--color-text-secondary)",
          800: "var(--color-text-primary)",
          900: "var(--color-text-primary)"
        },
        "on-primary": "#ffffff",
        emerald: {
          50: "var(--color-success-bg)",
          100: "var(--color-success-bg)",
          200: "var(--color-success-border)",
          300: "var(--color-success-border)",
          400: "var(--color-success)",
          500: "var(--color-success)",
          600: "var(--color-success)",
          700: "var(--color-success)",
          800: "var(--color-success)",
          900: "var(--color-success)"
        },
        rose: {
          50: "var(--color-error-bg)",
          100: "var(--color-error-bg)",
          200: "var(--color-error-border)",
          300: "var(--color-error-border)",
          400: "var(--color-error)",
          500: "var(--color-error)",
          600: "var(--color-error)",
          700: "var(--color-error)",
          800: "var(--color-error)",
          900: "var(--color-error)"
        },
        amber: {
          50: "var(--color-warning-bg)",
          100: "var(--color-warning-bg)",
          200: "var(--color-warning-border)",
          300: "var(--color-warning-border)",
          400: "var(--color-warning)",
          500: "var(--color-warning)",
          600: "var(--color-warning)",
          700: "var(--color-warning)",
          800: "var(--color-warning)",
          900: "var(--color-warning)"
        }
      },
      borderRadius: {
        xl: "0.9rem"
      },
      fontSize: {
        base: ["16px", { lineHeight: "1.6" }],
        sm: ["14px", { lineHeight: "1.5" }],
        xs: ["12px", { lineHeight: "1.4" }]
      }
    }
  },
  plugins: []
};

export default config;
