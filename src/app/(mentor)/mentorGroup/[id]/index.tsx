import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function MentorGroupDetails() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  // Temporary data.
  // We will replace this with Supabase data.
  const group = {
    id,
    name: 'Software Development Mentors',
    programme: 'Software Development',
    description:
      'A mentor group for students interested in software development.',
    members: 18,
    capacity: 25,
  };

  const remaining = group.capacity - group.members;

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
            {group.name}
          </Text>

          <Text
            style={[
              styles.programme,
              { color: colors.textSecondary },
            ]}
          >
            {group.programme}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push(
              `/mentorGroup/${id}/edit` as never
            )
          }
          style={[
            styles.editButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="create-outline"
            size={21}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* Group description */}
      <View
        style={[
          styles.descriptionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {group.description}
        </Text>
      </View>

      {/* Capacity */}
      <View
        style={[
          styles.capacityCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.capacityHeader}>
          <View>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary },
              ]}
            >
              {t('mgm.capacityUpper')}
            </Text>

            <Text
              style={[
                styles.memberCount,
                { color: colors.text },
              ]}
            >
              {group.members}/{group.capacity}
            </Text>

            <Text
              style={[
                styles.remaining,
                { color: colors.textSecondary },
              ]}
            >
              {remaining} {t('mgm.spacesLeft')}
            </Text>
          </View>

          <View
            style={[
              styles.peopleIcon,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={30}
              color={colors.accent}
            />
          </View>
        </View>

        {/* Progress bar */}
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progress,
              {
                backgroundColor: colors.accent,
                width: `${Math.min(
                  (group.members / group.capacity) * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Management options */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text },
        ]}
      >
        {t('mgm.manageGroup')}
      </Text>

      <ManagementCard
        icon="person-add-outline"
        title={t('mgm.joinRequests')}
        description={t('mgm.joinRequestsText')}
        colors={colors}
        onPress={() =>
          router.push(
            `/mentorGroup/${id}/request` as never
          )
        }
      />

      <ManagementCard
        icon="people-outline"
        title={t('mg.members')}
        description={t('mgm.membersText')}
        colors={colors}
        onPress={() =>
          router.push(
            `/mentorGroup/${id}/members` as never
          )
        }
      />

      <ManagementCard
        icon="qr-code-outline"
        title={t('mgm.qrTitle')}
        description={t('mgm.qrText')}
        colors={colors}
        onPress={() =>
          router.push(
            `/mentorGroup/${id}/qr` as never
          )
        }
      />

      <ManagementCard
        icon="megaphone-outline"
        title={t('mgm.broadcast')}
        description={t('mgm.broadcastText')}
        colors={colors}
        onPress={() =>
          router.push(
            `/mentorGroup/${id}/broadcast` as never
          )
        }
      />
    </ScrollView>
  );
}

function ManagementCard({
  icon,
  title,
  description,
  colors,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.managementCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.managementIcon,
          { backgroundColor: colors.background },
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={colors.accent}
        />
      </View>

      <View style={styles.managementContent}>
        <Text
          style={[
            styles.managementTitle,
            { color: colors.text },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.managementDescription,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textSecondary}
      />
    </Pressable>
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
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
  },

  programme: {
    fontSize: 13,
    marginTop: 3,
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  descriptionCard: {
    borderRadius: 17,
    borderWidth: 1,
    padding: 17,
    marginBottom: 16,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
  },

  capacityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 28,
  },

  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  memberCount: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },

  remaining: {
    fontSize: 12,
    marginTop: 2,
  },

  peopleIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressBackground: {
    height: 8,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 18,
  },

  progress: {
    height: '100%',
    borderRadius: 10,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },

  managementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },

  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  managementContent: {
    flex: 1,
    marginRight: 8,
  },

  managementTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },

  managementDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
});