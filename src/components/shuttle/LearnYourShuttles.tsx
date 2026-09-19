import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  SHIFTS,
  SHUTTLE_SOURCE_NOTE,
  routesFor,
  type Shift,
} from '../../data/shuttle-data';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';

// Learn Your Shuttles — the times, plus the things nobody tells a first-year until they have
// already been turned away at the door.
//
// Times are mock data that ships with the app (src/data/shuttle-data.ts), so the screen works with
// no network and no database behind it.

const currentShift = (now: Date): Shift => {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
};

// The things that actually go wrong, written as advice rather than regulations.
const ADVICE: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'card-outline',
    title: 'Carry your student card every single day',
    body: 'You must show a valid student ID card to board, along with your proof of acceptance or registration letter. No card, no ride — so put it in the bag you always take, not the one you sometimes take.',
  },
  {
    icon: 'alarm-outline',
    title: 'Want to be early? Take the first one',
    body: 'If you need to be on campus early, take the first scheduled shuttle of the day rather than cutting it fine with a later one.',
  },
  {
    icon: 'help-buoy-outline',
    title: 'If you are not sure, ask a marshal',
    body: 'Shuttle marshals are there to help. If you do not know which shuttle is yours, ask one — that is the job. It is faster than guessing and ending up on the wrong side of the city.',
  },
  {
    icon: 'navigate-outline',
    title: 'Lost, and need to find a stop',
    body: 'Open the campus map and find the building nearest you, then walk to the stop it lists. If you are off campus and unsure, go to the nearest listed landmark stop — Feather Market Hall, Kings Beach and Central are all easy to find and ask directions to.',
  },
  {
    icon: 'people-outline',
    title: 'The last shuttle is the last one',
    body: 'Night shuttles run at 18:30, 20:30 and 22:00. Miss the 22:00 and you are arranging your own way home, so decide before 22:00 rather than at 22:05.',
  },
];

export function LearnYourShuttles() {
  const { colors } = useTheme();
  const router = useRouter();
  const [shift, setShift] = useState<Shift>(() => currentShift(new Date()));

  const routes = routesFor(shift);
  const activeShift = SHIFTS.find((option) => option.key === shift);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="Learn your shuttles"
          title="Getting around, without the guesswork"
          subtitle="When the shuttles run, what you need to board, and what to do when you are lost."
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        <View style={[styles.cardRule, { backgroundColor: colors.accent }]}>
          <Ionicons name="card-outline" size={20} color="#071B2C" />
          <Text style={styles.cardRuleText}>
            No student card, no shuttle. Carry it every day, along with your registration letter.
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
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.shiftHint, { color: colors.textSecondary }]}>{activeShift?.hint}</Text>

        {routes.map((route) => (
          <View
            key={route.id}
            style={[styles.route, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Stop name large, the landmark under it — that second line is what actually tells a
                student where to stand. */}
            <Text style={[styles.routeName, { color: colors.text }]}>{route.name}</Text>
            <Text style={[styles.routeLeg, { color: colors.textSecondary }]}>{route.detail}</Text>
            <View style={[styles.routeRule, { backgroundColor: colors.border }]} />
            <View style={styles.times}>
              {route[shift].map((time) => (
                <View key={time} style={[styles.timePill, { backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.timeText, { color: colors.text }]}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the campus map"
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
            <Text style={[styles.mapTitle, { color: colors.text }]}>Find your stop on the map</Text>
            <Text style={[styles.mapBody, { color: colors.textSecondary }]}>
              Lost? Open the campus map, find the building nearest you and walk from there.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Before you board</Text>

        {ADVICE.map((item) => (
          <View
            key={item.title}
            style={[styles.advice, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name={item.icon} size={20} color={colors.accent} />
            <View style={styles.adviceCopy}>
              <Text style={[styles.adviceTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.adviceBody, { color: colors.textSecondary }]}>{item.body}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.footnote, { color: colors.textSecondary }]}>
          {SHUTTLE_SOURCE_NOTE}
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
  },
  shiftLabel: { fontSize: 13, fontWeight: '800' },
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
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 6 },
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
