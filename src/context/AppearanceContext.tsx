import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type AppearanceContextType = {
  darkMode: boolean;
  userOverride: boolean | null;
  toggleDarkMode: () => void;
  setDarkModeOverride: (value: boolean | null) => void;
  fontScale: number;
  changeFontScale: (scale: number) => void;
};

const AppearanceContext = createContext<AppearanceContextType | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [userOverride, setUserOverride] = useState<boolean | null>(null);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem('themeOverride').then(v => {
      if (v === 'light' || v === 'dark') {
        setUserOverride(v === 'dark');
      } else {
        setUserOverride(null);
      }
    });

    AsyncStorage.getItem('fontScale').then(v => {
      if (v !== null) {
        setFontScale(Number(v));
      }
    });
  }, []);

  const darkMode = userOverride === null ? systemScheme === 'dark' : userOverride;

  const setDarkModeOverride = (value: boolean | null) => {
    setUserOverride(value);
    if (value === null) {
      AsyncStorage.removeItem('themeOverride');
      return;
    }
    AsyncStorage.setItem('themeOverride', value ? 'dark' : 'light');
  };

  const toggleDarkMode = () => {
    const nextValue = !darkMode;
    setDarkModeOverride(nextValue);
  };

  const changeFontScale = (scale: number) => {
    setFontScale(scale);
    AsyncStorage.setItem('fontScale', String(scale));
  };

  const value: AppearanceContextType = {
    darkMode,
    userOverride,
    toggleDarkMode,
    setDarkModeOverride,
    fontScale,
    changeFontScale,
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}