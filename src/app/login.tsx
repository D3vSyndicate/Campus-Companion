
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ScaledText as Text } from '../components/ScaledText';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { homeRouteFor } from '../lib/roleHome';
import { useTheme } from '../theme/ThemeContext';
export default function LoginScreen() {
  const router = useRouter();
  const { signIn, resetPassword, signOut, user, role, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const handleLogin = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, for example name@mandela.ac.za.');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // The password was right but the account has no usable role. Say so, instead of sending the
    // person to a screen that silently sends them back here.
    if (!result.role) {
      await signOut();
      setError(
        'You are signed in, but this account has not been given a role yet, so the app does not know where to take you. Please ask an administrator to set your role.',
      );
      return;
    }

    showToast('Login successful', 'success');
    // Always the home screen for this account, never wherever the last person was.
    router.replace(homeRouteFor(result.role) as never);
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage('Password reset instructions have been sent to your email.');
  };

  if (!authLoading && user && role) {
    return <Redirect href={homeRouteFor(role) as never} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroImageContainer}>
            <Image
              source={require('@/assets/images/login-hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 
            <Text style={[styles.title, { color: colors.text }]}>{t('common.welcomeBack')}</Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
              Sign in to your Campus Companion account
            </Text>

            <LanguageSwitcher />

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('common.email')}</Text>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: '#dfeaf3', borderColor: '#dfeaf3', color: '#071B2C' },
                ]}
                placeholder={t('common.email')}
                placeholderTextColor="#5B6B76"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>{t('common.password')}</Text>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: '#dfeaf3', borderColor: '#dfeaf3', color: '#071B2C' },
                ]}
                placeholder={t('common.password')}
                placeholderTextColor="#5B6B76"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => void handleForgotPassword()}
              disabled={loading}
            >
              <Text style={[styles.forgotText, { color: colors.text }]}> 
                Forgot password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
              onPress={() => void handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.text }]}>
                  {t('common.login')}
                </Text>
              )}
            </TouchableOpacity>

            {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
            {message && <Text style={[styles.messageText, { color: colors.accent }]}>{message}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 22,
  },

  heroImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 8,
  },

  heroImage: {
    width: 360,
    height: 220,
  },

  card: {
    width: '100%',
    maxWidth: 980,
    borderRadius: 26,
    paddingHorizontal: 28,
    paddingVertical: 26,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 22,
  },

  forgotText: {
    fontSize: 15,
    fontWeight: '600',
  },

  loginButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },

  errorText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },

  messageText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },

});

