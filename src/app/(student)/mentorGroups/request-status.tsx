import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../components/PageHeader';
import { ScaledText as Text } from '../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen, Panel } from '../../../components/mentorgroups/parts';
import { fetchMyState, isMissingSetup, type MyGroupState } from '../../../lib/mentorGroups';
import { useTheme } from '../../../theme/ThemeContext';

// Where the student stands with their mentor group: in one, waiting for an answer, turned down, taken
// out, or not asked yet. It reads the database each time, so "Check again" shows the mentor's answer.
export default function RequestStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  // undefined = loading, null = no request or membership at all.
  const [mine, setMine] = useState<MyGroupState | null | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const { state, error } = await fetchMyState();
    if (error) {
      setProblem(isMissingSetup(error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      setMine(null);
      return;
    }
    setProblem(null);
    setMine(state);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkAgain = async () => {
    setChecking(true);
    await load();
    setChecking(false);
  };

  const find = () => router.push('/(student)/mentorGroups/groups' as never);
  const scan = () => router.push('/(student)/mentorGroups/scan' as never);

  const copy = (() => {
    switch (mine?.state) {
      case 'member':
        return { icon: 'checkmark-circle-outline' as const, tint: '#1F7A5A', title: t('mg.approved'), text: t('mg.approvedText') };
      case 'rejected':
        return { icon: 'close-circle-outline' as const, tint: '#C62828', title: t('mg.rejected'), text: t('mg.rejectedText') };
      case 'removed':
        return { icon: 'exit-outline' as const, tint: '#C62828', title: t('mg.removedTitle'), text: t('mg.removedText') };
      default:
        return { icon: 'time-outline' as const, tint: '#D98E04', title: t('mg.requestPending'), text: t('mg.pendingText') };
    }
  })();

  return (
    <MgScreen>
      <PageHeader eyebrow={t('mg.title')} title={t('mg.statusTitle')} subtitle={t('mg.statusSubtitle')} showSearch={false} />

      {mine === undefined ? (
        <Loading />
      ) : mine === null ? (
        <EmptyState icon="people-outline" title={problem ? t('mg.groupGone') : t('mg.notAsked')} text={problem ?? t('mg.notAskedText')}>
          <MgButton label={t('mg.findTitle')} icon="search-outline" onPress={find} />
          <MgButton label={t('mg.scanTitle')} icon="qr-code-outline" tone="quiet" onPress={scan} />
        </EmptyState>
      ) : (
        <>
          <Panel style={styles.card}>
            <View style={[styles.iconTile, { backgroundColor: `${copy.tint}22` }]}>
              <Ionicons name={copy.icon} size={30} color={copy.tint} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
            <Text style={[styles.group, { color: colors.accent }]}>{mine.groupName}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{copy.text}</Text>
          </Panel>

          {mine.state === 'member' ? (
            <MgButton label={t('mg.openMine')} icon="people-outline" onPress={() => router.push(`/(student)/mentorGroups/${mine.groupId}` as never)} />
          ) : mine.state === 'pending' ? (
            <>
              <MgButton label={t('mg.checkAgain')} icon="refresh-outline" busy={checking} onPress={() => void checkAgain()} />
              <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mg.oneGroupOnly')}</Text>
            </>
          ) : (
            <>
              <MgButton label={t('mg.findAnother')} icon="search-outline" onPress={find} />
              <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mg.browseOthers')}</Text>
            </>
          )}
        </>
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  iconTile: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  group: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  text: { fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 340, marginTop: 4 },
  foot: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
