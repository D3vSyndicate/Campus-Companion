import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../components/PageHeader';
import { ScaledText as Text } from '../../../components/ScaledText';
import { MgScreen } from '../../../components/mentorgroups/parts';
import { useTheme } from '../../../theme/ThemeContext';

// Where a student starts with mentor groups: find one, scan a QR code, or see where their request stands.
export default function MentorGroups() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  const tiles: { key: string; icon: keyof typeof Ionicons.glyphMap; title: string; text: string; path: string }[] = [
    { key: 'find', icon: 'search-outline', title: t('mg.findTitle'), text: t('mg.findText'), path: '/(student)/mentorGroups/groups' },
    { key: 'scan', icon: 'qr-code-outline', title: t('mg.scanTitle'), text: t('mg.scanText'), path: '/(student)/mentorGroups/scan' },
    { key: 'mine', icon: 'people-outline', title: t('mg.mine'), text: t('mg.mineText'), path: '/(student)/mentorGroups/request-status' },
  ];

  return (
    <MgScreen>
      <PageHeader eyebrow={t('common.tribe')} title={t('mg.title')} subtitle={t('mg.subtitle')} showSearch={false} />

      {tiles.map((tile) => (
        <Pressable
          key={tile.key}
          accessibilityRole="button"
          onPress={() => router.push(tile.path as never)}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.icon, { backgroundColor: colors.accent }]}>
            <Ionicons name={tile.icon} size={24} color="#071B2C" />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>{tile.title}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{tile.text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}

      <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mg.notAutomatic')}</Text>
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, minHeight: 84 },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
  text: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  foot: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 8 },
});
