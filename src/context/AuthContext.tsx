import React, { createContext, useContext, useState, ReactNode } from 'react';

// PLACEHOLDER — your team is building the real auth flow. This just gives
// the admin screens (Header avatar, Profile screen) something to read from
// so they're not blocked. Swap this out for whatever your team's auth
// context ends up exposing, as long as it keeps a similar shape
// (user.email, signOut()) — or update the two call sites (Header, Profile)
// to match their API.

type PlaceholderUser = { email: string } | null;

type AuthContextValue = {
  user: PlaceholderUser;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<PlaceholderUser>({ email: 'admin@example.com' });

  const signOut = () => {
    // TODO: replace with supabase.auth.signOut() from your team's client
    console.log('signOut() called — wire this up to real auth');
  };

  return <AuthContext.Provider value={{ user, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
