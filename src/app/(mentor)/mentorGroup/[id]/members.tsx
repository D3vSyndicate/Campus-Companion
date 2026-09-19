import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

type Member = {
  id: string;
  name: string;
  studentNumber: string;
  programme: string;
  joinedAt: string;
};

export default function MentorGroupMembers() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [members, setMembers] = useState<Member[]>([
    {
      id: '1',
      name: 'Thabo Mokoena',
      studentNumber: '223456789',
      programme: 'Software Development',
      joinedAt: '18 Sep 2026',
    },
    {
      id: '2',
      name: 'Lerato Nkosi',
      studentNumber: '223456790',
      programme: 'Software Development',
      joinedAt: '18 Sep 2026',
    },
    {
      id: '3',
      name: 'Sipho Dlamini',
      studentNumber: '223456791',
      programme: 'Software Development',
      joinedAt: '17 Sep 2026',
    },
  ]);

  const handleRemove = (member: Member) => {
    Alert.alert(
      'Remove member',
      `Are you sure you want to remove ${member.name} from this group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setMembers((current) =>
              current.filter((item) => item.id !== member.id)
            );

            Alert.alert(
              'Member removed',
              `${member.name} has been removed from the group.`
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Members
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Students in your mentor group
          </Text>
        </View>
      </View>

      {/* Member count */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.summaryIcon,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={25}
            color={colors.accent}
          />
        </View>

        <View>
          <Text
            style={[
              styles.summaryNumber,
              { color: colors.text },
            ]}
          >
            {members.length}
          </Text>

          <Text
            style={[
              styles.summaryLabel,
              { color: colors.textSecondary },
            ]}
          >
            Active members
          </Text>
        </View>
      </View>

      {/* Members */}
      {members.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={48}
            color={colors.textSecondary}
          />

          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}
          >
            No members yet
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
            ]}
          >
            Students you approve will appear here.
          </Text>
        </View>
      ) : (
        <View>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Group Members
          </Text>

          {members.map((member) => (
            <View
              key={member.id}
              style={[
                styles.memberCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: colors.accent },
                  ]}
                >
                  {member.name.charAt(0)}
                </Text>
              </View>

              {/* Information */}
              <View style={styles.memberInfo}>
                <Text
                  style={[
                    styles.memberName,
                    { color: colors.text },
                  ]}
                >
                  {member.name}
                </Text>

                <Text
                  style={[
                    styles.studentNumber,
                    { color: colors.textSecondary },
                  ]}
                >
                  {member.studentNumber}
                </Text>

                <Text
                  style={[
                    styles.programme,
                    { color: colors.textSecondary },
                  ]}
                >
                  {member.programme}
                </Text>

                <Text
                  style={[
                    styles.joined,
                    { color: colors.textSecondary },
                  ]}
                >
                  Joined {member.joinedAt}
                </Text>
              </View>

              {/* Remove */}
              <Pressable
                style={[
                  styles.removeButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleRemove(member)}
              >
                <Ionicons
                  name="person-remove-outline"
                  size={20}
                  color={colors.text}
                />
              </Pressable>
            </View>
          ))}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: '800',
  },

  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: '800',
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },

  studentNumber: {
    fontSize: 11,
    marginBottom: 2,
  },

  programme: {
    fontSize: 11,
    marginBottom: 2,
  },

  joined: {
    fontSize: 10,
  },

  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 35,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
  },

  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});