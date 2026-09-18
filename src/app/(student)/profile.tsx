import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { ScaledText as Text } from '../../components/ScaledText';
import { useAppearance } from '../../context/AppearanceContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeMode, useTheme } from '../../theme/ThemeContext';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function StudentProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { fontScale, changeFontScale } = useAppearance();
  const { user, role, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      router.replace('/login');
      setLoggingOut(false);
    }
  };

  const adjustFontScale = (change: number) => {
    const nextScale = Math.min(1.3, Math.max(0.7, Math.round((fontScale + change) * 10) / 10));
    changeFontScale(nextScale);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MY ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.email, { color: colors.text }]}>{user?.email ?? 'Not signed in'}</Text>
          <Text style={[styles.role, { color: colors.textSecondary }]}>{role === 'student' ? 'Student' : role ?? 'Student'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>STUDENT TOOLS</Text>
        {[
          ['My Orientation Checklist', '/(student)/checklist'],
          ['My Orientation Schedule', '/(student)/schedule'],
          ['Campus Resources', '/(student)/digital'],
          ['Help & Support', '/(student)/contacts'],
        ].map(([label, route]) => (
          <TouchableOpacity
            key={route}
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(route as any)}
          >
            <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LANGUAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LanguageSwitcher />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCESSIBILITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.menuText, { color: colors.text }]}>Text size</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => adjustFontScale(-0.1)}
                disabled={fontScale <= 0.7}
                style={[styles.stepButton, { borderColor: colors.border, opacity: fontScale <= 0.7 ? 0.4 : 1 }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>A-</Text>
              </TouchableOpacity>
              <Text style={[styles.scaleText, { color: colors.text }]}>{Math.round(fontScale * 100)}%</Text>
              <TouchableOpacity
                onPress={() => adjustFontScale(0.1)}
                disabled={fontScale >= 1.3}
                style={[styles.stepButton, { borderColor: colors.border, opacity: fontScale >= 1.3 ? 0.4 : 1 }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SETTINGS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modeRow}>
            {MODES.map((item) => {
              const active = mode === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setMode(item.key)}
                  style={[styles.modeButton, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}
                >
                  <Text style={[styles.modeText, { color: active ? colors.text : colors.textSecondary }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <TouchableOpacity
        disabled={loggingOut}
        onPress={() => void handleSignOut()}
        style={[styles.signOut, { borderColor: colors.danger }]}
      >
        <Text style={[styles.signOutText, { color: colors.danger }]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  email: { fontSize: 16, fontWeight: '700' },
  role: { fontSize: 13, marginTop: 4 },
  menuItem: { borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, padding: 15, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuText: { fontSize: 15, fontWeight: '600' },
  chevron: { fontSize: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  stepText: { fontSize: 13, fontWeight: '800' },
  scaleText: { minWidth: 42, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  modeText: { fontSize: 13, fontWeight: '700' },
  signOut: { marginTop: 28, paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '700' },
});
