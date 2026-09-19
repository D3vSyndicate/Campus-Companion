import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { fetchShuttleRows } from '../../lib/shuttle';
import { fetchSportRows } from '../../lib/sport';
import { highlight, prepare, search, snippet, type PreparedDoc, type SearchDoc, type SearchHit, type SearchKind } from '../../lib/search';
import { buildSearchDocs, type SearchSources } from '../../lib/searchDocs';
import { SEARCH_SCOPES, type SearchScopeId } from '../../lib/searchScopes';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import { ShameResilientBanner } from '../ShameResilientBanner';

export type SearchArea = 'student' | 'mentor';

// Each role keeps to its own screens, so a result never sends someone somewhere they cannot go.
const ROUTES = {
  student: {
    home: '/(student)', schedule: '/(student)/schedule', faqs: '/(student)/faqs', support: '/(student)/support', map: '/(student)/map',
    contacts: '/(student)/contacts', guides: '/(student)/digital', sportGym: '/(student)/sport-gym', programme: '/(student)/it-programme-detail',
    announcements: '/(student)', checklist: '/(student)/checklist', supportInfo: '/(student)/support', shuttle: '/(student)', profile: '/(student)/profile',
  },
  mentor: {
    home: '/(mentor)', schedule: '/(mentor)/schedule', faqs: '/(mentor)/faqs', support: '/(mentor)/refer', map: '/(mentor)/map',
    contacts: '/(mentor)/refer', guides: null, sportGym: null, programme: null,
    announcements: '/(mentor)/announcements', checklist: null, supportInfo: null, shuttle: null, profile: '/(mentor)/profile',
  },
} as const;

// What each role can find. A buddy has no checklist, guides or programmes screens, so none are searched.
const AREA_KINDS: Record<SearchArea, SearchKind[]> = {
  student: ['faq', 'support', 'schedule', 'venue', 'place', 'contact', 'guide', 'event', 'sport', 'programme', 'announcement', 'checklist', 'info', 'shuttle', 'setting'],
  mentor: ['faq', 'support', 'schedule', 'venue', 'place', 'contact', 'event', 'announcement', 'setting'],
};

// Which table feeds which documents. Only the tables a search needs are loaded.
const SOURCES: { key: Exclude<keyof SearchSources, 'today'>; table: string; kinds: SearchKind[]; core?: boolean }[] = [
  { key: 'faqs', table: 'FAQ', kinds: ['faq'], core: true },
  { key: 'support', table: 'Support_pathway', kinds: ['support'], core: true },
  { key: 'contacts', table: 'Contact', kinds: ['contact'], core: true },
  { key: 'venues', table: 'Venue', kinds: ['venue', 'schedule', 'event'], core: true },
  { key: 'schedule', table: 'schedule_items', kinds: ['schedule'], core: true },
  { key: 'guides', table: 'digital_readiness', kinds: ['guide'] },
  { key: 'events', table: 'event', kinds: ['event'] },
  { key: 'sport', table: 'sport_recreation', kinds: ['sport'] },
  { key: 'programmes', table: 'it_programmes', kinds: ['programme'] },
  { key: 'announcements', table: 'Announcement', kinds: ['announcement'] },
  { key: 'checklist', table: 'checklist_item', kinds: ['checklist'] },
  { key: 'info', table: 'coordinator_content', kinds: ['info'] },
  { key: 'shuttle', table: 'shuttle_times', kinds: ['shuttle'] },
];

