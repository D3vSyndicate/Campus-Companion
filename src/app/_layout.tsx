<<<<<<< HEAD
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppearanceProvider, useAppearance } from '../context/AppearanceContext';

SplashScreen.preventAutoHideAsync();

function AppThemeShell() {
  const { darkMode } = useAppearance();

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
=======
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';

import { useState } from 'react';
import { useColorScheme } from 'react-native';

import CampusSplashScreen from '@/components/splash-scrren';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const colorScheme = useColorScheme();

  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = async () => {
    setShowSplash(false);

    await SplashScreen.hideAsync();
  };

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >

      {/* Your existing app navigation */}
>>>>>>> 4e62bca90f72d0e94a1ad24291510765895f8806
      <Stack screenOptions={{ headerShown: false }}>

        <Stack.Screen
          name="(student)"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="(admin)"
          options={{ headerShown: false }}
        />

      </Stack>


      {/* Custom Campus Companion Splash Screen */}
      {showSplash && (
        <CampusSplashScreen
          onFinish={handleSplashFinish}
        />
      )}

    </ThemeProvider>
  );
<<<<<<< HEAD
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <AppThemeShell />
    </AppearanceProvider>
  );
}
=======
}
>>>>>>> 4e62bca90f72d0e94a1ad24291510765895f8806
