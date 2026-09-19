import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

// Wording pairs come from the orientation spec's "supportive UI wording" table: the same kindness
// the app shows students is what a buddy should say out loud.
const SAY_THIS: { situation: string; avoid: string; better: string }[] = [
  {
    situation: 'A student missed a session',
    avoid: 'You missed this session.',
    better: 'This session has already passed. Here is what you can do next.',
  },
  {
    situation: 'A student does not know where to go',
    avoid: 'Venue unknown.',
    better: 'Not sure where this is? Here are directions.',
  },
  {
    situation: 'A student asks a basic question',
    avoid: 'That is an obvious question.',
    better: 'Many new students ask this. Here is a quick guide.',
  },
  {
    situation: 'A student cannot access Funda',
    avoid: 'Login failed.',
    better: "Let's check a few things: your username, password and internet connection.",
  },
  {
    situation: 'A student needs support',
    avoid: 'Contact support.',
    better: 'Tell us what you need help with, and we will guide you to the right place.',
  },
];

const PRINCIPLES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'flame-outline', title: 'Courage', text: 'Encourage the next small step: attend the session, ask the question, send the email.' },
  { icon: 'heart-outline', title: 'Empathy', text: 'Orientation can feel overwhelming. Use warm, plain words and skip the jargon.' },
  { icon: 'hand-left-outline', title: 'Vulnerability', text: 'Make it safe to say "I do not know yet". Share a time you felt the same.' },
  { icon: 'shield-checkmark-outline', title: 'Shame resilience', text: 'Never make anyone feel late, lost or foolish. Always leave them with a next step.' },
];

const BOUNDARIES = [
  'You are a buddy, not a counsellor. For serious worries about safety or wellbeing, refer the student to professional support and tell the orientation coordinators.',
  'Never ask for ID numbers, medical details or financial information, and do not share what a student tells you in confidence.',
  'Keep Tribe chats respectful. Orientation staff can read them to help keep the space safe.',
  'If you do not know the answer, say so, then find it together in the Answers tab or ask a coordinator.',
];

const CHECKLIST = [
  'Say hello to your tribe in the chat',
  "Read today's announcements",
  "Look at this week's schedule and know where the venues are",
  'Save the key contacts in the Refer tab',
  'Read through the FAQs so the common answers feel familiar',
];

const storageKey = (userId: string) => `buddy:checklist:${userId}`;

export default function BuddyGuide() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id ?? 'guest';

  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey(userId));
        if (saved) setDone(JSON.parse(saved) as number[]);
      } catch {
        // A lost tick is harmless; start fresh.
      }
    })();
  }, [userId]);

  const toggle = (index: number) => {
    const next = done.includes(index) ? done.filter((entry) => entry !== index) : [...done, index];
    setDone(next);
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => undefined);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Buddy guide</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        As a first-year student buddy you help new students find their feet during orientation and the first weeks. You share information, point to help, and make it feel normal to ask.
      </Text>

      <Text style={[styles.heading, { color: colors.text }]}>Your first-week checklist</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {CHECKLIST.map((item, index) => {
          const checked = done.includes(index);
          return (
            <TouchableOpacity
              key={item}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggle(index)}
              style={styles.checkRow}
            >
              <Ionicons
                name={checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={checked ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.checkText, { color: colors.text }, checked && styles.checked]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.progress, { color: colors.textSecondary }]}>
          {done.length} of {CHECKLIST.length} done. One step at a time.
        </Text>
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>How to help</Text>
      {PRINCIPLES.map((principle) => (
        <View key={principle.title} style={[styles.principle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.card }]}>
            <Ionicons name={principle.icon} size={20} color={colors.accent} />
          </View>
          <View style={styles.principleText}>
            <Text style={[styles.principleTitle, { color: colors.text }]}>{principle.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{principle.text}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.heading, { color: colors.text }]}>Say this, not that</Text>
      {SAY_THIS.map((row) => (
        <View key={row.situation} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.situation, { color: colors.textSecondary }]}>{row.situation}</Text>
          <Text style={[styles.avoid, { color: colors.danger }]}>Avoid: {row.avoid}</Text>
          <Text style={[styles.better, { color: colors.text }]}>Try: {row.better}</Text>
        </View>
      ))}

      <Text style={[styles.heading, { color: colors.text }]}>Your boundaries</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {BOUNDARIES.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.body, styles.bulletText, { color: colors.textSecondary }]}>{line}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  heading: { fontSize: 18, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  checkText: { flex: 1, fontSize: 14, lineHeight: 20 },
  checked: { textDecorationLine: 'line-through', opacity: 0.6 },
  progress: { fontSize: 12, marginTop: 6 },
  principle: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  principleText: { flex: 1 },
  principleTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  body: { fontSize: 14, lineHeight: 20 },
  situation: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  avoid: { fontSize: 13, lineHeight: 19, textDecorationLine: 'line-through', marginBottom: 4 },
  better: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1 },
});
