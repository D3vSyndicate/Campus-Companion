import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { loadProgrammes, type Programme } from '../../lib/programmes';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK = /^https?:\/\//i;
const PHONE = /^\+?[\d\s()-]{7,}$/;

// The advisor contact is one free-text field, so work out what kind of contact it is.
function contactAction(contact: string): { url: string; icon: keyof typeof Ionicons.glyphMap; label: string } | null {
  if (EMAIL.test(contact)) return { url: `mailto:${contact}`, icon: 'mail-outline', label: i18n.t('common.email') };
  if (LINK.test(contact)) return { url: contact, icon: 'open-outline', label: i18n.t('common.openLink') };
  if (PHONE.test(contact)) return { url: `tel:${contact.replace(/[\s()-]/g, '')}`, icon: 'call-outline', label: i18n.t('emergency.call') };
  return null;
}

// "Year 1: Foundations" is shown with the year in bold. Lines without a short label are shown as they are.
function splitLabel(line: string): { label: string; rest: string } {
  const index = line.indexOf(':');
  if (index > 0 && index <= 24) return { label: line.slice(0, index).trim(), rest: line.slice(index + 1).trim() };
  return { label: '', rest: line };
}

function Section({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function ProgrammeDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await loadProgrammes();
      if (!active) return;
      setProgramme(result.programmes.find((item) => item.id === id) ?? null);
      setOffline(result.fromCache && result.failed);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(student)/it-programmes' as never);
  };

  const bullets = (items: string[]) =>
    items.map((item, index) => (
      <View key={`${index}-${item}`} style={styles.bulletRow}>
        <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
        <Text style={[styles.body, styles.bulletText, { color: colors.text }]}>{item}</Text>
      </View>
    ));

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('programmes.backAll')}
      onPress={goBack}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="arrow-back" size={18} color={colors.text} />
      <Text style={[styles.backText, { color: colors.text }]}>{t('programmes.all')}</Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!programme) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        {back}
        <View style={[styles.stateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={28} color={colors.accent} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>{t('programmes.notFound')}</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>{t('programmes.notFoundText')}</Text>
        </View>
      </ScrollView>
    );
  }

  const action = contactAction(programme.advisorContact);
  const hasAdvice = programme.advisorName || programme.advisorContact || programme.advisorAvailability;
  const years = programme.yearStructure
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow={t('programmes.detailEyebrow')}
        title={programme.name}
      />

      {offline ? <ShameResilientBanner message={t('common.offlineShort')} type="info" /> : null}

      {programme.description ? (
        <Section icon="information-circle-outline" title={t('programmes.about')}>
          <Text style={[styles.body, { color: colors.text }]}>{programme.description}</Text>
        </Section>
      ) : null}

      {years.length ? (
        <Section icon="layers-outline" title={t('programmes.years')}>
          {years.map((line, index) => {
            const { label, rest } = splitLabel(line);
            return (
              <Text key={`${index}-${line}`} style={[styles.body, styles.yearLine, { color: colors.text }]}>
                {label ? <Text style={styles.yearLabel}>{label}: </Text> : null}
                {rest}
              </Text>
            );
          })}
        </Section>
      ) : null}

      {programme.keyModules.length ? (
        <Section icon="book-outline" title={t('programmes.modules')}>
          {bullets(programme.keyModules)}
        </Section>
      ) : null}

      {programme.careers.length ? (
        <Section icon="briefcase-outline" title={t('programmes.careers')}>
          {bullets(programme.careers)}
        </Section>
      ) : null}

      {programme.expectations ? (
        <Section icon="ribbon-outline" title={t('programmes.expectations')}>
          <Text style={[styles.body, { color: colors.text }]}>{programme.expectations}</Text>
        </Section>
      ) : null}

      <View style={[styles.advice, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
        <View style={styles.sectionHead}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('programmes.advice')}</Text>
        </View>

        {hasAdvice ? (
          <>
            {programme.advisorName ? (
              <View style={styles.adviceRow}>
                <Ionicons name="person-outline" size={17} color={colors.textSecondary} />
                <Text style={[styles.body, styles.adviceText, { color: colors.text }]}>{programme.advisorName}</Text>
              </View>
            ) : null}
            {programme.advisorContact ? (
              <View style={styles.adviceRow}>
                <Ionicons name="call-outline" size={17} color={colors.textSecondary} />
                <Text style={[styles.body, styles.adviceText, { color: colors.text }]} selectable>
                  {programme.advisorContact}
                </Text>
              </View>
            ) : null}
            {programme.advisorAvailability ? (
              <View style={styles.adviceRow}>
                <Ionicons name="time-outline" size={17} color={colors.textSecondary} />
                <Text style={[styles.body, styles.adviceText, { color: colors.text }]}>{programme.advisorAvailability}</Text>
              </View>
            ) : null}
            {action ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${action.label} ${programme.advisorName || t('programmes.theAdvisor')}`}
                onPress={() => Linking.openURL(action.url).catch(() => undefined)}
                style={({ pressed }) => [styles.action, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name={action.icon} size={17} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>{action.label}</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('programmes.noAdvisor')}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start', marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '800' },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
  yearLine: { marginBottom: 8 },
  yearLabel: { fontWeight: '800' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1 },
  advice: { borderWidth: 2, borderRadius: 16, padding: 16, marginBottom: 12 },
  adviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  adviceText: { flex: 1 },
  action: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, marginTop: 6 },
  actionText: { fontSize: 14, fontWeight: '800' },
  stateCard: { alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 24 },
  stateTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});
