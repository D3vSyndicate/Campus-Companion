import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { fetchShuttleRows, ruleKey, SHUTTLE_CAMPUS, SHUTTLE_RULES, SHUTTLE_YEAR } from '../../lib/shuttle';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { useTranslation } from 'react-i18next';

// Learn Your Shuttles — the times, plus the things nobody tells a first-year until they have
// already been turned away at the door.
//
// Times and rules come from lib/shuttle, the same source the Home shuttle card and the search
// screen use: staff-maintained rows from shuttle_times when the database has a real timetable,
// otherwise the published schedule that ships inside the app. Keeping all three screens on one
// source is the point — a student who sees 07:45 on Home must not see 06:45 here.

type Shift = 'morning' | 'afternoon' | 'night';

interface RouteGroup {
  name: string;
  detail: string;
  times: string[];
}

// Written to sound like a person, not a noticeboard. A first-year reading this is often anxious
// about getting somewhere on time, and a timetable that speaks kindly costs nothing.
const SHIFTS: { key: Shift; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'morning', icon: 'sunny-outline' },
  { key: 'afternoon', icon: 'partly-sunny-outline' },
  { key: 'night', icon: 'moon-outline' },
];

// Advice that is not already covered by the official rules below, so nothing is said twice.
// The words are in the locale files under shuttleGuide.advice.<id>.
const ADVICE: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'lost', icon: 'navigate-outline' },
  { id: 'last', icon: 'time-outline' },
];

const str = (value: unknown) => String(value ?? '').trim();

// "Korsten (PSA 163 Durban Rd)" -> name "Korsten", landmark "PSA 163 Durban Rd".
// "Kalinga House - Richmond Hill" -> name "Kalinga House", landmark "Richmond Hill".
// The landmark is what actually tells a student where to stand, so it gets its own line rather
// than being buried in a long single-line route name.
function splitRouteName(route: string): { name: string; detail: string } {
  const parens = route.match(/^(.*?)\s*\((.+)\)\s*$/);
  if (parens) return { name: parens[1].trim(), detail: parens[2].trim() };

  const dashed = route.split(' - ');
  if (dashed.length === 2) return { name: dashed[0].trim(), detail: dashed[1].trim() };

  return { name: route, detail: '' };
}

const currentShift = (now: Date): Shift => {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
};

