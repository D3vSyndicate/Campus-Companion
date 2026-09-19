import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { fetchWithOfflineFallback } from '../lib/offlineData';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Shift = 'morning' | 'afternoon' | 'night';

type Shuttle = {
  id: string;
  shift: Shift;
  route: string;
  pickup: string;
  dropoff: string;
  time: string; // HH:MM
  days: string;
  notes: string;
};

const SHIFTS: { key: Shift; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'morning', icon: 'sunny-outline' },
  { key: 'afternoon', icon: 'partly-sunny-outline' },
  { key: 'night', icon: 'moon-outline' },
];

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

  useEffect(() => {
    void (async () => {
      const { data, error } = await fetchWithOfflineFallback('shuttle_times');
      if (error) console.error('Failed to load shuttle times.', error);

      setShuttles(
        (Array.isArray(data) ? data : [])
          .map((row) => {
            const item = row as Record<string, unknown>;
            return {
              id: str(item.shuttle_id),
              shift: str(item.shift) as Shift,
              route: str(item.route_name),
              pickup: str(item.pickup_point),
              dropoff: str(item.dropoff_point),
              time: str(item.departure_time).slice(0, 5),
              days: str(item.days),
              notes: str(item.notes),
              active: item.is_active !== false,
            };
          })
          .filter((shuttle) => shuttle.active && /^\d{2}:\d{2}$/.test(shuttle.time))
          .sort((a, b) => a.time.localeCompare(b.time)),
      );
    })();
  }, []);

  // Earliest departure still to come today, or the first one tomorrow.
  const next = useMemo(() => {
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const later = shuttles.find((shuttle) => toMinutes(shuttle.time) >= minutesNow);
    return later ? { shuttle: later, tomorrow: false } : shuttles[0] ? { shuttle: shuttles[0], tomorrow: true } : null;
  }, [shuttles]);

  if (!shuttles.length) return null;

  const visible = shuttles.filter((shuttle) => shuttle.shift === shift);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.card }]}>
          <Ionicons name="bus-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>{t('common.shuttleTitle')}</Text>
          {next ? (
            <Text style={[styles.next, { color: colors.textSecondary }]}>
              {next.tomorrow
                ? t('common.shuttleTomorrow', { time: next.shuttle.time })
                : t('common.shuttleNext', { time: next.shuttle.time, route: next.shuttle.route })}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.tabs}>
        {SHIFTS.map(({ key, icon }) => {
          const selected = key === shift;
          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setShift(key)}
              style={[
                styles.tab,
                { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.card },
              ]}
            >
              <Ionicons name={icon} size={14} color={selected ? '#071B2C' : colors.textSecondary} />
              <Text style={[styles.tabText, { color: selected ? '#071B2C' : colors.text }]}>{t(`common.shift_${key}`)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('common.shuttleNoneInShift')}</Text>
      ) : (
        visible.map((shuttle) => (
          <View key={shuttle.id} style={[styles.row, { borderTopColor: colors.border }]}>
            <Text style={[styles.time, { color: colors.text }]}>{shuttle.time}</Text>
            <View style={styles.rowText}>
              <Text style={[styles.route, { color: colors.text }]}>{shuttle.route}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {[shuttle.pickup && shuttle.dropoff ? `${shuttle.pickup} → ${shuttle.dropoff}` : '', shuttle.days]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {shuttle.notes ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{shuttle.notes}</Text> : null}
            </View>
          </View>
        ))
      )}
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
  tabs: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 6 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingVertical: 8 },
  tabText: { fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 13, lineHeight: 19, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  time: { fontSize: 18, fontWeight: '800', minWidth: 58 },
  rowText: { flex: 1 },
  route: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});
