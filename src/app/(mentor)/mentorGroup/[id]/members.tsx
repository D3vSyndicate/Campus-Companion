import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../../components/PageHeader';
import { ScaledText as Text } from '../../../../components/ScaledText';
import { EmptyState, Loading, MgScreen, Panel } from '../../../../components/mentorgroups/parts';
import { useToast } from '../../../../context/ToastContext';
import { shortDate } from '../../../../lib/dates';
import { fetchMembers, isMissingSetup, removeMember, type GroupMember } from '../../../../lib/mentorGroups';
import { useTheme } from '../../../../theme/ThemeContext';

// The students in a mentor's group, from the database. Removing one asks first.
export default function MentorGroupMembers() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [members, setMembers] = useState<GroupMember[] | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return setMembers([]);
    const { members: list, error } = await fetchMembers(id);
    if (error) {
      setProblem(isMissingSetup(error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      return setMembers([]);
    }
    setProblem(null);
    setMembers(list);
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmRemove = (member: GroupMember) => {
    Alert.alert(t('mgm.removeMember'), t('mgm.confirmRemove', { name: member.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('mgm.remove'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (!id) return;
            setBusyId(member.studentId);
            const { error } = await removeMember(id, member.studentId);
            setBusyId(null);
            if (error) {
              showToast(error.message, 'error');
              return;
            }
            showToast(t('mgm.removed', { name: member.name }), 'success');
            await load();
          })();
        },
      },
    ]);
  };

  return (
    <MgScreen>
      <PageHeader eyebrow={t('mgm.groupMembers')} title={t('mg.members')} subtitle={t('mgm.membersSub')} showSearch={false} />

      {members === undefined ? (
        <Loading />
      ) : members.length === 0 ? (
        <EmptyState icon="people-outline" title={problem ? t('mgm.loadFail') : t('mgm.noMembers')} text={problem ?? t('mgm.noMembersText')} />
      ) : (
        <>
          <Text style={[styles.count, { color: colors.textSecondary }]}>
            {t('mgm.activeMembers')}: {members.length}
          </Text>
          {members.map((member) => (
            <Panel key={member.studentId} style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{member.name}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[member.studentNumber, `${t('mgm.joined')} ${shortDate(member.joinedAt)}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('mgm.remove')} ${member.name}`}
                disabled={busyId === member.studentId}
                onPress={() => confirmRemove(member)}
                style={({ pressed }) => [styles.remove, (pressed || busyId === member.studentId) && { opacity: 0.5 }]}
              >
                <Ionicons name="person-remove-outline" size={20} color="#C62828" />
              </Pressable>
            </Panel>
          ))}
        </>
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  count: { fontSize: 12, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#071B2C', fontSize: 16, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
