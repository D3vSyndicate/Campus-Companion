import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { SEARCH_SCOPES, scopeForScreen, searchHref } from '../lib/searchScopes';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// The header is a dark card in both themes, so its white text always has the same contrast. Using the
// theme's own text/surface colours would flip it to a white slab in dark mode.
const INK_LIGHT = '#071B2C';
const INK_DARK = '#0E2A40';
const ON_INK = '#FFFFFF';

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  mentor: 'FYS Buddy',
  coordinator: 'Orientation Coordinator',
  admin: 'Administrator',
  hod: 'Head of Department',
};

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  // Screens with a self-explanatory title can leave this out.
  subtitle?: string;
  // A screen that already has its own search box can turn this off.
  showSearch?: boolean;
  // Screens reached by tapping a card (rather than a tab) need a way back.
  showBack?: boolean;
  // Where "back" goes when there is no history, for example after a deep link.
  backFallback?: string;
}

// Opens a search limited to the screen it sits on, so it only finds what that screen shows. The search
// on the Home screen is the one that looks across the whole app. Students and buddies have their own.
function HeaderSearch() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const area = segments[0] === '(mentor)' ? 'mentor' : segments[0] === '(student)' ? 'student' : null;
  const scope = scopeForScreen(segments[segments.length - 1]);
  // Search belongs to the student and buddy screens. A screen with no search of its own does not get
  // one that quietly searches everything.
  if (!area || !scope) return null;
  const href = searchHref(area, scope);
  const info = SEARCH_SCOPES[scope];

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={`Search ${info.label}`}
      onPress={() => router.push(href as never)}
      style={({ pressed }) => [styles.search, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="search" size={18} color={colors.accent} />
      <Text style={styles.searchText} numberOfLines={1}>
        {info.placeholder}
      </Text>
    </Pressable>
  );
}

export function PageHeader({ eyebrow, title, subtitle, showSearch = true, showBack = false, backFallback }: PageHeaderProps) {
  const { colors, isDark } = useTheme();
  const { user, role } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const metadata = user?.user_metadata ?? {};
  const displayName = String(
    metadata.full_name ?? metadata.name ?? metadata.first_name ?? user?.email ?? 'Student',
  ).trim();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'S';
  const roleLabel = ROLE_LABELS[role ?? ''] ?? 'Student';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (backFallback) router.replace(backFallback as never);
  };

  return (
    <View
      style={[
        styles.container,
        // Without this the card would sit under the status bar: no screen using it sets a top inset.
        { marginTop: insets.top, backgroundColor: isDark ? INK_DARK : INK_LIGHT },
        isDark && styles.containerDark,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftGroup}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={goBack}
              hitSlop={10}
              style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="arrow-back" size={20} color={ON_INK} />
            </Pressable>
          ) : null}
          <View style={[styles.eyebrowPill, { backgroundColor: colors.accent }]}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text>
          </View>
        </View>

        <View style={styles.identityRow}>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.identityRole} numberOfLines={1}>{roleLabel}</Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.accent }]}>
            <Text style={styles.identityInitials}>{initials}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {showSearch ? <HeaderSearch /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginBottom: 20,
    padding: 22,
    shadowColor: '#071B2C',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  // In dark mode the card and the page are both dark, so a hairline keeps its edges visible.
  containerDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 8 },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -4 },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
    backgroundColor: INK_LIGHT,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, maxWidth: '52%' },
  identityCopy: { flexShrink: 1, alignItems: 'flex-end', marginRight: 8 },
  identityName: { color: ON_INK, fontSize: 12, fontWeight: '800' },
  identityRole: { color: ON_INK, fontSize: 10, opacity: 0.7, marginTop: 2 },
  // The pill and the avatar are both accent, so their text stays dark for contrast in either theme.
  identityInitials: { color: INK_LIGHT, fontSize: 12, fontWeight: '800' },
  eyebrow: {
    color: INK_LIGHT,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: ON_INK,
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 35,
  },
  subtitle: {
    color: ON_INK,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.76,
    marginTop: 10,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  searchText: { flex: 1, color: ON_INK, fontSize: 14, opacity: 0.85 },
});
