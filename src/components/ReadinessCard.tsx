import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = { done: number; total: number; onPress: () => void };

const INK = '#071B2C';

// The welcome card at the top of Home. It points a new student to the short digital readiness guides
// and shows how far they have got. Once every guide is opened it shrinks to a quiet one-line row.
export function ReadinessCard({ done, total, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const finished = total > 0 && done >= total;
  const started = done > 0;
  const percent = total ? Math.round((done / total) * 100) : 0;

  if (finished) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.readinessDoneTitle')}
        onPress={onPress}
        style={({ pressed }) => [styles.doneCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
      >
        <View style={[styles.tile, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-done-outline" size={22} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.doneTitle, { color: colors.text }]}>{t('common.readinessDoneTitle')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('common.readinessDoneHint')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('common.startHereTitle')}. ${t('common.readinessProgress', { done, total })}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: `${colors.accent}${isDark ? '14' : '12'}`, borderColor: `${colors.accent}66` },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.tile, { backgroundColor: colors.accent }]}>
          <Ionicons name="sparkles" size={22} color={INK} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.eyebrow, { color: isDark ? colors.accent : '#9A5B00' }]}>{t('common.startHereEyebrow')}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('common.startHereTitle')}</Text>
        </View>
      </View>

      <Text style={[styles.hint, styles.hintGap, { color: colors.textSecondary }]}>{t('common.startHereHint')}</Text>

      <View style={styles.progressRow}>
        <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(7,27,44,0.10)' }]}>
          <View style={[styles.fill, { backgroundColor: colors.accent, width: `${percent}%` }]} />
        </View>
        <Text style={[styles.count, { color: colors.textSecondary }]}>{done}/{total}</Text>
      </View>

      <View style={[styles.button, { backgroundColor: colors.accent }]}>
        <Text style={styles.buttonText}>{started ? t('common.startHereContinue') : t('common.startHereCta')}</Text>
        <Ionicons name="arrow-forward" size={18} color={INK} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: 22, padding: 16, marginBottom: 14 },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 2 },
  title: { fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.2 },
  doneTitle: { fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 19 },
  hintGap: { marginTop: 12 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  track: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  count: { fontSize: 12, fontWeight: '800', minWidth: 30, textAlign: 'right' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, marginTop: 14 },
  buttonText: { color: INK, fontSize: 15, fontWeight: '800' },
});
