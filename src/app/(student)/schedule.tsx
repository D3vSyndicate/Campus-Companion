import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAppearance } from '../../context/AppearanceContext';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { ScheduleItem } from '../../types';

export default function ScheduleScreen() {
  const { darkMode } = useAppearance();
  const palette = darkMode
    ? {
        screenBg: '#0B1220',
        cardBg: '#111B2E',
        mutedBg: '#17253E',
        title: '#E8EEF7',
        body: '#B9C9DD',
        secondary: '#8DA3C1',
        badge: '#FFF8D9',
        badgeText: '#806414',
        emptyBg: '#111B2E',
      }
    : {
        screenBg: '#F4F6F9',
        cardBg: '#FFFFFF',
        mutedBg: '#F1F5F9',
        title: '#0F172A',
        body: '#475569',
        secondary: '#0B1F3A',
        badge: '#FFF8D9',
        badgeText: '#806414',
        emptyBg: '#FFFFFF',
      };

  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      const { data, fromCache } = await fetchWithOfflineFallback('schedule_items');

      if (fromCache) {
        setShowOfflineBanner(true);
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
              isPast: Boolean(item.is_past ?? item.isPast),
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
    <View style={[styles.card, { backgroundColor: palette.cardBg }, item.isPast && styles.pastCard]}>
      <View style={[styles.timeBadge, { backgroundColor: palette.badge }]}>
        <Text style={[styles.timeText, { color: palette.badgeText }]}>{item.startTime} - {item.endTime}</Text>
      </View>
      <Text style={[styles.title, { color: palette.title }]}>{item.title}</Text>
      <Text style={[styles.venue, { color: palette.secondary }]}>📍 Venue: {item.venue}</Text>
      <Text style={[styles.desc, { color: palette.body }]}>{item.description}</Text>

      {item.isPast ? (
        <View style={[styles.recoveryBox, { backgroundColor: palette.mutedBg }]}>
          <Text style={[styles.recoveryText, { color: palette.body }]}>
            This session has passed. Don't worry—you can review materials on Funda or ask a How2buddy mentor for a quick recap!
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.directionBtn}
          onPress={() => Alert.alert('Directions', `Start at main entrance and follow signs to ${item.venue}.`)}
        >
          <Text style={styles.directionText}>Show me where to go</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.screenBg }]}>
      <PageHeader
        eyebrow="ORIENTATION"
        title="Your schedule"
        subtitle="See what is happening today and find your way to each session."
      />

      {showOfflineBanner && (
        <ShameResilientBanner
          message="You are viewing saved schedule data because your connection is unavailable right now."
          type="info"
        />
      )}

      <ShameResilientBanner
        message="If you miss a session, don't worry. Every session has catch-up pathways listed below."
        type="recovery"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#0B1F3A" />
      ) : schedule.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: palette.emptyBg }]}>
          <Text style={[styles.emptyTitle, { color: palette.title }]}>No schedule loaded yet</Text>
          <Text style={[styles.emptyText, { color: palette.body }]}>Check your connection or try again later.</Text>
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
  container: { flex: 1, backgroundColor: '#F4F6F9', padding: 16 },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  pastCard: { opacity: 0.85, borderColor: '#E2E8F0', borderWidth: 1 },
  timeBadge: { backgroundColor: '#FFF8D9', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  timeText: { color: '#806414', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  venue: { fontSize: 13, color: '#0B1F3A', marginVertical: 4 },
  desc: { fontSize: 13, color: '#475569', marginBottom: 10 },
  recoveryBox: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 6, marginTop: 4 },
  recoveryText: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
  directionBtn: { backgroundColor: '#0B1F3A', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  directionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  emptyState: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0B1F3A', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#475569', textAlign: 'center' },
});