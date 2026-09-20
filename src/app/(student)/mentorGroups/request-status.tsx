import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type RequestStatus = 'pending' | 'approved' | 'rejected';

export default function RequestStatusScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  // Temporary status.
  // Later this will come from Supabase.
  const [status, setStatus] =
    useState<RequestStatus>('pending');

  const group = {
    id: '1',
    name: 'Software Development Mentors',
    programme: 'Software Development',
    mentor: 'Thabo Mokoena',
    requestedAt: '18 September 2026',
  };

  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          icon: 'checkmark-circle-outline' as const,
          title: t('mg.approved'),
          description:
            t('mg.approvedText'),
        };

      case 'rejected':
        return {
          icon: 'close-circle-outline' as const,
          title: t('mg.rejected'),
          description:
            t('mg.rejectedText'),
        };

      default:
        return {
          icon: 'time-outline' as const,
          title: t('mg.requestPending'),
          description:
            t('mg.pendingText'),
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handlePrimaryAction = () => {
    if (status === 'approved') {
      router.push(`/(student)/mentorGroups/${group.id}` as never);
      return;
    }

    if (status === 'rejected') {
      router.push('/(student)/mentorGroups/groups');
      return;
    }

    Alert.alert(
      t('mg.requestPending'),
      t('mg.stillWaiting')
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
            {t('mg.statusTitle')}
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {t('mg.statusSubtitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: colors.background },
            ]}
          >
            <Ionicons
              name={statusInfo.icon}
              size={55}
              color={colors.accent}
            />
          </View>

          <Text
            style={[styles.statusTitle, { color: colors.text }]}
          >
            {statusInfo.title}
          </Text>

          <Text
            style={[
              styles.statusDescription,
              { color: colors.textSecondary },
            ]}
          >
            {statusInfo.description}
          </Text>
        </View>

        {/* Group Information */}
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          {t('mg.details')}
        </Text>

        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.groupHeader}>
            <View
              style={[
                styles.groupIcon,
                { backgroundColor: colors.background },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={27}
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

          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.textSecondary}
            />

            <Text
              style={[
                styles.detailText,
                { color: colors.textSecondary },
              ]}
            >
              {t('mg.requestedLabel')} {group.requestedAt}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          {t('mg.progress')}
        </Text>

        <View
          style={[
            styles.timelineCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Submitted */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconWrapper}>
              <View
                style={[
                  styles.timelineCircle,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={15}
                  color={colors.background}
                />
              </View>

              <View
                style={[
                  styles.timelineLine,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineTitle,
                  { color: colors.text },
                ]}
              >
                {t('mg.submitted')}
              </Text>

              <Text
                style={[
                  styles.timelineDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {t('mg.submittedText')}
              </Text>
            </View>
          </View>

          {/* Review */}
          <View style={styles.timelineRow}>
            <View style={styles.timelineIconWrapper}>
              <View
                style={[
                  styles.timelineCircle,
                  {
                    backgroundColor:
                      status === 'pending'
                        ? colors.background
                        : colors.accent,
                    borderColor: colors.accent,
                  },
                ]}
              >
                {status === 'pending' ? (
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={colors.accent}
                  />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={colors.background}
                  />
                )}
              </View>

              {status === 'pending' && (
                <View
                  style={[
                    styles.timelineLine,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </View>

            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineTitle,
                  { color: colors.text },
                ]}
              >
                {t('mg.review')}
              </Text>

              <Text
                style={[
                  styles.timelineDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {status === 'pending'
                  ? t('mg.reviewWaiting')
                  : t('mg.reviewDone')}
              </Text>
            </View>
          </View>

          {/* Final Status */}
          {status !== 'pending' && (
            <View style={styles.timelineRow}>
              <View style={styles.timelineIconWrapper}>
                <View
                  style={[
                    styles.timelineCircle,
                    {
                      backgroundColor:
                        status === 'approved'
                          ? colors.accent
                          : colors.background,
                      borderColor: colors.accent,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      status === 'approved'
                        ? 'checkmark'
                        : 'close'
                    }
                    size={15}
                    color={
                      status === 'approved'
                        ? colors.background
                        : colors.accent
                    }
                  />
                </View>
              </View>

              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    { color: colors.text },
                  ]}
                >
                  {status === 'approved'
                    ? t('mg.approvedShort')
                    : t('mg.rejectedShort')}
                </Text>

                <Text
                  style={[
                    styles.timelineDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {status === 'approved'
                    ? t('mg.nowMember')
                    : t('mg.notApproved')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Primary Action */}
        <Pressable
          onPress={handlePrimaryAction}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.accent },
          ]}
        >
          <Ionicons
            name={
              status === 'approved'
                ? 'people-outline'
                : status === 'rejected'
                ? 'search-outline'
                : 'refresh-outline'
            }
            size={20}
            color={colors.background}
          />

          <Text
            style={[
              styles.primaryButtonText,
              { color: colors.background },
            ]}
          >
            {status === 'approved'
              ? t('mg.openMine')
              : status === 'rejected'
              ? t('mg.findAnother')
              : t('mg.checkAgain')}
          </Text>
        </Pressable>

        {/* Pending Info */}
        {status === 'pending' && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.accent}
            />

            <Text
              style={[
                styles.infoText,
                { color: colors.textSecondary },
              ]}
            >
              {t('mg.oneGroupOnly')}
            </Text>
          </View>
        )}

        {/* Rejected Info */}
        {status === 'rejected' && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.accent}
            />

            <Text
              style={[
                styles.infoText,
                { color: colors.textSecondary },
              ]}
            >
              {t('mg.browseOthers')}
            </Text>
          </View>
        )}
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
    fontSize: 21,
    fontWeight: '700',
  },

  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  statusCard: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 25,
    marginBottom: 25,
  },

  statusIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  statusTitle: {
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  statusDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 11,
  },

  groupCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 17,
    marginBottom: 25,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },

  groupName: {
    fontSize: 16,
    fontWeight: '700',
  },

  programme: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  detailText: {
    fontSize: 13,
    marginLeft: 9,
  },

  timelineCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
  },

  timelineRow: {
    flexDirection: 'row',
    minHeight: 70,
  },

  timelineIconWrapper: {
    width: 32,
    alignItems: 'center',
  },

  timelineCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 3,
  },

  timelineContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 15,
  },

  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  timelineDescription: {
    fontSize: 12,
    lineHeight: 18,
  },

  primaryButton: {
    height: 52,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 9,
  },
});