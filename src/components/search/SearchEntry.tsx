import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SEARCH_SCOPES, searchHref, type SearchScopeId } from '../../lib/searchScopes';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';

// Looks like a search box. Tapping it opens the search screen with the keyboard ready.
// With no scope it searches the whole app (the Home screen); with a scope it searches only that screen.
export function SearchEntry({
  area = 'student',
  scope = 'all',
  style,
}: {
  area?: 'student' | 'mentor';
  scope?: SearchScopeId;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const info = SEARCH_SCOPES[scope];

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={scope === 'all' ? 'Search the whole app' : `Search ${info.label}`}
      onPress={() => router.push(searchHref(area, scope) as never)}
      style={({ pressed }) => [
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Ionicons name="search" size={20} color={colors.accent} />
      <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
        {info.placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  text: { flex: 1, fontSize: 14 },
});
