
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import { ScaledText as Text } from '../../components/ScaledText';
import { useTheme } from '../../theme/ThemeContext';

const SECTIONS: { href: string; label: string; desc: string }[] = [
  { href: '/(admin)/schedule', label: 'Schedule Items', desc: 'Add, edit and remove schedule entries' },
  { href: '/(admin)/announcements', label: 'Announcements', desc: 'Manage posted announcements' },
  { href: '/(admin)/faqs', label: 'FAQs', desc: 'Answers grouped by category' },
  { href: '/(admin)/contacts', label: 'Contacts', desc: 'Manage the student support directory' },
  { href: '/(admin)/venue', label: 'Venue Information', desc: 'Edit venue details' },
  { href: '/(admin)/checklist', label: 'Checklist', desc: 'Organise tasks students need to complete' },
  { href: '/(admin)/support', label: 'Support Pathways', desc: 'Update the "I need help with..." options' },
  { href: '/(admin)/shuttle', label: 'Shuttle Times', desc: 'Morning, afternoon and night departures' },
  { href: '/(admin)/digital', label: 'Digital Readiness Modules', desc: 'Tutorial topics: computer skills, Funda, printing, Wi-Fi' },
  { href: '/(admin)/digital-steps', label: 'Digital Readiness Steps', desc: 'Step-by-step guides with images and videos' },
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

