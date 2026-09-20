import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PageHeader } from '../../../../components/PageHeader';
import { ScaledText as Text } from '../../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen, Panel } from '../../../../components/mentorgroups/parts';
import { useToast } from '../../../../context/ToastContext';
import { fetchOverview, isMissingSetup, qrPayload, regenerateQr } from '../../../../lib/mentorGroups';
import { useTheme } from '../../../../theme/ThemeContext';

// The QR code a mentor shows to students. It holds a secret token, not the group's id, so replacing the
// token really does stop an old code (or a photo of it) from working. Scanning only ever sends a request.
export default function MentorGroupQR() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return setToken(null);
    const { group, error } = await fetchOverview(id);
    if (error) {
      setProblem(isMissingSetup(error) ? t('mgm.notSetUp') : t('common.tryAgain'));
      return setToken(null);
    }
    setProblem(null);
    setToken(group?.qrToken ?? null);
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const regenerate = () => {
    Alert.alert(t('mgm.regenTitle'), t('mgm.regenText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('mgm.regen'),
        onPress: () => {
          void (async () => {
            if (!id) return;
            setBusy(true);
            const { token: fresh, error } = await regenerateQr(id);
            setBusy(false);
            if (error || !fresh) {
              showToast(error?.message ?? t('common.tryAgain'), 'error');
              return;
            }
            setToken(fresh);
            showToast(t('mgm.regenDone'), 'success');
          })();
        },
      },
    ]);
  };

  return (
    <MgScreen>
      <PageHeader eyebrow={t('mg.title')} title={t('mgm.qrTitle')} subtitle={t('mgm.qrCanScan')} showSearch={false} />

      {token === undefined ? (
        <Loading />
      ) : token === null ? (
        <EmptyState icon="qr-code-outline" title={t('mgm.loadFail')} text={problem ?? t('mgm.notFound')} />
      ) : (
        <>
          <Panel style={styles.qrCard}>
            <View style={styles.qrWrapper}>
              <QRCode value={qrPayload(token)} size={230} backgroundColor="white" color="black" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('mgm.scanToJoin')}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{t('mgm.qrHow')}</Text>
          </Panel>

          <Panel style={styles.note}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
            <View style={styles.flex}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>{t('mgm.approvalRequired')}</Text>
              <Text style={[styles.small, { color: colors.textSecondary }]}>{t('mgm.approvalText')}</Text>
            </View>
          </Panel>

          <MgButton label={t('mgm.regenTitle')} icon="refresh-outline" tone="quiet" busy={busy} onPress={regenerate} />
          <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mgm.qrShareOnly')}</Text>
        </>
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  qrCard: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  qrWrapper: { padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF' },
  title: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  text: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  noteTitle: { fontSize: 14, fontWeight: '800' },
  small: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  foot: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
