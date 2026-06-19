import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors, type ColorTokens } from '../theme/colors';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  isDark: boolean;
  colors: ColorTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: async () => {},
  toggleTheme: async () => {},
  isDark: false,
  colors: themeColors.light,
});

  const value = useMemo(
    () => ({ isDark, mode, colors: currentColors }),
    [isDark, mode, currentColors],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark', colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
