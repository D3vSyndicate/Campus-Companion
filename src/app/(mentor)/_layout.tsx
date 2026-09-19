import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { useTheme } from '../../theme/ThemeContext';

const TAB_ICON_SIZE = 22;

// The FYS buddy (mentor) app. Main tabs are the things a buddy reaches for mid-conversation; the
// rest open from the Home screen.
export default function MentorLayout() {
  const { colors } = useTheme();

  return (
    <AuthGate requiredRole="mentor">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 68,
            paddingTop: 6,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="faqs"
          options={{
            title: 'Answers',
            tabBarIcon: ({ color }) => <Ionicons name="help-circle-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tribe"
          options={{
            title: 'Tribe',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="refer"
          options={{
            title: 'Refer',
            tabBarIcon: ({ color }) => <Ionicons name="hand-left-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />

        {/* Opened from Home */}
        <Tabs.Screen name="announcements" options={{ href: null, title: 'Announcements' }} />
        <Tabs.Screen name="schedule" options={{ href: null, title: 'Schedule' }} />
        <Tabs.Screen name="venues" options={{ href: null, title: 'Venues' }} />
        <Tabs.Screen name="map" options={{ href: null, title: 'Campus map' }} />
        <Tabs.Screen name="search" options={{ href: null, title: 'Search' }} />
        <Tabs.Screen name="guide" options={{ href: null, title: 'Buddy guide' }} />
      </Tabs>
    </AuthGate>
  );
}
