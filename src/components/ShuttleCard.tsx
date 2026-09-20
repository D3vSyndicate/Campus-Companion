import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { fetchShuttleRows, ruleKey, SHUTTLE_CAMPUS, SHUTTLE_RULES, SHUTTLE_YEAR } from '../lib/shuttle';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Shift = 'morning' | 'afternoon' | 'night';

type Shuttle = {
  id: string;
  shift: Shift;
  route: string; // the stop, for the morning and afternoon shifts
  time: string; // HH:MM
  days: string;
  notes: string;
};

const SHIFTS: { key: Shift; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'morning', icon: 'sunny-outline' },
  { key: 'afternoon', icon: 'partly-sunny-outline' },
  { key: 'night', icon: 'moon-outline' },
];

const STOP_KEY = 'shuttle:my-stop';
const str = (value: unknown) => String(value ?? '').trim();

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function currentShift(now: Date): Shift {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

export function ShuttleCard() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [shuttles, setShuttles] = useState<Shuttle[]>([]);
  const [shift, setShift] = useState<Shift>(() => currentShift(new Date()));
  const [stop, setStop] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fetchShuttleRows();
      // Shuttle times are optional: if they cannot be loaded the card is simply not shown.
      if (error) console.warn('Could not load shuttle times from the database.', error);

      setShuttles(
        data
          .map((row) => ({
            id: str(row.shuttle_id),
            shift: str(row.shift) as Shift,
            route: str(row.route_name),
            time: str(row.departure_time).slice(0, 5),
            days: str(row.days),
            notes: str(row.notes),
            active: row.is_active !== false,
          }))
          .filter((shuttle) => shuttle.active && /^\d{2}:\d{2}$/.test(shuttle.time))
          .sort((a, b) => a.time.localeCompare(b.time)),
      );

      try {
        setStop((await AsyncStorage.getItem(STOP_KEY)) ?? '');
      } catch {
        // Not remembering the stop only means choosing it again.
      }
    })();
  }, []);

  // The stops to choose from. The night shift is not tied to a stop.
  const stops = useMemo(
    () => [...new Set(shuttles.filter((shuttle) => shuttle.shift !== 'night').map((shuttle) => shuttle.route))].sort((a, b) => a.localeCompare(b)),
    [shuttles],
  );

  // A remembered stop that is no longer on the schedule is ignored.
  const myStop = stops.includes(stop) ? stop : '';

  const chooseStop = (next: string) => {
    setStop(next);
    setPickerOpen(false);
    void AsyncStorage.setItem(STOP_KEY, next).catch(() => undefined);
  };

  // Departures that matter to this student: their own stop's, plus the night shift that serves everyone.
  const mine = useMemo(() => shuttles.filter((shuttle) => shuttle.shift === 'night' || shuttle.route === myStop), [shuttles, myStop]);

  // Earliest departure still to come today, or the first one tomorrow.
  const next = useMemo(() => {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const later = mine.find((shuttle) => toMinutes(shuttle.time) >= minutesNow);
    return later ? { shuttle: later, tomorrow: false } : mine[0] ? { shuttle: mine[0], tomorrow: true } : null;
  }, [mine]);

  if (!shuttles.length) return null;

  const visible = mine.filter((shuttle) => shuttle.shift === shift);
  const notes = [...new Set(visible.flatMap((shuttle) => [shuttle.days, shuttle.notes]).filter(Boolean))];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.card }]}>
          <Ionicons name="bus-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{t('common.shuttleTitle')}</Text>
          <Text style={[styles.next, { color: colors.textSecondary }]}>
            {myStop && next
              ? next.tomorrow
                ? t('common.shuttleTomorrow', { time: next.shuttle.time })
                : t('common.shuttleNext', { time: next.shuttle.time, route: next.shuttle.shift === 'night' ? next.shuttle.route : myStop })
              : t('shuttle.chooseHint')}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={myStop ? t('shuttle.changeStop', { stop: myStop }) : t('shuttle.chooseStop')}
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [styles.stopButton, { backgroundColor: colors.card, borderColor: myStop ? colors.accent : colors.border }, pressed && styles.pressed]}
      >
        <Ionicons name="location-outline" size={18} color={colors.accent} />
        <View style={styles.stopCopy}>
          <Text style={[styles.stopLabel, { color: colors.textSecondary }]}>{t('shuttle.yourStop')}</Text>
          <Text style={[styles.stopName, { color: colors.text }]} numberOfLines={1}>{myStop || t('shuttle.chooseStop')}</Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.tabs}>
        {SHIFTS.map(({ key, icon }) => {
          const selected = key === shift;
          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setShift(key)}
              style={[styles.tab, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.card }]}
            >
              <Ionicons name={icon} size={14} color={selected ? '#071B2C' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: selected ? '#071B2C' : colors.text }]}>{t(`common.shift_${key}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {shift !== 'night' && !myStop ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('shuttle.chooseAbove')}</Text>
      ) : visible.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('common.shuttleNoneInShift')}</Text>
      ) : (
        <>
          {shift === 'night' ? <Text style={[styles.routeLine, { color: colors.text }]}>{visible[0].route}</Text> : null}
          <View style={styles.pills}>
            {visible.map((shuttle) => {
              const isNext = next?.shuttle.id === shuttle.id && !next.tomorrow;
              return (
                <View
                  key={shuttle.id}
                  accessibilityLabel={`${shuttle.time}${isNext ? `, ${t('shuttle.nextShuttle')}` : ''}`}
                  style={[styles.pill, { borderColor: isNext ? colors.accent : colors.border, backgroundColor: isNext ? colors.accent : colors.card }]}
                >
                  <Text style={[styles.pillText, { color: isNext ? '#071B2C' : colors.text }]}>{shuttle.time}</Text>
                </View>
              );
            })}
          </View>
          {notes.map((note) => (
            <Text key={note} style={[styles.meta, { color: colors.textSecondary }]}>{note}</Text>
          ))}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: rulesOpen }}
        onPress={() => setRulesOpen((open) => !open)}
        style={[styles.rulesHead, { borderTopColor: colors.border }]}
      >
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
        <Text style={[styles.rulesTitle, { color: colors.text }]}>{t('shuttle.beforeYouBoard')}</Text>
        <Ionicons name={rulesOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>

      {rulesOpen ? (
        <View style={styles.rules}>
          {SHUTTLE_RULES.map((rule) => (
            <View key={rule.title} style={styles.rule}>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>{t(`shuttle.rules.${ruleKey(rule.title)}.title`, { defaultValue: rule.title })}</Text>
              <Text style={[styles.ruleText, { color: colors.textSecondary }]}>{t(`shuttle.rules.${ruleKey(rule.title)}.text`, { defaultValue: rule.text })}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={[styles.caption, { color: colors.textSecondary }]}>{t('shuttle.caption', { campus: SHUTTLE_CAMPUS, year: SHUTTLE_YEAR })}</Text>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} accessibilityLabel={t('shuttle.closeList')} />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('shuttle.chooseStop')}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('shuttle.close')} onPress={() => setPickerOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetList}>
            {stops.map((name) => {
              const selected = name === myStop;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => chooseStop(name)}
                  style={[styles.stopRow, { borderColor: selected ? colors.accent : colors.border, backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.stopRowText, { color: colors.text }]}>{name}</Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: '800' },
  next: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  stopButton: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 14 },
  stopCopy: { flex: 1 },
  stopLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  stopName: { fontSize: 14, fontWeight: '700', marginTop: 1 },
  pressed: { opacity: 0.8 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingVertical: 8 },
  tabText: { fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 13, lineHeight: 19, paddingVertical: 8 },
  routeLine: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, minWidth: 68, alignItems: 'center' },
  pillText: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  rulesHead: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 12 },
  rulesTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  rules: { marginTop: 8, gap: 10 },
  rule: {},
  ruleTitle: { fontSize: 13, fontWeight: '800' },
  ruleText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  caption: { fontSize: 11, marginTop: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 16, paddingBottom: 24 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetList: { gap: 8 },
  stopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  stopRowText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
