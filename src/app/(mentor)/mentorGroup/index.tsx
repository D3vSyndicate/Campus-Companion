import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../components/PageHeader';
import { ScaledText as Text } from '../../../components/ScaledText';
import { MgButton, MgScreen } from '../../../components/mentorgroups/parts';
import { useTheme } from '../../../theme/ThemeContext';

// A buddy's mentor groups: open the ones they run, or start a new one.
export default function MentorTribe() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <MgScreen>
      <PageHeader eyebrow={t('common.tribe')} title={t('mg.title')} subtitle={t('mgm.tribeSubtitle')} showSearch={false} />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/mentorGroup/group' as never)}
        style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.accent }]}>
          <Ionicons name="people-outline" size={24} color="#071B2C" />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.text }]}>{t('mg.title')}</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>{t('mgm.groupsText')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      <MgButton label={t('mgm.createGroup')} icon="add" onPress={() => router.push('/mentorGroup/create' as never)} />
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, minHeight: 84 },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800' },
  text: { fontSize: 13, lineHeight: 19, marginTop: 3 },
});
