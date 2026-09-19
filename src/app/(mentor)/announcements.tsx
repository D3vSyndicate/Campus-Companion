import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

type Announcement = { id: string; title: string; message: string; priority: string; postedBy: string };

const str = (value: unknown) => String(value ?? '').trim();
const isUrgent = (priority: string) => ['urgent', 'high'].includes(priority.toLowerCase());

// Read-only: buddies see what students are being told, so their answers match.
export default function BuddyAnnouncements() {
  const { colors } = useTheme();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = async () => {
    const { data, fromCache, error } = await fetchWithOfflineFallback('Announcement');
    setOffline(fromCache && Boolean(error));
    setItems(
      (Array.isArray(data) ? data : []).map((row: Record<string, unknown>, index: number) => ({
        id: str(row.announcement_id) || String(index),
        title: str(row.title),
        message: str(row.message),
        priority: str(row.priority_level) || 'Normal',
        postedBy: str(row.posted_by),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
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
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Announcements</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              What first-years are being told. If a message is urgent, share it calmly and point students to the next step.
            </Text>
            {offline ? <ShameResilientBanner message="You are viewing saved announcements while your connection is unavailable." type="info" /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>No announcements have been posted yet.</Text>
          )
        }
        renderItem={({ item }) => {
          const urgent = isUrgent(item.priority);
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: urgent ? colors.accent : colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: urgent ? colors.accent : colors.card }]}>
                  <Text style={[styles.badgeText, { color: urgent ? '#071B2C' : colors.textSecondary }]}>{item.priority}</Text>
                </View>
              </View>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
              {item.postedBy ? <Text style={[styles.meta, { color: colors.textSecondary }]}>Posted by {item.postedBy}</Text> : null}
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
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  loading: { marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 11, marginTop: 8 },
});
