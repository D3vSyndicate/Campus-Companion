import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  const { colors } = useTheme();
  const { user, role } = useAuth();
  const metadata = user?.user_metadata ?? {};
  const displayName = String(
    metadata.full_name ?? metadata.name ?? metadata.first_name ?? user?.email ?? 'Student',
  ).trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'S';
  const roleLabel = role === 'student' ? 'Student' : role === 'mentor' ? 'FYS Buddy' : role ?? 'Student';

  return (
    <View style={[styles.container, { backgroundColor: colors.text }]}>
      <View style={styles.topRow}>
        <View style={[styles.eyebrowPill, { backgroundColor: colors.accent }]}>
          <View style={[styles.eyebrowDot, { backgroundColor: colors.text }]} />
          <Text style={[styles.eyebrow, { color: colors.text }]}>{eyebrow}</Text>
        </View>
        <View style={styles.identityRow}>
          <View style={styles.identityCopy}>
            <Text style={[styles.identityName, { color: colors.surface }]} numberOfLines={1}>{displayName}</Text>
            <Text style={[styles.identityRole, { color: colors.surface }]}>{roleLabel}</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent }]}>
            <Text style={[styles.identityInitials, { color: colors.text }]}>{initials}</Text>
          </View>
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
  identityRow: { flexDirection: 'row', alignItems: 'center', maxWidth: '58%' },
  identityCopy: { flexShrink: 1, alignItems: 'flex-end', marginRight: 8 },
  identityName: { fontSize: 11, fontWeight: '800' },
  identityRole: { fontSize: 9, opacity: 0.68, marginTop: 2 },
  identityInitials: { fontSize: 12, fontWeight: '800' },
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
