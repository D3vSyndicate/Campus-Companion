import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQScreen() {
  const { colors } = useTheme();
  const palette = {
    pageBg: colors.background,
    inputBg: colors.card,
    inputBorder: colors.border,
    cardBg: colors.surface,
    question: colors.text,
    answer: colors.textSecondary,
    tagBg: colors.card,
    tagText: colors.text,
    text: colors.text,
  };

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFaqs = async () => {
      const { data, error } = await fetchWithOfflineFallback('FAQ');
      if (error) {
        console.error('Failed to load FAQs from Supabase.', error);
      }

      const mappedFaqs = Array.isArray(data) && data.length
        ? data.map((row, index) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? item.faq_id ?? index + 1),
              question: String(item.question ?? item.title ?? ''),
              answer: String(item.answer ?? item.description ?? ''),
              category: String(item.category ?? 'General'),
            };
          })
        : [];

      setFaqs(mappedFaqs);
      setLoading(false);
    };

    void loadFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) || 
    faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.pageBg }]}>
      <PageHeader
        eyebrow="NEED A QUICK ANSWER?"
        title="Frequently asked questions"
        subtitle="Search common questions about Funda, venues, timetables, and support."
      />

      <TextInput
        style={[styles.searchInput, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }]}
        placeholder="Search FAQs (e.g., Funda, Venues, Timetable)..."
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : (
        <FlatList
          data={filteredFaqs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: palette.cardBg }]}
            onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.question, { color: palette.question }]}>❓ {item.question}</Text>
              <Text style={[styles.tag, { backgroundColor: palette.tagBg, color: palette.tagText }]}>{item.category}</Text>
            </View>
            
            {expandedId === item.id && (
              <Text style={[styles.answer, { color: palette.answer, borderTopColor: colors.border }]}>{item.answer}</Text>
            )}
          </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchInput: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  card: { padding: 14, borderRadius: 10, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 14, fontWeight: '600', flex: 1 },
  tag: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  answer: { fontSize: 13, marginTop: 10, borderTopWidth: 1, paddingTop: 8 },
});