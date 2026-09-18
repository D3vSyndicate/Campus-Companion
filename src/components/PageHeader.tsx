import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.text }]}>
      <View style={styles.topRow}>
        <View style={[styles.eyebrowPill, { backgroundColor: colors.accent }]}>
          <View style={[styles.eyebrowDot, { backgroundColor: colors.text }]} />
          <Text style={[styles.eyebrow, { color: colors.text }]}>{eyebrow}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.surface }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.surface }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginBottom: 20,
    padding: 22,
    shadowColor: '#071B2C',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 35,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.72,
    marginTop: 10,
  },
});
