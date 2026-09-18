import { Stack } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { HodProvider } from '../../context/HodContext';
import { ThemeProvider } from '../../theme/ThemeContext';

export default function HodLayout() {
  return (
    <AuthGate requiredRole="hod">
      <ThemeProvider>
        <HodProvider>
          <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="programme" options={{ title: 'Programme Information' }} />
            <Stack.Screen name="assignments" options={{ title: 'Assignments' }} />
            <Stack.Screen name="contacts" options={{ title: 'Department Contacts' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile & Settings' }} />
          </Stack>
        </HodProvider>
      </ThemeProvider>
    </AuthGate>
  );
}