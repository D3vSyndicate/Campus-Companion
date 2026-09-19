import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = { done: number; total: number; onPress: () => void };

// Home-screen entry point to the digital readiness tutorial.
export function ReadinessCard({ done, total, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const finished = total > 0 && done >= total;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: finished ? colors.border : colors.accent }]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: colors.card }]}>
          <Ionicons name={finished ? 'checkmark-done-outline' : 'rocket-outline'} size={22} color={colors.accent} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.text }]}>
            {finished ? t('common.readinessDoneTitle') : t('common.startHereTitle')}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {finished ? t('common.readinessDoneHint') : t('common.startHereHint')}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={colors.accent} />
      </View>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { backgroundColor: colors.accent, width: `${total ? (done / total) * 100 : 0}%` }]} />
      </View>
      <Text style={[styles.count, { color: colors.textSecondary }]}>{t('common.readinessProgress', { done, total })}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 14 },
  fill: { height: '100%', borderRadius: 999 },
  count: { fontSize: 11, marginTop: 6 },
});
