import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { useAppearance } from '../../context/AppearanceContext';
import { fetchWithOfflineFallback } from '../lib/offlineData';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FALLBACK_FAQS: FAQ[] = [
  {
    id: '1',
    question: 'What should I do if I cannot access Funda?',
    answer: 'Funda can feel confusing at first. Check that your password is active. If you are stuck, visit Info@IT in Building 12 or ask a mentor.',
    category: 'Digital'
  },
  {
    id: '2',
    question: 'What if I arrive late or miss an orientation session?',
    answer: 'Missing a session is not the end of the world! Check the schedule screen for catch-up notes or ask a How2buddy mentor.',
    category: 'General'
  },
  {
    id: '3',
    question: 'Where can I find my timetable?',
    answer: 'Timetables are published on the Student Portal. Your mentor can also show you how to read your timetable slots.',
    category: 'Academics'
  }
];

export default function FAQScreen() {
  const { darkMode } = useAppearance();
  const palette = darkMode
    ? {
        pageBg: '#0B1220',
        inputBg: '#111B2E',
        inputBorder: '#223552',
        cardBg: '#111B2E',
        question: '#F2F7FF',
        answer: '#D3DDF0',
        tagBg: '#243754',
        tagText: '#EAF3FF',
        text: '#DCEAFB',
      }
    : {
        pageBg: '#F4F6F9',
        inputBg: '#FFF',
        inputBorder: '#B8C4D1',
        cardBg: '#FFF',
        question: '#1E293B',
        answer: '#334155',
        tagBg: '#E2E8F0',
        tagText: '#0F172A',
        text: '#0B1F3A',
      };

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFaqs = async () => {
      const { data } = await fetchWithOfflineFallback('FAQ');

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
        : FALLBACK_FAQS;

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
        <ActivityIndicator size="large" color="#0B1F3A" />
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
              <Text style={[styles.answer, { color: palette.answer }]}>{item.answer}</Text>
            )}
          </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F9', padding: 16 },
  searchInput: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#B8C4D1', marginBottom: 16, color: '#0B1F3A' },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 14, fontWeight: '600', color: '#1E293B', flex: 1 },
  tag: { fontSize: 10, backgroundColor: '#E2E8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  answer: { fontSize: 13, color: '#334155', marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
});