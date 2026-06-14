import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { themeColors, type ColorMode, type ColorTokens } from '../theme/colors';

interface ThemeContextValue {
  isDark: boolean;
  mode: ColorMode;
  colors: ColorTokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const mode: ColorMode = isDark ? 'dark' : 'light';
  const currentColors = themeColors[mode];

  const value = useMemo(
    () => ({ isDark, mode, colors: currentColors }),
    [isDark, mode, currentColors],
  );

  return (
    <ThemeContext.Provider value={value}>
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
