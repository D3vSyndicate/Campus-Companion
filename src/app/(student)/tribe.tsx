import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TribeChat } from '../../components/TribeChat';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';

export default function TribeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ groupId?: string | string[] }>();
  const routeGroupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
  const metadata = user?.user_metadata ?? {};
  const groupId = routeGroupId ?? String(metadata.group_id ?? metadata.groupId ?? '');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TribeChat groupId={groupId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
