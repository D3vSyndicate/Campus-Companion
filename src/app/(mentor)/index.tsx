import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAuth } from '../../context/AuthContext';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

// id picks the wording: buddy.actions.<id>.title and .text. Two of them reuse shared wording.
type Action = { id: string; route: string; icon: keyof typeof Ionicons.glyphMap };

const ACTIONS: Action[] = [
  { id: 'myTribe', route: '/(mentor)/mentorGroup', icon: 'chatbubbles-outline' },
  { id: 'search', route: '/(mentor)/search', icon: 'search-outline' },
  { id: 'answers', route: '/(mentor)/faqs', icon: 'help-circle-outline' },
  { id: 'announcements', route: '/(mentor)/announcements', icon: 'megaphone-outline' },
  { id: 'schedule', route: '/(mentor)/schedule', icon: 'calendar-outline' },
  { id: 'map', route: '/(mentor)/map', icon: 'map-outline' },
  { id: 'venues', route: '/(mentor)/venues', icon: 'location-outline' },
  { id: 'refer', route: '/(mentor)/refer', icon: 'hand-left-outline' },
  { id: 'emergency', route: '/(mentor)/emergency', icon: 'call-outline' },
  { id: 'guide', route: '/(mentor)/guide', icon: 'book-outline' },
];

// Where each action gets its title. Most have their own; two reuse wording used elsewhere.
const ACTION_TITLE: Record<string, string> = {
  schedule: 'common.scheduleTitleShort',
  emergency: 'emergency.title',
};

type Session = { id: string; title: string; time: string; venue: string };

const pad = (value: number) => String(value).padStart(2, '0');
const localIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function BuddyHome() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  // Which heading to show, kept as data so it changes language with the rest of the screen.
  const [comingUp, setComingUp] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [scheduleResult, venueResult] = await Promise.all([
      fetchWithOfflineFallback('schedule_items'),
      fetchWithOfflineFallback('Venue'),
    ]);

    const venues = new Map(
      (Array.isArray(venueResult.data) ? venueResult.data : []).map((venue: Record<string, unknown>) => [
        String(venue.venue_id),
        String(venue.venue_name ?? ''),
      ]),
    );

    const today = localIsoDate(new Date());
    const upcoming = (Array.isArray(scheduleResult.data) ? scheduleResult.data : [])
      .map((row: Record<string, unknown>) => ({
        id: String(row.id ?? ''),
        date: String(row.date ?? ''),
        title: String(row.title ?? ''),
        time: String(row.start_time ?? '').slice(0, 5),
        venue: venues.get(String(row.venue_id)) ?? '',
      }))
      .filter((item) => item.date >= today)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    // Today's sessions, or the next day that has any.
    const nextDate = upcoming[0]?.date;
    setComingUp(nextDate && nextDate !== today ? nextDate : null);
    setSessions(upcoming.filter((item) => item.date === nextDate).slice(0, 4));
  };

  useEffect(() => {
    void load();
  }, []);

  const metadata = user?.user_metadata ?? {};
  const name = String(metadata.full_name ?? metadata.name ?? metadata.first_name ?? '').trim();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={[styles.hero, { backgroundColor: colors.text }]}>
        <Image
          source={require('../../../assets/images/coordinator-hero.png')}
          style={styles.heroBackground}
          contentFit="fill"
        />
        <View style={styles.heroOverlay} />
        <Text style={[styles.eyebrow, { color: colors.accent }]}>{t('buddy.eyebrow')}</Text>
        <Text style={[styles.heroTitle, { color: '#FFFFFF' }]}>{name ? t('buddy.hi', { name }) : t('buddy.hiThere')}</Text>
        <Text style={[styles.heroText, { color: '#FFFFFF' }]}>
          {t('buddy.heroText')}
        </Text>
      </View>

      <ShameResilientBanner message={t('buddy.banner')} type="encouragement" />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{comingUp ? t('buddy.comingUp', { date: comingUp }) : t('buddy.todaySessions')}</Text>
      {sessions.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('buddy.noSessions')}</Text>
      ) : (
        sessions.map((session) => (
          <View key={session.id} style={[styles.session, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sessionTime, { color: colors.text }]}>{session.time || '--:--'}</Text>
            <View style={styles.sessionText}>
              <Text style={[styles.sessionTitle, { color: colors.text }]}>{session.title}</Text>
              {session.venue ? <Text style={[styles.muted, { color: colors.textSecondary }]}>{session.venue}</Text> : null}
            </View>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('common.whatNeed')}</Text>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          onPress={() => router.push(action.route as never)}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.card }]}>
            <Ionicons name={action.icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>{t(ACTION_TITLE[action.id] ?? `buddy.actions.${action.id}.title`)}</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{t(`buddy.actions.${action.id}.text`)}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.accent} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  hero: { position: 'relative', overflow: 'hidden', borderRadius: 24, padding: 22, marginBottom: 6, minHeight: 348 },
  heroBackground: { ...StyleSheet.absoluteFill },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 19, 29, 0.28)' },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  heroText: { fontSize: 14, lineHeight: 21, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  muted: { fontSize: 13, lineHeight: 19 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 8 },
  sessionTime: { fontSize: 17, fontWeight: '800', minWidth: 56 },
  sessionText: { flex: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '700' },
  action: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
});
