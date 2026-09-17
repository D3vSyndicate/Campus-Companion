import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const TAB_ICON_SIZE = 22;

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0B1F3A',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D9E0E8',
          height: 68,
          paddingTop: 6,
        },
        headerShown: false,
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
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="digital"
        options={{
          title: 'Digital',
          tabBarIcon: ({ color }) => <Ionicons name="laptop-outline" size={TAB_ICON_SIZE} color={color} />,
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
          title: 'Support',
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
