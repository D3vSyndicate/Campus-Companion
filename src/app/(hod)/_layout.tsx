import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { EnglishOnly } from '../../i18n/EnglishOnly';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';

const TAB_ICON_SIZE = 22;

function HodTabs() {
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
        name="programme"
        options={{
          title: 'Programme',
          tabBarIcon: ({ color }) => <Ionicons name="school-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color }) => <Ionicons name="library-outline" size={TAB_ICON_SIZE} color={color} />,
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
      <Tabs.Screen name="expectations" options={{ href: null, title: 'Expectations' }} />
      <Tabs.Screen name="assignments" options={{ href: null, title: 'Assignments' }} />
    </Tabs>
  );
}

export default function HodLayout() {
  return (
    <AuthGate requiredRole="hod">
      <EnglishOnly>
        <ThemeProvider>
          <HodTabs />
        </ThemeProvider>
      </EnglishOnly>
    </AuthGate>
  );
}
