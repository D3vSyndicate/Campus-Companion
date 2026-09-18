
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

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
    const result = registering
      ? await signUp(email, password).then(({ error }) => ({ error, role: 'student' as const }))
      : await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (registering && !result.error) {
      setMessage('Account created. Check your email to confirm it, then log in.');
      setRegistering(false);
      return;
    }

    showToast('Login successful');
    const destination =
      result.role === 'coordinator'
        ? '/(coordinator)'
        : result.role === 'admin'
          ? '/(admin)'
          : '/(student)';
    router.replace(destination as any);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 

      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer}>
        <Image
          source={require('@/assets/images/globe-hands.png')}
          style={styles.backgroundLogo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.text }]}> 


            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
              Sign in to your Campus Companion account
            </Text>

             <LanguageSwitcher />

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>

              <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>

              <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => void handleForgotPassword()}
              disabled={loading}
            >
              <Text style={[styles.forgotText, { color: colors.text }]}> 
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
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
                  {registering ? 'Create account' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
            {message && <Text style={[styles.messageText, { color: colors.accent }]}>{message}</Text>}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => {
                setError(null);
                setMessage(null);
                setRegistering(!registering);
              }}
              disabled={loading}
            >
              <Text style={[styles.registerText, { color: colors.textSecondary }]}> 
                {registering ? 'Already have an account? Log in' : 'New student? Create an account'}
              </Text>
            </TouchableOpacity>

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
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  /* Background Logo */

  backgroundLogoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backgroundLogo: {
    width: 320,
    height: 320,
    opacity: 0.08,
  },

  /* Login Card */

  card: {
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 32,
    minHeight: 430,

    justifyContent: 'center',

    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },

  /* Logo */

  logo: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    marginBottom: 12,
  },

  /* Text */

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },

  /* Inputs */

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
  },

  /* Forgot Password */

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 22,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* Login */

  loginButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    fontSize: 16,
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

  registerButton: {
    alignItems: 'center',
    marginTop: 18,
  },

  registerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});

