import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { ThemeMode, useTheme } from '../../theme/ThemeContext';

const MODES: {
  key: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    key: 'system',
    label: 'System',
    icon: 'settings-outline',
    description: 'Use device settings',
  },
  {
    key: 'light',
    label: 'Light',
    icon: 'sunny-outline',
    description: 'Bright theme',
  },
  {
    key: 'dark',
    label: 'Dark',
    icon: 'moon-outline',
    description: 'Dark theme',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();

  const isWide = width >= 800;

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await signOut();
            router.replace('/login');
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.page,
          isWide && styles.pageWide,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
              ]}
            >
              Profile & Settings
            </Text>

            <Text
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
              ]}
            >
              Manage your account details and preferences.
            </Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary },
            ]}
          >
            ACCOUNT
          </Text>

          <View
            style={[
              styles.accountCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.profileIcon,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={28}
                color="#071B2C"
              />
            </View>

            <View style={styles.accountInfo}>
              <Text
                style={[
                  styles.email,
                  { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {user?.email ?? 'Not signed in'}
              </Text>

              <Text
                style={[
                  styles.role,
                  { color: colors.textSecondary },
                ]}
              >
                Orientation Coordinator
              </Text>
            </View>

            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={15}
                color="#071B2C"
              />

              <Text style={styles.roleBadgeText}>
                Coordinator
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary },
            ]}
          >
            APPEARANCE
          </Text>

          <View
            style={[
              styles.appearanceCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.sectionHeading}>
              <View
                style={[
                  styles.headingIcon,
                  {
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="color-palette-outline"
                  size={24}
                  color={colors.text}
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.headingTitle,
                    { color: colors.text },
                  ]}
                >
                  Appearance
                </Text>

                <Text
                  style={[
                    styles.headingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Customise how Campus Companion looks for you.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.modeRow,
                isWide && styles.modeRowWide,
              ]}
            >
              {MODES.map((item) => {
                const active = mode === item.key;

                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => setMode(item.key)}
                    style={[
                      styles.modeButton,
                      {
                        borderColor: active
                          ? colors.accent
                          : colors.border,
                        backgroundColor: active
                          ? colors.accent
                          : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.modeIcon,
                        {
                          backgroundColor: active
                            ? 'rgba(7,27,44,0.10)'
                            : colors.surfaceMuted,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={
                          active
                            ? '#071B2C'
                            : colors.text
                        }
                      />
                    </View>

                    <View style={styles.modeInfo}>
                      <Text
                        style={[
                          styles.modeLabel,
                          {
                            color: active
                              ? '#071B2C'
                              : colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>

                      <Text
                        style={[
                          styles.modeDescription,
                          {
                            color: active
                              ? 'rgba(7,27,44,0.70)'
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>

                    {active && (
                      <View style={styles.checkCircle}>
                        <Ionicons
                          name="checkmark"
                          size={17}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Sign out */}
        <View style={styles.section}>
          <View
            style={[
              styles.signOutCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.signOutInfo}>
              <View
                style={[
                  styles.signOutIcon,
                  {
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
              >
                <Ionicons
                  name="log-out-outline"
                  size={25}
                  color={colors.text}
                />
              </View>

              <View style={styles.signOutTextContainer}>
                <Text
                  style={[
                    styles.signOutTitle,
                    { color: colors.text },
                  ]}
                >
                  Sign out
                </Text>

                <Text
                  style={[
                    styles.signOutDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  End your session and return to the login screen.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={confirmSignOut}
              style={[
                styles.signOutButton,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={19}
                color="#071B2C"
              />

              <Text style={styles.signOutButtonText}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingBottom: 40,
  },

  page: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  pageWide: {
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 30,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },

  /* Sections */

  section: {
    marginBottom: 22,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 9,
  },

  /* Account */

  accountCard: {
    minHeight: 130,
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountInfo: {
    flex: 1,
  },

  email: {
    fontSize: 17,
    fontWeight: '800',
  },

  role: {
    fontSize: 14,
    marginTop: 5,
  },

  roleBadge: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  roleBadgeText: {
    color: '#071B2C',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Appearance */

  appearanceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },

  headingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headingTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  headingDescription: {
    fontSize: 13,
    marginTop: 3,
  },

  modeRow: {
    gap: 10,
  },

  modeRowWide: {
    flexDirection: 'row',
  },

  modeButton: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeInfo: {
    flex: 1,
  },

  modeLabel: {
    fontSize: 15,
    fontWeight: '800',
  },

  modeDescription: {
    fontSize: 12,
    marginTop: 3,
  },

  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#071B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Sign out */

  signOutCard: {
    minHeight: 110,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },

  signOutInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  signOutIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  signOutTextContainer: {
    flex: 1,
  },

  signOutTitle: {
    fontSize: 17,
    fontWeight: '800',
  },

  signOutDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  signOutButton: {
    minHeight: 48,
    minWidth: 125,
    borderRadius: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  signOutButtonText: {
    color: '#071B2C',
    fontSize: 14,
    fontWeight: '800',
  },
});