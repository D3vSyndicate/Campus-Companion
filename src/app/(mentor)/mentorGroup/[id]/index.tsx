import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../../components/PageHeader';
import { ScaledText as Text } from '../../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen, Panel } from '../../../../components/mentorgroups/parts';
import { fetchOverview, isMissingSetup, type GroupOverview } from '../../../../lib/mentorGroups';
import { useTheme } from '../../../../theme/ThemeContext';

// A mentor's own group: how full it is, and the four things a mentor does with it.
export default function MentorGroupDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = useState<GroupOverview | null | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return setGroup(null);
    const { group: found, error } = await fetchOverview(id);
    if (error) {
      setProblem(isMissingSetup(error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      return setGroup(null);
    }
    setProblem(null);
    setGroup(found);
  }, [id, t]);

  // Reload whenever the mentor comes back from approving requests, removing members and so on.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const go = (path: string) => router.push(`/mentorGroup/${id}/${path}` as never);

  if (group === undefined) {
    return (
      <MgScreen>
        <PageHeader eyebrow={t('mgm.manageGroup')} title={t('mg.title')} showSearch={false} />
        <Loading />
      </MgScreen>
    );
  }

  if (group === null) {
    return (
      <MgScreen>
        <PageHeader eyebrow={t('mgm.manageGroup')} title={t('mg.title')} showSearch={false} />
        <EmptyState icon="people-outline" title={t('mgm.loadFail')} text={problem ?? t('mgm.notFound')}>
          <MgButton label={t('mg.title')} onPress={() => router.push('/mentorGroup/group' as never)} />
        </EmptyState>
      </MgScreen>
    );
  }

  const remaining = Math.max(group.maxCapacity - group.memberCount, 0);
  const fill = group.maxCapacity > 0 ? Math.min(group.memberCount / group.maxCapacity, 1) : 0;

  const tiles: { key: string; icon: keyof typeof Ionicons.glyphMap; title: string; text: string; badge?: number; path: string }[] = [
    { key: 'requests', icon: 'person-add-outline', title: t('mgm.joinRequests'), text: t('mgm.joinRequestsText'), badge: group.pendingCount, path: 'request' },
    { key: 'members', icon: 'people-outline', title: t('mg.members'), text: t('mgm.membersText'), path: 'members' },
    { key: 'qr', icon: 'qr-code-outline', title: t('mgm.qrTitle'), text: t('mgm.qrText'), path: 'qr' },
    { key: 'broadcast', icon: 'megaphone-outline', title: t('mgm.broadcast'), text: t('mgm.broadcastText'), path: 'broadcast' },
  ];

  return (
    <MgScreen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load().finally(() => setRefreshing(false));
      }}
    >
      <PageHeader eyebrow={t('mgm.manageGroup')} title={group.name} subtitle={group.programme} showSearch={false} />

      {group.description ? (
        <Panel>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{group.description}</Text>
        </Panel>
      ) : null}

      <Panel style={styles.capacity}>
        <View style={styles.capacityHead}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('mgm.capacityUpper')}</Text>
          <Text style={[styles.count, { color: colors.text }]}>
            {group.memberCount} / {group.maxCapacity}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View style={[styles.fill, { width: `${fill * 100}%`, backgroundColor: remaining === 0 ? '#C62828' : colors.accent }]} />
        </View>
        <Text style={[styles.small, { color: colors.textSecondary }]}>
          {remaining} {t('mgm.spacesLeft')}
        </Text>
      </Panel>

      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('mgm.manageGroup')}</Text>
      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          accessibilityLabel={tile.badge ? `${tile.title}, ${tile.badge}` : tile.title}
          onPress={() => go(tile.path)}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.tileIcon, { backgroundColor: colors.background }]}>
            <Ionicons name={tile.icon} size={22} color={colors.accent} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{tile.title}</Text>
            <Text style={[styles.small, { color: colors.textSecondary }]}>{tile.text}</Text>
          </View>
          {tile.badge ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{tile.badge}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}

      <MgButton label={t('mgm.editTitle')} icon="create-outline" tone="quiet" onPress={() => go('edit')} />
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  body: { fontSize: 14, lineHeight: 21 },
  capacity: { gap: 10 },
  capacityHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  count: { fontSize: 20, fontWeight: '800' },
  track: { height: 10, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  small: { fontSize: 12, lineHeight: 17 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, minHeight: 72 },
  tileIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontSize: 15, fontWeight: '800' },
  badge: { minWidth: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#071B2C', fontSize: 12, fontWeight: '800' },
});
