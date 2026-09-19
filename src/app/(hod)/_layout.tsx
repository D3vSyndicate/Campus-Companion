import { Stack } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { ThemeProvider } from '../../theme/ThemeContext';

// Every screen in here draws its own header (PageHeader), so the navigator does not add a second one.
// Profile keeps the plain navigation header because it is not a content screen.
export default function HodLayout() {
  return (
    <AuthGate requiredRole="hod">
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile & Settings' }} />
          <Stack.Screen name="programme" />
          <Stack.Screen name="expectations" />
          <Stack.Screen name="resources" />
          <Stack.Screen name="assignments" />
          <Stack.Screen name="contacts" />
        </Stack>
      </ThemeProvider>
    </AuthGate>
  );
}
