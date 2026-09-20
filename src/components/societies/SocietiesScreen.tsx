import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import {
  CATEGORY_META,
  SOCIETIES,
  WHAT_IS_A_SOCIETY,
  duplicateCodes,
  feeLabel,
  type Society,
  type SocietyCategory,
} from '../../data/societies';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { useTranslation } from 'react-i18next';

// Societies a student can join. Searchable, because a first-year arrives looking for one specific
// thing ("is there a debating society?") rather than browsing seventy entries.

type Filter = SocietyCategory | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'religious', label: CATEGORY_META.religious.label },
  { key: 'academic', label: CATEGORY_META.academic.label },
  { key: 'developmental', label: CATEGORY_META.developmental.label },
];

export function SocietiesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const clashes = useMemo(duplicateCodes, []);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SOCIETIES.filter((society) => {
      if (filter !== 'all' && society.category !== filter) return false;
      if (!needle) return true;
      // Searching the code too, so a student holding a payment reference can find what it is for.
      return (
        society.name.toLowerCase().includes(needle) || society.code.toLowerCase().includes(needle)
      );
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filter, query]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={t('home.cards.societies.title')}
          title={t('soc.title')}
          subtitle={t('soc.subtitle')}
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        <View style={[styles.explainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.explainerTitle, { color: colors.text }]}>{t('soc.what')}</Text>
          <Text style={[styles.explainerBody, { color: colors.textSecondary }]}>
            {t('soc.whatIs')}
          </Text>
        </View>

        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('soc.searchLabel')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            accessibilityLabel={t('soc.search')}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('map.clear')} onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {FILTERS.map((option) => {
            const active = filter === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(option.key)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.chipLabel, { color: active ? '#071B2C' : colors.textSecondary }]}>
                  {option.key === 'all' ? t('common.allCategories') : t(`soc.cat.${option.key}.label`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filter !== 'all' ? (
          <Text style={[styles.blurb, { color: colors.textSecondary }]}>
            {t(`soc.cat.${filter}.blurb`)}
          </Text>
        ) : null}

        {shown.length === 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{t('soc.noMatch')}</Text>
            <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>
              {t('soc.incomplete')}
            </Text>
          </View>
        ) : (
          shown.map((society) => <SocietyRow key={`${society.name}-${society.code}`} society={society} />)
        )}

        {/* The gaps in this data are the student's problem if they are hidden, so they are not. */}
        <View style={[styles.disclaimer, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <View style={styles.disclaimerCopy}>
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>{t('soc.about')}</Text>
            <Text style={[styles.disclaimerBody, { color: colors.textSecondary }]}>
              {t('soc.aboutText')}
            </Text>
            {clashes.length > 0 ? (
              <Text style={[styles.disclaimerBody, { color: colors.textSecondary }]}>
                {t(clashes.length === 1 ? 'soc.clashOne' : 'soc.clashMany', { codes: clashes.join(` ${t('common.and')} `) })}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SocietyRow({ society }: { society: Society }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.rowName, { color: colors.text }]}>{society.name}</Text>
        <View style={[styles.feePill, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.feeText, { color: colors.text }]}>{feeLabel(society.fee)}</Text>
        </View>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.rowCategory, { color: colors.textSecondary }]}>
          {CATEGORY_META[society.category].label}
        </Text>
        {society.code ? (
          <Text style={[styles.rowCode, { color: colors.textSecondary }]}>{society.code}</Text>
        ) : null}
      </View>
      {society.note ? (
        <Text style={[styles.rowNote, { color: colors.textSecondary }]}>{society.note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  explainer: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  explainerTitle: { fontSize: 15, fontWeight: '800' },
  explainerBody: { fontSize: 13, lineHeight: 20, marginTop: 7 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '700' },
  blurb: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  notice: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 6 },
  noticeTitle: { fontSize: 15, fontWeight: '800' },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  row: { borderRadius: 14, borderWidth: 1, padding: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  feePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  feeText: { fontSize: 12, fontWeight: '800' },
  rowMeta: { flexDirection: 'row', gap: 10, marginTop: 6 },
  rowCategory: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  rowCode: { fontSize: 11, fontWeight: '600' },
  rowNote: { fontSize: 12, lineHeight: 17, marginTop: 8, fontStyle: 'italic' },
  disclaimer: { flexDirection: 'row', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  disclaimerCopy: { flex: 1, gap: 6 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800' },
  disclaimerBody: { fontSize: 12, lineHeight: 17 },
});
