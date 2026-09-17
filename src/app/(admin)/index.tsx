import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import Header from '../../components/Header';

// Simple entry point — no tab bar. Each card pushes into that section's own
// route (list -> form). Add a card + route folder here as you build the
// next section (announcements, faqs, contacts, venue).

const SECTIONS: { href: string; label: string; desc: string }[] = [
  { href: '/schedule', label: 'Schedule Items', desc: 'Add, edit and remove schedule entries' },
  { href: '/announcements', label: 'Announcements', desc: 'Manage posted announcements' },
  { href: '/faqs', label: 'FAQs', desc: 'Control which FAQs are visible' },
  { href: '/contacts', label: 'Contacts', desc: 'Manage contact directory' },
  { href: '/venue', label: 'Venue Information', desc: 'Edit venue details' },
];

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Admin" />
      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.href}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push(section.href as any)}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>{section.label}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{section.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  cardDesc: { fontSize: 13, marginTop: 4 },
});
