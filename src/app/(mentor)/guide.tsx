import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

// Wording pairs come from the orientation spec's "supportive UI wording" table: the same kindness
// the app shows students is what a buddy should say out loud. The words themselves live in the locale
// files under buddyGuide.*, so this list only says which entries to show, and in what order.
const SAY_THIS = ['missed', 'lost', 'basic', 'funda', 'support'];

const PRINCIPLES: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'courage', icon: 'flame-outline' },
  { id: 'empathy', icon: 'heart-outline' },
  { id: 'vulnerability', icon: 'hand-left-outline' },
  { id: 'shame', icon: 'shield-checkmark-outline' },
];

const BOUNDARIES = ['b1', 'b2', 'b3', 'b4'];

const CHECKLIST = ['c1', 'c2', 'c3', 'c4', 'c5'];

const storageKey = (userId: string) => `buddy:checklist:${userId}`;

export default function BuddyGuide() {
  const { t } = useTranslation();
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
      <PageHeader
        eyebrow={t('buddy.eyebrow')}
        title={t('buddy.actions.guide.title')}
        subtitle={t('buddyGuide.subtitle')}
      />

      <Text style={[styles.heading, { color: colors.text }]}>{t('buddyGuide.checklistTitle')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {CHECKLIST.map((id, index) => {
          const checked = done.includes(index);
          return (
            <TouchableOpacity
              key={id}
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
              <Text style={[styles.checkText, { color: colors.text }, checked && styles.checked]}>{t(`buddyGuide.checklist.${id}`)}</Text>
            </TouchableOpacity>
          );
        })}
        <Text style={[styles.progress, { color: colors.textSecondary }]}>
          {t('buddyGuide.progress', { done: done.length, total: CHECKLIST.length })}
        </Text>
      </View>

      <Text style={[styles.heading, { color: colors.text }]}>{t('buddyGuide.howToHelp')}</Text>
      {PRINCIPLES.map((principle) => (
        <View key={principle.id} style={[styles.principle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.card }]}>
            <Ionicons name={principle.icon} size={20} color={colors.accent} />
          </View>
          <View style={styles.principleText}>
            <Text style={[styles.principleTitle, { color: colors.text }]}>{t(`buddyGuide.principles.${principle.id}.title`)}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{t(`buddyGuide.principles.${principle.id}.text`)}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.heading, { color: colors.text }]}>{t('buddyGuide.sayThis')}</Text>
      {SAY_THIS.map((id) => (
        <View key={id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.situation, { color: colors.textSecondary }]}>{t(`buddyGuide.say.${id}.situation`)}</Text>
          <Text style={[styles.avoid, { color: colors.danger }]}>{t('buddyGuide.avoid', { text: t(`buddyGuide.say.${id}.avoid`) })}</Text>
          <Text style={[styles.better, { color: colors.text }]}>{t('buddyGuide.try', { text: t(`buddyGuide.say.${id}.better`) })}</Text>
        </View>
      ))}

      <Text style={[styles.heading, { color: colors.text }]}>{t('buddyGuide.boundariesTitle')}</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {BOUNDARIES.map((id) => (
          <View key={id} style={styles.bulletRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.body, styles.bulletText, { color: colors.textSecondary }]}>{t(`buddyGuide.boundaries.${id}`)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
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
