import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ThemeMode, useTheme } from '../../theme/ThemeContext';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function HodProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const handleSignOut = async () => { await signOut(); router.replace('/login'); };
  return <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
    <View style={styles.section}><Text style={[styles.label, { color: colors.textSecondary }]}>ACCOUNT</Text><View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.email, { color: colors.text }]}>{user?.email ?? 'Not signed in'}</Text><Text style={[styles.role, { color: colors.textSecondary }]}>Head of Department</Text></View></View>
    <View style={styles.section}><Text style={[styles.label, { color: colors.textSecondary }]}>APPEARANCE</Text><View style={[styles.card, styles.modeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>{MODES.map((item) => { const active = mode === item.key; return <TouchableOpacity key={item.key} onPress={() => setMode(item.key)} style={[styles.modeButton, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}><Text style={{ color: active ? '#071B2C' : colors.text, fontWeight: '600' }}>{item.label}</Text></TouchableOpacity>; })}</View></View>
    <TouchableOpacity style={[styles.signOut, { borderColor: colors.danger }]} onPress={() => void handleSignOut()}><Text style={{ color: colors.danger, fontWeight: '700' }}>Sign out</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, section: { paddingHorizontal: 16, paddingTop: 20 }, label: { fontSize: 12, fontWeight: '600', marginBottom: 8 }, card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 }, email: { fontSize: 16, fontWeight: '600' }, role: { fontSize: 13, marginTop: 2 }, modeRow: { flexDirection: 'row', gap: 8 }, modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' }, signOut: { margin: 16, marginTop: 28, paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
});
