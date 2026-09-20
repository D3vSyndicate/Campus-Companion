import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../components/PageHeader';
import { ScaledText as Text } from '../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen, Panel, PriorityBadge, SectionLabel } from '../../../components/mentorgroups/parts';
import { postedLabel } from '../../../lib/announcements';
import { fetchNotes, fetchOverview, isMissingSetup, type GroupNote, type GroupOverview } from '../../../lib/mentorGroups';
import { useTheme } from '../../../theme/ThemeContext';

// A student's mentor group: who the mentor is, how full it is, and what the mentor has announced.
// Only members can read the announcements: the database decides that, not this screen.
export default function StudentMentorGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // undefined = still loading, null = there is no such group for this student.
  const [group, setGroup] = useState<GroupOverview | null | undefined>(undefined);
  const [notes, setNotes] = useState<GroupNote[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setGroup(null);
      return;
    }
    const [overview, announcements] = await Promise.all([fetchOverview(id), fetchNotes(id)]);
    if (overview.error) {
      setProblem(isMissingSetup(overview.error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      setGroup(null);
      return;
    }
    setProblem(null);
    setGroup(overview.group);
    setNotes(announcements.notes);
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <MgScreen refreshing={refreshing} onRefresh={() => void refresh()}>
      <PageHeader
        eyebrow={t('mg.title')}
        title={group?.name ?? t('mg.title')}
        subtitle={group ? group.programme : t('mg.subtitle')}
        showSearch={false}
      />

      {group === undefined ? (
        <Loading />
      ) : group === null ? (
        <EmptyState icon="people-outline" title={t('mg.groupGone')} text={problem ?? t('mg.groupGoneText')}>
          <MgButton label={t('mg.findTitle')} icon="search-outline" onPress={() => router.push('/(student)/mentorGroups/groups' as never)} />
        </EmptyState>
      ) : (
        <>
          <Panel style={styles.about}>
            <View style={styles.aboutRow}>
              <View style={[styles.iconTile, { backgroundColor: colors.background }]}>
                <Ionicons name="person-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.small, { color: colors.textSecondary }]}>{t('mg.mentor')}</Text>
                <Text style={[styles.strong, { color: colors.text }]}>{group.mentorName}</Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.small, { color: colors.textSecondary }]}>{t('mg.members')}</Text>
                <Text style={[styles.strong, { color: colors.text }]}>{t('mg.membersOf', { count: group.memberCount, max: group.maxCapacity })}</Text>
              </View>
            </View>
            {group.description ? (
              <>
                <SectionLabel>{t('mg.about')}</SectionLabel>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{group.description}</Text>
              </>
            ) : null}
          </Panel>

          <View>
            <SectionLabel>{t('mg.broadcasts')}</SectionLabel>
            <Text style={[styles.small, { color: colors.textSecondary, marginTop: 2 }]}>{t('mg.broadcastsSub')}</Text>
          </View>

          {notes.length === 0 ? (
            <EmptyState icon="megaphone-outline" title={t('mg.noBroadcasts')} />
          ) : (
            notes.map((note) => (
              <Panel key={note.id} style={styles.note}>
                <View style={styles.noteHead}>
                  <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                  <PriorityBadge priority={note.priority} />
                </View>
                <Text style={[styles.small, { color: colors.textSecondary }]}>{postedLabel(note.createdAt)}</Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{note.message}</Text>
              </Panel>
            ))
          )}

          <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mg.readOnly')}</Text>
        </>
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end' },
  about: { gap: 12 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 12, lineHeight: 17 },
  strong: { fontSize: 15, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  note: { gap: 6 },
  noteHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  noteTitle: { flex: 1, fontSize: 16, fontWeight: '800' },
  foot: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
