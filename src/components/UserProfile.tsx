import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AboutProject } from './AboutProject';
import { LogOutButton } from './LogOutButton';
import { SearchEntry } from './search/SearchEntry';
import { ScaledText as Text } from './ScaledText';
import { useAppearance } from '../context/AppearanceContext';
import { useAuth } from '../context/AuthContext';
import { ThemeMode, useTheme } from '../theme/ThemeContext';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'af', label: 'Afrikaans' },
];

const MIN_SCALE = 0.7;
const MAX_SCALE = 1.3;

// A row of options where exactly one is selected.
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <TouchableOpacity
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={[styles.segment, active && { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.segmentText, { color: active ? '#071B2C' : colors.textSecondary }]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PreferenceRow({
  icon,
  label,
  children,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.prefRow, !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.prefLabelRow}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={[styles.prefLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

type Props = {
  variant?: 'student' | 'mentor';
};

export function UserProfile({ variant = 'student' }: Props) {
  const { i18n } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const { fontScale, changeFontScale } = useAppearance();
  const { user, role } = useAuth();

  const adjustFontScale = (change: number) => {
    const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((fontScale + change) * 10) / 10));
    changeFontScale(nextScale);
  };

  const metadata = user?.user_metadata ?? {};
  const displayName = String(metadata.full_name ?? metadata.name ?? metadata.first_name ?? '').trim();
  const initials =
    (displayName || user?.email || 'S')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'S';

  const roleLabel = role === 'mentor' ? 'FYS Buddy (Mentor)' : role === 'student' || !role ? 'Student' : role;

  const currentLanguage = LANGUAGES.find((lang) => i18n.language?.startsWith(lang.code))?.code ?? 'en';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>

      <SearchEntry area={variant === 'mentor' ? 'mentor' : 'student'} scope="profile" style={styles.searchEntry} />

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MY ACCOUNT</Text>
        <View style={[styles.card, styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.accountCopy}>
            {displayName ? <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text> : null}
            <Text style={[styles.email, { color: colors.text }]} numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </Text>
            <Text style={[styles.role, { color: colors.textSecondary }]}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.card, styles.prefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <PreferenceRow icon="language-outline" label="Language">
            <Segmented options={LANGUAGES.map((lang) => ({ key: lang.code, label: lang.label }))} value={currentLanguage} onChange={(code) => void i18n.changeLanguage(code)} />
          </PreferenceRow>

          <PreferenceRow icon="contrast-outline" label="Appearance">
            <Segmented options={MODES} value={mode} onChange={setMode} />
          </PreferenceRow>

          <PreferenceRow icon="text-outline" label="Text size" last>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Decrease text size"
                onPress={() => adjustFontScale(-0.1)}
                disabled={fontScale <= MIN_SCALE}
                style={[styles.stepButton, { borderColor: colors.border, opacity: fontScale <= MIN_SCALE ? 0.4 : 1 }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>A-</Text>
              </TouchableOpacity>
              <Text style={[styles.scaleText, { color: colors.text }]}>{Math.round(fontScale * 100)}%</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Increase text size"
                onPress={() => adjustFontScale(0.1)}
                disabled={fontScale >= MAX_SCALE}
                style={[styles.stepButton, { borderColor: colors.border, opacity: fontScale >= MAX_SCALE ? 0.4 : 1 }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>A+</Text>
              </TouchableOpacity>
            </View>
          </PreferenceRow>
        </View>
      </View>

      <View style={styles.section}>
        <AboutProject variant={variant} />
      </View>

      <LogOutButton style={styles.signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  searchEntry: { marginTop: 12, marginBottom: 0 },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16 },

  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#071B2C', fontSize: 18, fontWeight: '800' },
  accountCopy: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800' },
  email: { fontSize: 14, fontWeight: '600', marginTop: 1 },
  role: { fontSize: 13, marginTop: 3 },

  prefCard: { paddingVertical: 4 },
  prefRow: { paddingVertical: 14 },
  prefLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  prefLabel: { fontSize: 15, fontWeight: '700' },

  segmented: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, gap: 3 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 8 },
  segmentText: { fontSize: 13, fontWeight: '700' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stepButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 9 },
  stepText: { fontSize: 14, fontWeight: '800' },
  scaleText: { minWidth: 56, textAlign: 'center', fontSize: 14, fontWeight: '700' },

  signOut: { marginTop: 28 },
});
