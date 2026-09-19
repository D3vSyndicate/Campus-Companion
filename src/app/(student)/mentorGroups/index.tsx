import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

export default function MentorGroups() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Mentor Groups
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Connect with your mentor and fellow students.
          </Text>
        </View>
      </View>

      {/* Welcome Card */}
      <View
        style={[
          styles.welcomeCard,
          { backgroundColor: colors.accent },
        ]}
      >
        <View style={styles.welcomeIcon}>
          <Ionicons name="people" size={30} color="#fff" />
        </View>

        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>
            Find your mentor group
          </Text>

          <Text style={styles.welcomeDescription}>
            Join a group for your programme and stay connected with
            your mentor.
          </Text>
        </View>
      </View>

      {/* Find Group */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={() =>
          router.push('/(student)/mentorGroups/groups')
        }
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={26}
            color={colors.accent}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Find a Mentor Group
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary },
            ]}
          >
            Browse available groups and send a request to join.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Scan QR */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={() =>
          router.push('/(student)/mentorGroups/scan')
        }
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="qr-code-outline"
            size={26}
            color={colors.accent}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Scan Mentor QR
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary },
            ]}
          >
            Scan a QR code provided by your mentor to request
            access to their group.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* My Group / Request */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={() =>
          router.push('/(student)/mentorGroups/request-status')
        }
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={26}
            color={colors.accent}
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            My Mentor Group
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary },
            ]}
          >
            Check your join request or access your approved
            mentor group.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Information */}
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
          size={22}
          color={colors.accent}
        />

        <Text
          style={[
            styles.infoText,
            { color: colors.textSecondary },
          ]}
        >
          Joining a mentor group is not automatic. Your request
          must be approved by the mentor before you become a
          member.
        </Text>
      </View>
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
    gap: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  welcomeCard: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  welcomeText: {
    flex: 1,
  },

  welcomeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  welcomeDescription: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
  },

  card: {
    minHeight: 95,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
  },

  infoCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    gap: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});