export function LearnYourShuttles() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [shift, setShift] = useState<Shift>(() => currentShift(new Date()));

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await fetchShuttleRows();
      if (!active) return;
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // One card per route with its times gathered onto it — a student thinks "when does my stop go?",
  // not "what leaves at 07:45?".
  const routes = useMemo(() => {
    const grouped = new Map<string, RouteGroup>();

    for (const row of rows) {
      if (str(row.shift) !== shift) continue;
      const route = str(row.route_name);
      const time = str(row.departure_time).slice(0, 5);
      if (!route || !time) continue;

      const existing = grouped.get(route);
      if (existing) existing.times.push(time);
      else grouped.set(route, { ...splitRouteName(route), times: [time] });
    }

    return [...grouped.values()]
      .map((entry) => ({ ...entry, times: [...new Set(entry.times)].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, shift]);

  const activeShift = SHIFTS.find((option) => option.key === shift);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow={t('home.cards.shuttles.title')}
          title={t('shuttleGuide.title')}
          subtitle={t('shuttleGuide.subtitle')}
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        <View style={[styles.cardRule, { backgroundColor: colors.accent }]}>
          <Ionicons name="card-outline" size={20} color="#071B2C" />
          <Text style={styles.cardRuleText}>
            {t('shuttleGuide.cardRule')}
          </Text>
        </View>

        <View style={styles.shiftRow}>
          {SHIFTS.map((option) => {
            const active = shift === option.key;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setShift(option.key)}
                style={({ pressed }) => [
                  styles.shiftTab,
                  {
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color={active ? '#071B2C' : colors.textSecondary}
                />
                <Text style={[styles.shiftLabel, { color: active ? '#071B2C' : colors.textSecondary }]}>
                  {t(`shuttleGuide.shift.${option.key}.label`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.shiftHint, { color: colors.textSecondary }]}>{activeShift ? t(`shuttleGuide.shift.${activeShift.key}.hint`) : null}</Text>

        {loading ? (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('shuttleGuide.loading')}</Text>
        ) : routes.length === 0 ? (
          <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noticeTitle, { color: colors.text }]}>{t('shuttleGuide.nothing')}</Text>
            <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>
              {t('shuttleGuide.nothingText')}
            </Text>
          </View>
        ) : (
          routes.map((route) => (
            <View
              key={route.name + route.detail}
              style={[styles.route, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.routeName, { color: colors.text }]}>{route.name}</Text>
              {route.detail ? (
                <Text style={[styles.routeLeg, { color: colors.textSecondary }]}>{route.detail}</Text>
              ) : null}
              <View style={[styles.routeRule, { backgroundColor: colors.border }]} />
              <View style={styles.times}>
                {route.times.map((time) => (
                  <View key={time} style={[styles.timePill, { backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('shuttleGuide.openMap')}
          onPress={() => router.push('/(student)/map')}
          style={({ pressed }) => [
            styles.mapLink,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.mapIcon, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="map-outline" size={20} color={colors.accent} />
          </View>
          <View style={styles.mapCopy}>
            <Text style={[styles.mapTitle, { color: colors.text }]}>{t('shuttleGuide.findStop')}</Text>
            <Text style={[styles.mapBody, { color: colors.textSecondary }]}>
              {t('shuttleGuide.lostHelp')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('shuttle.beforeYouBoard')}</Text>

        {/* The official rules, straight from the published schedule. */}
        {SHUTTLE_RULES.map((rule) => (
          <View
            key={rule.title}
            style={[styles.advice, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <View style={styles.adviceCopy}>
              <Text style={[styles.adviceTitle, { color: colors.text }]}>{t(`shuttle.rules.${ruleKey(rule.title)}.title`, { defaultValue: rule.title })}</Text>
              <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>{t(`shuttle.rules.${ruleKey(rule.title)}.text`, { defaultValue: rule.text })}</Text>
            </View>
          </View>
        ))}

        {ADVICE.map((item) => (
          <View
            key={item.id}
            style={[styles.advice, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={item.icon} size={20} color={colors.accent} />
            <View style={styles.adviceCopy}>
              <Text style={[styles.adviceTitle, { color: colors.text }]}>{t(`shuttleGuide.advice.${item.id}.title`)}</Text>
              <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>{t(`shuttleGuide.advice.${item.id}.body`)}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          {t('shuttleGuide.footnote', { label: t('shuttle.caption', { campus: SHUTTLE_CAMPUS, year: SHUTTLE_YEAR }) })}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  cardRule: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16 },
  cardRuleText: { flex: 1, color: '#071B2C', fontSize: 13, fontWeight: '800', lineHeight: 19 },
  shiftRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  shiftTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 6,
  },
  shiftLabel: { flexShrink: 1, fontSize: 12, fontWeight: '800' },
  shiftHint: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  notice: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 6 },
  noticeTitle: { fontSize: 15, fontWeight: '800' },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  route: { borderRadius: 16, borderWidth: 1, padding: 16 },
  routeName: { fontSize: 15, fontWeight: '800' },
  routeLeg: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  routeRule: { height: StyleSheet.hairlineWidth, marginTop: 12 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  timePill: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  timeText: { fontSize: 13, fontWeight: '800' },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  mapIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  mapCopy: { flex: 1 },
  mapTitle: { fontSize: 14, fontWeight: '800' },
  mapBody: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
  },
  advice: { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, padding: 16 },
  adviceCopy: { flex: 1 },
  adviceTitle: { fontSize: 14, fontWeight: '800' },
  adviceBody: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  footnote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 10 },
});
