import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { ScheduleItem } from '../../types';

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const palette = {
    screenBg: colors.background,
    cardBg: colors.surface,
    mutedBg: colors.card,
    title: colors.text,
    body: colors.textSecondary,
    secondary: colors.text,
    badge: colors.accent,
    badgeText: colors.text,
    emptyBg: colors.surface,
  };

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      const { data, fromCache, error } = await fetchWithOfflineFallback('schedule_items');

      if (fromCache) {
        setShowOfflineBanner(true);
      }
      if (error) {
        console.error('Failed to load schedule from Supabase.', error);
      }

      if (Array.isArray(data) && data.length > 0) {
        setSchedule(
          data.map((row: Record<string, unknown>, index: number) => {
            const item = row as Record<string, unknown>;
            return {
              id: String(item.id ?? item.schedule_id ?? index + 1),
              title: String(item.title ?? ''),
              date: String(item.date ?? ''),
              startTime: String(item.start_time ?? item.startTime ?? ''),
              endTime: String(item.end_time ?? item.endTime ?? ''),
              venue: String(item.venue ?? item.location ?? item.venue_name ?? ''),
              description: String(item.description ?? ''),
              category: (item.category ?? 'academic') as ScheduleItem['category'],
              isPast: normalizeBoolean(item.is_past ?? item.isPast),
            };
          }),
        );
      } else {
        setSchedule([]);
      }

      setLoading(false);
    };

    void loadSchedule();
  }, []);

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: colors.border }, item.isPast && styles.pastCard]}>
      <View style={[styles.timeBadge, { backgroundColor: palette.badge }]}>
        <Text style={[styles.timeText, { color: palette.badgeText }]}>{item.startTime} - {item.endTime}</Text>
      </View>
      <Text style={[styles.title, { color: palette.title }]}>{item.title}</Text>
      <Text style={[styles.venue, { color: palette.secondary }]}>📍 Venue: {item.venue}</Text>
      <Text style={[styles.desc, { color: palette.body }]}>{item.description}</Text>

      {item.isPast ? (
        <View style={[styles.recoveryBox, { backgroundColor: palette.mutedBg }]}>
          <Text style={[styles.recoveryText, { color: palette.body }]}>
            {t('common.pastSession')}
          </Text>
        </View>
      ) : (
          <TouchableOpacity
          style={[styles.directionBtn, { backgroundColor: colors.accent }]}
          onPress={() => Alert.alert('Directions', `Start at main entrance and follow signs to ${item.venue}.`)}
        >
          <Text style={[styles.directionText, { color: colors.text }]}>{t('common.directions')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBg }]}>
      <PageHeader
        eyebrow={t('common.orientation')}
        title={t('common.scheduleTitle')}
        subtitle={t('common.scheduleSubtitle')}
      />

      {showOfflineBanner && (
        <ShameResilientBanner
          message={t('common.savedSchedule')}
          type="info"
        />
      )}

      <ShameResilientBanner
        message={t('common.missedSession')}
        type="recovery"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : schedule.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: palette.emptyBg }]}>
          <Text style={[styles.emptyTitle, { color: palette.title }]}>{t('common.noSchedule')}</Text>
          <Text style={[styles.emptyText, { color: palette.body }]}>{t('common.tryAgain')}</Text>
        </View>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 20 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  pastCard: { opacity: 0.85, borderWidth: 1 },
  timeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  timeText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: 'bold' },
  venue: { fontSize: 13, marginVertical: 4 },
  desc: { fontSize: 13, marginBottom: 10 },
  recoveryBox: { padding: 10, borderRadius: 6, marginTop: 4 },
  recoveryText: { fontSize: 12, fontStyle: 'italic' },
  directionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  directionText: { fontSize: 12, fontWeight: '600' },
  emptyState: { borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: 'center' },
});