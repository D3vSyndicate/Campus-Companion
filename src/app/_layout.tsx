import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '../context/AuthContext';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppearanceProvider, useAppearance } from '../context/AppearanceContext';
import { ToastProvider } from '../context/ToastContext';

SplashScreen.preventAutoHideAsync();

function AppThemeShell() {
  const { darkMode } = useAppearance();

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(student)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
<<<<<<< HEAD
    <AppearanceProvider>
      <ToastProvider>
        <AppThemeShell />
      </ToastProvider>
    </AppearanceProvider>
=======
    <AuthProvider>
      <AppearanceProvider>
        <AppThemeShell />
      </AppearanceProvider>
    </AuthProvider>
>>>>>>> 0720c1202f0168b90c49af8ad3c50360ed8f9933
  );
}
