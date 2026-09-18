import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppearanceProvider, useAppearance } from '../context/AppearanceContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider as AppThemeProvider } from '../theme/ThemeContext';
import '../i18n';

SplashScreen.preventAutoHideAsync();

function AppThemeShell() {
  const { darkMode } = useAppearance();

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
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
