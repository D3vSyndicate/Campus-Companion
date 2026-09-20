import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAuth } from '../../context/AuthContext';
import i18n from '../../i18n';
import { isRecent, newestFirst, postedAtOf, postedLabel, useSeenAnnouncements } from '../../lib/announcements';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Announcement = { id: string; title: string; message: string; priority: string; postedAt: Date | null };

const str = (value: unknown) => String(value ?? '').trim();
const isUrgent = (priority: string) => ['urgent', 'high'].includes(priority.toLowerCase());

// Read-only: buddies see what students are being told, so their answers match.
export default function BuddyAnnouncements() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { seen, markSeen } = useSeenAnnouncements(user?.id);
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = async () => {
    const { data, fromCache, error } = await fetchWithOfflineFallback('Announcement');
    setOffline(fromCache && Boolean(error));
    setItems(
      newestFirst((Array.isArray(data) ? data : []).map((row: Record<string, unknown>, index: number): Announcement => ({
        id: str(row.announcement_id) || String(index),
        title: str(row.title),
        message: str(row.message),
        priority: str(row.priority_level) || 'Normal',
        postedAt: postedAtOf(row),
      }))),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const ids = items.map((item) => item.id);
      return () => markSeen(ids);
    }, [items, markSeen]),
  );

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
            <PageHeader
              eyebrow={t('buddy.eyebrow')}
              title={t('buddy.actions.announcements.title')}
              subtitle={t('buddyAnn.subtitle')}
            />
            {offline ? <ShameResilientBanner message={t('buddyAnn.saved')} type="info" /> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={styles.loading} />
          ) : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('buddyAnn.none')}</Text>
          )
        }
        renderItem={({ item }) => {
          const urgent = isUrgent(item.priority);
          const isNew = isRecent(item.postedAt) && !seen.has(item.id);
          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: urgent ? colors.accent : colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
                {isNew ? (
                  <View style={[styles.newBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                ) : null}
                <View style={[styles.badge, { backgroundColor: urgent ? colors.accent : colors.card }]}>
                  <Text style={[styles.badgeText, { color: urgent ? '#071B2C' : colors.textSecondary }]}>{item.priority}</Text>
                </View>
              </View>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{item.message}</Text>
              {item.postedAt ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{i18n.t('announcements.posted', { when: postedLabel(item.postedAt) })}</Text> : null}
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
  empty: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  loading: { marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  newBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  newBadgeText: { color: '#071B2C', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 11, marginTop: 8 },
});
