import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { fetchWithOfflineFallback } from '../lib/offlineData';
import { useTheme } from '../theme/ThemeContext';
import { PageHeader } from './PageHeader';
import { CampusActionButton as LinkButton } from './CampusActionButton';
import { ScaledText as Text } from './ScaledText';
import { ShameResilientBanner } from './ShameResilientBanner';

export type SportGymTab = 'sport' | 'gym';

type SportItem = {
  id: string;
  kind: 'club' | 'facility' | 'gym';
  name: string;
  campus: string;
  venue: string;
  description: string;
  schedule: string;
  cost: string;
  steps: string[];
  bring: string;
  contactName: string;
  email: string;
  phone: string;
  link: string;
  sortOrder: number;
};

const str = (value: unknown) => String(value ?? '').trim();

const TABS: { key: SportGymTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'sport', label: 'Sport', icon: 'football-outline' },
  { key: 'gym', label: 'Gym', icon: 'barbell-outline' },
];

// One step per line; a leading "1." the coordinator typed is dropped so numbers are not doubled.
const toSteps = (value: unknown) =>
  str(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean);

function mapSport(row: Record<string, unknown>): SportItem | null {
  const name = str(row.name);
  if (!name || row.is_active === false) return null;
  const kind = str(row.kind);
  return {
    id: str(row.item_id ?? name),
    kind: kind === 'gym' || kind === 'facility' ? kind : 'club',
    name,
    campus: str(row.campus),
    venue: str(row.venue),
    description: str(row.description),
    schedule: str(row.schedule),
    cost: str(row.cost),
    steps: toSteps(row.how_to_join),
    bring: str(row.what_to_bring),
    contactName: str(row.contact_name),
    email: str(row.contact_email),
    phone: str(row.contact_phone),
    link: str(row.link_url),
    sortOrder: Number(row.sort_order) || 0,
  };
}

const safeOpen = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

