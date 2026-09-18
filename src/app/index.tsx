import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { loading, role, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user || !role) {
    return <Redirect href="/login" />;
  }

  const destination =
    role === 'coordinator'
      ? '/(coordinator)'
      : role === 'admin'
        ? '/(admin)'
        : '/(student)';

  return <Redirect href={destination as any} />;
}