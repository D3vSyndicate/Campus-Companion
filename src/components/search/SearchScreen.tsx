import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { highlight, prepare, search, snippet, type PreparedDoc, type SearchDoc, type SearchHit, type SearchKind } from '../../lib/search';
import { buildSearchDocs } from '../../lib/searchDocs';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import { ShameResilientBanner } from '../ShameResilientBanner';

export type SearchArea = 'student' | 'mentor';

// Each role keeps to its own screens, so a result never sends someone somewhere they cannot go.
const ROUTES = {
  student: { home: '/(student)', schedule: '/(student)/schedule', faqs: '/(student)/faqs', support: '/(student)/contacts', map: '/(student)/map', guides: '/(student)/digital' },
  mentor: { home: '/(mentor)', schedule: '/(mentor)/schedule', faqs: '/(mentor)/faqs', support: '/(mentor)/refer', map: '/(mentor)/map', guides: null },
} as const;

const KIND_META: Record<SearchKind, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  faq: { label: 'Answers', icon: 'help-circle-outline', color: '#2563EB' },
  support: { label: 'Getting help', icon: 'hand-left-outline', color: '#0F766E' },
  schedule: { label: 'Schedule', icon: 'calendar-outline', color: '#7C3AED' },
  venue: { label: 'Venues', icon: 'location-outline', color: '#D98E04' },
  place: { label: 'Campus buildings', icon: 'business-outline', color: '#64748B' },
  contact: { label: 'People to contact', icon: 'people-outline', color: '#EA580C' },
  guide: { label: 'Digital guides', icon: 'laptop-outline', color: '#0891B2' },
};

const POPULAR = ['Wi-Fi', 'Printing', 'Funda', 'Student email', 'Library', 'Registration', 'Counselling', 'Clinic'];
const RECENT_KEY = 'search:recent';
const GROUP_PREVIEW = 3;
const ink = '#071B2C';

const pad = (value: number) => String(value).padStart(2, '0');
const localIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

type Action = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; primary?: boolean };

// ---- Small pieces ------------------------------------------------------------------------------

// Shows the words the student typed in bold.
function Highlighted({ text, tokens, style }: { text: string; tokens: string[]; style: object }) {
  const segments = useMemo(() => highlight(text, tokens), [text, tokens]);
  return (
    <Text style={style}>
      {segments.map((segment, index) =>
        segment.match ? (
          <NativeText key={index} style={styles.match}>
            {segment.text}
          </NativeText>
        ) : (
          segment.text
        ),
      )}
    </Text>
  );
}

function ActionButton({ action }: { action: Action }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.action,
        action.primary ? { backgroundColor: colors.accent } : { borderColor: colors.border, borderWidth: 1 },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Ionicons name={action.icon} size={16} color={action.primary ? ink : colors.text} />
      <Text style={[styles.actionText, { color: action.primary ? ink : colors.text }]}>{action.label}</Text>
    </Pressable>
  );
}

function ResultCard({
  hit,
  tokens,
  expanded,
  onToggle,
  actions,
}: {
  hit: SearchHit;
  tokens: string[];
  expanded: boolean;
  onToggle: () => void;
  actions: Action[];
}) {
  const { colors } = useTheme();
  const { doc } = hit;
  const meta = KIND_META[doc.kind];
  const body = doc.body ?? '';
  const long = body.length > 150;
  const shown = expanded || !long ? body : snippet(body, tokens);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.kindIcon, { backgroundColor: meta.color }]}>
          <Ionicons name={meta.icon} size={17} color="#FFFFFF" />
        </View>
        <View style={styles.cardTitleBlock}>
          <Highlighted text={doc.title} tokens={tokens} style={[styles.cardTitle, { color: colors.text }]} />
          {doc.subtitle ? <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{doc.subtitle}</Text> : null}
        </View>
      </View>

      {shown ? <Highlighted text={shown} tokens={tokens} style={[styles.cardBody, { color: colors.textSecondary }]} /> : null}

      {long ? (
        <Pressable accessibilityRole="button" onPress={onToggle} hitSlop={8}>
          <Text style={[styles.readMore, { color: colors.text }]}>{expanded ? 'Show less' : doc.kind === 'faq' ? 'Read the whole answer' : 'Read more'}</Text>
        </Pressable>
      ) : null}

      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ label, count, active, onPress }: { label: string; count?: number; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.accent : colors.border }]}
    >
      <Text style={[styles.chipText, { color: active ? ink : colors.text }]}>
        {label}
        {count !== undefined ? ` ${count}` : ''}
      </Text>
    </Pressable>
  );
}

// ---- The screen -------------------------------------------------------------------------------

