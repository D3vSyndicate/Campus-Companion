import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { AuthGate } from '../../components/AuthGate';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const TAB_ICON_SIZE = 22;

// The FYS buddy (mentor) app. Main tabs are the things a buddy reaches for mid-conversation; the
// rest open from the Home screen.
export default function MentorLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <AuthGate requiredRole="mentor">
      <Tabs
        // Back returns to the screen you were just on. The default jumps to the first tab (Home) from every
        // screen that is not in the tab bar, such as the mentor groups.
        backBehavior="history"
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
            title: t('common.home'),
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="faqs"
          options={{
            title: t('buddy.tabAnswers'),
            tabBarIcon: ({ color }) => <Ionicons name="help-circle-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tribe"
          options={{
            title: t('common.tribe'),
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="refer"
          options={{
            title: t('buddy.tabRefer'),
            tabBarIcon: ({ color }) => <Ionicons name="hand-left-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile.tab'),
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />

        {/* Opened from Home */}
        <Tabs.Screen name="announcements" options={{ href: null, title: t('buddy.actions.announcements.title') }} />
        <Tabs.Screen name="schedule" options={{ href: null, title: t('common.schedule') }} />
        <Tabs.Screen name="venues" options={{ href: null, title: t('buddy.tabVenues') }} />
        <Tabs.Screen name="map" options={{ href: null, title: t('buddy.actions.map.title') }} />
        <Tabs.Screen name="search" options={{ href: null, title: t('buddy.actions.search.title') }} />
        <Tabs.Screen name="guide" options={{ href: null, title: t('buddy.actions.guide.title') }} />
        <Tabs.Screen name="emergency" options={{ href: null, title: t('emergency.title') }} />
        <Tabs.Screen name="mentorGroup/index" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/create" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/group" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/index" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/edit" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/members" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/qr" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/request" options={{ href: null, title: t('common.tribe') }} />
        <Tabs.Screen name="mentorGroup/[id]/broadcast" options={{ href: null, title: t('common.tribe') }} />
      </Tabs>
    </AuthGate>
  );
}
