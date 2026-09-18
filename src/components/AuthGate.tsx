import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth, UserRole } from '../context/AuthContext';

export function AuthGate({ children, requiredRole }: { children: ReactNode; requiredRole: UserRole }) {
  const { loading, role, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (role !== requiredRole) {
    return <Redirect href={role ? (role === 'admin' ? '/(admin)' : '/(student)') : '/login'} />;
  }

  return <>{children}</>;
}
