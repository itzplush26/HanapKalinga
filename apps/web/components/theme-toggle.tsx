"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { resolveTheme, setTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const [theme, setThemeState] = useState<ThemePreference>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(resolveTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-alt",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="min-w-0">
        {showLabel ? (
          <>
            <p className="text-sm font-semibold text-text-primary">Appearance</p>
            <p className="text-xs text-text-secondary">
              {mounted ? (isDark ? "Dark mode" : "Light mode") : "Loading…"}
            </p>
          </>
        ) : null}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-primary">
        {mounted ? (
          isDark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />
        ) : (
          <Moon className="h-5 w-5 opacity-50" aria-hidden />
        )}
      </span>
    </button>
  );
}
