import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AuthGate } from '../../components/AuthGate';
import { useTheme } from '../../theme/ThemeContext';

const TAB_ICON_SIZE = 22;

export default function StudentLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <AuthGate requiredRole="student">
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
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('common.home'),
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: t('common.schedule'),
            tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="checklist"
          options={{
            href: null,
            title: t('common.checklist'),
            tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="digital"
          options={{
            title: t('common.digital'),
            tabBarIcon: ({ color }) => <Ionicons name="laptop-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="faqs"
          options={{
            href: null,
            title: t('common.faqs'),
            tabBarIcon: ({ color }) => <Ionicons name="help-circle-outline" size={TAB_ICON_SIZE} color={color} />,
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: t('common.support'),
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
      </Tabs>
    </AuthGate>
  );
}