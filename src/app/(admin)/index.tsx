import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Header from '../../components/Header';
import { ScaledText as Text } from '../../components/ScaledText';
import { useTheme } from '../../theme/ThemeContext';

const SECTIONS: { href: string; label: string; desc: string }[] = [
  { href: '/(admin)/schedule', label: 'Orientation Schedule', desc: 'The timetable first-years follow' },
  { href: '/(admin)/announcements', label: 'Announcements', desc: 'Manage posted announcements' },
  { href: '/(admin)/faqs', label: 'FAQs', desc: 'Write answers and choose which ones students can see' },
  { href: '/(admin)/contacts', label: 'Contacts', desc: 'Manage the student support directory' },
  { href: '/(admin)/venue', label: 'Venue Information', desc: 'Edit venue details' },
  { href: '/(admin)/checklist', label: 'Checklist', desc: 'Organise tasks students need to complete' },
  { href: '/(admin)/support', label: 'Support Pathways', desc: 'Update the "I need help with..." options' },
  { href: '/(admin)/shuttle', label: 'Shuttle Times', desc: 'Morning, afternoon and night departures' },
  { href: '/(admin)/events', label: 'Campus Events', desc: 'What is on around campus, open to everyone' },
  { href: '/(admin)/sport', label: 'Sport & Gym', desc: 'Clubs, facilities and gym sign-up' },
  { href: '/(admin)/programmes', label: 'Programmes', desc: 'School of IT programmes and advisors' },
  { href: '/(admin)/digital', label: 'Digital Readiness', desc: 'Guides and their steps: computer skills, Funda, printing, Wi-Fi' },
  { href: '/(admin)/tribes', label: 'Tribes', desc: 'Create mentor groups for first-years' },
  { href: '/(admin)/buddies', label: 'Buddies', desc: 'Place FYS buddies in tribes' },
  { href: '/(admin)/faq-suggestions', label: 'FAQ Suggestions', desc: 'Questions buddies keep hearing' },
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