const KIND_META: Record<SearchKind, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  faq: { label: 'Answers', icon: 'help-circle-outline', color: '#2563EB' },
  support: { label: 'Getting help', icon: 'hand-left-outline', color: '#0F766E' },
  schedule: { label: 'Schedule', icon: 'calendar-outline', color: '#7C3AED' },
  venue: { label: 'Venues', icon: 'location-outline', color: '#D98E04' },
  place: { label: 'Campus buildings', icon: 'business-outline', color: '#64748B' },
  contact: { label: 'People to contact', icon: 'people-outline', color: '#EA580C' },
  guide: { label: 'Digital guides', icon: 'laptop-outline', color: '#0891B2' },
  event: { label: 'Events', icon: 'ticket-outline', color: '#DB2777' },
  sport: { label: 'Sport & gym', icon: 'barbell-outline', color: '#16A34A' },
  programme: { label: 'Programmes', icon: 'school-outline', color: '#4F46E5' },
  announcement: { label: 'Announcements', icon: 'megaphone-outline', color: '#B45309' },
  checklist: { label: 'Checklist', icon: 'checkmark-circle-outline', color: '#15803D' },
  info: { label: 'Support information', icon: 'information-circle-outline', color: '#0F766E' },
  shuttle: { label: 'Shuttle times', icon: 'bus-outline', color: '#0369A1' },
  setting: { label: 'Settings', icon: 'settings-outline', color: '#475569' },
};

const RECENT_KEY = 'search:recent';
const WHOLE_APP_NOTE = 'To search the whole app, use the search box on the Home screen.';
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

