import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useAppearance } from '../context/AppearanceContext';
import { darkColors, lightColors, ThemeColors } from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedScheme: 'light' | 'dark';
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { darkMode, userOverride, setDarkModeOverride } = useAppearance();
  const mode: ThemeMode =
    userOverride === null ? 'system' : userOverride ? 'dark' : 'light';

  const resolvedScheme: 'light' | 'dark' = darkMode ? 'dark' : 'light';
  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setMode = (nextMode: ThemeMode) => {
    setDarkModeOverride(
      nextMode === 'system' ? null : nextMode === 'dark',
    );
  };

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedScheme,
      colors,
      isDark: resolvedScheme === 'dark',
    }),
    [mode, resolvedScheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
