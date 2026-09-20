import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { CampusActionButton } from './CampusActionButton';
import { ScaledText as Text } from './ScaledText';
import { ShameResilientBanner } from './ShameResilientBanner';
import { useTranslation } from 'react-i18next';
import { monthShort, shortDate } from '../lib/dates';
import i18n from '../i18n';

// General campus events (sport, social, culture...). These are separate from the orientation
// schedule, which is the timetable the orientation coordinator sets for first-years.
export type CampusEvent = {
  id: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD, or '' when the date has not been set yet
  start: string; // HH:MM or ''
  end: string;
  venue: string;
  room: string;
  organizer: string;
  image: string;
  description: string;
  cost: string;
  link: string;
};

const str = (value: unknown) => String(value ?? '').trim();

// Events only store a venue_id, so the venue names come from the Venue table.
export type VenueLookup = Map<string, { name: string; room: string }>;

export function venueLookup(rows: unknown): VenueLookup {
  const lookup: VenueLookup = new Map();
  for (const row of Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []) {
    lookup.set(str(row.venue_id), { name: str(row.venue_name), room: str(row.room_number) });
  }
  return lookup;
}

// Rows of the `event` table. An event with no date yet is still shown, marked "Date to be announced".
export function mapEvent(row: Record<string, unknown>, venues?: VenueLookup): CampusEvent | null {
  const title = str(row.title);
  if (!title || row.is_active === false) return null;
  const venue = venues?.get(str(row.venue_id));
  const date = str(row.event_date ?? row.date ?? row.start_date).slice(0, 10);
  return {
    id: str(row.id ?? row.event_id) || `${title}-${date}`,
    title,
    category: str(row.category) || 'Other',
    date,
    start: str(row.start_time).slice(0, 5),
    end: str(row.end_time).slice(0, 5),
    venue: venue?.name ?? '',
    room: venue?.room ?? '',
    organizer: str(row.organizer),
    image: str(row.image_url),
    description: str(row.description),
    cost: str(row.cost),
    link: str(row.signup_url ?? row.link),
  };
}

const CATEGORY_COLOURS: Record<string, string> = {
  sport: '#16A34A',
  social: '#7C3AED',
  culture: '#DB2777',
  academic: '#2563EB',
  wellness: '#0891B2',
};
const categoryColour = (category: string) => CATEGORY_COLOURS[category.toLowerCase()] ?? '#64748B';

