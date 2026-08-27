import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { light, dark, type ThemePalette } from './theme';

interface ThemeContextValue {
  palette: ThemePalette;
  isDark: boolean;
  colorScheme: 'light' | 'dark' | undefined;
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({
      palette: isDark ? dark : light,
      isDark,
      colorScheme,
      setColorScheme,
    }),
    [isDark, colorScheme, setColorScheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
