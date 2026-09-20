import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { PageHeader } from '../../../components/PageHeader';
import { ScaledText as Text } from '../../../components/ScaledText';
import { EmptyState, Loading, MgButton, MgScreen } from '../../../components/mentorgroups/parts';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/superbase';
import { useTheme } from '../../../theme/ThemeContext';

type MentorGroup = { id: string; name: string; programme: string; description: string; max_capacity: number };

// The groups this buddy runs. Tap one to manage it.
export default function MentorGroups() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [groups, setGroups] = useState<MentorGroup[] | undefined>(undefined);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mentor_groups')
      .select('id, name, programme, description, max_capacity')
      .eq('mentor_id', user.id)
      .order('created_at', { ascending: false });
    setGroups((data ?? []) as MentorGroup[]);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <MgScreen>
      <PageHeader eyebrow={t('common.tribe')} title={t('mg.title')} subtitle={t('mgm.manageStudents')} showSearch={false} />

      {groups === undefined ? (
        <Loading />
      ) : groups.length === 0 ? (
        <EmptyState icon="people-outline" title={t('mgm.noGroups')} text={t('mgm.noGroupsText')}>
          <MgButton label={t('mgm.createGroup')} icon="add" onPress={() => router.push('/mentorGroup/create' as never)} />
        </EmptyState>
      ) : (
        <>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              onPress={() => router.push(`/mentorGroup/${group.id}` as never)}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.icon, { backgroundColor: colors.background }]}>
                <Ionicons name="people-outline" size={26} color={colors.accent} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{group.name}</Text>
                <Text style={[styles.programme, { color: colors.accent }]} numberOfLines={1}>{group.programme}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                  {group.description || t('mgm.manageYours')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
          <MgButton label={t('mgm.createGroup')} icon="add" tone="quiet" onPress={() => router.push('/mentorGroup/create' as never)} />
        </>
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800' },
  programme: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  description: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
