import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../../components/PageHeader';
import { ScaledText as Text } from '../../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen, Panel } from '../../../../components/mentorgroups/parts';
import { useToast } from '../../../../context/ToastContext';
import { shortDate } from '../../../../lib/dates';
import { fetchRequests, isMissingSetup, reviewRequest, type JoinRequest } from '../../../../lib/mentorGroups';
import { useTheme } from '../../../../theme/ThemeContext';

// Students waiting to join this mentor's group. Approving adds them; rejecting tells them no. The database
// checks the group has room and that the student is not already in another group.
export default function MentorGroupRequests() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [requests, setRequests] = useState<JoinRequest[] | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return setRequests([]);
    const { requests: list, error } = await fetchRequests(id);
    if (error) {
      setProblem(isMissingSetup(error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      return setRequests([]);
    }
    setProblem(null);
    setRequests(list);
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const decide = (request: JoinRequest, decision: 'approved' | 'rejected') => {
    const approving = decision === 'approved';
    Alert.alert(
      approving ? t('mgm.approveTitle') : t('mgm.rejectTitle'),
      approving ? t('mgm.confirmApprove', { name: request.name }) : t('mgm.confirmReject', { name: request.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: approving ? t('mgm.approve') : t('mgm.reject'),
          style: approving ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(request.id);
              const { error } = await reviewRequest(request.id, decision);
              setBusyId(null);
              if (error) {
                showToast(error.message, 'error');
                await load();
                return;
              }
              showToast(approving ? t('mgm.added', { name: request.name }) : t('mgm.rejectedNamed', { name: request.name }), 'success');
              await load();
            })();
          },
        },
      ],
    );
  };

  return (
    <MgScreen>
      <PageHeader eyebrow={t('mgm.pendingRequests')} title={t('mgm.joinRequests')} subtitle={t('mgm.waiting')} showSearch={false} />

      {requests === undefined ? (
        <Loading />
      ) : requests.length === 0 ? (
        <EmptyState icon="person-add-outline" title={problem ? t('mgm.loadFail') : t('mgm.noPending')} text={problem ?? t('mgm.noPendingText')} />
      ) : (
        requests.map((request) => (
          <Panel key={request.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{request.name}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[request.studentNumber, `${t('mgm.requested')} ${shortDate(request.requestedAt)}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <MgButton label={t('mgm.reject')} icon="close-outline" tone="quiet" disabled={busyId === request.id} onPress={() => decide(request, 'rejected')} />
              </View>
              <View style={styles.flex}>
                <MgButton label={t('mgm.approve')} icon="checkmark-outline" busy={busyId === request.id} onPress={() => decide(request, 'approved')} />
              </View>
            </View>
          </Panel>
        ))
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
});
