import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  ENTRY_KINDS,
  LEGEND_BLURB,
  monthGrid,
  todayIso,
  useCalendar,
  type CalendarEntry,
  type EntryKind,
} from '../../lib/calendar';
import { addPersonalEntry, removePersonalEntry } from '../../lib/personalEntries';
import { readStreamPreference, saveStreamPreference } from '../../lib/timetable';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { AddEntryForm } from './AddEntryForm';

const WEEKDAY_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function dayLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  if (Number.isNaN(date.getTime())) return iso;
  const weekday = WEEKDAYS_LONG[(date.getDay() || 7) - 1];
  return `${weekday} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function CalendarScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayIso());
  const [stream, setStream] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { loading, byDate, streams, uncoveredWeekdays, refreshPersonal } = useCalendar(year, month, stream);

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

  const cells = monthGrid(year, month);
  const dayEntries = byDate.get(selected) ?? [];

  const saveEntry = async (entry: { title: string; date: string; start: string; end: string; venue: string }) => {
    if (!userId) {
      Alert.alert('Sign in first', 'Your own calendar entries are saved against your account.');
      return;
    }
    await addPersonalEntry(userId, entry);
    await refreshPersonal();
    setAdding(false);
  };

  const deleteEntry = (entry: CalendarEntry) => {
    if (!userId) return;
    Alert.alert('Remove this?', `"${entry.title}" will be taken off your calendar.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Remove',
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
  const selectedWeekday = (() => {
    const [y, m, d] = selected.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    return date.getDay() || 7;
  })();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Calendar"
          title="Everything you have on"
          subtitle="Orientation, lectures, campus events and your own plans, in one month view."
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        {/* The legend is the feature: colour is what tells a student what is expected of them. */}
        <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.legendGrid}>
            {(Object.keys(ENTRY_KINDS) as EntryKind[]).map((kind) => {
              const meta = ENTRY_KINDS[kind];
              return (
                <View key={kind} style={styles.legendItem}>
                  <View style={[styles.swatch, { backgroundColor: meta.color }]} />
                  <View style={styles.legendCopy}>
                    <Text style={[styles.legendLabel, { color: colors.text }]}>{meta.label}</Text>
                    <Text style={[styles.legendNote, { color: colors.textSecondary }]}>
                      {meta.note}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <View style={[styles.legendRule, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendBlurb, { color: colors.textSecondary }]}>{LEGEND_BLURB}</Text>
        </View>

        {streams.length > 0 ? (
          <View style={styles.streamBlock}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {stream ? 'Your timetable' : 'Pick your class to see lectures'}
            </Text>
            <View style={styles.streamRow}>
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
                      {
                        backgroundColor: active ? colors.accent : colors.card,
                        borderColor: active ? colors.accent : colors.border,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: active ? '#071B2C' : colors.textSecondary }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.monthHead}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => shift(-1)}
              hitSlop={12}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => shift(1)}
              hitSlop={12}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekHead}>
            {WEEKDAY_HEADS.map((head, index) => (
              <Text key={index} style={[styles.weekHeadText, { color: colors.textSecondary }]}>
                {head}
              </Text>
            ))}
          </View>
          <View style={[styles.weekRule, { backgroundColor: colors.border }]} />

          <View style={styles.grid}>
            {cells.map((iso, index) => {
              if (!iso) return <View key={`blank-${index}`} style={styles.cell} />;
              const entries = byDate.get(iso) ?? [];
              const isSelected = iso === selected;
              const isToday = iso === todayIso();
              // At most three dots: beyond that they stop being countable anyway.
              const kinds = [...new Set(entries.map((entry) => entry.kind))].slice(0, 3);

              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayLabel(iso)}, ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(iso)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.cellInner,
                      isSelected && { backgroundColor: colors.accent },
                      !isSelected && isToday && { borderWidth: 1, borderColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        { color: isSelected ? '#071B2C' : colors.text },
                      ]}
                    >
                      {Number(iso.slice(8, 10))}
                    </Text>
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
          <Text style={[styles.dayTitle, { color: colors.text }]}>{dayLabel(selected)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add your own entry"
            onPress={() => setAdding(true)}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="add" size={18} color="#071B2C" />
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
        </View>

        {fridayMissing && selectedWeekday === 5 ? (
          <View style={[styles.warning, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              No Friday lectures are loaded yet. Check your printed timetable — this does not mean
              you are free.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading your month…</Text>
        ) : dayEntries.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            Nothing on this day. Tap Add to put something of your own here.
          </Text>
        ) : (
          dayEntries.map((entry) => {
            const meta = ENTRY_KINDS[entry.kind];
            return (
              <Pressable
                key={entry.id}
                accessibilityRole={entry.kind === 'personal' ? 'button' : 'text'}
                accessibilityLabel={
                  entry.kind === 'personal' ? `${entry.title}. Tap to remove.` : entry.title
                }
                onPress={() => (entry.kind === 'personal' ? deleteEntry(entry) : undefined)}
                style={[styles.entry, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.stripe, { backgroundColor: meta.color }]} />
                <View style={styles.entryBody}>
                  <View style={styles.entryTop}>
                    <Text style={[styles.entryKind, { color: meta.color }]}>
                      {meta.label} · {meta.note}
                    </Text>
                    <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
                      {entry.start ? `${entry.start}${entry.end ? `–${entry.end}` : ''}` : 'All day'}
                    </Text>
                  </View>
                  <Text style={[styles.entryTitle, { color: colors.text }]}>{entry.title}</Text>
                  {entry.venue ? (
                    <Text style={[styles.entryMeta, { color: colors.textSecondary }]}>{entry.venue}</Text>
                  ) : null}
                  {entry.detail ? (
                    <Text style={[styles.entryMeta, { color: colors.textSecondary }]} numberOfLines={2}>
                      {entry.detail}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
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
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  legend: { borderRadius: 16, borderWidth: 1, padding: 16 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  // Two per row at every width, so the four never reflow into a ragged 3+1.
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: '50%', paddingRight: 8 },
  legendCopy: { flex: 1 },
  // Nudged down to sit on the label's first line rather than floating above it.
  swatch: { width: 12, height: 12, borderRadius: 3, marginTop: 3 },
  legendLabel: { fontSize: 12, fontWeight: '800' },
  legendNote: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  legendRule: { height: StyleSheet.hairlineWidth, marginTop: 16, marginBottom: 12 },
  legendBlurb: { fontSize: 12, lineHeight: 18 },
  streamBlock: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  streamRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '700' },
  monthCard: { borderRadius: 20, borderWidth: 1, padding: 14 },
  monthHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthTitle: { fontSize: 17, fontWeight: '800' },
  weekHead: { flexDirection: 'row', paddingBottom: 8 },
  weekHeadText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800' },
  weekRule: { height: StyleSheet.hairlineWidth, marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  // minWidth/minHeight rather than fixed width/height: with the app's font scaling turned up, a
  // hard 34px box clipped two-digit dates.
  cellInner: {
    minWidth: 34,
    minHeight: 34,
    paddingHorizontal: 4,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { fontSize: 13, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 3, height: 8, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  dayTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 14, minHeight: 38 },
  addLabel: { color: '#071B2C', fontSize: 13, fontWeight: '800' },
  warning: { flexDirection: 'row', gap: 8, borderRadius: 14, borderWidth: 1, padding: 12 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
  empty: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingVertical: 24 },
  entry: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  stripe: { width: 5 },
  entryBody: { flex: 1, padding: 14 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  entryKind: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  entryTime: { fontSize: 11, fontWeight: '700' },
  entryTitle: { fontSize: 15, fontWeight: '800' },
  entryMeta: { fontSize: 12, lineHeight: 17, marginTop: 3 },
});
