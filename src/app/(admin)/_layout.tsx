import { Stack } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { ContactsProvider } from '../../context/ContactsContext';
import { ScheduleProvider } from '../../context/ScheduleContext';
import { ThemeProvider } from '../../theme/ThemeContext';


function AdminStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="profile"
        options={{ title: 'Profile & Settings' }}
      />

      <Stack.Screen
        name="schedule/index"
        options={{ title: 'Schedule Items' }}
      />

      <Stack.Screen
        name="schedule/new"
        options={{ title: 'New Item' }}
      />

      <Stack.Screen
        name="schedule/[id]"
        options={{ title: 'Edit Item' }}
      />

      <Stack.Screen
        name="contacts/index"
        options={{ title: 'Contacts' }}
      />

      <Stack.Screen
        name="contacts/new"
        options={{ title: 'New Contact' }}
      />

      <Stack.Screen
        name="contacts/[id]"
        options={{ title: 'Edit Contact' }}
      />
    </Stack>
  );
}
export default function AdminLayout() {
  return (
    <AuthGate>
      <ThemeProvider>
        <ScheduleProvider>
          <ContactsProvider>
            <AdminStack />
          </ContactsProvider>
        </ScheduleProvider>
      </ThemeProvider>
    </AuthGate>
  );
}