import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = {
  // Students and mentors also get a shortcut to their support screen.
  variant?: 'student' | 'mentor' | 'staff';
};

// Edit these to update what the About section says.
const PROJECT = {
  name: 'Campus Companion',
  subtitle: 'School of IT Student Orientation App',
  summary:
    'Built to help first-year School of IT students feel welcome, informed and ready. It brings the orientation schedule, venues, contacts, FAQs, support and digital skills guides into one place, so nobody has to piece it together from emails and messages.',
  status: 'This is a hackathon prototype. Content shown may be sample data until staff publish the real orientation programme.',
};

const PRINCIPLES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: 'flame-outline',
    title: 'Courage',
    text: 'Clear next steps and small wins, so taking the first step feels doable.',
  },
  {
    icon: 'heart-outline',
    title: 'Empathy',
    text: 'Warm, plain language. We never assume you already know how university works.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Vulnerability',
    text: 'Not knowing something yet is normal. The guides and FAQs are here for exactly that.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Shame resilience',
    text: 'Missed a session or feeling lost? You will always be shown what to do next, never blamed.',
  },
];

const FEATURES = [
  'Home with announcements, shuttle times and your progress',
  'Orientation schedule with venue directions',
  'New student checklist',
  'Digital readiness guides: computer skills, Funda, printing and Wi-Fi',
  'FAQs grouped by category',
  'Support pathways ("I need help with...") and key contacts',
  'Tribe: a chat with the students in your mentor group',
  'Language switcher (English, isiXhosa, Afrikaans), dark mode and adjustable text size',
  'Saved copy of key information for when your connection drops',
];

const PRIVACY: { label: string; text: string }[] = [
  {
    label: 'What we keep',
    text: 'Your email address (to sign you in), the chat name you choose for Tribe, the messages you send there, and which digital readiness steps you have finished.',
  },
  {
    label: 'What we never ask for',
    text: 'ID numbers, medical details or financial information.',
  },
  {
    label: 'Who can see it',
    text: 'Tribe messages are visible to the students in your tribe and to orientation staff, who help keep the space safe. Your progress is only yours.',
  },
  {
    label: 'On your device',
    text: 'Your language, text size and theme, plus a saved copy of the schedule, FAQs and contacts so they work offline.',
  },
  {
    label: 'Our approach',
    text: 'Designed with POPIA principles in mind: collect only what is needed, and keep private details private.',
  },
];

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
  const { colors } = useTheme();
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>('about');

  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));
  const platformName = Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iOS' : 'Android';

  return (
    <View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>ABOUT THE PROJECT</Text>

      <Section icon="information-circle-outline" title="About this app" open={openKey === 'about'} onToggle={() => toggle('about')}>
        <Text style={[styles.name, { color: colors.text }]}>{PROJECT.name}</Text>
        <Text style={[styles.subtitle, { color: colors.accent }]}>{PROJECT.subtitle}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{PROJECT.summary}</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>{PROJECT.status}</Text>
      </Section>

      <Section icon="sparkles-outline" title="How it supports students" open={openKey === 'support'} onToggle={() => toggle('support')}>
        {PRINCIPLES.map((principle) => (
          <View key={principle.title} style={styles.principle}>
            <View style={[styles.principleIcon, { backgroundColor: colors.background }]}>
              <Ionicons name={principle.icon} size={18} color={colors.accent} />
            </View>
            <View style={styles.principleText}>
              <Text style={[styles.principleTitle, { color: colors.text }]}>{principle.title}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{principle.text}</Text>
            </View>
          </View>
        ))}
      </Section>

      <Section icon="apps-outline" title="What is inside" open={openKey === 'features'} onToggle={() => toggle('features')}>
        {FEATURES.map((feature) => (
          <Bullet key={feature} text={feature} />
        ))}
      </Section>

      <Section icon="lock-closed-outline" title="Privacy and your data" open={openKey === 'privacy'} onToggle={() => toggle('privacy')}>
        {PRIVACY.map((item) => (
          <View key={item.label} style={styles.privacyItem}>
            <Text style={[styles.principleTitle, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{item.text}</Text>
          </View>
        ))}
      </Section>

      <Section icon="help-buoy-outline" title="Getting real help" open={openKey === 'help'} onToggle={() => toggle('help')}>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          This app points you towards help. It does not replace it. If you are struggling, or you or someone else may be in danger, contact
          the university counselling and wellness services or campus protection services straight away. Asking for help early is a smart,
          responsible thing to do.
        </Text>
        {variant !== 'staff' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push((variant === 'mentor' ? '/(mentor)/refer' : '/(student)/contacts') as never)}
            style={[styles.button, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.buttonText}>{variant === 'mentor' ? 'Open Refer a student' : 'Open the Support tab'}</Text>
            <Ionicons name="arrow-forward" size={16} color="#071B2C" />
          </Pressable>
        ) : null}
      </Section>

      <Section icon="phone-portrait-outline" title="App information" open={openKey === 'info'} onToggle={() => toggle('info')}>
        {[
          ['Version', Constants.expoConfig?.version ?? '1.0.0'],
          ['Platform', platformName],
          ['Data', 'Live from the School of IT database, with a saved copy for offline use'],
        ].map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={[styles.infoKey, { color: colors.textSecondary }]}>{key}</Text>
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