export function SearchScreen({ area, initialQuery = '' }: { area: SearchArea; initialQuery?: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routes = ROUTES[area];
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery);
  const [prepared, setPrepared] = useState<PreparedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [kindFilter, setKindFilter] = useState<SearchKind | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<SearchKind>>(new Set());
  const [recent, setRecent] = useState<string[]>([]);

  // ---- Load everything once. Saved copies are used when the connection drops. ------------------

  useEffect(() => {
    let active = true;

    void (async () => {
      const includeGuides = area === 'student';
      const names = ['FAQ', 'Support_pathway', 'Contact', 'Venue', 'schedule_items', ...(includeGuides ? ['digital_readiness'] : [])];
      const results = await Promise.all(names.map((name) => fetchWithOfflineFallback(name)));
      if (!active) return;

      const rows = (index: number): Record<string, unknown>[] => (Array.isArray(results[index]?.data) ? (results[index].data as Record<string, unknown>[]) : []);
      // Only the core tables decide whether to say "offline". A guide table that is not set up yet is not a connection problem.
      setOffline(results.slice(0, 5).some((result) => result.fromCache && Boolean(result.error)));

      const docs = buildSearchDocs(
        {
          faqs: rows(0),
          support: rows(1),
          contacts: rows(2),
          venues: rows(3),
          schedule: rows(4),
          guides: includeGuides ? rows(5) : [],
          today: localIsoDate(new Date()),
        },
        { includeGuides },
      );
      setPrepared(prepare(docs));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [area]);

  // A link such as /search?q=wifi opens the screen already searching.
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_KEY);
        if (saved) setRecent(JSON.parse(saved) as string[]);
      } catch {
        // Recent searches are a convenience only.
      }
    })();
  }, []);

  const remember = useCallback((text: string) => {
    const value = text.trim();
    if (value.length < 2) return;
    setRecent((current) => {
      const next = [value, ...current.filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 5);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const forgetRecent = () => {
    setRecent([]);
    AsyncStorage.removeItem(RECENT_KEY).catch(() => undefined);
  };

  // ---- Searching ------------------------------------------------------------------------------

  const trimmed = query.trim();
  const { hits, tokens } = useMemo(() => (trimmed ? search(prepared, trimmed) : { hits: [] as SearchHit[], tokens: [] as string[] }), [prepared, trimmed]);

  const fullHits = hits.filter((hit) => !hit.partial);
  const closestOnly = fullHits.length === 0 && hits.length > 0;
  const shownHits = closestOnly ? hits : fullHits;

  const groups = useMemo(() => {
    const byKind = new Map<SearchKind, SearchHit[]>();
    for (const hit of shownHits) byKind.set(hit.doc.kind, [...(byKind.get(hit.doc.kind) ?? []), hit]);
    // The type with the best match comes first.
    return [...byKind.entries()].sort((a, b) => b[1][0].score - a[1][0].score);
  }, [shownHits]);

  const visibleGroups = kindFilter === 'all' ? groups : groups.filter(([kind]) => kind === kindFilter);

  // ---- What each result lets you do next -------------------------------------------------------

  const go = (pathname: string, params?: Record<string, string>) => {
    remember(trimmed);
    router.push((params ? { pathname, params } : pathname) as never);
  };

  const actionsFor = (doc: SearchDoc): Action[] => {
    const list: Action[] = [];

    switch (doc.kind) {
      case 'faq':
        list.push({ label: 'See it in FAQs', icon: 'open-outline', primary: true, onPress: () => go(routes.faqs, { category: doc.data.question }) });
        break;
      case 'support':
        if (doc.data.relatedFaq) list.push({ label: 'Related questions', icon: 'help-circle-outline', primary: true, onPress: () => go(routes.faqs, { category: doc.data.relatedFaq }) });
        list.push({ label: 'Open help options', icon: 'hand-left-outline', primary: !doc.data.relatedFaq, onPress: () => go(routes.support) });
        break;
      case 'schedule':
        if (doc.data.venue) list.push({ label: 'Show me where', icon: 'location-outline', primary: true, onPress: () => go(routes.map, { q: doc.data.venue }) });
        list.push({ label: 'Open schedule', icon: 'calendar-outline', primary: !doc.data.venue, onPress: () => go(routes.schedule) });
        break;
      case 'venue':
      case 'place':
        list.push({ label: 'Show me where', icon: 'location-outline', primary: true, onPress: () => go(routes.map, { q: doc.data.name }) });
        if (doc.kind === 'venue' && /^https?:\/\//i.test(doc.data.mapLink ?? '')) {
          list.push({ label: 'Online map', icon: 'globe-outline', onPress: () => void Linking.openURL(doc.data.mapLink) });
        }
        break;
      case 'contact':
        if (doc.data.email) list.push({ label: 'Email', icon: 'mail-outline', primary: true, onPress: () => { remember(trimmed); void Linking.openURL(`mailto:${doc.data.email}`); } });
        else list.push({ label: 'Open help options', icon: 'hand-left-outline', primary: true, onPress: () => go(routes.support) });
        break;
      case 'guide':
        if (routes.guides) list.push({ label: 'Open the guide', icon: 'laptop-outline', primary: true, onPress: () => go(routes.guides, { guide: doc.data.id || doc.data.title }) });
        break;
    }

    return list;
  };

  const toggleExpanded = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (kind: SearchKind) =>
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace(routes.home as never);
  };

  const useSuggestion = (text: string) => {
    setQuery(text);
    setKindFilter('all');
    remember(text);
  };

  // ---- What to show -----------------------------------------------------------------------------

  let body: ReactNode;

  if (loading) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Getting everything ready to search...</Text>
      </View>
    );
  } else if (!trimmed) {
    body = (
      <View>
        <Text style={[styles.heading, { color: colors.text }]}>What do you need to find?</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Search the schedule, answers, contacts, venues and buildings, and help options in one place. Many new students search for the same things.
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Popular searches</Text>
        <View style={styles.chipRow}>
          {POPULAR.map((text) => (
            <Chip key={text} label={text} active={false} onPress={() => useSuggestion(text)} />
          ))}
        </View>

        {recent.length ? (
          <View>
            <View style={styles.recentHeader}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Recent</Text>
              <Pressable accessibilityRole="button" onPress={forgetRecent} hitSlop={8}>
                <Text style={[styles.readMore, { color: colors.text }]}>Clear</Text>
              </Pressable>
            </View>
            {recent.map((text) => (
              <Pressable key={text} accessibilityRole="button" onPress={() => useSuggestion(text)} style={[styles.recent, { borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.recentText, { color: colors.text }]}>{text}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  } else if (!shownHits.length) {
    body = (
      <View>
        <Text style={[styles.heading, { color: colors.text }]}>We could not find that yet</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          That is okay. Try a shorter or different word, like the number on a building or a word like library, food, timetable or clinic.
        </Text>
        <View style={styles.chipRow}>
          {POPULAR.slice(0, 5).map((text) => (
            <Chip key={text} label={text} active={false} onPress={() => useSuggestion(text)} />
          ))}
        </View>
        <View style={[styles.help, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="hand-left-outline" size={22} color={colors.accent} />
          <View style={styles.helpText}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Still stuck?</Text>
            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Tell us what you need help with, and we will guide you to the right place.</Text>
            <ActionButton action={{ label: 'Open help options', icon: 'arrow-forward', primary: true, onPress: () => go(routes.support) }} />
          </View>
        </View>
      </View>
    );
  } else {
    body = (
      <View>
        {closestOnly ? (
          <ShameResilientBanner message="Nothing matches every word yet, so here are the closest matches." type="info" />
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {fullHits.length} {fullHits.length === 1 ? 'result' : 'results'}. Tap a button to take the next step.
          </Text>
        )}

        {visibleGroups.map(([kind, groupHits]) => {
          const meta = KIND_META[kind];
          const open = kindFilter !== 'all' || openGroups.has(kind);
          const list = open ? groupHits : groupHits.slice(0, GROUP_PREVIEW);
          return (
            <View key={kind} style={styles.group}>
              <View style={styles.groupHeader}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
                <Text style={[styles.groupTitle, { color: colors.text }]}>{meta.label}</Text>
              </View>
              {list.map((hit) => (
                <ResultCard
                  key={hit.doc.id}
                  hit={hit}
                  tokens={tokens}
                  expanded={expanded.has(hit.doc.id)}
                  onToggle={() => toggleExpanded(hit.doc.id)}
                  actions={actionsFor(hit.doc)}
                />
              ))}
              {groupHits.length > GROUP_PREVIEW && kindFilter === 'all' ? (
                <Pressable accessibilityRole="button" onPress={() => toggleGroup(kind)}>
                  <Text style={[styles.readMore, { color: colors.text }]}>
                    {open ? 'Show fewer' : `Show all ${groupHits.length} in ${meta.label.toLowerCase()}`}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.top, { paddingTop: insets.top + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.searchRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={leave} hitSlop={10} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={19} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setKindFilter('all');
              }}
              onSubmitEditing={() => remember(trimmed)}
              placeholder="Search schedule, FAQs, contacts, venues..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputText, { color: colors.text }]}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search the app"
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={19} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {groups.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} keyboardShouldPersistTaps="handled">
            <Chip label="All" count={shownHits.length} active={kindFilter === 'all'} onPress={() => setKindFilter('all')} />
            {groups.map(([kind, groupHits]) => (
              <Chip key={kind} label={KIND_META[kind].label} count={groupHits.length} active={kindFilter === kind} onPress={() => setKindFilter(kind)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {offline ? <ShameResilientBanner message="You are searching saved information because your connection is unavailable right now." type="info" /> : null}
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  inputText: { flex: 1, paddingVertical: 12, fontSize: 15, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  filterRow: { gap: 8, paddingTop: 10 },
  content: { padding: 16, paddingBottom: 48 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  heading: { fontSize: 22, fontWeight: '800' },
  hint: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  recentText: { fontSize: 15 },
  group: { marginBottom: 18 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  groupTitle: { fontSize: 16, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  kindIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  cardSub: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  cardBody: { fontSize: 13, lineHeight: 20, marginTop: 10 },
  match: { fontWeight: '900', backgroundColor: 'rgba(248,167,5,0.28)' },
  readMore: { fontSize: 13, fontWeight: '800', marginTop: 8, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10, alignSelf: 'flex-start' },
  actionText: { fontSize: 13, fontWeight: '800' },
  help: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 16, padding: 16 },
  helpText: { flex: 1, gap: 6 },
});
