import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as NativeSplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import SplashScreen from '../components/splash-scrren';
import { AppearanceProvider, useAppearance } from '../context/AppearanceContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider as AppThemeProvider } from '../theme/ThemeContext';
import '../i18n';

void NativeSplashScreen.preventAutoHideAsync();

function AppThemeShell() {
  const { darkMode } = useAppearance();
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      {showCustomSplash ? <SplashScreen onFinish={() => setShowCustomSplash(false)} /> : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(coordinator)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <AppThemeProvider>
          <ToastProvider>
            <AppThemeShell />
          </ToastProvider>
        </AppThemeProvider>
      </AppearanceProvider>
    </AuthProvider>
  );
}
