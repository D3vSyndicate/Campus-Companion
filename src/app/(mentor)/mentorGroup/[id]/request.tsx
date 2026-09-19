import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../../../lib/superbase';
import { useTheme } from '../../../../theme/ThemeContext';

type JoinRequest = {
  id: string;
  name: string;
  studentNumber: string;
  programme: string;
  requestedAt: string;
};

export default function MentorGroupRequests() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [requests, setRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from('mentor_group_requests')
        .select('id, student_id, requested_at')
        .eq('group_id', id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      if (!active) return;
      setRequests((data ?? []).map((request) => ({
        id: request.id,
        name: 'Student',
        studentNumber: request.student_id,
        programme: 'Mentor group applicant',
        requestedAt: new Date(request.requested_at).toLocaleString(),
      })));
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleApprove = (request: JoinRequest) => {
    Alert.alert(
      'Approve request',
      `Add ${request.name} to this mentor group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: () => void (async () => {
            const { error } = await supabase.rpc('review_mentor_group_request', { request_id: request.id, decision: 'approved' });
            if (error) {
              Alert.alert('Could not approve request', error.message);
              return;
            }
            setRequests((current) => current.filter((item) => item.id !== request.id));
            Alert.alert('Request approved', `${request.name} has been added to the group.`);
          })(),
        },
      ]
    );
  };

  const handleReject = (request: JoinRequest) => {
    Alert.alert(
      'Reject request',
      `Reject ${request.name}'s request?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => void (async () => {
            const { error } = await supabase.rpc('review_mentor_group_request', { request_id: request.id, decision: 'rejected' });
            if (error) {
              Alert.alert('Could not reject request', error.message);
              return;
            }
            setRequests((current) => current.filter((item) => item.id !== request.id));
            Alert.alert('Request rejected', `${request.name}'s request has been rejected.`);
          })(),
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

        <View>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Join Requests
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Students waiting for approval
          </Text>
        </View>
      </View>

      {/* Request count */}
      <View
        style={[
          styles.countCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.countIcon,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="person-add-outline"
            size={25}
            color={colors.accent}
          />
        </View>

        <View>
          <Text
            style={[
              styles.countNumber,
              { color: colors.text },
            ]}
          >
            {requests.length}
          </Text>

          <Text
            style={[
              styles.countLabel,
              { color: colors.textSecondary },
            ]}
          >
            Pending requests
          </Text>
        </View>
      </View>

      {/* Requests */}
      {requests.length === 0 ? (
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
            name="checkmark-circle-outline"
            size={50}
            color={colors.accent}
          />

          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}
          >
            No pending requests
          </Text>

          <Text
            style={[
              styles.emptyText,
              { color: colors.textSecondary },
            ]}
          >
            New student requests will appear here.
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
            Pending
          </Text>

          {requests.map((request) => (
            <View
              key={request.id}
              style={[
                styles.requestCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Student */}
              <View style={styles.studentHeader}>
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
                    {request.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.studentInfo}>
                  <Text
                    style={[
                      styles.studentName,
                      { color: colors.text },
                    ]}
                  >
                    {request.name}
                  </Text>

                  <Text
                    style={[
                      styles.studentNumber,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {request.studentNumber}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="school-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.detailText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {request.programme}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.detailText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Requested {request.requestedAt}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.rejectButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => handleReject(request)}
                >
                  <Ionicons
                    name="close-outline"
                    size={19}
                    color={colors.text}
                  />

                  <Text
                    style={[
                      styles.rejectText,
                      { color: colors.text },
                    ]}
                  >
                    Reject
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.approveButton,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={() => handleApprove(request)}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.approveText}>
                    Approve
                  </Text>
                </Pressable>
              </View>
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

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
  },

  countIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  countNumber: {
    fontSize: 23,
    fontWeight: '800',
  },

  countLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },

  requestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },

  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 16,
    fontWeight: '800',
  },

  studentNumber: {
    fontSize: 12,
    marginTop: 3,
  },

  details: {
    marginTop: 15,
    gap: 8,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  detailText: {
    fontSize: 12,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },

  rejectButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  rejectText: {
    fontSize: 13,
    fontWeight: '700',
  },

  approveButton: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  approveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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