import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../../lib/superbase';
import { useTheme } from '../../../theme/ThemeContext';

export default function ScanMentorQRScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({
    data,
  }: {
    data: string;
  }) => {
    if (scanned) return;

    setScanned(true);

    const groupId = data.startsWith('mentor-group:')
      ? data.slice('mentor-group:'.length)
      : '';

    if (!groupId) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code does not contain valid mentor group information.',
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
        ]
      );

      return;
    }

    Alert.alert(
      'Mentor Group Found',
      'This QR code belongs to a mentor group. Would you like to send a join request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Send Request',
          onPress: () => void (async () => {
            const { error } = await supabase.rpc('request_to_join_mentor_group', { target_group: groupId });
            if (error) {
              Alert.alert('Request not sent', error.message, [{ text: 'OK', onPress: () => setScanned(false) }]);
              return;
            }
            Alert.alert(
              'Request Sent',
              'Your join request has been sent to the mentor.',
              [
                {
                  text: 'OK',
                  onPress: () =>
                    router.replace(
                      '/(student)/mentorGroups/request-status'
                    ),
                },
              ]
            );
          })(),
        },
      ]
    );
  };

  // Camera permission hasn't been determined yet
  if (!permission) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.permissionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={55}
            color={colors.accent}
          />

          <Text
            style={[
              styles.permissionTitle,
              { color: colors.text },
            ]}
          >
            Camera Permission Required
          </Text>

          <Text
            style={[
              styles.permissionText,
              { color: colors.textSecondary },
            ]}
          >
            Camera access is needed to scan the QR code provided
            by your mentor.
          </Text>

          <Pressable
            onPress={requestPermission}
            style={[
              styles.permissionButton,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.permissionButtonText,
                { color: colors.background },
              ]}
            >
              Allow Camera
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text
              style={[
                styles.cancelButtonText,
                { color: colors.textSecondary },
              ]}
            >
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Camera */}
        <CameraView
        style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        }}
        facing="back"
        barcodeScannerSettings={{
            barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={
            scanned ? undefined : handleBarcodeScanned
        }
        />

      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            Scan Mentor QR
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Scanner */}
        <View style={styles.scannerArea}>
          <Text style={styles.instructionTitle}>
            Scan your mentor&apos;s QR code
          </Text>

          <Text style={styles.instructionText}>
            Position the QR code inside the frame
          </Text>

          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.infoText}>
              Scanning the code will send a join request. You will
              not automatically become a member.
            </Text>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomContainer}>
          {scanned && (
            <Pressable
              onPress={() => setScanned(false)}
              style={styles.scanAgainButton}
            >
              <Ionicons
                name="scan-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.scanAgainText}>
                Scan Again
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    fontSize: 15,
  },

  permissionCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
  },

  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 18,
  },

  permissionText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  permissionButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  cancelButton: {
    padding: 14,
    marginTop: 4,
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 42,
  },

  scannerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
  },

  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 7,
  },

  instructionText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
  },

  scannerFrame: {
    width: 270,
    height: 270,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderColor: '#FFFFFF',
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },

  infoText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 8,
    textAlign: 'center',
  },

  bottomContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  scanAgainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});