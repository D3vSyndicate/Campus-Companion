import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, Share, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CampusMap } from '../../components/map/CampusMap';
import { Attribution, BrowseSheet, LostSheet, PickFromSheet, PlaceSheet, RouteSheet, type TodayStop } from '../../components/map/MapSheets';
import type { CampusMapHandle } from '../../components/map/types';
import { ScaledText as Text } from '../../components/ScaledText';
import {
    CAMPUS_PLACES,
    CAMPUSES,
    CATEGORIES,
    distanceMeters,
    searchPlaces,
    type CampusId,
    type CampusPlace,
    type PlaceCategory,
} from '../../data/campus';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { campusName, categoryLabel } from '../../lib/campusText';
import i18n from '../../i18n';
import { walkingRoute, type RouteResult } from '../../lib/routing';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Mode = 'browse' | 'place' | 'pickFrom' | 'route' | 'lost';
type RouteState = { fromId: string; toId: string; loading: boolean; result: RouteResult | null };

const CATEGORY_ORDER: PlaceCategory[] = ['learning', 'services', 'food', 'residence', 'sport', 'transport', 'building', 'venue'];
const ink = '#071B2C';

const pad = (value: number) => String(value).padStart(2, '0');
const localIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function CampusMapScreen() {
  const { t } = useTranslation();
  const { colors, resolvedScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const segments = useSegments();
  // Shared with the buddy (mentor) app: keep links inside the caller's own area.
  const areaRoot = segments[0] === '(mentor)' ? '/(mentor)' : '/(student)';
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const qParam = Array.isArray(params.q) ? params.q[0] : params.q;

  const mapRef = useRef<CampusMapHandle>(null);
  const searchRef = useRef<TextInput>(null);
  const routeToken = useRef(0);
  const lastHandledQ = useRef<string | undefined>(undefined);

  const [venuePlaces, setVenuePlaces] = useState<CampusPlace[]>([]);
  const [todayStops, setTodayStops] = useState<TodayStop[]>([]);
  const [venuesLoaded, setVenuesLoaded] = useState(false);

  const [campus, setCampus] = useState<CampusId>('south');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlaceCategory | 'all'>('all');
  const [mode, setMode] = useState<Mode>('browse');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteState | null>(null);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [topHeight, setTopHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  // Hides the search and list so the whole map is on screen.
  const [fullView, setFullView] = useState(false);

  const places = useMemo(() => [...CAMPUS_PLACES, ...venuePlaces], [venuePlaces]);
  const placeById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const selected = selectedId ? placeById.get(selectedId) ?? null : null;

  // ---- Orientation venues and today's sessions (coordinators add coordinates to a Venue) --------

  useEffect(() => {
    let active = true;

    void (async () => {
      const [venueResult, scheduleResult] = await Promise.all([
        fetchWithOfflineFallback('Venue'),
        fetchWithOfflineFallback('schedule_items'),
      ]);
      if (!active) return;

      const found: CampusPlace[] = [];
      for (const row of (Array.isArray(venueResult.data) ? venueResult.data : []) as Record<string, unknown>[]) {
        const lat = Number.parseFloat(String(row.latitude ?? ''));
        const lng = Number.parseFloat(String(row.longitude ?? ''));
        // Ignore anything that is not near Gqeberha, so a typo cannot fling a pin across the world.
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -34.2 || lat > -33.7 || lng < 25.4 || lng > 25.9) continue;

        const nearest: CampusId =
          distanceMeters([lat, lng], CAMPUSES.south.center) <= distanceMeters([lat, lng], CAMPUSES.north.center) ? 'south' : 'north';
        const detail = [row.building, row.room_number ? i18n.t('map.room', { number: String(row.room_number) }) : '', row.directions]
          .map((part) => String(part ?? '').trim())
          .filter(Boolean)
          .join(' · ');

        found.push({
          id: `venue:${String(row.venue_id)}`,
          name: String(row.venue_name ?? 'Venue').trim(),
          campus: nearest,
          category: 'venue',
          lat,
          lng,
          symbol: '★',
          note: detail || undefined,
          key: true,
        });
      }
      setVenuePlaces(found);

      const today = localIsoDate(new Date());
      const known = new Set(found.map((place) => place.id));
      setTodayStops(
        (Array.isArray(scheduleResult.data) ? scheduleResult.data : [])
          .map((row: Record<string, unknown>) => ({
            id: String(row.id ?? ''),
            date: String(row.date ?? ''),
            time: String(row.start_time ?? '').slice(0, 5),
            title: String(row.title ?? ''),
            placeId: `venue:${String(row.venue_id)}`,
          }))
          .filter((item) => item.date === today && known.has(item.placeId))
          .sort((a, b) => a.time.localeCompare(b.time)),
      );
      setVenuesLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  // New venues become pins without reloading the map.
  // (CampusMap sends them to the page when the `places` list changes.)

  // ---- Search and filters -----------------------------------------------------------------------

  const trimmed = query.trim();
  const filtering = trimmed.length > 0 || category !== 'all';

  const results = useMemo(() => {
    if (trimmed) {
      const found = searchPlaces(places, trimmed);
      return category === 'all' ? found : found.filter((place) => place.category === category);
    }
    if (category !== 'all') {
      return places
        .filter((place) => place.category === category)
        .sort((a, b) => a.campus.localeCompare(b.campus) || (a.number ?? '').localeCompare(b.number ?? '', undefined, { numeric: true }));
    }
    return [];
  }, [places, trimmed, category]);

  useEffect(() => {
    mapRef.current?.setVisible(filtering ? results.map((place) => place.id) : null);
  }, [filtering, results]);

  const categoryChips = useMemo(
    () => CATEGORY_ORDER.filter((key) => places.some((place) => place.category === key)),
    [places],
  );

  const keyPlaces = useMemo(() => places.filter((place) => place.key && place.campus === campus), [places, campus]);

  // ---- Keeping pins clear of the overlays -------------------------------------------------------

  useEffect(() => {
    mapRef.current?.setInsets(fullView ? 0 : topHeight, fullView ? 0 : sheetHeight);
  }, [topHeight, sheetHeight, fullView]);

  // ---- Actions ----------------------------------------------------------------------------------

  const clearRoute = useCallback(() => {
    routeToken.current += 1;
    mapRef.current?.clearRoute();
    setRoute(null);
  }, []);

  const selectPlace = useCallback(
    (id: string, fromMap = false) => {
      const place = placeById.get(id);
      if (!place) return;
      Keyboard.dismiss();
      clearRoute();
      setSelectedId(id);
      setCampus(place.campus);
      setMode('place');
      if (fullView) {
        // Bring the search and list back, and keep the pin clear of them.
        setFullView(false);
        mapRef.current?.setInsets(topHeight, sheetHeight);
      }
      if (!fromMap || fullView) mapRef.current?.focusPlace(id);
    },
    [placeById, clearRoute, fullView, topHeight, sheetHeight],
  );

  const closePlace = useCallback(() => {
    clearRoute();
    setSelectedId(null);
    setMode('browse');
    mapRef.current?.clearSelection();
  }, [clearRoute]);

  const beginRoute = useCallback(
    async (fromId: string, toId: string) => {
      const from = placeById.get(fromId);
      const to = placeById.get(toId);
      if (!from || !to) return;

      const token = ++routeToken.current;
      Keyboard.dismiss();
      setSelectedId(toId);
      setMode('route');
      setRoute({ fromId, toId, loading: true, result: null });

      const result = await walkingRoute([from.lat, from.lng], [to.lat, to.lng]);
      if (token !== routeToken.current) return; // A newer request replaced this one.

      setRoute({ fromId, toId, loading: false, result });
      mapRef.current?.showRoute(result.coords);
    },
    [placeById],
  );

  const chooseCampus = (id: CampusId) => {
    setCampus(id);
    mapRef.current?.showCampus(id);
  };

  // Shows both campuses at once, with the search and list out of the way.
  const enterFullView = () => {
    Keyboard.dismiss();
    setFullView(true);
    mapRef.current?.setInsets(0, 0);
    mapRef.current?.fitAll();
  };

  const exitFullView = () => {
    setFullView(false);
    mapRef.current?.setInsets(topHeight, sheetHeight);
    mapRef.current?.showCampus(campus);
  };

  const shareSelected = async () => {
    if (!selected) return;
    try {
      await Share.share({
        message: `${selected.name}${selected.number ? ` (${t('map.building', { number: selected.number })})` : ''}, ${campusName(selected.campus)}.`,
      });
    } catch {
      // Sharing is not available everywhere, and that is fine.
    }
  };

  // A schedule card can open the map on its venue, e.g. /map?q=North Campus Auditorium.
  useEffect(() => {
    if (!qParam || qParam === lastHandledQ.current || !venuesLoaded) return;
    lastHandledQ.current = qParam;
    const term = qParam.split(' · ')[0].trim();
    const hit = searchPlaces(places, term)[0];
    if (hit) selectPlace(hit.id);
    else setQuery(term);
  }, [qParam, venuesLoaded, places, selectPlace]);

  const onMapSelect = useCallback((id: string) => selectPlace(id, true), [selectPlace]);
  const onMapBlank = useCallback(() => {
    Keyboard.dismiss();
    if (mode === 'place') closePlace();
  }, [mode, closePlace]);

  // ---- Bottom sheet content ---------------------------------------------------------------------

  let content: ReactNode;
  const routeFrom = route ? placeById.get(route.fromId) : undefined;
  const routeTo = route ? placeById.get(route.toId) : undefined;

  if (mode === 'place' && selected) {
    content = (
      <PlaceSheet
        place={selected}
        onClose={closePlace}
        onRoute={() => setMode('pickFrom')}
        onShare={() => void shareSelected()}
      />
    );
  } else if (mode === 'pickFrom' && selected) {
    content = (
      <PickFromSheet
        destination={selected}
        places={places}
        onPick={(id) => void beginRoute(id, selected.id)}
        onClose={() => setMode('place')}
      />
    );
  } else if (mode === 'route' && route && routeFrom && routeTo) {
    content = (
      <RouteSheet
        from={routeFrom}
        to={routeTo}
        loading={route.loading}
        result={route.result}
        onSwap={() => void beginRoute(route.toId, route.fromId)}
        onClose={() => selectPlace(route.toId)}
      />
    );
  } else if (mode === 'lost') {
    content = (
      <LostSheet
        onClose={() => setMode('browse')}
        onSearchNumber={() => {
          setMode('browse');
          searchRef.current?.focus();
        }}
        onAskTribe={() => router.push(`${areaRoot}/tribe` as never)}
        onWholeMap={() => {
          setMode('browse');
          enterFullView();
        }}
      />
    );
  } else {
    content = (
      <BrowseSheet
        campus={campus}
        keyPlaces={keyPlaces}
        results={results}
        filtering={filtering}
        todayStops={todayStops}
        placeById={placeById}
        onSelect={selectPlace}
        onPlanCampusWalk={() => void beginRoute('s-1', 'n-260')}
        onLost={() => setMode('lost')}
      />
    );
  }

  const sheetMax = Math.round(height * 0.46);
  const shadow = { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <CampusMap
          ref={mapRef}
          places={places}
          theme={resolvedScheme}
          initialCampus="south"
          onSelect={onMapSelect}
          onBlank={onMapBlank}
          onStatus={setMapStatus}
        />
      </View>

      {/* Search, campus switch and filters */}
      {!fullView ? (
      <View style={[styles.top, { top: insets.top + 10 }]} pointerEvents="box-none" onLayout={(event) => setTopHeight(event.nativeEvent.layout.height + insets.top + 10)}>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
          <Ionicons name="search" size={19} color={colors.textSecondary} />
          <TextInput
            ref={searchRef}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (mode !== 'browse') {
                clearRoute();
                setSelectedId(null);
                mapRef.current?.clearSelection();
                setMode('browse');
              }
            }}
            placeholder={t('map.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t('map.searchLabel')}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('map.clear')} onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={19} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.controlRow} pointerEvents="box-none">
          <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}>
            {(Object.keys(CAMPUSES) as CampusId[]).map((id) => {
              const active = id === campus;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => chooseCampus(id)}
                  style={[styles.segment, active && { backgroundColor: colors.accent }]}
                >
                  <Text style={[styles.segmentText, { color: active ? ink : colors.textSecondary }]}>{campusName(id)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('lost')}
            style={[styles.lost, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
          >
            <Ionicons name="help-buoy-outline" size={17} color={colors.accent} />
            <Text style={[styles.lostText, { color: colors.text }]}>{t('map.lost')}</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          {(['all', ...categoryChips] as (PlaceCategory | 'all')[]).map((key) => {
            const active = category === key;
            const meta = key === 'all' ? null : CATEGORIES[key];
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setCategory(key);
                  if (mode !== 'browse') {
                    clearRoute();
                    setSelectedId(null);
                    mapRef.current?.clearSelection();
                    setMode('browse');
                  }
                }}
                style={[
                  styles.chip,
                  { backgroundColor: active ? colors.accent : colors.surface, borderColor: active ? colors.accent : colors.border },
                  shadow,
                ]}
              >
                {meta ? <View style={[styles.chipDot, { backgroundColor: meta.color }]} /> : null}
                <Text style={[styles.chipText, { color: active ? ink : colors.text }]}>{key === 'all' ? t('map.allPlaces') : categoryLabel(key)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      ) : null}

      {/* Zoom */}
      <View style={[styles.zoom, { bottom: fullView ? 18 : sheetHeight + 14 }]} pointerEvents="box-none">
        {([['add', 1, t('map.zoomIn')], ['remove', -1, t('map.zoomOut')]] as const).map(([icon, delta, label]) => (
          <Pressable
            key={icon}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => mapRef.current?.zoom(delta)}
            style={[styles.zoomButton, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
          >
            <Ionicons name={icon} size={20} color={colors.text} />
          </Pressable>
        ))}
      </View>

      {/* Whole map: one tap shows both campuses with everything else out of the way */}
      {fullView ? (
        <Pressable
          accessibilityRole="button"
          onPress={exitFullView}
          style={[styles.wholeMap, { bottom: 18, backgroundColor: colors.accent, borderColor: colors.accent }, shadow]}
        >
          <Ionicons name="search" size={17} color={ink} />
          <Text style={[styles.wholeMapText, { color: ink }]}>{t('map.searchAndPlaces')}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={enterFullView}
          style={[styles.wholeMap, { bottom: sheetHeight + 14, backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
        >
          <Ionicons name="expand-outline" size={17} color={colors.text} />
          <Text style={[styles.wholeMapText, { color: colors.text }]}>{t('map.wholeMap')}</Text>
        </Pressable>
      )}

      {/* Bottom sheet */}
      {!fullView ? (
      <View
        style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }, shadow]}
        onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <ScrollView style={{ maxHeight: sheetMax }} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {mapStatus === 'offline' ? (
            <View style={[styles.offline, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.accent} />
              <Text style={[styles.offlineText, { color: colors.textSecondary }]}>
                {t('map.unavailable')}
              </Text>
            </View>
          ) : null}
          {content}
          <Attribution />
        </ScrollView>
      </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { position: 'absolute', left: 12, right: 12, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  segmented: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 3, gap: 3 },
  segment: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  segmentText: { fontSize: 13, fontWeight: '800' },
  lost: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  lostText: { fontSize: 13, fontWeight: '800' },
  chips: { gap: 8, paddingRight: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipDot: { width: 9, height: 9, borderRadius: 5 },
  chipText: { fontSize: 13, fontWeight: '700' },
  zoom: { position: 'absolute', right: 12, gap: 8 },
  wholeMap: { position: 'absolute', left: 12, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  wholeMapText: { fontSize: 13, fontWeight: '800' },
  zoomButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 6 },
  sheetContent: { paddingHorizontal: 16, paddingBottom: 18 },
  offline: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  offlineText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