export function SportGym({ initialTab = 'sport', focusId = '' }: { initialTab?: SportGymTab; focusId?: string }) {
  const { colors } = useTheme();
  const router = useRouter();

  const [tab, setTab] = useState<SportGymTab>(initialTab);
  const [sport, setSport] = useState<SportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(focusId ? [focusId] : []));

  // A search result can send the student to a particular tab.
  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => {
    if (focusId) setOpenIds((current) => new Set(current).add(focusId));
  }, [focusId]);

  const load = useCallback(async () => {
    const sportResult = await fetchWithOfflineFallback('sport_recreation');
    const rows = (result: { data: unknown }) => (Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : []);

    setSport(
      rows(sportResult)
        .map(mapSport)
        .filter((item): item is SportItem => item !== null)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    );
    setOffline(Boolean(sportResult.fromCache));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const gymItems = sport.filter((item) => item.kind === 'gym');
  const sportItems = sport.filter((item) => item.kind !== 'gym');

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const showOnMap = (place: string) => router.push({ pathname: '/(student)/map', params: { q: place } } as never);

  const card = { backgroundColor: colors.surface, borderColor: colors.border };

  const renderSteps = (steps: string[]) => (
    <View style={[styles.steps, { backgroundColor: colors.card }]}>
      {steps.map((step, index) => (
        <View key={`${index}-${step}`} style={styles.stepRow}>
          <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
            <Text style={[styles.stepNumberText, { color: colors.text }]}>{index + 1}</Text>
          </View>
          <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
        </View>
      ))}
    </View>
  );

  const renderContact = (item: SportItem) => {
    const hasContact = item.contactName || item.email || item.phone;
    if (!hasContact) return null;
    return (
      <View style={styles.block}>
        <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>WHO TO ASK</Text>
        {item.contactName ? <Text style={[styles.body, { color: colors.text }]}>{item.contactName}</Text> : null}
        <View style={styles.actions}>
          {item.email ? <LinkButton icon="mail-outline" label="Email" onPress={() => safeOpen(`mailto:${item.email}`)} /> : null}
          {item.phone ? <LinkButton icon="call-outline" label="Call" onPress={() => safeOpen(`tel:${item.phone.replace(/\s+/g, '')}`)} /> : null}
        </View>
      </View>
    );
  };

  const renderSport = (item: SportItem) => {
    const open = openIds.has(item.id);
    const focused = focusId === item.id;
    const icon: keyof typeof Ionicons.glyphMap = item.kind === 'facility' ? 'business-outline' : 'football-outline';
    return (
      <View key={item.id} style={[styles.card, card, focused && { borderColor: colors.accent, borderWidth: 2 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={item.name}
          onPress={() => toggle(item.id)}
          style={styles.eventHead}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
            <Ionicons name={icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.eventCopy}>
            <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {[item.kind === 'facility' ? 'Facility' : 'Sport / club', item.campus, item.venue].filter(Boolean).join('  ·  ')}
            </Text>
          </View>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </Pressable>

        {open ? (
          <View style={styles.details}>
            {item.description ? <Text style={[styles.body, { color: colors.text }]}>{item.description}</Text> : null}
            {item.schedule ? (
              <View style={styles.block}>
                <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>WHEN</Text>
                <Text style={[styles.body, { color: colors.text }]}>{item.schedule}</Text>
              </View>
            ) : null}
            {item.cost ? (
              <View style={styles.block}>
                <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>COST</Text>
                <Text style={[styles.body, { color: colors.text }]}>{item.cost}</Text>
              </View>
            ) : null}
            {item.steps.length ? (
              <View style={styles.block}>
                <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>HOW TO JOIN</Text>
                {renderSteps(item.steps)}
              </View>
            ) : null}
            {renderContact(item)}
            <View style={styles.actions}>
              {item.venue ? <LinkButton icon="location-outline" label="Show me where" primary onPress={() => showOnMap(item.venue)} /> : null}
              {item.link ? <LinkButton icon="open-outline" label="More info" onPress={() => safeOpen(item.link)} /> : null}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderGym = (item: SportItem) => (
    <View key={item.id} style={[styles.card, card, focusId === item.id && { borderColor: colors.accent, borderWidth: 2 }]}>
      <View style={styles.gymHead}>
        <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
          <Ionicons name="barbell-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.eventCopy}>
          <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{[item.campus, item.venue].filter(Boolean).join('  ·  ') || 'Gym'}</Text>
        </View>
      </View>

      <View style={styles.details}>
        {item.description ? <Text style={[styles.body, { color: colors.text }]}>{item.description}</Text> : null}
        {item.steps.length ? (
          <View style={styles.block}>
            <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>HOW TO SIGN UP</Text>
            {renderSteps(item.steps)}
          </View>
        ) : null}
        {item.cost ? (
          <View style={styles.block}>
            <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>COST</Text>
            <Text style={[styles.body, { color: colors.text }]}>{item.cost}</Text>
          </View>
        ) : null}
        {item.schedule ? (
          <View style={styles.block}>
            <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>OPENING HOURS</Text>
            <Text style={[styles.body, { color: colors.text }]}>{item.schedule}</Text>
          </View>
        ) : null}
        {item.bring ? (
          <View style={styles.block}>
            <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>WHAT TO BRING</Text>
            <Text style={[styles.body, { color: colors.text }]}>{item.bring}</Text>
          </View>
        ) : null}
        {renderContact(item)}
        <View style={styles.actions}>
          {item.link ? <LinkButton icon="open-outline" label="Sign up online" primary onPress={() => safeOpen(item.link)} /> : null}
          {item.venue ? <LinkButton icon="location-outline" label="Show me where" onPress={() => showOnMap(item.venue)} /> : null}
        </View>
      </View>
    </View>
  );

  const empty = (message: string) => <ShameResilientBanner message={message} type="info" />;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
    >
      <PageHeader
        eyebrow="SPORT & RECREATION"
        title="Sport & gym"
        subtitle="Find a sport or club, and learn how to sign up for the gym."
        showBack
        backFallback="/(student)"
      />

      {offline ? <ShameResilientBanner message="You are offline, so this may be out of date. It will refresh when you are back online." type="info" /> : null}

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
      ) : tab === 'sport' ? (
        <>
          {gymItems.length ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See how to sign up for the gym"
              onPress={() => setTab('gym')}
              style={({ pressed }) => [styles.gymCallout, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="barbell-outline" size={22} color={colors.text} />
              <View style={styles.eventCopy}>
                <Text style={[styles.calloutTitle, { color: colors.text }]}>Want to join the gym?</Text>
                <Text style={[styles.calloutSub, { color: colors.text }]}>See how to sign up</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.text} />
            </Pressable>
          ) : null}
          {sportItems.length ? sportItems.map(renderSport) : empty('Sports and clubs have not been added yet. Check back soon.')}
        </>
      ) : gymItems.length ? (
        gymItems.map(renderGym)
      ) : (
        empty('Gym sign-up details have not been added yet. Ask at the Sport office or your buddy in the meantime.')
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
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 72 },
  gymHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 8 },
  iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eventCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  details: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 2, gap: 8 },
  body: { fontSize: 14, lineHeight: 21 },
  block: { marginTop: 4 },
  blockLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  steps: { borderRadius: 12, padding: 12, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  gymCallout: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 12 },
  calloutTitle: { fontSize: 15, fontWeight: '800' },
  calloutSub: { fontSize: 12, opacity: 0.8, marginTop: 2 },
});
