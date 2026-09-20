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
import { campusIntro, campusName, campusNumbering, categoryLabel } from '../../lib/campusText';
import { formatDistance, type RouteResult } from '../../lib/routing';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const meta = CATEGORIES[place.category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}${place.number ? `, ${t('map.building', { number: place.number }).toLowerCase()}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: colors.border }, pressed && { opacity: 0.7 }]}
    >
      <Badge place={place} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={2}>
          {place.name}
        </Text>
        <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
          {[showCampus ? campusName(place.campus) : '', categoryLabel(place.category)].filter(Boolean).join(' · ')}
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {leading}
      <View style={styles.headerText}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('shuttle.close')} onPress={onClose} hitSlop={10} style={[styles.close, { backgroundColor: colors.card }]}>
          <Ionicons name="close" size={18} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

function OfficialMaps() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.official, { borderTopColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('map.official')}</Text>
      <View style={styles.actions}>
        <Button label="MapBuddy" icon="navigate-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.interactive)} />
        <Button label={t('map.southPdf')} icon="document-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.south)} />
        <Button label={t('map.northPdf')} icon="document-outline" variant="outline" onPress={() => void Linking.openURL(OFFICIAL_MAPS.north)} />
      </View>
    </View>
  );
}

export function Attribution() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Text style={[styles.attribution, { color: colors.textSecondary }]}>
      {t('map.attribution')}
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const info = CAMPUSES[campus];

  if (filtering) {
    return (
      <View>
        <SheetHeader
          title={results.length ? (results.length === 1 ? t('map.foundOne') : t('map.foundMany', { count: results.length })) : t('map.nothing')}
          subtitle={
            results.length
              ? t('map.tapOne')
              : t('map.tryNumber')
          }
        />
        {results.map((place) => (
          <PlaceRow key={place.id} place={place} showCampus onPress={() => onSelect(place.id)} />
        ))}
        {!results.length ? <Button label={t('map.lostHelp')} icon="help-buoy-outline" variant="outline" onPress={onLost} /> : null}
      </View>
    );
  }

  return (
    <View>
      <SheetHeader title={t('map.whereNext')} subtitle={`${campusIntro(info.id)} ${campusNumbering(info.id)}`} />

      {todayStops.length ? (
        <View style={styles.block}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('map.sessionsToday')}</Text>
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
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('map.placesNeed')}</Text>
        {keyPlaces.map((place) => (
          <PlaceRow key={place.id} place={place} onPress={() => onSelect(place.id)} />
        ))}
      </View>

      <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="walk-outline" size={20} color={colors.accent} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{t('map.between')}</Text>
          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
            {t('map.betweenText')}
          </Text>
        </View>
      </View>
      <Button label={t('map.showWalk')} icon="trail-sign-outline" variant="outline" onPress={onPlanCampusWalk} />

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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const meta = CATEGORIES[place.category];

  return (
    <View>
      <SheetHeader
        leading={<Badge place={place} size={44} />}
        title={place.name}
        subtitle={`${campusName(place.campus)} · ${categoryLabel(place.category)}${place.number ? ` · ${t('map.building', { number: place.number })}` : ''}`}
        onClose={onClose}
      />
      {place.note ? <Text style={[styles.body, { color: colors.textSecondary }]}>{place.note}</Text> : null}
      {place.number ? (
        <View style={[styles.tip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="eye-outline" size={20} color={colors.accent} />
          <Text style={[styles.rowSub, styles.rowText, { color: colors.textSecondary }]}>
            {t('map.rightOne', { number: place.number })}
          </Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label={t('map.walkingRoute')} icon="walk-outline" onPress={onRoute} />
        <Button label={t('common.share')} icon="share-social-outline" variant="outline" onPress={onShare} />
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const options = useMemo(() => {
    const matches = text.trim() ? searchPlaces(places, text) : places.filter((place) => place.key);
    return matches.filter((place) => place.id !== destination.id).slice(0, 12);
  }, [text, places, destination.id]);

  return (
    <View>
      <SheetHeader title={t('map.startFrom')} subtitle={t('map.walkingTo', { name: destination.name })} onClose={onClose} />
      <View style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('map.nearYou')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.inputText, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{text.trim() ? t('map.matches') : t('map.popularStarts')}</Text>
      {options.map((place) => (
        <PlaceRow key={place.id} place={place} showCampus onPress={() => onPick(place.id)} />
      ))}
      {!options.length ? <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('map.nothingNear')}</Text> : null}
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const steps = result?.steps ?? [];
  const visibleSteps = showAll ? steps : steps.slice(0, 5);

  return (
    <View>
      <SheetHeader title={t('map.walkingRoute')} onClose={onClose} />

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
        <Pressable accessibilityRole="button" accessibilityLabel={t('map.swap')} onPress={onSwap} hitSlop={10} style={styles.swap}>
          <Ionicons name="swap-vertical" size={20} color={colors.accent} />
        </Pressable>
      </View>

      {loading || !result ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('map.finding')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.accent }]}>
              <Ionicons name="walk-outline" size={16} color={ink} />
              <Text style={styles.chipText}>{t('map.onFoot', { distance: formatDistance(result.distanceM) })}</Text>
            </View>
          </View>

          {result.approximate ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {t('map.estimate')}
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
              <Text style={[styles.link, { color: colors.accent }]}>{showAll ? t('map.fewerSteps') : t('map.allSteps', { count: steps.length })}</Text>
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
  const { t } = useTranslation();
  const { colors } = useTheme();

  const steps: { icon: keyof typeof Ionicons.glyphMap; text: string; action?: { label: string; onPress: () => void } }[] = [
    {
      icon: 'eye-outline',
      text: t('map.lostNumber'),
      action: { label: t('map.searchNumber'), onPress: onSearchNumber },
    },
    {
      icon: 'bus-outline',
      text: t('map.lostRoad'),
    },
    {
      icon: 'chatbubbles-outline',
      text: t('map.lostAsk'),
      action: { label: t('map.askTribe'), onPress: onAskTribe },
    },
    {
      icon: 'map-outline',
      text: t('map.lostZoom'),
      action: { label: t('map.viewWhole'), onPress: onWholeMap },
    },
  ];

  return (
    <View>
      <SheetHeader title={t('map.turned')} subtitle={t('map.turnedText')} onClose={onClose} />
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
