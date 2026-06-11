/**
 * Email brand palette — matches apps/web/styles/tokens.css (light mode).
 * Emails are always rendered light; use these constants instead of hardcoded hex in templates.
 */
export const EMAIL_COLORS = {
  primary: "#0d9488",
  primaryHover: "#0f766e",
  primaryLight: "#ccfbf1",
  secondary: "#1e3a5f",
  bg: "#f8fafb",
  surface: "#ffffff",
  surfaceAlt: "#f1f5f9",
  textPrimary: "#1a202c",
  textSecondary: "#4a5568",
  textMuted: "#718096",
  textOnPrimary: "#ffffff",
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
  border: "#e2e8f0"
} as const;
