import { useRouter, useSegments } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// Title bar used at the top of the coordinator dashboard. Tapping the avatar
// opens profile settings, theme, account details, and sign out.

export default function Header({ title }: { title: string }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const isAdminFlow = segments[0] === '(admin)';

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.headerBackground, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
      <TouchableOpacity
        onPress={() => router.push((isAdminFlow ? '/(admin)/profile' : '/(coordinator)/profile') as any)}
        style={[styles.avatar, { backgroundColor: colors.accent }]}
        accessibilityLabel="Open profile and settings"
      >
        <Text style={styles.avatarText}>{initials}</Text>
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
