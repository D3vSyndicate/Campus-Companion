import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = {
  // Students and mentors also get a shortcut to their support screen.
  variant?: 'student' | 'mentor' | 'staff';
};

// The words are in the locale files under about.*. These lists only say which entries to show.
const PROJECT_NAME = 'Campus Companion';

const PRINCIPLES: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'courage', icon: 'flame-outline' },
  { id: 'empathy', icon: 'heart-outline' },
  { id: 'vulnerability', icon: 'hand-left-outline' },
  { id: 'shame', icon: 'shield-checkmark-outline' },
];

// f5 is the checklist, which reuses the wording of the checklist screen.
const FEATURES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11'];

const PRIVACY = ['keep', 'never', 'who', 'device', 'map', 'approach'];

function Section({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={styles.cardHeader}
      >
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </Pressable>
      {open ? <View style={[styles.cardBody, { borderTopColor: colors.border }]}>{children}</View> : null}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.body, styles.bulletText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

export function AboutProject({ variant = 'student' }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>('about');

  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));
  const platformName = Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iOS' : 'Android';

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('about.label')}</Text>

      <Section icon="information-circle-outline" title={t('about.appTitle')} open={openKey === 'about'} onToggle={() => toggle('about')}>
        <Text style={[styles.name, { color: colors.text }]}>{PROJECT_NAME}</Text>
        <Text style={[styles.subtitle, { color: colors.accent }]}>{t('about.subtitle')}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('about.summary')}</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>{t('about.status')}</Text>
      </Section>

      <Section icon="sparkles-outline" title={t('about.supportTitle')} open={openKey === 'support'} onToggle={() => toggle('support')}>
        {PRINCIPLES.map((principle) => (
          <View key={principle.id} style={styles.principle}>
            <View style={[styles.principleIcon, { backgroundColor: colors.background }]}>
              <Ionicons name={principle.icon} size={18} color={colors.accent} />
            </View>
            <View style={styles.principleText}>
              <Text style={[styles.principleTitle, { color: colors.text }]}>{t(`buddyGuide.principles.${principle.id}.title`)}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{t(`about.principles.${principle.id}`)}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section icon="apps-outline" title={t('about.insideTitle')} open={openKey === 'features'} onToggle={() => toggle('features')}>
        {FEATURES.map((feature) => (
          <Bullet key={feature} text={feature === 'f5' ? t('common.checklistTitleShort') : t(`about.features.${feature}`)} />
        ))}
      </Section>

      <Section icon="lock-closed-outline" title={t('about.privacyTitle')} open={openKey === 'privacy'} onToggle={() => toggle('privacy')}>
        {PRIVACY.map((item) => (
          <View key={item} style={styles.privacyItem}>
            <Text style={[styles.principleTitle, { color: colors.text }]}>{t(`about.privacy.${item}.label`)}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{t(`about.privacy.${item}.text`)}</Text>
          </View>
        ))}
      </Section>

      <Section icon="help-buoy-outline" title={t('about.helpTitle')} open={openKey === 'help'} onToggle={() => toggle('help')}>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t('about.helpText')}
        </Text>
        {variant !== 'staff' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push((variant === 'mentor' ? '/(mentor)/refer' : '/(student)/contacts') as never)}
            style={[styles.button, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.buttonText}>{variant === 'mentor' ? t('about.openRefer') : t('about.openSupport')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#071B2C" />
          </Pressable>
        ) : null}
      </Section>

      <Section icon="phone-portrait-outline" title={t('about.infoTitle')} open={openKey === 'info'} onToggle={() => toggle('info')}>
        {[
          ['version', Constants.expoConfig?.version ?? '1.0.0'],
          ['platform', platformName],
          ['data', t('about.dataValue')],
        ].map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textSecondary }]}>{t(`about.${key}`)}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
          </View>
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  cardBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 15 },
  name: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '700', marginTop: 2, marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21 },
  note: { fontSize: 12, lineHeight: 18, fontStyle: 'italic', marginTop: 10 },
  principle: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  principleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  principleText: { flex: 1 },
  principleTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1 },
  privacyItem: { marginBottom: 12 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12, marginTop: 14 },
  buttonText: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 6 },
  infoKey: { fontSize: 13, fontWeight: '600' },
  infoValue: { flex: 1, fontSize: 13, textAlign: 'right' },
});
