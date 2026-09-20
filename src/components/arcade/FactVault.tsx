import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { KIND_META, poolSize, type RewardKind } from '../../data/arcade-rewards';
import { useArcade } from '../../lib/arcade';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { RewardCard } from './RewardCard';
import { useTranslation } from 'react-i18next';

// Everything the student has unlocked, newest first. This is the part that makes the arcade a
// feature rather than a game: what you won is still here tomorrow.

const FILTERS: { key: RewardKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fact', label: KIND_META.fact.label },
  { key: 'madibaz', label: KIND_META.madibaz.label },
  { key: 'tip', label: KIND_META.tip.label },
];

export function FactVault() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { unlockedRewards, totalRewards, loading, madibazComingSoon } = useArcade();
  const [filter, setFilter] = useState<RewardKind | 'all'>('all');

  // Newest first: the thing you just won should be the thing you land on.
  const ordered = [...unlockedRewards].reverse();
  const shown = filter === 'all' ? ordered : ordered.filter((reward) => reward.kind === filter);

  const remaining =
    filter === 'all'
      ? totalRewards - unlockedRewards.length
      : poolSize(filter) - ordered.filter((reward) => reward.kind === filter).length;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow={t('arcade.vault')}
          title={t('arcade.vaultTitle')}
          subtitle={t('arcade.collected', { count: unlockedRewards.length, total: totalRewards })}
          showSearch={false}
          showBack
          backFallback="/(student)/arcade"
        />

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
                  styles.filter,
                  {
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={[styles.filterLabel, { color: active ? '#071B2C' : colors.textSecondary }]}
                >
                  {option.key === 'all' ? t('common.allCategories') : t(`arcade.kind.${option.key}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* An empty category is not the student's fault, so it does not read like a locked one. */}
        {filter === 'madibaz' && madibazComingSoon ? (
          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.noticeEmoji}>🎓</Text>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{t('arcade.comingSoon')}</Text>
            <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>
              {t('arcade.comingSoonText')}
            </Text>
          </View>
        ) : shown.length === 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.noticeEmoji}>🔒</Text>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>
              {loading ? t('arcade.openingVault') : t('arcade.nothingYet')}
            </Text>
            <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>
              {t('arcade.nothingText')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(student)/arcade')}
              style={({ pressed }) => [
                styles.noticeButton,
                { backgroundColor: colors.accent },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.noticeButtonLabel}>{t('arcade.goArcade')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {shown.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
            {remaining > 0 ? (
              <Text style={[styles.remaining, { color: colors.textSecondary }]}>
                {t('arcade.stillLocked', { count: remaining })}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  filter: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterLabel: { fontSize: 12, fontWeight: '700' },
  notice: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', gap: 8 },
  noticeEmoji: { fontSize: 28 },
  noticeTitle: { fontSize: 16, fontWeight: '800' },
  noticeBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  noticeButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 22,
    justifyContent: 'center',
    marginTop: 8,
  },
  noticeButtonLabel: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
  remaining: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 10 },
});
