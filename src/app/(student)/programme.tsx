import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type ProgrammeItem = { id: string; title: string; content: string };
type HodContact = { id: string; name: string; role: string; email: string; phone: string };

export default function StudentProgrammeScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<ProgrammeItem[]>([]);
  const [contacts, setContacts] = useState<HodContact[]>([]);
  useEffect(() => {
    const load = async () => {
      const [programmeResult, contactResult] = await Promise.all([
        supabase.from('hod_programme_content').select('id, title, content').order('created_at', { ascending: true }),
        supabase.from('hod_contacts').select('id, name, role, email, phone').order('name', { ascending: true }),
      ]);
      setItems((programmeResult.data ?? []) as ProgrammeItem[]);
      setContacts((contactResult.data ?? []) as HodContact[]);
    };
    void load();
  }, []);
  return <FlatList data={items} keyExtractor={(item) => item.id} style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} ListHeaderComponent={<View><Text style={[styles.heading, { color: colors.text }]}>Programme information</Text><Text style={[styles.description, { color: colors.textSecondary }]}>Guidance and expectations from your department.</Text></View>} ListFooterComponent={<View><Text style={[styles.supportHeading, { color: colors.text }]}>Department support</Text>{contacts.length === 0 ? <Text style={[styles.empty, { color: colors.textSecondary }]}>No department support contacts have been published yet.</Text> : contacts.map((contact) => <View key={contact.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.title, { color: colors.text }]}>{contact.name}</Text><Text style={[styles.body, { color: colors.textSecondary }]}>{contact.role || 'Department support'}{`\n`}{contact.email}{contact.phone ? `\n${contact.phone}` : ''}</Text></View>)}</View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>Your department has not published programme information yet.</Text>} renderItem={({ item }) => <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.title, { color: colors.text }]}>{item.title}</Text><Text style={[styles.body, { color: colors.textSecondary }]}>{item.content}</Text></View>} />;
}

const styles = StyleSheet.create({ content: { padding: 16, paddingBottom: 32 }, heading: { fontSize: 24, fontWeight: '800', marginBottom: 6 }, description: { fontSize: 14, lineHeight: 20, marginBottom: 18 }, supportHeading: { fontSize: 19, fontWeight: '800', marginTop: 12, marginBottom: 10 }, item: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 10 }, title: { fontSize: 16, fontWeight: '800' }, body: { fontSize: 14, lineHeight: 20, marginTop: 6 }, empty: { textAlign: 'center', marginTop: 20 },
});
