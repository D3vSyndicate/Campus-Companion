import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { ContactItem } from '../../types';

export default function ContactsScreen() {
  const { colors } = useTheme();
  const palette = {
    pageBg: colors.background,
    cardBg: colors.surface,
    border: colors.border,
    heading: colors.text,
    name: colors.text,
    role: colors.textSecondary,
    body: colors.textSecondary,
    accent: colors.accent,
  };

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      const { data, error } = await fetchWithOfflineFallback('contacts');
      if (error) {
        console.error('Failed to load contacts from Supabase.', error);
      }

      const mappedContacts = Array.isArray(data) && data.length
        ? data.map((row, index) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? item.contact_id ?? index + 1),
              name: String(item.name ?? item.title ?? ''),
              role: String(item.role ?? ''),
              email: String(item.email ?? ''),
              office: String(item.office ?? item.location ?? ''),
              supportType: String(item.support_type ?? item.supportType ?? item.description ?? ''),
            };
          })
        : [];

      setContacts(mappedContacts);
      setLoading(false);
    };

    void loadContacts();
  }, []);

  const openEmail = async (contact: ContactItem) => {
    await Linking.openURL(`mailto:${contact.email}`);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.pageBg }]} contentContainerStyle={[styles.content, { backgroundColor: palette.pageBg }]}>
      <PageHeader
        eyebrow="YOU ARE NOT ON YOUR OWN"
        title="People who can help"
        subtitle="Reach out early for questions, practical support, and a quick reset when university feels like a lot."
      />

      <ShameResilientBanner
        message="You do not need to have the perfect words before asking for help. A simple 'I am stuck' is enough."
        type="info"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : contacts.map(contact => {
        const isExpanded = selectedContact === contact.id;
        return (
          <View key={contact.id} style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.border }]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setSelectedContact(isExpanded ? null : contact.id)}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                  <Text style={[styles.avatarText, { color: colors.text }]}>{contact.name.charAt(0)}</Text>
                </View>
                <View style={styles.cardHeading}>
                  <Text style={[styles.name, { color: palette.name }]}>{contact.name}</Text>
                  <Text style={[styles.role, { color: palette.role }]}>{contact.role}</Text>
                </View>
                <Text style={[styles.chevron, { color: colors.text }]}>{isExpanded ? '−' : '+'}</Text>
              </View>
              <Text style={[styles.supportType, { color: palette.body }]}>{contact.supportType}</Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={[styles.details, { borderTopColor: colors.border }]}>
                <Text style={[styles.detail, { color: palette.body }]}>Office: {contact.office}</Text>
                <Text style={[styles.detail, { color: palette.body }]}>Email: {contact.email}</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => void openEmail(contact)}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>Email this team</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardHeading: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  role: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 24, fontWeight: '400' },
  supportType: { fontSize: 13, lineHeight: 19, marginTop: 14 },
  details: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  detail: { fontSize: 13, marginBottom: 6 },
  button: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginTop: 6 },
  buttonText: { fontSize: 13, fontWeight: '700' },
});
