import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// Logging out only clears the session: AuthGate sees there is no user and sends you to the login
// screen. Redirecting by hand as well used to race that, which is what made it feel unreliable.
export function useLogOut() {
  const { signOut } = useAuth();
  const { t } = useTranslation();

  return () => {
    const logOut = () => {
      void signOut();
    };

    // Alert shows no buttons on the web build, so ask with the browser's own dialog there.
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(t('logout.confirm'))) logOut();
      return;
    }

    Alert.alert(t('logout.action'), t('logout.confirm'), [
      { text: t('logout.stay'), style: 'cancel' },
      { text: t('logout.action'), style: 'destructive', onPress: logOut },
    ]);
  };
}

export function LogOutButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const logOut = useLogOut();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('logout.action')}
      onPress={logOut}
      style={({ pressed }) => [styles.button, { borderColor: colors.danger }, pressed && { opacity: 0.7 }, style]}
    >
      <Ionicons name="log-out-outline" size={18} color={colors.danger} />
      <Text style={[styles.label, { color: colors.danger }]}>{t('logout.action')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 15, fontWeight: '700' },
});
