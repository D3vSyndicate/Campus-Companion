import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
    CAMPUSES,
    CATEGORIES,
    OFFICIAL_MAPS,
    searchPlaces,
    type CampusId,
    type CampusPlace,
} from '../../data/campus';
import { formatDistance, type RouteResult } from '../../lib/routing';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';

const ink = '#071B2C';

// ---- Small building blocks -----------------------------------------------------------------

export function Badge({ place, size = 34 }: { place: CampusPlace; size?: number }) {
  const meta = CATEGORIES[place.category];
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2.6, backgroundColor: meta.color }]}>
      <Text style={styles.badgeText} numberOfLines={1}>
        {place.number ?? place.symbol ?? '•'}
      </Text>
    </View>
  );
}

export function PlaceRow({ place, onPress, showCampus = false }: { place: CampusPlace; onPress: () => void; showCampus?: boolean }) {
  const { colors } = useTheme();
  const meta = CATEGORIES[place.category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}${place.number ? `, building ${place.number}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
    >
      <Badge place={place} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
          {place.name}
        </Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {[showCampus ? CAMPUSES[place.campus].name : '', meta.label].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

function Button({
  label,
  icon,
  onPress,
  variant = 'primary',
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'outline';
}) {
  const { colors } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: colors.accent } : { borderColor: colors.border, borderWidth: 1 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={primary ? ink : colors.text} /> : null}
      <Text style={[styles.buttonText, { color: primary ? ink : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function SheetHeader({ title, subtitle, onClose, leading }: { title: string; subtitle?: string; onClose?: () => void; leading?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {leading}
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card }]}>
          <Ionicons name="close" size={18} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

function OfficialMaps() {
  const { colors } = useTheme();
  return (
    <View style={[styles.official, { borderTopColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Official university maps</Text>
      <View style={styles.actions}>
        <Button label="MapBuddy" icon="navigate-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.interactive)} />
        <Button label="South PDF" icon="document-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.south)} />
        <Button label="North PDF" icon="document-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.north)} />
      </View>
    </View>
  );
}

export function Attribution() {
  const { colors } = useTheme();
  return (
    <Text style={[styles.attribution, { color: colors.textSecondary }]}>
      Building numbers: NMU official campus maps (2024). Map data © OpenStreetMap contributors, tiles by HOT hosted by OpenStreetMap France. Positions are
      approximate, so check building signs.
    </Text>
  );
}

// ---- Browse ----------------------------------------------------------------------------------

export type TodayStop = { id: string; time: string; title: string; placeId: string };

export function BrowseSheet({
  campus,
  keyPlaces,
  results,
  filtering,
  todayStops,
  placeById,
  onSelect,
  onPlanCampusWalk,
  onLost,
}: {
  campus: CampusId;
  keyPlaces: CampusPlace[];
  results: CampusPlace[];
  filtering: boolean;
  todayStops: TodayStop[];
  placeById: Map<string, CampusPlace>;
  onSelect: (id: string) => void;
  onPlanCampusWalk: () => void;
  onLost: () => void;
}) {
  const { colors } = useTheme();
  const info = CAMPUSES[campus];

  if (filtering) {
    return (
      <View>
        <SheetHeader
          title={results.length ? `${results.length} ${results.length === 1 ? 'place' : 'places'} found` : 'Nothing matches yet'}
          subtitle={
            results.length
              ? 'Tap one to see it on the map.'
              : 'That is okay. Try the number on the building, like 12, or a word like library, food or clinic.'
          }
        />
        {results.map((place) => (
          <PlaceRow key={place.id} place={place} showCampus onPress={() => onSelect(place.id)} />
        ))}
        {!results.length ? <Button label="I am lost. Help me" icon="help-buoy-outline" variant="outline" onPress={onLost} /> : null}
      </View>
    );
  }

  return (
    <View>
      <SheetHeader title="Where to next?" subtitle={`${info.intro} ${info.numbering}`} />

      {todayStops.length ? (
        <View style={styles.block}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Your sessions today</Text>
          {todayStops.map((stop) => {
            const place = placeById.get(stop.placeId);
            if (!place) return null;
            return (
              <Pressable
                key={stop.id}
                accessibilityRole="button"
                onPress={() => onSelect(stop.placeId)}
                style={({ pressed }) => [styles.stop, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.stopTime, { color: colors.text }]}>{stop.time}</Text>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                    {stop.title}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {place.name}
                  </Text>
                </View>
                <Ionicons name="location" size={18} color={colors.accent} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Places you will probably need</Text>
        {keyPlaces.map((place) => (
          <PlaceRow key={place.id} place={place} onPress={() => onSelect(place.id)} />
        ))}
      </View>

      <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="walk-outline" size={20} color={colors.accent} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>Between the campuses</Text>
          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
            South and North campus are roughly 1.5 km apart on foot. See the route before you set off.
          </Text>
        </View>
      </View>
      <Button label="Show the walk between campuses" icon="trail-sign-outline" variant="outline" onPress={onPlanCampusWalk} />

      <OfficialMaps />
    </View>
  );
}

// ---- Place details ------------------------------------------------------------------------------

export function PlaceSheet({
  place,
  onClose,
  onRoute,
  onShare,
}: {
  place: CampusPlace;
  onClose: () => void;
  onRoute: () => void;
  onShare: () => void;
}) {
  const { colors } = useTheme();
  const meta = CATEGORIES[place.category];

  return (
    <View>
      <SheetHeader
        leading={<Badge place={place} size={44} />}
        title={place.name}
        subtitle={`${CAMPUSES[place.campus].name} · ${meta.label}${place.number ? ` · Building ${place.number}` : ''}`}
        onClose={onClose}
      />
      {place.note ? <Text style={[styles.body, { color: colors.textSecondary }]}>{place.note}</Text> : null}
      {place.number ? (
        <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="eye-outline" size={20} color={colors.accent} />
          <Text style={[styles.rowSub, styles.rowText, { color: colors.textSecondary }]}>
            Not sure you are at the right one? Look for the number {place.number} on the building or a nearby sign.
          </Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label="Walking route" icon="walk-outline" onPress={onRoute} />
        <Button label="Share" icon="share-social-outline" variant="outline" onPress={onShare} />
      </View>
    </View>
  );
}

// ---- Choose where you are ---------------------------------------------------------------------

export function PickFromSheet({
  destination,
  places,
  onPick,
  onClose,
}: {
  destination: CampusPlace;
  places: CampusPlace[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const options = useMemo(() => {
    const matches = text.trim() ? searchPlaces(places, text) : places.filter((place) => place.key);
    return matches.filter((place) => place.id !== destination.id).slice(0, 12);
  }, [text, places, destination.id]);

  return (
    <View>
      <SheetHeader title="Where are you starting from?" subtitle={`Walking to ${destination.name}`} onClose={onClose} />
      <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="A building number or name near you"
          placeholderTextColor={colors.textSecondary}
          style={[styles.inputText, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{text.trim() ? 'Matches' : 'Popular starting points'}</Text>
      {options.map((place) => (
        <PlaceRow key={place.id} place={place} showCampus onPress={() => onPick(place.id)} />
      ))}
      {!options.length ? <Text style={[styles.sub, { color: colors.textSecondary }]}>Nothing matches yet. Try the number on the nearest building.</Text> : null}
    </View>
  );
}

// ---- Route ------------------------------------------------------------------------------------

export function RouteSheet({
  from,
  to,
  loading,
  result,
  onSwap,
  onClose,
}: {
  from: CampusPlace;
  to: CampusPlace;
  loading: boolean;
  result: RouteResult | null;
  onSwap: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const steps = result?.steps ?? [];
  const visibleSteps = showAll ? steps : steps.slice(0, 5);

  return (
    <View>
      <SheetHeader title="Walking route" onClose={onClose} />

      <View style={[styles.stops, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stopLine}>
          <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          <Text style={[styles.rowTitle, styles.rowText, { color: colors.text }]} numberOfLines={1}>
            {from.name}
          </Text>
        </View>
        <View style={styles.stopLine}>
          <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.rowTitle, styles.rowText, { color: colors.text }]} numberOfLines={1}>
            {to.name}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Swap start and destination" onPress={onSwap} hitSlop={10} style={styles.swap}>
          <Ionicons name="swap-vertical" size={20} color={colors.accent} />
        </Pressable>
      </View>

      {loading || !result ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.sub, { color: colors.textSecondary }]}>Finding a good path...</Text>
        </View>
      ) : (
        <>
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.accent }]}>
              <Ionicons name="walk-outline" size={16} color={ink} />
              <Text style={styles.chipText}>{formatDistance(result.distanceM)} on foot</Text>
            </View>
          </View>

          {result.approximate ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              We could not load the exact path right now, so this is an estimate of the distance along a straight line.
            </Text>
          ) : null}

          {visibleSteps.map((step, index) => (
            <View key={`${index}-${step}`} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: colors.card }]}>
                <Text style={[styles.stepNumberText, { color: colors.text }]}>{index + 1}</Text>
              </View>
              <Text style={[styles.body, styles.rowText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}
          {steps.length > 5 ? (
            <Pressable accessibilityRole="button" onPress={() => setShowAll((current) => !current)}>
              <Text style={[styles.link, { color: colors.accent }]}>{showAll ? 'Show fewer steps' : `Show all ${steps.length} steps`}</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

// ---- Feeling lost -----------------------------------------------------------------------------

export function LostSheet({
  onClose,
  onSearchNumber,
  onAskTribe,
  onWholeMap,
}: {
  onClose: () => void;
  onSearchNumber: () => void;
  onAskTribe: () => void;
  onWholeMap: () => void;
}) {
  const { colors } = useTheme();

  const steps: { icon: keyof typeof Ionicons.glyphMap; text: string; action?: { label: string; onPress: () => void } }[] = [
    {
      icon: 'eye-outline',
      text: 'Look for a number on the wall of the nearest building or on a sign, then search it here to see where you are.',
      action: { label: 'Search a number', onPress: onSearchNumber },
    },
    {
      icon: 'bus-outline',
      text: 'Head for a main road or the bus stop. They are easy to find on the map and a good place to start again.',
    },
    {
      icon: 'chatbubbles-outline',
      text: 'Ask someone nearby. Students and staff are happy to point the way, and your buddy in Tribe can help too.',
      action: { label: 'Ask my Tribe', onPress: onAskTribe },
    },
    {
      icon: 'map-outline',
      text: 'Zoom out to see both campuses and where the buildings are, then work your way to the one you need.',
      action: { label: 'View the whole map', onPress: onWholeMap },
    },
  ];

  return (
    <View>
      <SheetHeader title="Feeling turned around? That is completely normal." subtitle="A new campus confuses almost everyone in the first weeks. Here is what helps." onClose={onClose} />
      {steps.map((step) => (
        <View key={step.text} style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={step.icon} size={22} color={colors.accent} />
          <View style={styles.rowText}>
            <Text style={[styles.body, { color: colors.text }]}>{step.text}</Text>
            {step.action ? (
              <Pressable accessibilityRole="button" onPress={step.action.onPress}>
                <Text style={[styles.link, { color: colors.accent }]}>{step.action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
      <OfficialMaps />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 19, fontWeight: '800', lineHeight: 24 },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  close: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  block: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 20 },
  link: { fontSize: 13, fontWeight: '800', marginTop: 6 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  buttonText: { fontSize: 13, fontWeight: '800' },
  official: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 14, paddingTop: 12 },
  attribution: { fontSize: 10, lineHeight: 14, marginTop: 14 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  stopTime: { fontSize: 15, fontWeight: '800', minWidth: 48 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  inputText: { flex: 1, paddingVertical: 11, fontSize: 14 },
  stops: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10, marginBottom: 12 },
  stopLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 36 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  swap: { position: 'absolute', right: 12, top: '50%', marginTop: -10 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: '800', color: ink },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumberText: { fontSize: 11, fontWeight: '800' },
});
