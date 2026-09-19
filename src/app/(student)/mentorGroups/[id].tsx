import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const broadcasts = [
  {
    id: '1',
    title: 'Welcome to the group',
    message:
      'Welcome everyone! We are excited to have you in the mentor group. Please keep an eye out for important announcements.',
    priority: 'Normal',
    date: 'Today',
  },
  {
    id: '2',
    title: 'Orientation Meeting',
    message:
      'Our first mentor meeting will take place this Friday. Please make sure you attend.',
    priority: 'Important',
    date: 'Yesterday',
  },
];

export default function StudentMentorGroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  // Temporary group data
  const group = {
    name: 'Software Development Mentors',
    programme: 'Software Development',
    mentor: 'Thabo Mokoena',
    members: 18,
    capacity: 25,
    description:
      'A mentor group for students interested in software development. Your mentor will share announcements, guidance and important information here.',
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

        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {group.name}
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {group.programme}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Card */}
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.groupTop}>
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={32}
                color={colors.accent}
              />
            </View>

            <View style={styles.groupInfo}>
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

          {/* Mentor */}
          <View style={styles.detailRow}>
            <Ionicons
              name="person-outline"
              size={19}
              color={colors.textSecondary}
            />

            <View>
              <Text
                style={[
                  styles.detailLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Mentor
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  { color: colors.text },
                ]}
              >
                {group.mentor}
              </Text>
            </View>
          </View>

          {/* Members */}
          <View style={styles.detailRow}>
            <Ionicons
              name="people-outline"
              size={19}
              color={colors.textSecondary}
            />

            <View>
              <Text
                style={[
                  styles.detailLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Members
              </Text>

              <Text
                style={[
                  styles.detailValue,
                  { color: colors.text },
                ]}
              >
                {group.members} / {group.capacity}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text
              style={[
                styles.descriptionTitle,
                { color: colors.text },
              ]}
            >
              About this group
            </Text>

            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
            >
              {group.description}
            </Text>
          </View>
        </View>

        {/* Broadcast Section */}
        <View style={styles.broadcastSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Mentor Broadcasts
              </Text>

              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Important updates from your mentor
              </Text>
            </View>

            <Ionicons
              name="megaphone-outline"
              size={24}
              color={colors.accent}
            />
          </View>

          {broadcasts.map((broadcast) => (
            <View
              key={broadcast.id}
              style={[
                styles.broadcastCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.broadcastHeader}>
                <View style={styles.broadcastTitleRow}>
                  <Ionicons
                    name="megaphone-outline"
                    size={19}
                    color={colors.accent}
                  />

                  <Text
                    style={[
                      styles.broadcastTitle,
                      { color: colors.text },
                    ]}
                  >
                    {broadcast.title}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.broadcastDate,
                    { color: colors.textSecondary },
                  ]}
                >
                  {broadcast.date}
                </Text>
              </View>

              <Text
                style={[
                  styles.broadcastMessage,
                  { color: colors.textSecondary },
                ]}
              >
                {broadcast.message}
              </Text>

              <View
                style={[
                  styles.priorityBadge,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {broadcast.priority}
                </Text>
              </View>
            </View>
          ))}

          {/* Read Only Notice */}
          <View
            style={[
              styles.readOnlyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={19}
              color={colors.textSecondary}
            />

            <Text
              style={[
                styles.readOnlyText,
                { color: colors.textSecondary },
              ]}
            >
              Only mentors can send messages to this group.
              Students can read broadcasts but cannot reply.
            </Text>
          </View>
        </View>
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
    marginRight: 12,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },

  groupTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  groupIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupInfo: {
    flex: 1,
    marginLeft: 14,
  },

  groupName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },

  programme: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
    paddingTop: 17,
    marginTop: 2,
  },

  descriptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
  },

  broadcastSection: {
    marginTop: 28,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  sectionSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  broadcastCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  broadcastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  broadcastTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 7,
  },

  broadcastDate: {
    fontSize: 11,
    marginLeft: 8,
  },

  broadcastMessage: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 11,
  },

  priorityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },

  readOnlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },

  readOnlyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 9,
  },
});