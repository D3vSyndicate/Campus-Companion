import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type ProgrammeItem = { id: string; title: string; content: string; category: string | null };
type Resource = { id: string; title: string; description: string | null; url: string | null };
type Assignment = { id: string; title: string; description: string | null; due_date: string | null; status: string | null };
type HodContact = { id: string; name: string; role: string | null; email: string; phone: string | null };

// Only ever open web, email and phone links. A link typed without a scheme is treated as a web address.
function safeUrl(raw: string | null) {
  const text = (raw ?? '').trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  return /^(https?|mailto|tel):/i.test(withScheme) ? withScheme : null;
}

// What the head of department publishes: programme information, expectations, support resources and who to contact.
export default function StudentProgrammeScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<ProgrammeItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [contacts, setContacts] = useState<HodContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const [programmeResult, assignmentResult, resourceResult, contactResult] = await Promise.all([
      supabase.from('hod_programme_content').select('id, title, content, category').order('created_at', { ascending: true }),
      supabase.from('hod_assignments').select('id, title, description, due_date, status').order('due_date', { ascending: true }),
      supabase.from('hod_resources').select('id, title, description, url').order('title', { ascending: true }),
      supabase.from('hod_contacts').select('id, name, role, email, phone').order('name', { ascending: true }),
    ]);

    // Say so when the department content could not be loaded, rather than claiming nothing is published.
    setFailed(Boolean(programmeResult.error || assignmentResult.error || resourceResult.error || contactResult.error));
    setItems((programmeResult.data ?? []) as ProgrammeItem[]);
    setAssignments((assignmentResult.data ?? []) as Assignment[]);
    setResources((resourceResult.data ?? []) as Resource[]);
    setContacts((contactResult.data ?? []) as HodContact[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const programmeNotes = items.filter((item) => item.category !== 'expectation');
  const expectations = items.filter((item) => item.category === 'expectation');
  const nothingPublished = items.length === 0 && assignments.length === 0 && resources.length === 0 && contacts.length === 0;

  const openLink = (raw: string | null) => {
    const url = safeUrl(raw);
    if (url) Linking.openURL(url).catch(() => undefined);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />}
    >
      <PageHeader
        eyebrow="YOUR DEPARTMENT"
        title="Programme information"
        subtitle="Programme guidance, what is expected of you, and where to get support."
        showSearch={false}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : (
        <>
          {failed ? (
            <Text style={[styles.error, { color: colors.danger }]}>
              Some department information could not be loaded. Check your connection and pull down to try again.
            </Text>
          ) : null}

          {nothingPublished && !failed ? (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>Your department has not published anything yet. Check back soon.</Text>
          ) : null}

          {programmeNotes.map((item) => (
            <View key={item.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{item.content}</Text>
            </View>
          ))}

          {expectations.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>What is expected of you</Text>
              {expectations.map((item) => (
                <View key={item.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>{item.content}</Text>
                </View>
              ))}
            </>
          ) : null}

          {assignments.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Assignments</Text>
              {assignments.map((assignment) => (
                <View key={assignment.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.title, { color: colors.text }]}>{assignment.title}</Text>
                  <Text style={[styles.meta, { color: colors.accent }]}>
                    {[assignment.due_date ? `Due ${assignment.due_date}` : 'No due date', assignment.status].filter(Boolean).join(' · ')}
                  </Text>
                  {assignment.description ? <Text style={[styles.body, { color: colors.textSecondary }]}>{assignment.description}</Text> : null}
                </View>
              ))}
            </>
          ) : null}

          {resources.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Support resources</Text>
              {resources.map((resource) => {
                const link = safeUrl(resource.url);
                return (
                  <Pressable
                    key={resource.id}
                    disabled={!link}
                    accessibilityRole={link ? 'link' : undefined}
                    onPress={() => openLink(resource.url)}
                    style={({ pressed }) => [styles.item, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.75 }]}
                  >
                    <Text style={[styles.title, { color: colors.text }]}>{resource.title}</Text>
                    {resource.description ? <Text style={[styles.body, { color: colors.textSecondary }]}>{resource.description}</Text> : null}
                    {link ? (
                      <View style={styles.linkRow}>
                        <Ionicons name="open-outline" size={15} color={colors.accent} />
                        <Text style={[styles.meta, { color: colors.accent }]} numberOfLines={1}>Open resource</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </>
          ) : null}

          {contacts.length > 0 ? (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Department support</Text>
              {contacts.map((contact) => (
                <View key={contact.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.title, { color: colors.text }]}>{contact.name}</Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>
                    {contact.role || 'Department support'}
                    {`\n`}
                    {contact.email}
                    {contact.phone ? `\n${contact.phone}` : ''}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  loader: { marginTop: 24 },
  sectionHeading: { fontSize: 19, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  item: { borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 20 },
  error: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
});
