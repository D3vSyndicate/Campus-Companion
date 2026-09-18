import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { useAuth } from '../../context/AuthContext';
import { ThemeMode, useTheme } from '../../theme/ThemeContext';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await signOut();
            router.replace('/');
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.email, { color: colors.text }]}>
            {user?.email ?? 'Not signed in'}
          </Text>
          <Text style={[styles.role, { color: colors.textSecondary }]}>Admin</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const active = mode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[
                    styles.modeButton,
                    {
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accent : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[styles.modeButtonText, { color: active ? '#071B2C' : colors.text }]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, { borderColor: colors.danger }]}
        onPress={confirmSignOut}
      >
        <Text style={[styles.signOutText, { color: colors.danger }]}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  email: { fontSize: 16, fontWeight: '600' },
  role: { fontSize: 13, marginTop: 2 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  modeButtonText: { fontSize: 14, fontWeight: '600' },
  signOutButton: {
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
