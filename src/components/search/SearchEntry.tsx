import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';

// Looks like a search box. Tapping it opens the full search screen with the keyboard ready.
export function SearchEntry({ href, style }: { href: string; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Search the app"
      onPress={() => router.push(href as never)}
      style={({ pressed }) => [
        styles.box,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      <Ionicons name="search" size={20} color={colors.accent} />
      <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={1}>
        Search schedule, FAQs, contacts, venues...
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  text: { flex: 1, fontSize: 14 },
});
