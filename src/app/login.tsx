
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();

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

    if (!result.role) {
      setError('Your account does not have a valid role. Ask an administrator to set it to admin or student.');
      return;
    }

    router.replace(result.role === 'admin' ? '/(admin)' : '/(student)');
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
    <View style={styles.container}>

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
          <View style={styles.card}>


            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.subtitle}>
              Sign in to your Campus Companion account
            </Text>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#8A8A8A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8A8A8A"
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
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={() => void handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#071B2C" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}
            {message && <Text style={styles.messageText}>{message}</Text>}

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071B2C',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingVertical: 32,
    minHeight: 430,

    justifyContent: 'center',

    shadowColor: '#000',
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
    color: '#071B2C',
    textAlign: 'center',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#071B2C',
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D9DDE2',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#071B2C',
    backgroundColor: '#F8F9FA',
  },

  /* Forgot Password */

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 22,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#071B2C',
  },

  /* Login */

  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F8A705',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonText: {
    color: '#071B2C',
    fontSize: 16,
    fontWeight: '700',
  },

  errorText: {
    color: '#B42318',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },

  messageText: {
    color: '#16794A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
});

