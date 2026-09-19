import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { homeRouteFor } from '../lib/roleHome';
import { useTheme } from '../theme/ThemeContext';

// The front door. Someone who is already signed in goes straight to their home screen, everyone else
// goes to the login screen.
export default function Index() {
  const { loading, user, role } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <Redirect href={(user && role ? homeRouteFor(role) : '/login') as never} />;
}