// Dates are written by hand rather than with toLocaleDateString, so they look the same on every phone.
const parseDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const toHm = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const daysFrom = (iso: string, today: Date) =>
  Math.round((parseDate(iso).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);

function dayLabel(iso: string, today: Date) {
  if (!iso) return i18n.t('events.dateTba');
  const days = daysFrom(iso, today);
  if (days === 0) return i18n.t('common.today');
  if (days === 1) return i18n.t('common.tomorrow');
  const date = parseDate(iso);
  return shortDate(date);
}

const timeRange = (event: CampusEvent) =>
  event.start ? (event.end ? `${event.start} - ${event.end}` : i18n.t('events.from', { time: event.start })) : i18n.t('events.timeTba');

const where = (event: CampusEvent) => [event.venue, event.room].filter(Boolean).join(' · ');

type Group = { title: string; events: CampusEvent[] };

export function EventsList({ events, focusId = '' }: { events: CampusEvent[]; focusId?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  // The list is shared with the buddy (mentor) app, so stay inside the caller's own area.
  const mapRoute = segments[0] === '(mentor)' ? '/(mentor)/map' : '/(student)/map';

  const [category, setCategory] = useState('All');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(focusId ? [focusId] : []));
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (focusId) setOpenIds((current) => new Set(current).add(focusId));
  }, [focusId]);

  const now = useMemo(() => new Date(), []);

  // What is on from now: nothing that has already finished. Events with no date yet stay, at the end.
  const upcoming = useMemo(() => {
    const todayIso = toIso(now);
    const nowHm = toHm(now);
    return events
      .filter((event) => !event.date || event.date > todayIso || (event.date === todayIso && !(event.end && event.end < nowHm)))
      .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.start.localeCompare(b.start));
  }, [events, now]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(upcoming.map((event) => event.category)))], [upcoming]);
  const shown = category === 'All' || !categories.includes(category) ? upcoming : upcoming.filter((event) => event.category === category);

  const groups = useMemo(() => {
    const today: Group = { title: t('common.today'), events: [] };
    const week: Group = { title: t('events.thisWeek'), events: [] };
    const later: Group = { title: t('events.later'), events: [] };
    const undated: Group = { title: t('events.dateTba'), events: [] };
    for (const event of shown) {
      if (!event.date) {
        undated.events.push(event);
        continue;
      }
      const days = daysFrom(event.date, now);
      (days <= 0 ? today : days <= 6 ? week : later).events.push(event);
    }
    return [today, week, later, undated].filter((group) => group.events.length > 0);
  }, [shown, now]);

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const showOnMap = (place: string) => router.push({ pathname: mapRoute, params: { q: place } } as never);

  const isHappeningNow = (event: CampusEvent) =>
    event.date === toIso(now) && Boolean(event.start) && Boolean(event.end) && event.start <= toHm(now) && toHm(now) <= event.end;

  const renderEvent = (event: CampusEvent) => {
    const date = event.date ? parseDate(event.date) : null;
    const colour = categoryColour(event.category);
    const open = openIds.has(event.id);
    const focused = focusId === event.id;
    const live = isHappeningNow(event);
    const place = where(event);

    return (
      <View
        key={event.id}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, focused && { borderColor: colors.accent, borderWidth: 2 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${event.title}, ${dayLabel(event.date, now)}, ${timeRange(event)}`}
          onPress={() => toggle(event.id)}
          style={styles.head}
        >
          <View style={[styles.dateBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {date ? (
              <>
                <Text style={[styles.dateDay, { color: colors.text }]}>{date.getDate()}</Text>
                <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>{monthShort(date.getMonth()).toUpperCase()}</Text>
              </>
            ) : (
              <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>TBA</Text>
            )}
          </View>
          <View style={styles.copy}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${colour}22` }]}>
                <Text style={[styles.badgeText, { color: colour }]}>{event.category}</Text>
              </View>
              {live ? (
                <View style={[styles.badge, { backgroundColor: '#DC262622' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>{t('events.now')}</Text>
                </View>
              ) : date ? (
                <Text style={[styles.when, { color: colors.accent }]}>{dayLabel(event.date, now)}</Text>
              ) : null}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{timeRange(event)}</Text>
            </View>
            {place ? (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{place}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </Pressable>

        {open ? (
          <View style={styles.details}>
            {event.image && !brokenImages.has(event.id) ? (
              <Image
                source={{ uri: event.image }}
                style={styles.image}
                resizeMode="cover"
                accessibilityLabel={t('events.pictureFor', { title: event.title })}
                onError={() => setBrokenImages((current) => new Set(current).add(event.id))}
              />
            ) : null}
            {event.description ? <Text style={[styles.body, { color: colors.text }]}>{event.description}</Text> : null}
            {event.organizer ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{t('events.organisedBy')} {event.organizer}</Text> : null}
            {event.cost ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{t('events.cost')} {event.cost}</Text> : null}
            <View style={styles.actions}>
              {event.venue ? <CampusActionButton icon="location-outline" label={t('events.showWhere')} primary onPress={() => showOnMap(event.venue)} /> : null}
              {event.link ? (
                <CampusActionButton icon="open-outline" label={t('events.signUp')} onPress={() => Linking.openURL(event.link).catch(() => undefined)} />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  if (upcoming.length === 0) {
    return (
      <ShameResilientBanner
        message={
          events.length
            ? t('events.nothingElse')
            : t('events.none')
        }
        type="info"
      />
    );
  }

  return (
    <View>
      {categories.length > 2 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((name) => {
            const active = category === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setCategory(name)}
                style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>{name === 'All' ? t('common.allCategories') : name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {groups.map((group) => (
        <View key={group.title}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{group.title.toUpperCase()}</Text>
          {group.events.map(renderEvent)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingBottom: 12 },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '700' },
  groupTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 6, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 72 },
  dateBlock: { width: 52, height: 58, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  dateMonth: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  copy: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  when: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { flexShrink: 1, fontSize: 12, lineHeight: 17 },
  details: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8 },
  image: { width: '100%', aspectRatio: 1.8, maxHeight: 200, borderRadius: 12, backgroundColor: '#E4E7EA' },
  body: { fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
});
