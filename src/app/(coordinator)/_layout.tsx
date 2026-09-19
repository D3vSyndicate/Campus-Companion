import { Stack } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { ThemeProvider } from '../../theme/ThemeContext';

// Every screen in here draws its own header (PageHeader), so the navigator does not add a second one.
// Profile keeps the plain navigation header because it is not a content screen.
export default function CoordinatorLayout() {
  return (
    <AuthGate requiredRole="coordinator">
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile & Settings' }} />
          <Stack.Screen name="schedule" />
          <Stack.Screen name="announcements" />
          <Stack.Screen name="faqs" />
          <Stack.Screen name="contacts" />
          <Stack.Screen name="venue" />
          <Stack.Screen name="checklist" />
          <Stack.Screen name="support" />
          <Stack.Screen name="shuttle" />
          <Stack.Screen name="events" />
          <Stack.Screen name="sport" />
          <Stack.Screen name="programmes" />
          <Stack.Screen name="digital" />
          <Stack.Screen name="tribes" />
          <Stack.Screen name="buddies" />
          <Stack.Screen name="faq-suggestions" />
          <Stack.Screen name="activity-log" />
        </Stack>
      </ThemeProvider>
    </AuthGate>
  );
}
