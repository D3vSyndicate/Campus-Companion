import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    SectionList,
    Share,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchWithOfflineFallback } from '../lib/offlineData';
import { useTheme } from '../theme/ThemeContext';
import { ChipSelect } from './ChipSelect';
import { PageHeader } from './PageHeader';
import { ScaledText as Text } from './ScaledText';
import { ShameResilientBanner } from './ShameResilientBanner';
import { SuggestFaq } from './SuggestFaq';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const ALL = '';

type Props = {
  // Mentors can pass an answer on to a student straight from the app.
  canShare?: boolean;
  // Mentors can tell coordinators about a question that is not answered yet.
  canSuggest?: boolean;
};

export function FaqBrowser({ canShare = false, canSuggest = false }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const linkedCategory = Array.isArray(params.category) ? params.category[0] : params.category;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    const loadFaqs = async () => {
      const { data, fromCache, error } = await fetchWithOfflineFallback('FAQ');
      setShowOfflineBanner(fromCache && Boolean(error));
      if (error) {
        console.error('Failed to load FAQs from Supabase.', error);
      }

      setFaqs(
        (Array.isArray(data) ? data : []).map((row, index) => {
          const item = row as Record<string, unknown>;
          return {
            id: String(item.faq_id ?? item.id ?? index + 1),
            question: String(item.question ?? item.title ?? '').trim(),
            answer: String(item.answer ?? item.description ?? '').trim(),
            // Some rows have stray spaces or different capitalisation ("Support ", "Wi-fi").
            category: String(item.category ?? '').trim() || 'General',
          };
        }),
      );
      setLoading(false);
    };

    void loadFaqs();
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const faq of faqs) {
      const key = faq.category.toLowerCase();
      if (!seen.has(key)) seen.set(key, faq.category);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [faqs]);

  // A support pathway can link to a category ("Funda") or to one exact question. Open on whichever
  // matches; if neither does, just show everything.
  useEffect(() => {
    if (!linkedCategory) return;
    const wanted = linkedCategory.trim().toLowerCase();
    const categoryMatch = categories.find((name) => name.toLowerCase() === wanted);
    if (categoryMatch) {
      setCategory(categoryMatch);
      return;
    }
    const questionMatch = faqs.find((faq) => faq.question.toLowerCase() === wanted);
    if (questionMatch) {
      setCategory(questionMatch.category);
      setExpandedId(questionMatch.id);
    }
  }, [linkedCategory, categories, faqs]);

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const visible = faqs.filter(
      (faq) =>
        (category === ALL || faq.category.toLowerCase() === category.toLowerCase()) &&
        (!query || faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query)),
    );

    const groups = new Map<string, FAQ[]>();
    for (const faq of visible) {
      const key = faq.category.toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), faq]);
    }
    return [...groups.values()]
      .map((data) => ({ title: data[0].category, data }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [faqs, category, search]);

  const shareAnswer = async (faq: FAQ) => {
    try {
      await Share.share({ message: `${faq.question}\n\n${faq.answer}` });
    } catch {
      Alert.alert(t('share.unavailable'), t('share.readAnswer'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader
        eyebrow={t('common.quickAnswer')}
        title={t('common.faqsTitle')}
        subtitle={t('common.faqsSubtitle')}
        showSearch={false}
      />

      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder={t('common.searchFaqs')}
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {showOfflineBanner && <ShameResilientBanner message={t('common.tryAgain')} type="info" />}

      {categories.length > 1 ? (
        <View style={styles.chips}>
          <ChipSelect
            options={[
              { value: ALL, label: t('common.allCategories') },
              ...categories.map((name) => ({ value: name, label: name })),
            ]}
            value={category}
            onChange={setCategory}
          />
        </View>
      ) : null}

      {canSuggest ? (
        suggesting ? (
          <SuggestFaq initialQuestion={search} onDone={() => setSuggesting(false)} />
        ) : (
          <TouchableOpacity accessibilityRole="button" onPress={() => setSuggesting(true)} style={styles.suggestLink}>
            <Text style={[styles.suggestText, { color: colors.accent }]}>{t('faq.cantFind')}</Text>
          </TouchableOpacity>
        )
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : sections.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {faqs.length ? t('common.noMatchingAnswers') : t('common.noFaqsYet')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {faqs.length ? t('common.noMatchingHint') : t('common.noFaqsHint')}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const open = expandedId === item.id;
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setExpandedId(open ? null : item.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                  <Text style={[styles.chevron, { color: colors.textSecondary }]}>{open ? '−' : '+'}</Text>
                </View>

                {open ? (
                  <View style={[styles.answerBox, { borderTopColor: colors.border }]}>
                    <Text style={[styles.hint, { color: colors.accent }]}>{t('common.manyAsk')}</Text>
                    <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
                    {canShare ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => void shareAnswer(item)}
                        style={[styles.shareButton, { backgroundColor: colors.accent }]}
                      >
                        <Text style={styles.shareText}>{t('share.shareAnswer')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchInput: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  chips: { marginBottom: 12 },
  list: { paddingBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  card: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  question: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  chevron: { fontSize: 22 },
  answerBox: { marginTop: 10, borderTopWidth: 1, paddingTop: 8 },
  hint: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  answer: { fontSize: 13, lineHeight: 19 },
  suggestLink: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 10 },
  suggestText: { fontSize: 13, fontWeight: '800' },
  shareButton: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, marginTop: 12 },
  shareText: { color: '#071B2C', fontSize: 13, fontWeight: '800' },
  emptyState: { borderWidth: 1, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
