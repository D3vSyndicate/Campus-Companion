import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// Title bar used at the top of the coordinator dashboard. Tapping the avatar
// opens profile settings, theme, account details, and log out.

export default function Header({ title }: { title: string }) {
  const { colors } = useTheme();
  const { user, role } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const isAdminFlow = segments[0] === '(admin)';
  const isHodFlow = segments[0] === '(hod)';

  const metadata = user?.user_metadata ?? {};
  const displayName = String(
    metadata.full_name ?? metadata.name ?? metadata.first_name ?? user?.email ?? 'User',
  ).trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
  const roleLabel = role === 'coordinator' ? 'Coordinator' : role === 'hod' ? 'Head of Department' : role === 'admin' ? 'Administrator' : 'User';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.headerBackground, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
        <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>{roleLabel}</Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push((isAdminFlow ? '/(admin)/profile' : isHodFlow ? '/(hod)/profile' : '/(coordinator)/profile') as any)}
        style={styles.identityButton}
        accessibilityLabel="Open profile and settings"
      >
        <View style={styles.identityCopy}>
          <Text style={[styles.identityName, { color: colors.headerText }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.identityEmail, { color: colors.textSecondary }]} numberOfLines={1}>{user?.email ?? roleLabel}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  titleBlock: { flex: 1, marginRight: 12 },
  roleLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  identityButton: { flexDirection: 'row', alignItems: 'center', maxWidth: '58%' },
  identityCopy: { flexShrink: 1, alignItems: 'flex-end', marginRight: 9 },
  identityName: { fontSize: 12, fontWeight: '800' },
  identityEmail: { fontSize: 10, marginTop: 2 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#071B2C',
    fontWeight: '700',
    fontSize: 15,
  },
});
