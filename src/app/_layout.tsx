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
}