export function SearchScreen({ area, initialQuery = '', scope = 'all' }: { area: SearchArea; initialQuery?: string; scope?: SearchScopeId }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const routes = ROUTES[area];
  const inputRef = useRef<TextInput>(null);

  // The Home search covers everything the role can see. Any other screen searches only its own content.
  const scopeInfo = SEARCH_SCOPES[scope];
  const scoped = scope !== 'all';
  const allowedKinds = useMemo(
    () => AREA_KINDS[area].filter((kind) => !scopeInfo.kinds || scopeInfo.kinds.includes(kind)),
    [area, scopeInfo],
  );
  const recentKey = `${RECENT_KEY}:${scope}`;

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
      // Only the tables this search needs are loaded.
      const needed = SOURCES.filter((source) => source.kinds.some((kind) => allowedKinds.includes(kind)));
      // Sport & gym and the shuttle schedule have information built into the app, so they never come back empty.
      const results = await Promise.all(
        needed.map((source) =>
          source.key === 'sport' ? fetchSportRows() : source.key === 'shuttle' ? fetchShuttleRows() : fetchWithOfflineFallback(source.table),
        ),
      );
      if (!active) return;

      const sources: SearchSources = { today: localIsoDate(new Date()) };
      needed.forEach((source, index) => {
        const data = results[index]?.data;
        sources[source.key] = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
      });

      // Only the core tables decide whether to say "offline". A table that is not set up yet is not a connection problem.
      setOffline(needed.some((source, index) => source.core && results[index].fromCache && Boolean(results[index].error)));

      // Everything loaded is turned into documents, then only this search's kinds are kept.
      const docs = buildSearchDocs(sources).filter((doc) => allowedKinds.includes(doc.kind));
      setPrepared(prepare(docs));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [allowedKinds]);

  // A link such as /search?q=wifi opens the screen already searching.
  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(recentKey);
        setRecent(saved ? (JSON.parse(saved) as string[]) : []);
      } catch {
        // Recent searches are a convenience only.
      }
    })();
  }, [recentKey]);

  const remember = useCallback((text: string) => {
    const value = text.trim();
    if (value.length < 2) return;
    setRecent((current) => {
      const next = [value, ...current.filter((entry) => entry.toLowerCase() !== value.toLowerCase())].slice(0, 5);
      AsyncStorage.setItem(recentKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [recentKey]);

  const forgetRecent = () => {
    setRecent([]);
    AsyncStorage.removeItem(recentKey).catch(() => undefined);
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
        else list.push({ label: 'See who to contact', icon: 'people-outline', primary: true, onPress: () => go(routes.contacts) });
        break;
      case 'event':
        list.push({ label: 'See the event', icon: 'ticket-outline', primary: true, onPress: () => go(routes.schedule, { tab: 'events', focus: doc.data.id }) });
        if (doc.data.venue) list.push({ label: 'Show me where', icon: 'location-outline', onPress: () => go(routes.map, { q: doc.data.venue }) });
        break;
      case 'sport':
        if (routes.sportGym) {
          const gym = doc.data.tab === 'gym';
          list.push({ label: gym ? 'How to sign up' : 'How to join', icon: gym ? 'barbell-outline' : 'football-outline', primary: true, onPress: () => go(routes.sportGym, { tab: doc.data.tab, focus: doc.data.id }) });
        }
        if (doc.data.venue) list.push({ label: 'Show me where', icon: 'location-outline', onPress: () => go(routes.map, { q: doc.data.venue }) });
        break;
      case 'programme':
        if (routes.programme) list.push({ label: 'See the programme', icon: 'school-outline', primary: true, onPress: () => go(routes.programme, { id: doc.data.id }) });
        break;
      case 'announcement':
        if (routes.announcements) list.push({ label: area === 'mentor' ? 'See announcements' : 'See it on Home', icon: 'megaphone-outline', primary: true, onPress: () => go(routes.announcements) });
        break;
      case 'checklist':
        if (routes.checklist) list.push({ label: 'Open checklist', icon: 'checkmark-circle-outline', primary: true, onPress: () => go(routes.checklist) });
        break;
      case 'info':
        if (routes.supportInfo) list.push({ label: 'Open support', icon: 'help-buoy-outline', primary: true, onPress: () => go(routes.supportInfo) });
        break;
      case 'shuttle':
        if (routes.shuttle) list.push({ label: 'See shuttle times', icon: 'bus-outline', primary: true, onPress: () => go(routes.shuttle) });
        break;
      case 'setting':
        list.push({ label: 'Open profile', icon: 'settings-outline', primary: true, onPress: () => go(routes.profile) });
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

  const applySuggestion = (text: string) => {
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
        <Text style={[styles.heading, { color: colors.text }]}>{scoped ? `Search ${scopeInfo.label}` : 'What do you need to find?'}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{scopeInfo.hint}</Text>

        {scopeInfo.suggestions.length ? (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{scoped ? 'Try' : 'Popular searches'}</Text>
            <View style={styles.chipRow}>
              {scopeInfo.suggestions.map((text) => (
                <Chip key={text} label={text} active={false} onPress={() => applySuggestion(text)} />
              ))}
            </View>
          </>
        ) : null}

        {recent.length ? (
          <View>
            <View style={styles.recentHeader}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Recent</Text>
              <Pressable accessibilityRole="button" onPress={forgetRecent} hitSlop={8}>
                <Text style={[styles.readMore, { color: colors.text }]}>Clear</Text>
              </Pressable>
            </View>
            {recent.map((text) => (
              <Pressable key={text} accessibilityRole="button" onPress={() => applySuggestion(text)} style={[styles.recent, { borderColor: colors.border }]}>
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
          {scoped
            ? `Nothing in ${scopeInfo.label} matches that. Try a shorter or different word. ${WHOLE_APP_NOTE}`
            : 'That is okay. Try a shorter or different word, like the number on a building or a word like library, food, timetable or clinic.'}
        </Text>
        {scopeInfo.suggestions.length ? (
          <View style={styles.chipRow}>
            {scopeInfo.suggestions.slice(0, 5).map((text) => (
              <Chip key={text} label={text} active={false} onPress={() => applySuggestion(text)} />
            ))}
          </View>
        ) : null}
        {scoped ? null : (
          <View style={[styles.help, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="hand-left-outline" size={22} color={colors.accent} />
            <View style={styles.helpText}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Still stuck?</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>Tell us what you need help with, and we will guide you to the right place.</Text>
              <ActionButton action={{ label: 'Open help options', icon: 'arrow-forward', primary: true, onPress: () => go(routes.support) }} />
            </View>
          </View>
        )}
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
              placeholder={scopeInfo.placeholder}
              placeholderTextColor={colors.textSecondary}
              style={[styles.inputText, { color: colors.text }]}
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={scoped ? `Search ${scopeInfo.label}` : 'Search the whole app'}
            />
            {query ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={19} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {scoped ? (
          <View style={styles.scopeRow}>
            <Ionicons name="funnel-outline" size={13} color={colors.textSecondary} />
            <Text style={[styles.scopeText, { color: colors.textSecondary }]}>Searching {scopeInfo.label} only</Text>
          </View>
        ) : null}

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
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, paddingLeft: 42 },
  scopeText: { fontSize: 12, fontWeight: '700' },
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
