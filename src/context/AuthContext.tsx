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
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

export type UserRole = 'admin' | 'coordinator' | 'student';

export function getUserRole(user: User | null): UserRole | null {
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
  return role === 'admin' || role === 'coordinator' || role === 'student' ? role : null;
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
      const message = signInError.message;
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

  const signOut = async () => {
    setError(null);

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      const message = signOutError.message;
      setError(message);
      return;
    }

    setSession(null);
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
