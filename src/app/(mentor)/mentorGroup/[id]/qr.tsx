import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../../../theme/ThemeContext';

export default function MentorGroupQR() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const qrValue = `mentor-group:${id}`;

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate QR Code',
      'Regenerating the QR code will invalidate the previous code. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Regenerate',
          onPress: () => {
            Alert.alert(
              'QR Code regenerated',
              'A new QR code will be generated when the database is connected.'
            );
          },
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert(
      'Share QR Code',
      'QR sharing will be connected later.'
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
            Group QR Code
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Students can scan this code to request access.
          </Text>
        </View>
      </View>

      {/* QR Card */}
      <View
        style={[
          styles.qrCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrValue}
            size={230}
            backgroundColor="white"
            color="black"
          />
        </View>

        <Text
          style={[
            styles.instructionTitle,
            { color: colors.text },
          ]}
        >
          Scan to join
        </Text>

        <Text
          style={[
            styles.instructionText,
            { color: colors.textSecondary },
          ]}
        >
          Students can scan this QR code using the Campus
          Companion app. Scanning creates a join request —
          it does not automatically add them to the group.
        </Text>
      </View>

      {/* Status */}
      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={22}
          color={colors.accent}
        />

        <View style={styles.statusContent}>
          <Text
            style={[
              styles.statusTitle,
              { color: colors.text },
            ]}
          >
            Approval required
          </Text>

          <Text
            style={[
              styles.statusText,
              { color: colors.textSecondary },
            ]}
          >
            Students will remain pending until you approve
            their request.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <Pressable
        style={[
          styles.shareButton,
          { backgroundColor: colors.accent },
        ]}
        onPress={handleShare}
      >
        <Ionicons
          name="share-social-outline"
          size={20}
          color="#FFFFFF"
        />

        <Text style={styles.primaryButtonText}>
          Share QR Code
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.regenerateButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={handleRegenerate}
      >
        <Ionicons
          name="refresh-outline"
          size={20}
          color={colors.text}
        />

        <Text
          style={[
            styles.secondaryButtonText,
            { color: colors.text },
          ]}
        >
          Regenerate QR Code
        </Text>
      </Pressable>

      {/* Security note */}
      <View style={styles.securityNote}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.textSecondary}
        />

        <Text
          style={[
            styles.securityText,
            { color: colors.textSecondary },
          ]}
        >
          QR codes should only be shared with students who
          are part of your programme.
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
    lineHeight: 18,
  },

  qrCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },

  qrWrapper: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 22,
  },

  instructionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },

  instructionText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 17,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },

  statusText: {
    fontSize: 12,
    lineHeight: 18,
  },

  shareButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  regenerateButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 4,
  },

  securityText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 8,
  },
});