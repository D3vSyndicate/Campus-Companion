import { Stack } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { ThemeProvider } from '../../theme/ThemeContext';

export default function HodLayout() {
  return (
    <AuthGate requiredRole="hod">
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile & Settings' }} />
          <Stack.Screen name="programme" />
          <Stack.Screen name="assignments" />
          <Stack.Screen name="contacts" />
        </Stack>
      </ThemeProvider>
    </AuthGate>
  );
}
