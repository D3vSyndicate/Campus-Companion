import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/superbase';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type MentorGroup = {
  id: string;
  name: string;
  programme: string;
  mentor: string;
  description: string;
  members: number;
  capacity: number;
};

export default function MentorGroupsListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [groups, setGroups] = useState<MentorGroup[]>([]);
  const [requestedGroups, setRequestedGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void (async () => {
      const [{ data: groupData }, { data: requestData }] = await Promise.all([
        supabase.from('mentor_groups').select('id, name, programme, description, max_capacity').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('mentor_group_requests').select('group_id').eq('student_id', user.id).eq('status', 'pending'),
      ]);
      if (!active) return;

      const loadedGroups = await Promise.all((groupData ?? []).map(async (group) => {
        const { count } = await supabase
          .from('mentor_group_members')
          .select('student_id', { count: 'exact', head: true })
          .eq('group_id', group.id);
        return {
          id: group.id,
          name: group.name,
          programme: group.programme,
          mentor: 'Student Mentor',
          description: group.description,
          members: count ?? 0,
          capacity: group.max_capacity,
        };
      }));
      if (active) {
        setGroups(loadedGroups);
        setRequestedGroups((requestData ?? []).map((request) => request.group_id));
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const requestToJoin = (group: MentorGroup) => {
    if (requestedGroups.includes(group.id)) {
      Alert.alert(
        t('mg.requestPending'),
        t('mg.alreadyRequested')
      );
      return;
    }

    if (group.members >= group.capacity) {
      Alert.alert(
        t('mg.groupFull'),
        t('mg.groupFullText')
      );
      return;
    }

    Alert.alert(
      t('mg.joinGroup'),
      t('mg.confirmJoin', { name: group.name }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('mg.sendRequest'),
          onPress: () => void (async () => {
            const { error } = await supabase.rpc('request_to_join_mentor_group', { target_group: group.id });
            if (error) {
              Alert.alert(t('mg.notSent'), error.message);
              return;
            }
            setRequestedGroups((current) => [...current, group.id]);
            Alert.alert(t('mg.requestSent'), t('mg.requestSentText'));
          })(),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <View>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
          >
            {t('mg.findTitle')}
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {t('mg.browse')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('mg.available')}
          </Text>

          <Text
            style={[
              styles.description,
              { color: colors.textSecondary },
            ]}
          >
            {t('mg.chooseText')}
          </Text>
        </View>

        {/* Groups */}
        {loading ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{t('mg.loading')}</Text>
        ) : null}
        {groups.map((group) => {
          const isFull = group.members >= group.capacity;
          const requestPending = requestedGroups.includes(group.id);

          const percentage =
            (group.members / group.capacity) * 100;

          return (
            <View
              key={group.id}
              style={[
                styles.groupCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={26}
                    color={colors.accent}
                  />
                </View>

                <View style={styles.groupHeaderText}>
                  <Text
                    style={[
                      styles.groupName,
                      { color: colors.text },
                    ]}
                  >
                    {group.name}
                  </Text>

                  <Text
                    style={[
                      styles.programme,
                      { color: colors.accent },
                    ]}
                  >
                    {group.programme}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <Text
                style={[
                  styles.groupDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {group.description}
              </Text>

              {/* Mentor */}
              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textSecondary}
                />

                <Text
                  style={[
                    styles.detailText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t('mg.mentorLabel')} {group.mentor}
                </Text>
              </View>

              {/* Capacity */}
              <View style={styles.capacitySection}>
                <View style={styles.capacityHeader}>
                  <Text
                    style={[
                      styles.capacityLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('mg.capacity')}
                  </Text>

                  <Text
                    style={[
                      styles.capacityCount,
                      { color: colors.text },
                    ]}
                  >
                    {group.members}/{group.capacity}
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBackground,
                    {
                      backgroundColor: colors.background,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progress,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isFull
                          ? colors.textSecondary
                          : colors.accent,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Status */}
              {isFull && (
                <View
                  style={[
                    styles.fullBadge,
                    { borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.fullText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('mg.groupFull')}
                  </Text>
                </View>
              )}

              {requestPending && (
                <View
                  style={[
                    styles.pendingBadge,
                    { borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={colors.accent}
                  />

                  <Text
                    style={[
                      styles.pendingText,
                      { color: colors.accent },
                    ]}
                  >
                    {t('mg.requestPending')}
                  </Text>
                </View>
              )}

              {/* Button */}
              <Pressable
                disabled={isFull || requestPending}
                onPress={() => requestToJoin(group)}
                style={[
                  styles.joinButton,
                  {
                    backgroundColor:
                      isFull || requestPending
                        ? colors.background
                        : colors.accent,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={
                    requestPending
                      ? 'time-outline'
                      : 'person-add-outline'
                  }
                  size={19}
                  color={
                    isFull || requestPending
                      ? colors.textSecondary
                      : colors.background
                  }
                />

                <Text
                  style={[
                    styles.joinButtonText,
                    {
                      color:
                        isFull || requestPending
                          ? colors.textSecondary
                          : colors.background,
                    },
                  ]}
                >
                  {isFull
                    ? t('mg.groupFull')
                    : requestPending
                    ? t('mg.requestPending')
                    : t('mg.requestToJoin')}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {/* QR Option */}
        <Pressable
          onPress={() =>
            router.push('/(student)/mentorGroups/scan')
          }
          style={[
            styles.scanCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="qr-code-outline"
            size={25}
            color={colors.accent}
          />

          <View style={styles.scanContent}>
            <Text
              style={[styles.scanTitle, { color: colors.text }]}
            >
              {t('mg.haveQr')}
            </Text>

            <Text
              style={[
                styles.scanDescription,
                { color: colors.textSecondary },
              ]}
            >
              {t('mg.scanDirect')}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },

  backButton: {
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  intro: {
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 7,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
  },

  groupCard: {
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupHeaderText: {
    flex: 1,
    marginLeft: 13,
  },

  groupName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },

  programme: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  groupDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
    marginBottom: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  detailText: {
    fontSize: 13,
    marginLeft: 8,
  },

  capacitySection: {
    marginBottom: 14,
  },

  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  capacityLabel: {
    fontSize: 12,
  },

  capacityCount: {
    fontSize: 12,
    fontWeight: '700',
  },

  progressBackground: {
    height: 7,
    borderRadius: 10,
    overflow: 'hidden',
  },

  progress: {
    height: '100%',
    borderRadius: 10,
  },

  fullBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 12,
  },

  fullText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },

  pendingBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 12,
  },

  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },

  joinButton: {
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  joinButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },

  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },

  scanContent: {
    flex: 1,
    marginLeft: 12,
  },

  scanTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  scanDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
});