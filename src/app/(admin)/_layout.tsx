import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { EnglishOnly } from '../../i18n/EnglishOnly';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';

const TAB_ICON_SIZE = 22;

// The tab bar holds the four things that are handled every day: the schedule, announcements, FAQs and
// contacts. Everything else is reached from Home and keeps the tab bar in view.
function AdminTabs() {
  const { colors } = useTheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color }) => <Ionicons name="megaphone-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="faqs"
        options={{
          title: 'FAQs',
          tabBarIcon: ({ color }) => <Ionicons name="help-circle-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen name="venue" options={{ href: null, title: 'Venues' }} />
      <Tabs.Screen name="checklist" options={{ href: null, title: 'Checklist' }} />
      <Tabs.Screen name="support" options={{ href: null, title: 'Support' }} />
      <Tabs.Screen name="digital" options={{ href: null, title: 'Digital Readiness' }} />
      <Tabs.Screen name="events" options={{ href: null, title: 'Campus Events' }} />
      <Tabs.Screen name="tribes" options={{ href: null, title: 'Tribes' }} />
      <Tabs.Screen name="buddies" options={{ href: null, title: 'Buddies' }} />
      <Tabs.Screen name="faq-suggestions" options={{ href: null, title: 'FAQ Suggestions' }} />
      <Tabs.Screen name="emergency" options={{ href: null, title: 'Emergency Contacts' }} />
    </Tabs>
  );
}

export default function AdminLayout() {
  return (
    <AuthGate requiredRole="admin">
      <EnglishOnly>
        <ThemeProvider>
          <AdminTabs />
        </ThemeProvider>
      </EnglishOnly>
    </AuthGate>
  );
}
