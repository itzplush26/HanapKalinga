export const THEME_STORAGE_KEY = "nurselink-theme";

export type ThemePreference = "light" | "dark";

export function getStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
}

export function resolveTheme(): ThemePreference {
  const stored = getStoredTheme();
  if (stored) return stored;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: ThemePreference) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: ThemePreference) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}
