
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import { ScaledText as Text } from '../../components/ScaledText';
import { useTheme } from '../../theme/ThemeContext';

const SECTIONS: { href: string; label: string; desc: string }[] = [
  { href: '/(admin)/schedule', label: 'Schedule Items', desc: 'Add, edit and remove schedule entries' },
  { href: '/(admin)/contacts', label: 'Contacts', desc: 'Manage the student support directory' },
  { href: '/(admin)/profile', label: 'Profile & Settings', desc: 'Manage your account and preferences' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Header title="Admin" />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Welcome Card */}
        <View
          style={[
            styles.welcomeCard,
            {
              backgroundColor: colors.headerBackground,
            },
          ]}
        >
          <Text
            style={[
              styles.greeting,
              { color: colors.accent },
            ]}
          >
            Welcome back
          </Text>

          <Text
            style={[
              styles.welcomeTitle,
              { color: colors.headerText },
            ]}
          >
            Campus Companion
          </Text>

          <Text
            style={[
              styles.welcomeDescription,
              { color: colors.headerText },
            ]}
          >
            Manage your campus orientation information, schedules,
            contacts, announcements, and FAQs from one place.
          </Text>
        </View>

        {/* Admin Sections */}
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.href}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push(section.href as any)}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text },
              ]}
            >
              {section.label}
            </Text>

            <Text
              style={[
                styles.cardDesc,
                { color: colors.textSecondary },
              ]}
            >
              {section.desc}
            </Text>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  // Welcome Card
  welcomeCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },

  greeting: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },

  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },

  welcomeDescription: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.85,
  },

  // Section Cards
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  cardDesc: {
    fontSize: 13,
    marginTop: 4,
  },
});

