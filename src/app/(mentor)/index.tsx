import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAuth } from '../../context/AuthContext';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

type Action = { route: string; icon: keyof typeof Ionicons.glyphMap; title: string; text: string };

const ACTIONS: Action[] = [
  { route: '/(mentor)/mentorGroup/index', icon: 'chatbubbles-outline', title: 'My Tribe', text: 'Chat with the first-years in your group.' },
  { route: '/(mentor)/search', icon: 'search-outline', title: 'Search', text: 'Find answers, sessions, contacts and venues fast.' },
  { route: '/(mentor)/faqs', icon: 'help-circle-outline', title: 'Quick answers', text: 'Find and share answers to common questions.' },
  { route: '/(mentor)/announcements', icon: 'megaphone-outline', title: 'Announcements', text: 'Know what students are being told.' },
  { route: '/(mentor)/schedule', icon: 'calendar-outline', title: 'Orientation schedule', text: 'Where students need to be, and when.' },
  { route: '/(mentor)/map', icon: 'map-outline', title: 'Campus map', text: 'Find any building and show first-years the way.' },
  { route: '/(mentor)/venues', icon: 'location-outline', title: 'Venue guide', text: 'Directions you can give with confidence.' },
  { route: '/(mentor)/refer', icon: 'hand-left-outline', title: 'Refer a student', text: 'Who to point students to for each kind of help.' },
  { route: '/(mentor)/emergency', icon: 'call-outline', title: 'Emergency contacts', text: 'Numbers to share when a student needs urgent help.' },
  { route: '/(mentor)/guide', icon: 'book-outline', title: 'Buddy guide', text: 'Kind wording, your boundaries and a first-week checklist.' },
];

type Session = { id: string; title: string; time: string; venue: string };

const pad = (value: number) => String(value).padStart(2, '0');
const localIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function BuddyHome() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [heading, setHeading] = useState("Today's sessions");
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
    setHeading(nextDate && nextDate !== today ? `Coming up on ${nextDate}` : "Today's sessions");
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
        <Text style={[styles.eyebrow, { color: colors.accent }]}>FYS BUDDY</Text>
        <Text style={[styles.heroTitle, { color: '#FFFFFF' }]}>{name ? `Hi ${name}` : 'Hi there'}, thank you for being a buddy</Text>
        <Text style={[styles.heroText, { color: '#FFFFFF' }]}>
          You are the friendly face that makes a first-year feel they belong. You do not need to know everything. You just need to know where to point.
        </Text>
      </View>

      <ShameResilientBanner message="Many new students ask the questions they think are obvious. Treat every question as a good one." type="encouragement" />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{heading}</Text>
      {sessions.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>No sessions are scheduled yet. Check the orientation schedule again soon.</Text>
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>What do you need?</Text>
      {ACTIONS.map((action) => (
        <Pressable
          key={action.route}
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
            <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{action.text}</Text>
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
