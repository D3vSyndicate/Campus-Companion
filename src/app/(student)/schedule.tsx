import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { EventsList, mapEvent, venueLookup, type CampusEvent } from '../../components/EventsList';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { ScheduleItem } from '../../types';

type Tab = 'orientation' | 'events';

const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'orientation', label: 'Orientation', icon: 'school-outline' },
  { key: 'events', label: 'Campus events', icon: 'megaphone-outline' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// "2027-02-04" -> "Thu 4 Feb", done by hand so it reads the same on every phone.
function dayHeading(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (!year || Number.isNaN(date.getTime())) return iso || 'Date to be confirmed';
  const label = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return iso === toIso(new Date()) ? `Today · ${label}` : label;
}

// Two different things live on this screen:
//  - Orientation: the timetable the orientation coordinator sets for first-years (schedule_items).
//  - Campus events: what is happening around campus, open to everyone (the event table).
export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const params = useLocalSearchParams<{ tab?: string | string[]; focus?: string | string[] }>();
  const paramTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const focusId = (Array.isArray(params.focus) ? params.focus[0] : params.focus) ?? '';

  // This screen is shared with the buddy (mentor) app, so stay inside the caller's own area.
  const mapRoute = segments[0] === '(mentor)' ? '/(mentor)/map' : '/(student)/map';

  const [tab, setTab] = useState<Tab>(paramTab === 'events' ? 'events' : 'orientation');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // A search result can send the student straight to an event.
  useEffect(() => {
    if (paramTab === 'events' || paramTab === 'orientation') setTab(paramTab);
  }, [paramTab]);

  const loadAll = useCallback(async () => {
    const [scheduleResult, venueResult, eventResult] = await Promise.all([
      fetchWithOfflineFallback('schedule_items'),
      fetchWithOfflineFallback('Venue'),
      fetchWithOfflineFallback('event'),
    ]);

    // schedule_items only stores venue_id, so look the venue up.
    const venues = new Map(
      (Array.isArray(venueResult.data) ? venueResult.data : []).map((venue: Record<string, unknown>) => [String(venue.venue_id), venue]),
    );

    setShowOfflineBanner(Boolean(scheduleResult.fromCache));
    if (scheduleResult.error) console.error('Failed to load schedule from Supabase.', scheduleResult.error);

    const rows = Array.isArray(scheduleResult.data) ? (scheduleResult.data as Record<string, unknown>[]) : [];
    setSchedule(
      rows
        .map((item, index) => {
          const venue = venues.get(String(item.venue_id)) as Record<string, unknown> | undefined;
          const startTime = String(item.start_time ?? item.startTime ?? '').slice(0, 5);
          const endTime = String(item.end_time ?? item.endTime ?? '').slice(0, 5);
          const date = String(item.date ?? '');
          // Once a session's end time (or start time) has gone by, offer the catch-up guidance.
          const endsAt = new Date(`${date}T${endTime || startTime || '23:59'}:00`);
          const hasPassed = !Number.isNaN(endsAt.getTime()) && endsAt.getTime() < Date.now();
          return {
            id: String(item.id ?? item.schedule_id ?? index + 1),
            title: String(item.title ?? ''),
            date,
            startTime,
            endTime,
            venue: [venue?.venue_name, venue?.room_number].filter(Boolean).join(' · ') || String(item.venue ?? item.location ?? ''),
            directions: String(venue?.directions ?? ''),
            mapLink: String(venue?.map_link ?? ''),
            description: String(item.description ?? ''),
            category: (item.category ?? 'academic') as ScheduleItem['category'],
            isPast: normalizeBoolean(item.is_past ?? item.isPast) || hasPassed,
          };
        })
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    );

    // Events only store a venue_id, so the venue names come from the same Venue rows.
    if (eventResult.error) console.error('Failed to load events from Supabase.', eventResult.error);
    const eventVenues = venueLookup(venueResult.data);
    const eventRows = Array.isArray(eventResult.data) ? (eventResult.data as Record<string, unknown>[]) : [];
    setEvents(eventRows.map((row) => mapEvent(row, eventVenues)).filter((event): event is CampusEvent => event !== null));

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  // Sessions grouped by day, so "what is on Thursday" is easy to see.
  const days = schedule.reduce<{ date: string; items: ScheduleItem[] }[]>((groups, item) => {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
    return groups;
  }, []);

  const showDirections = (item: ScheduleItem) => {
    const guidance =
      item.directions ||
      `Start at the main entrance and follow the signs to ${item.venue || 'your venue'}. You can also ask a How2buddy for help.`;
    const buttons = [
      ...(item.venue ? [{ text: t('common.showOnCampusMap'), onPress: () => router.push({ pathname: mapRoute, params: { q: item.venue } } as never) }] : []),
      ...(item.mapLink ? [{ text: t('common.openMap'), onPress: () => void Linking.openURL(item.mapLink!) }] : []),
      { text: 'OK' },
    ];
    Alert.alert(t('common.notSureWhereTitle'), guidance, buttons);
  };

  const renderSession = (item: ScheduleItem) => (
    <View key={item.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, item.isPast && styles.pastCard]}>
      <View style={[styles.timeBadge, { backgroundColor: colors.accent }]}>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {item.startTime}
          {item.endTime ? ` - ${item.endTime}` : ''}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.venue, { color: colors.text }]}>📍 {item.venue || t('common.venueToBeConfirmed')}</Text>
      {item.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text> : null}

      {item.isPast ? (
        <View style={[styles.recoveryBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.recoveryText, { color: colors.textSecondary }]}>{t('common.pastSession')}</Text>
        </View>
      ) : (
        <TouchableOpacity style={[styles.directionBtn, { backgroundColor: colors.accent }]} onPress={() => showDirections(item)}>
          <Text style={[styles.directionText, { color: colors.text }]}>{t('common.directions')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const onEvents = tab === 'events';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.accent} />}
    >
      <PageHeader
        eyebrow={onEvents ? "WHAT'S ON" : t('common.orientation')}
        title={onEvents ? 'Campus events' : t('common.scheduleTitle')}
        subtitle={
          onEvents
            ? 'See what is happening around campus, when it starts and where to go.'
            : 'Your orientation timetable, set by the orientation coordinator. Find your way to each session.'
        }
      />

      <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityRole="tablist">
        {TABS.map(({ key, label, icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(key)}
              style={[styles.tab, active && { backgroundColor: colors.accent }]}
            >
              <Ionicons name={icon} size={16} color={active ? colors.text : colors.textSecondary} />
              <Text style={[styles.tabText, { color: active ? colors.text : colors.textSecondary }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : onEvents ? (
        <EventsList events={events} focusId={focusId} />
      ) : (
        <>
          {showOfflineBanner ? <ShameResilientBanner message={t('common.savedSchedule')} type="info" /> : null}
          <ShameResilientBanner message={t('common.missedSession')} type="recovery" />

          {days.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('common.noSchedule')}</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('common.tryAgain')}</Text>
            </View>
          ) : (
            days.map((day) => (
              <View key={day.date || 'undated'}>
                <Text style={[styles.dayHeading, { color: colors.textSecondary }]}>{dayHeading(day.date).toUpperCase()}</Text>
                {day.items.map(renderSession)}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  loader: { marginTop: 32 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 },
  tab: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 11 },
  tabText: { fontSize: 13, fontWeight: '800' },
  dayHeading: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 6, marginBottom: 8 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  pastCard: { opacity: 0.85 },
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
