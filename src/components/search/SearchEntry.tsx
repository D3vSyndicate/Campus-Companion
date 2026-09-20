import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SEARCH_SCOPES, scopeText, searchHref, type SearchScopeId } from '../../lib/searchScopes';
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
  const { t } = useTranslation();
  const router = useRouter();
  const info = SEARCH_SCOPES[scope];

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={scope === 'all' ? t('search.wholeApp') : t('search.searchScope', { scope: scopeText(info, 'label') })}
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
        {scopeText(info, 'placeholder')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  text: { flex: 1, fontSize: 14 },
});
