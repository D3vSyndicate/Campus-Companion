import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { MOCK_CONTACTS } from '../../mockData';
import { ContactItem } from '../../types';
import { supabase } from '../lib/superbase';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      const { data, error } = await supabase.from('Contact').select('*');

      if (!error && data?.length) {
        setContacts(data.map((row, index) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.id ?? item.contact_id ?? index + 1),
            name: String(item.name ?? item.title ?? ''),
            role: String(item.role ?? ''),
            email: String(item.email ?? ''),
            office: String(item.office ?? item.location ?? ''),
            supportType: String(item.support_type ?? item.supportType ?? item.description ?? ''),
          };
        }));
      } else {
        setContacts(MOCK_CONTACTS);
      }

      setLoading(false);
    };

    void loadContacts();
  }, []);

  const openEmail = async (contact: ContactItem) => {
    await Linking.openURL(`mailto:${contact.email}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        <ActivityIndicator size="large" color="#0B1F3A" />
      ) : contacts.map(contact => {
        const isExpanded = selectedContact === contact.id;
        return (
          <View key={contact.id} style={styles.card}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setSelectedContact(isExpanded ? null : contact.id)}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
                </View>
                <View style={styles.cardHeading}>
                  <Text style={styles.name}>{contact.name}</Text>
                  <Text style={styles.role}>{contact.role}</Text>
                </View>
                <Text style={styles.chevron}>{isExpanded ? '−' : '+'}</Text>
              </View>
              <Text style={styles.supportType}>{contact.supportType}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.details}>
                <Text style={styles.detail}>Office: {contact.office}</Text>
                <Text style={styles.detail}>Email: {contact.email}</Text>
                <TouchableOpacity style={styles.button} onPress={() => void openEmail(contact)}>
                  <Text style={styles.buttonText}>Email this team</Text>
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
  container: { flex: 1, backgroundColor: '#F4F6F9' },
  content: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF8D9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#0B1F3A', fontSize: 18, fontWeight: '800' },
  cardHeading: { flex: 1 },
  name: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  role: { color: '#64748B', fontSize: 12, marginTop: 2 },
  chevron: { color: '#0B1F3A', fontSize: 24, fontWeight: '400' },
  supportType: { color: '#334155', fontSize: 13, lineHeight: 19, marginTop: 14 },
  details: { borderTopColor: '#E2E8F0', borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  detail: { color: '#475569', fontSize: 13, marginBottom: 6 },
  button: { alignSelf: 'flex-start', backgroundColor: '#0B1F3A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, marginTop: 6 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
