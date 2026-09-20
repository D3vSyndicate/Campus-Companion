import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ENTRY_KINDS,
  LEGEND_BLURB,
  monthGrid,
  todayIso,
  useCalendar,
  type CalendarEntry,
  type EntryKind,
} from '../../lib/calendar';
import { monthLong, weekdayLong, weekdayShort } from '../../lib/dates';
import { addPersonalEntry, removePersonalEntry } from '../../lib/personalEntries';
import { usePinnedEvents } from '../../lib/pins';
import { readStreamPreference, saveStreamPreference } from '../../lib/timetable';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { AddEntryForm } from './AddEntryForm';

const INK = '#071B2C';

// Monday first, so the grid lines up with the timetable. The letters come from the locale files.
const WEEKDAY_HEAD_KEYS = [0, 1, 2, 3, 4, 5, 6].map((index) => `date.weekdayHeads.${index}`);
const KINDS = Object.keys(ENTRY_KINDS) as EntryKind[];

const parse = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

function dayLabel(iso: string) {
  const date = parse(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${weekdayLong(date.getDay())} ${date.getDate()} ${monthLong(date.getMonth())}`;
}

const timeText = (entry: CalendarEntry) => (entry.start ? `${entry.start}${entry.end ? `–${entry.end}` : ''}` : '');

export function CalendarScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { pinned, toggle: togglePin } = usePinnedEvents();
  const userId = user?.id;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayIso());
  const [stream, setStream] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Kinds the student has switched off with the chips. Nothing is deleted: it is only hidden.
  const [hidden, setHidden] = useState<ReadonlySet<EntryKind>>(new Set());

  const { loading, byDate, otherByDate, upNext, streams, uncoveredWeekdays, refreshPersonal } = useCalendar(year, month, stream, pinned);

  // The stream the student picked last time, so they only choose once.
  useEffect(() => {
    let active = true;
    void (async () => {
      const saved = userId ? await readStreamPreference(userId) : null;
      if (active && saved) setStream(saved);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const pickStream = (next: string) => {
    setStream(next);
    if (userId) void saveStreamPreference(userId, next);
  };

  const shift = (delta: number) => {
    const date = new Date(year, month + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
  };

  const goTo = (iso: string) => {
    const date = parse(iso);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setSelected(iso);
  };

  const flipKind = (kind: EntryKind) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const visible = (entries: CalendarEntry[] | undefined) => (entries ?? []).filter((entry) => !hidden.has(entry.kind));

  const cells = monthGrid(year, month);
  const dayEntries = visible(byDate.get(selected));
  const otherEvents = hidden.has('event') ? [] : (otherByDate.get(selected) ?? []);
  const viewingToday = year === today.getFullYear() && month === today.getMonth() && selected === todayIso();

  const pin = async (entry: CalendarEntry) => {
    if (!entry.sourceId) return;
    const nowPinned = await togglePin(entry.sourceId);
    showToast(nowPinned ? t('pin.added') : t('pin.removed'), 'info');
  };

  const saveEntry = async (entry: { title: string; date: string; start: string; end: string; venue: string }) => {
    if (!userId) {
      Alert.alert(t('cal.signInFirst'), t('cal.signInText'));
      return;
    }
    await addPersonalEntry(userId, entry);
    await refreshPersonal();
    setAdding(false);
  };

  const deleteEntry = (entry: CalendarEntry) => {
    if (!userId) return;
    Alert.alert(t('cal.removeTitle'), t('cal.removeText', { title: entry.title }), [
      { text: t('cal.keep'), style: 'cancel' },
      {
        text: t('mgm.remove'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await removePersonalEntry(userId, entry.id);
            await refreshPersonal();
          })();
        },
      },
    ]);
  };

  // Friday has no rows in the timetable we were given, so an empty Friday would otherwise read as
  // "you have nothing on".
  const fridayMissing = uncoveredWeekdays.includes(5);
  const selectedWeekday = parse(selected).getDay() || 7;

  const countText = useMemo(
    () => (dayEntries.length === 1 ? t('cal.countOne') : t('cal.countMany', { count: dayEntries.length })),
    [dayEntries.length, t],
  );

  const tint = (color: string) => `${color}${isDark ? '2E' : '1F'}`;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader eyebrow={t('cal.eyebrow')} title={t('cal.title')} subtitle={t('cal.subtitle')} showSearch={false} />

        {/* Up next: the answer to "what is coming?" comes before any grid. */}
        <View style={[styles.upNext, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.upNextHead}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('cal.upNext')}</Text>
          </View>
          {loading ? (
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('cal.loading')}</Text>
          ) : upNext.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('cal.upNextNone')}</Text>
          ) : (
            upNext.map((entry) => {
              const date = parse(entry.date);
              const meta = ENTRY_KINDS[entry.kind];
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.title}, ${dayLabel(entry.date)}`}
                  onPress={() => goTo(entry.date)}
                  style={({ pressed }) => [styles.upRow, pressed && { opacity: 0.75 }]}
                >
                  <View style={[styles.upDate, { backgroundColor: tint(meta.color) }]}>
                    <Text style={[styles.upWeekday, { color: meta.color }]}>{weekdayShort(date.getDay()).toUpperCase()}</Text>
                    <Text style={[styles.upDay, { color: colors.text }]}>{date.getDate()}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.upTitle, { color: colors.text }]} numberOfLines={1}>{entry.title}</Text>
                    <Text style={[styles.upMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                      {[timeText(entry) || t('cal.allDay'), entry.venue].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              );
            })
          )}
        </View>

        {/* The colours are the feature, and each one doubles as a switch to hide that kind. */}
        <View>
          <View style={styles.chipRow}>
            {KINDS.map((kind) => {
              const meta = ENTRY_KINDS[kind];
              const off = hidden.has(kind);
              return (
                <Pressable
                  key={kind}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !off }}
                  accessibilityLabel={t('cal.toggleKind', { kind: t(meta.label) })}
                  onPress={() => flipKind(kind)}
                  style={({ pressed }) => [
                    styles.kindChip,
                    { backgroundColor: off ? 'transparent' : tint(meta.color), borderColor: off ? colors.border : meta.color },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: off ? colors.border : meta.color }]} />
                  <Text style={[styles.kindChipText, { color: off ? colors.textSecondary : colors.text }]}>{t(meta.label)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.blurb, { color: colors.textSecondary }]}>{t(LEGEND_BLURB)}</Text>
        </View>

        {streams.length > 0 ? (
          <View style={styles.streamBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {stream ? t('cal.timetableTitle') : t('cal.timetableSub')}
            </Text>
            <View style={styles.chipRow}>
              {streams.map((option) => {
                const active = stream === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => pickStream(option)}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.accent : colors.border },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: active ? INK : colors.textSecondary }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.monthHead}>
            <Text style={[styles.monthTitle, { color: colors.text }]} accessibilityRole="header">
              {monthLong(month)} {year}
            </Text>
            <View style={styles.monthTools}>
              {!viewingToday ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => goTo(todayIso())}
                  style={({ pressed }) => [styles.todayPill, { borderColor: colors.accent }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.todayText, { color: colors.text }]}>{t('common.today')}</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('cal.prevMonth')}
                onPress={() => shift(-1)}
                style={({ pressed }) => [styles.navButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('cal.nextMonth')}
                onPress={() => shift(1)}
                style={({ pressed }) => [styles.navButton, { backgroundColor: colors.background, borderColor: colors.border }, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekHead}>
            {WEEKDAY_HEAD_KEYS.map((headKey, index) => (
              <Text key={index} style={[styles.weekHeadText, { color: colors.textSecondary }]}>
                {t(headKey)}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((iso, index) => {
              if (!iso) return <View key={`blank-${index}`} style={styles.cell} />;
              const entries = visible(byDate.get(iso));
              const isSelected = iso === selected;
              const isToday = iso === todayIso();
              const hasPin = entries.some((entry) => entry.kind === 'event');
              // At most three dots: beyond that they stop being countable anyway.
              const kinds = [...new Set(entries.map((entry) => entry.kind))].slice(0, 3);

              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(iso)}, ${entries.length === 1 ? t('cal.countOne') : t('cal.countMany', { count: entries.length })}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(iso)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isSelected && { backgroundColor: colors.accent },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.accent },
                    ]}
                  >
                    <Text style={[styles.cellText, { color: isSelected ? INK : colors.text }]}>{Number(iso.slice(8, 10))}</Text>
                    {hasPin ? (
                      <View style={styles.cellPin}>
                        <Ionicons name="pin" size={9} color={isSelected ? INK : ENTRY_KINDS.event.color} />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.dots}>
                    {kinds.map((kind) => (
                      <View key={kind} style={[styles.dot, { backgroundColor: ENTRY_KINDS[kind].color }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.dayHead}>
          <View style={styles.flex}>
            <Text style={[styles.dayTitle, { color: colors.text }]} accessibilityRole="header">{dayLabel(selected)}</Text>
            {!loading ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{countText}</Text> : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('cal.addOwn')}
            onPress={() => setAdding(true)}
            style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="add" size={18} color={INK} />
            <Text style={styles.addLabel}>{t('cal.add')}</Text>
          </Pressable>
        </View>

        {fridayMissing && selectedWeekday === 5 ? (
          <View style={[styles.warning, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>{t('cal.noFriday')}</Text>
          </View>
        ) : null}

        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('cal.loading')}</Text>
        ) : dayEntries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="sunny-outline" size={22} color={colors.accent} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('cal.emptyDay')}</Text>
          </View>
        ) : (
          dayEntries.map((entry) => {
            const meta = ENTRY_KINDS[entry.kind];
            const time = timeText(entry);
            return (
              <View key={entry.id} style={[styles.entry, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.stripe, { backgroundColor: meta.color }]} />
                <View style={styles.timeCol}>
                  {entry.start ? (
                    <>
                      <Text style={[styles.timeMain, { color: colors.text }]}>{entry.start}</Text>
                      {entry.end ? <Text style={[styles.timeEnd, { color: colors.textSecondary }]}>{entry.end}</Text> : null}
                    </>
                  ) : (
                    <Text style={[styles.timeEnd, { color: colors.textSecondary }]}>{t('cal.allDay')}</Text>
                  )}
                </View>
                <View style={styles.entryBody}>
                  <Text style={[styles.entryKind, { color: meta.color }]} numberOfLines={1}>
                    {t(meta.label)} · {t(meta.note)}
                  </Text>
                  <Text style={[styles.entryTitle, { color: colors.text }]} accessibilityLabel={time ? `${entry.title}, ${time}` : entry.title}>
                    {entry.title}
                  </Text>
                  {entry.venue ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                      <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>{entry.venue}</Text>
                    </View>
                  ) : null}
                  {entry.detail ? (
                    <Text style={[styles.entryMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                      {entry.detail}
                    </Text>
                  ) : null}
                </View>
                {entry.kind === 'event' && entry.sourceId ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('pin.unpinLabel', { title: entry.title })}
                    onPress={() => void pin(entry)}
                    style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="pin" size={20} color={ENTRY_KINDS.event.color} />
                  </Pressable>
                ) : null}
                {entry.kind === 'personal' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('cal.tapRemove', { title: entry.title })}
                    onPress={() => deleteEntry(entry)}
                    style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="trash-outline" size={19} color={colors.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}

        {/* Events nobody has pinned yet: offered here, one tap from the calendar. */}
        {!loading && otherEvents.length > 0 ? (
          <View style={styles.alsoBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('cal.alsoOn')}</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('cal.alsoOnHint')}</Text>
            {otherEvents.map((entry) => (
              <View key={entry.id} style={[styles.alsoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.flex}>
                  <Text style={[styles.upTitle, { color: colors.text }]} numberOfLines={2}>{entry.title}</Text>
                  <Text style={[styles.upMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[timeText(entry) || t('cal.allDay'), entry.venue].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('pin.pinLabel', { title: entry.title })}
                  onPress={() => void pin(entry)}
                  style={({ pressed }) => [styles.pinPill, { borderColor: ENTRY_KINDS.event.color, backgroundColor: tint(ENTRY_KINDS.event.color) }, pressed && { opacity: 0.8 }]}
                >
                  <Ionicons name="pin-outline" size={15} color={colors.text} />
                  <Text style={[styles.pinPillText, { color: colors.text }]}>{t('pin.pin')}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <AddEntryForm
        visible={adding}
        date={selected}
        dateLabel={dayLabel(selected)}
        onCancel={() => setAdding(false)}
        onSave={(entry) => void saveEntry(entry)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  muted: { fontSize: 12, lineHeight: 18 },

  upNext: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  upNextHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  upRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  upDate: { width: 48, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  upWeekday: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  upDay: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  upTitle: { fontSize: 14, fontWeight: '800' },
  upMeta: { fontSize: 12, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, minHeight: 40 },
  kindChipText: { fontSize: 12, fontWeight: '800' },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  blurb: { fontSize: 12, lineHeight: 18, marginTop: 10 },

  streamBlock: { gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '700' },

  monthCard: { borderRadius: 22, borderWidth: 1, padding: 14 },
  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  monthTitle: { flexShrink: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  monthTools: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayPill: { minHeight: 36, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 12, justifyContent: 'center' },
  todayText: { fontSize: 12, fontWeight: '800' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  weekHead: { flexDirection: 'row', paddingBottom: 6 },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  // minWidth/minHeight rather than fixed width/height: with the app's font scaling turned up, a
  // hard box clipped two-digit dates.
  cellInner: { minWidth: 36, minHeight: 36, paddingHorizontal: 4, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 14, fontWeight: '700' },
  cellPin: { position: 'absolute', top: -2, right: -2 },
  dots: { flexDirection: 'row', gap: 3, height: 8, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },

  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  dayTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 16, minHeight: 44 },
  addLabel: { color: INK, fontSize: 14, fontWeight: '800' },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 16 },
  emptyText: { flex: 1, fontSize: 13, lineHeight: 19 },

  entry: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  stripe: { width: 5 },
  timeCol: { width: 58, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  timeMain: { fontSize: 14, fontWeight: '800' },
  timeEnd: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  entryBody: { flex: 1, minWidth: 0, paddingVertical: 12, paddingRight: 6, gap: 3 },
  entryKind: { fontSize: 11, fontWeight: '800' },
  entryTitle: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryMeta: { fontSize: 12, lineHeight: 17 },
  iconButton: { width: 48, alignItems: 'center', justifyContent: 'center' },

  alsoBlock: { gap: 8, marginTop: 6 },
  alsoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12 },
  pinPill: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12 },
  pinPillText: { fontSize: 12, fontWeight: '800' },
});
