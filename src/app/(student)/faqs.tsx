import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
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
  const { t } = useTranslation();
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
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const loadFaqs = async () => {
      const { data, fromCache, error } = await fetchWithOfflineFallback('FAQ');
      setShowOfflineBanner(fromCache && Boolean(error));
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
        eyebrow={t('common.quickAnswer')}
        title={t('common.faqsTitle')}
        subtitle={t('common.faqsSubtitle')}
      />

      <TextInput
        style={[styles.searchInput, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder, color: palette.text }]}
        placeholder={t('common.searchFaqs')}
        value={search}
        onChangeText={setSearch}
      />

      {showOfflineBanner && (
        <ShameResilientBanner
          message={t('common.tryAgain')}
          type="info"
        />
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : filteredFaqs.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: palette.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: palette.question }]}>{faqs.length ? 'No matching answers' : 'No FAQs published yet'}</Text>
          <Text style={[styles.emptyText, { color: palette.answer }]}>{faqs.length ? 'Try a different search term.' : 'Common campus answers will appear here when they are available.'}</Text>
        </View>
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
  emptyState: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});