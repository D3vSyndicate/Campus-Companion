import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/superbase';
import { useTheme } from '../../../theme/ThemeContext';

type MentorGroup = {
  id: string;
  name: string;
  programme: string;
  description: string;
  max_capacity: number;
};

export default function MentorGroups() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [groups, setGroups] = useState<MentorGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void (async () => {
      const { data } = await supabase
        .from('mentor_groups')
        .select('id, name, programme, description, max_capacity')
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });
      if (active) {
        setGroups((data ?? []) as MentorGroup[]);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Mentor Groups
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Manage your student groups
          </Text>
        </View>

        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: colors.accent },
          ]}
          onPress={() =>
            router.push('/mentorGroup/create')
          }
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {loading ? null : groups.length > 0 ? groups.map((group) => (
        <Pressable
          key={group.id}
          style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push(`/mentorGroup/${group.id}` as never)}
        >
          <View style={[styles.groupIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="people-outline" size={28} color={colors.accent} />
          </View>
          <View style={styles.groupCopy}>
            <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
            <Text style={[styles.groupProgramme, { color: colors.accent }]}>{group.programme}</Text>
            <Text style={[styles.groupDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {group.description || 'Manage your mentor group.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>
      )) : (
      <View
        style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={40}
            color={colors.textSecondary}
          />
        </View>

        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No mentor groups yet
        </Text>

        <Text
          style={[
            styles.emptyText,
            { color: colors.textSecondary },
          ]}
        >
          Create your first mentor group to start connecting
          with your students.
        </Text>

        <Pressable
          style={[
            styles.createButton,
            { backgroundColor: colors.accent },
          ]}
          onPress={() =>
            router.push('/mentorGroup/create')
          }
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />

          <Text style={styles.createButtonText}>
            Create Group
          </Text>
        </Pressable>
      </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },

  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  groupCopy: { flex: 1, marginRight: 10 },
  groupName: { fontSize: 16, fontWeight: '800' },
  groupProgramme: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  groupDescription: { fontSize: 12, lineHeight: 18, marginTop: 5 },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },

  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});