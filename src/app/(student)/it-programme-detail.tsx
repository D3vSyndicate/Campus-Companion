import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { loadProgrammes, type Programme } from '../../lib/programmes';
import { useTheme } from '../../theme/ThemeContext';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LINK = /^https?:\/\//i;
const PHONE = /^\+?[\d\s()-]{7,}$/;

// The advisor contact is one free-text field, so work out what kind of contact it is.
function contactAction(contact: string): { url: string; icon: keyof typeof Ionicons.glyphMap; label: string } | null {
  if (EMAIL.test(contact)) return { url: `mailto:${contact}`, icon: 'mail-outline', label: 'Email' };
  if (LINK.test(contact)) return { url: contact, icon: 'open-outline', label: 'Open link' };
  if (PHONE.test(contact)) return { url: `tel:${contact.replace(/[\s()-]/g, '')}`, icon: 'call-outline', label: 'Call' };
  return null;
}

// "Year 1: Foundations" is shown with the year in bold. Lines without a short label are shown as they are.
function splitLabel(line: string): { label: string; rest: string } {
  const index = line.indexOf(':');
  if (index > 0 && index <= 24) return { label: line.slice(0, index).trim(), rest: line.slice(index + 1).trim() };
  return { label: '', rest: line };
}

export default function ProgrammeDetailScreen() {
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

  const Section = ({ icon, title, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; children: ReactNode }) => (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

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
      accessibilityLabel="Back to all programmes"
      onPress={goBack}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name="arrow-back" size={18} color={colors.text} />
      <Text style={[styles.backText, { color: colors.text }]}>All programmes</Text>
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
          <Text style={[styles.stateTitle, { color: colors.text }]}>We could not find that programme</Text>
          <Text style={[styles.stateText, { color: colors.textSecondary }]}>It may have been removed. Go back to see the current list.</Text>
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
        eyebrow="School of IT programme"
        title={programme.name}
        showBack
        backFallback="/(student)/it-programmes"
      />

      {offline ? <ShameResilientBanner message="You are offline, so this may be out of date." type="info" /> : null}

      {programme.description ? (
        <Section icon="information-circle-outline" title="About this programme">
          <Text style={[styles.body, { color: colors.text }]}>{programme.description}</Text>
        </Section>
      ) : null}

      {years.length ? (
        <Section icon="layers-outline" title="Year level structure">
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
        <Section icon="book-outline" title="Key modules">
          {bullets(programme.keyModules)}
        </Section>
      ) : null}

      {programme.careers.length ? (
        <Section icon="briefcase-outline" title="Career possibilities">
          {bullets(programme.careers)}
        </Section>
      ) : null}

      {programme.expectations ? (
        <Section icon="ribbon-outline" title="Academic expectations">
          <Text style={[styles.body, { color: colors.text }]}>{programme.expectations}</Text>
        </Section>
      ) : null}

      <View style={[styles.advice, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
        <View style={styles.sectionHead}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Advice</Text>
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
                accessibilityLabel={`${action.label} ${programme.advisorName || 'the advisor'}`}
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
            Advisor details have not been added yet. Ask your buddy or a coordinator who to speak to.
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
