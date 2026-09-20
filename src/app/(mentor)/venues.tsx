import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Share,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Venue = {
  id: string;
  name: string;
  building: string;
  room: string;
  directions: string;
  mapLink: string;
  accessibility: string;
};

const str = (value: unknown) => String(value ?? '').trim();

// Directions a buddy can give (or send) to a student who is not sure where to go.
export default function VenueGuide() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await fetchWithOfflineFallback('Venue');
      setVenues(
        (Array.isArray(data) ? data : [])
          .map((row: Record<string, unknown>, index: number) => ({
            id: str(row.venue_id) || String(index),
            name: str(row.venue_name),
            building: str(row.building),
            room: str(row.room_number),
            directions: str(row.directions),
            mapLink: str(row.map_link),
            accessibility: str(row.accessibilty_notes),
          }))
          .filter((venue) => venue.name)
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return venues.filter((venue) => !query || `${venue.name} ${venue.building} ${venue.room}`.toLowerCase().includes(query));
  }, [venues, search]);

  const guidance = (venue: Venue) =>
    venue.directions ||
    t('schedule.directionsText', { venue: venue.name });

  const share = async (venue: Venue) => {
    try {
      await Share.share({
        message: `${venue.name}${venue.building ? `, ${venue.building}` : ''}${venue.room ? `, ${t('map.room', { number: venue.room }).toLowerCase()}` : ''}\n\n${guidance(venue)}`,
      });
    } catch {
      Alert.alert(t('share.unavailable'), t('buddyVenues.readOut'));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <PageHeader
              eyebrow={t('buddy.eyebrow')}
              title={t('buddy.actions.venues.title')}
              subtitle={t('buddyVenues.subtitle')}
              showSearch={false}
            />
            <TextInput
              style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder={t('buddyVenues.search')}
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {venues.length ? t('buddyVenues.noMatch') : t('buddyVenues.none')}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const open = openId === item.id;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setOpenId(open ? null : item.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Ionicons name="location-outline" size={20} color={colors.accent} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {[item.building, item.room ? t('map.room', { number: item.room }) : ''].filter(Boolean).join(' · ') || t('buddyVenues.soon')}
                  </Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              {open ? (
                <View style={[styles.details, { borderTopColor: colors.border }]}>
                  <Text style={[styles.label, { color: colors.accent }]}>{t('buddyVenues.directions')}</Text>
                  <Text style={[styles.body, { color: colors.textSecondary }]}>{guidance(item)}</Text>

                  {item.accessibility ? (
                    <>
                      <Text style={[styles.label, { color: colors.accent }]}>{t('buddyVenues.accessibility')}</Text>
                      <Text style={[styles.body, { color: colors.textSecondary }]}>{item.accessibility}</Text>
                    </>
                  ) : null}

                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={() => void share(item)}>
                      <Text style={styles.buttonText}>{t('buddyVenues.share')}</Text>
                    </TouchableOpacity>
                    {item.mapLink ? (
                      <TouchableOpacity
                        style={[styles.button, styles.outlined, { borderColor: colors.border }]}
                        onPress={() => void Linking.openURL(item.mapLink)}
                      >
                        <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.openMap')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  search: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 15 },
  empty: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  loading: { marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  details: { borderTopWidth: 1, padding: 14 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  outlined: { borderWidth: 1 },
  buttonText: { color: '#071B2C', fontSize: 13, fontWeight: '800' },
});
