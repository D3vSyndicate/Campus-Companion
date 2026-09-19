import type { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/superbase';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role: UserRole | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export type UserRole = 'admin' | 'coordinator' | 'hod' | 'student';

export function getUserRole(user: User | null): UserRole | null {
  // app_metadata can only be set by the server. user_metadata is editable by the
  // user (signUp accepts it), so it may only ever grant the student role.
  const trusted = user?.app_metadata?.role;
  if (trusted === 'admin' || trusted === 'coordinator' || trusted === 'hod' || trusted === 'student') return trusted;
  return user?.user_metadata?.role === 'student' ? 'student' : null;
}

function getLoginErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'That email or password is incorrect, or the account does not exist in this Supabase project.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email address from the Supabase confirmation email before logging in.';
  }

  return message;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (mounted) {
          setSession(nextSession);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl === 'https://your-project-ref.supabase.co' ||
      supabaseKey === 'your-publishable-or-anon-key'
    ) {
      const message = 'Supabase is not configured. Add the values from .env.example to .env.';
      setError(message);
      return { error: message, role: null };
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      const message = getLoginErrorMessage(signInError.message);
      setError(message);
      return { error: message, role: null };
    }

    setSession(data.session);
    return { error: null, role: getUserRole(data.user) };
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim());

    if (resetError) {
      const message = resetError.message;
      setError(message);
      return { error: message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role: 'student' } },
    });

    if (signUpError) {
      const message = signUpError.message;
      setError(message);
      return { error: message };
    }

    setSession(data.session);
    return { error: null };
  };

  const signOut = async () => {
    setError(null);
    setSession(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
      if (signOutError) {
        setError(signOutError.message);
      }
    } finally {
      // Keep the local session cleared even when the network is unavailable.
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        role: getUserRole(session?.user ?? null),
        loading,
        error,
        signIn,
        signUp,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
