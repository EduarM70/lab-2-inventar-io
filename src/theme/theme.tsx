import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AppColors, darkColors, lightColors } from './colors';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeMode;

export interface AppTheme {
  colors: AppColors;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const AppThemeContext = createContext<AppTheme | undefined>(undefined);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');

  const mode: ThemeMode =
    preference === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<AppTheme>(
    () => ({
      colors: mode === 'dark' ? darkColors : lightColors,
      mode,
      preference,
      setPreference,
    }),
    [mode, preference],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);

  if (!theme) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return theme;
}
