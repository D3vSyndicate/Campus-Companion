import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    LayoutAnimation,
    Text as NativeText,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextProps,
    UIManager,
    View,
} from 'react-native';

import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { useAppearance } from '../../context/AppearanceContext';
import { supabase } from '../../lib/superbase';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// -----------------------------------------------------------------------------
// Design system
// -----------------------------------------------------------------------------

const COLORS = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3F9',
  primary: '#0B1F3A',
  primaryDark: '#07162A',
  primaryDeep: '#05101F',
  primarySoft: '#EEF3F9',
  text: '#10203A',
  textSecondary: '#5F6F82',
  textMuted: '#8A98A8',
  danger: '#C94C4C',
  warning: '#C58A28',
  border: '#D9E0E8',
  white: '#FFFFFF',
};

const LAST_SEEN_KEY = 'announcements:lastSeenId';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority?: string;
}

interface ActionItem {
  key: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

// -----------------------------------------------------------------------------
// Quick actions
// -----------------------------------------------------------------------------

const ACTIONS: ActionItem[] = [
  {
    key: 'schedule',
    route: '/schedule',
    icon: 'calendar-outline',
    iconBg: '#FFF8D9',
    iconColor: '#0B1F3A',
    title: 'Orientation schedule',
    subtitle: "See today's events and upcoming sessions.",
  },
  {
    key: 'checklist',
    route: '/checklist',
    icon: 'checkmark-circle-outline',
    iconBg: '#EEF3F9',
    iconColor: '#0B1F3A',
    title: 'New student checklist',
    subtitle: 'Keep track of the essentials at your own pace.',
  },
  {
    key: 'contacts',
    route: '/contacts',
    icon: 'people-outline',
    iconBg: '#F4F6F9',
    iconColor: '#0B1F3A',
    title: 'Get help & support',
    subtitle: 'Connect with mentors and advisors.',
  },
  {
    key: 'digital',
    route: '/digital',
    icon: 'laptop-outline',
    iconBg: '#FFF8D9',
    iconColor: '#0B1F3A',
    title: 'Digital tools',
    subtitle: 'Set up Funda, eduroam, labs and OneDrive.',
  },
  {
    key: 'faqs',
    route: '/faqs',
    icon: 'help-circle-outline',
    iconBg: '#EEF3F9',
    iconColor: '#0B1F3A',
    title: 'Common questions',
    subtitle: 'Quick answers about campus and support.',
  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getGreeting() {
  const h = new Date().getHours();

  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';

  return 'Good evening';
}

const tap = () => {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function ScaledText({ style, ...props }: TextProps) {
  const { fontScale } = useAppearance();
  const flattenedStyle = StyleSheet.flatten(style);

  return (
    <NativeText
      {...props}
      style={[
        flattenedStyle,
        typeof flattenedStyle?.fontSize === 'number' && {
          fontSize: flattenedStyle.fontSize * fontScale,
        },
        typeof flattenedStyle?.lineHeight === 'number' && {
          lineHeight: flattenedStyle.lineHeight * fontScale,
        },
      ]}
    />
  );
}

const Text = ScaledText;

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function SkeletonCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.announcementCard,
        styles.skeletonCard,
        { opacity: pulse },
      ]}
    >
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonCircle} />

        <View style={styles.skeletonTitle} />
      </View>

      <View style={[styles.skeletonLine, { width: '92%' }]} />

      <View
        style={[
          styles.skeletonLine,
          {
            width: '72%',
            marginTop: 7,
          },
        ]}
      />
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// Announcement card
// -----------------------------------------------------------------------------

function AnnouncementCard({
  item,
  expanded,
  onToggle,
  isNew,
}: {
  item: Announcement;
  expanded: boolean;
  onToggle: () => void;
  isNew: boolean;
}) {
  const urgent =
    item.priority?.toLowerCase() === 'urgent' ||
    item.priority?.toLowerCase() === 'high';

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.announcementCard,
        urgent && styles.announcementUrgent,
        pressed && styles.announcementPressed,
      ]}
    >
      <View style={styles.announcementHeader}>
        <View
          style={[
            styles.announcementDot,
            {
              backgroundColor: urgent
                ? COLORS.warning
                : COLORS.primary,
            },
          ]}
        />

        <Text
          style={[
            styles.announcementTitle,
            urgent && styles.announcementUrgentTitle,
          ]}
          numberOfLines={expanded ? undefined : 1}
        >
          {item.title}
        </Text>

        {isNew && (
          <View style={styles.newBadge}>
            <View style={styles.newBadgeDot} />
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={urgent ? COLORS.warning : COLORS.primary}
          />
        </View>
      </View>

      <Text
        style={[
          styles.announcementMessage,
          urgent && styles.announcementUrgentMessage,
        ]}
        numberOfLines={expanded ? undefined : 2}
      >
        {item.message}
      </Text>

      {!expanded && (
        <Text
          style={[
            styles.readMore,
            urgent && styles.readMoreUrgent,
          ]}
        >
          Tap to read more
        </Text>
      )}
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Quick action card
// -----------------------------------------------------------------------------

function ActionCard({
  action,
  onPress,
}: {
  action: ActionItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: action.iconBg },
        ]}
      >
        <Ionicons
          name={action.icon}
          size={22}
          color={action.iconColor}
        />
      </View>

      <View style={styles.actionText}>
        <Text style={styles.cardTitle}>
          {action.title}
        </Text>

        <Text style={styles.cardSub}>
          {action.subtitle}
        </Text>
      </View>

      <View style={styles.actionArrow}>
        <Ionicons
          name="arrow-forward"
          size={17}
          color={COLORS.primary}
        />
      </View>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Home screen
// -----------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const {
    darkMode,
    userOverride,
    setDarkModeOverride,
    fontScale,
    changeFontScale,
  } = useAppearance();

  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  const [lastSeenId, setLastSeenId] = useState<string | null>(
    null,
  );

  const greeting = useMemo(getGreeting, []);

  // ---------------------------------------------------------------------------
  // Load last-seen announcement
  // ---------------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      const stored =
        await AsyncStorage.getItem(LAST_SEEN_KEY);

      if (stored) {
        setLastSeenId(stored);
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch announcements
  // ---------------------------------------------------------------------------

  const fetchAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from('Announcement')
      .select('*');

    if (error || !data?.length) {
      return [];
    }

    return data.map((row, index) => {
      const item = row as Record<string, unknown>;

      return {
        id: String(
          item.id ??
            item.announcement_id ??
            index + 1,
        ),
        title: String(item.title ?? ''),
        message: String(
          item.message ??
            item.description ??
            '',
        ),
        priority: item.priority
          ? String(item.priority)
          : undefined,
      };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchAnnouncements();

        setAnnouncements(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchAnnouncements]);

  // ---------------------------------------------------------------------------
  // Pull to refresh
  // ---------------------------------------------------------------------------

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    tap();

    try {
      const list = await fetchAnnouncements();

      setAnnouncements(list);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnnouncements]);

  // ---------------------------------------------------------------------------
  // Unread state
  // ---------------------------------------------------------------------------

  const hasUnread =
    announcements.length > 0 &&
    announcements[0].id !== lastSeenId;

  const handleThemeToggle = () => {
    if (userOverride === null) {
      setDarkModeOverride(!darkMode);
      return;
    }

    if (darkMode) {
      setDarkModeOverride(false);
      return;
    }

    setDarkModeOverride(null);
  };

  const themeLabel = userOverride === null ? 'System' : darkMode ? 'Dark' : 'Light';

  const adjustFontScale = (change: number) => {
    tap();
    const nextScale = Math.min(
      1.3,
      Math.max(0.7, Math.round((fontScale + change) * 10) / 10),
    );
    changeFontScale(nextScale);
  };

  // ---------------------------------------------------------------------------
  // Announcement interaction
  // ---------------------------------------------------------------------------

  const toggleAnnouncement = async (id: string) => {
    tap();

    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut,
    );

    setExpandedId((current) =>
      current === id ? null : id,
    );

    // Mark latest announcement as seen
    if (
      announcements[0]?.id === id &&
      id !== lastSeenId
    ) {
      setLastSeenId(id);

      await AsyncStorage.setItem(
        LAST_SEEN_KEY,
        id,
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleNavigate = (route: string) => {
    tap();

    router.push(route as never);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* ================================================================= */}
      {/* HERO */}
      {/* ================================================================= */}

      <LinearGradient
        colors={[
          '#102D52',
          '#0B1F3A',
          '#07162A',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Decorative glow */}
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.heroTopRow}>
          <View>
            <Text style={styles.eyebrow}>
              SCHOOL OF IT
            </Text>

            <Text style={styles.heroMiniText}>
              CAMPUS COMPANION
            </Text>
          </View>

          <View style={styles.appearanceControls}>
            <View style={styles.fontSizeControls} accessibilityLabel="Text size">
              <Pressable
                style={[
                  styles.fontSizeButton,
                  fontScale <= 0.7 && styles.fontSizeButtonDisabled,
                ]}
                onPress={() => adjustFontScale(-0.1)}
                disabled={fontScale <= 0.7}
                accessibilityRole="button"
                accessibilityLabel="Decrease text size"
              >
                <Text style={styles.fontSizeButtonText}>A-</Text>
              </Pressable>

              <Text style={styles.fontSizeValue}>
                {Math.round(fontScale * 100)}%
              </Text>

              <Pressable
                style={[
                  styles.fontSizeButton,
                  fontScale >= 1.3 && styles.fontSizeButtonDisabled,
                ]}
                onPress={() => adjustFontScale(0.1)}
                disabled={fontScale >= 1.3}
                accessibilityRole="button"
                accessibilityLabel="Increase text size"
              >
                <Text style={styles.fontSizeButtonText}>A+</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.themeToggle}
              onPress={handleThemeToggle}
              accessibilityRole="button"
              accessibilityLabel={`Theme: ${themeLabel}`}
            >
              <Text style={styles.themeToggleText}>Theme: {themeLabel}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.greeting}>
            {greeting}
          </Text>

          <Text style={styles.welcomeTitle}>
            Start strong.
          </Text>

          <Text style={styles.welcomeTitleAccent}>
            Stay connected.
          </Text>

          <Text style={styles.subtitle}>
            Everything you need for your first
            week, in one place.
          </Text>
        </View>

        <View style={styles.heroBottom}>
          <View style={styles.statusIndicator} />

          <Text style={styles.heroStatus}>
            Your campus companion
          </Text>

          <Ionicons
            name="arrow-forward"
            size={15}
            color="#F4C542"
          />
        </View>
      </LinearGradient>

      {/* ================================================================= */}
      {/* SUPPORT BANNER */}
      {/* ================================================================= */}

      <ShameResilientBanner
        message="Feeling unsure about where to go or what to ask? That is completely normal. Take it one step at a time."
        type="encouragement"
      />

      {/* ================================================================= */}
      {/* ANNOUNCEMENTS */}
      {/* ================================================================= */}

      {(loading || announcements.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionEyebrow}>
                  LATEST
                </Text>

                {hasUnread && !loading && (
                  <View style={styles.unreadIndicator}>
                    <View style={styles.unreadDot} />

                    <Text style={styles.unreadText}>
                      NEW
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.sectionHeader}>
                Latest from the School
              </Text>
            </View>
          </View>

          {loading
            ? [0, 1].map((item) => (
                <SkeletonCard key={item} />
              ))
            : announcements.map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  item={announcement}
                  expanded={
                    expandedId === announcement.id
                  }
                  onToggle={() =>
                    toggleAnnouncement(
                      announcement.id,
                    )
                  }
                  isNew={
                    index === 0 && hasUnread
                  }
                />
              ))}
        </View>
      )}

      {/* ================================================================= */}
      {/* QUICK ACCESS */}
      {/* ================================================================= */}

      <View style={styles.section}>
        <View style={styles.sectionHeaderContainer}>
          <View>
            <Text style={styles.sectionEyebrow}>
              QUICK ACCESS
            </Text>

            <Text style={styles.sectionHeader}>
              What do you need?
            </Text>
          </View>
        </View>

        {ACTIONS.map((action) => (
          <ActionCard
            key={action.key}
            action={action}
            onPress={() =>
              handleNavigate(action.route)
            }
          />
        ))}
      </View>

      {/* ================================================================= */}
      {/* FOOTER */}
      {/* ================================================================= */}

      <View style={styles.footer}>
        <View style={styles.footerLine} />

        <Text style={styles.footerText}>
          SCHOOL OF IT
        </Text>

        <Text style={styles.footerSubtext}>
          Your first week, made simpler.
        </Text>
      </View>
    </ScrollView>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  // ===========================================================================
  // Layout
  // ===========================================================================

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
    paddingTop: 18,
    paddingBottom: 42,
  },

  section: {
    marginTop: 4,
  },

  // ===========================================================================
  // Hero
  // ===========================================================================

  hero: {
    position: 'relative',
    overflow: 'hidden',

    padding: 22,
    minHeight: 270,

    borderRadius: 28,
    marginBottom: 18,

    shadowColor: '#07162A',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 8,
  },

  heroGlowOne: {
    position: 'absolute',

    width: 190,
    height: 190,

    borderRadius: 95,

    backgroundColor:
      'rgba(255,255,255,0.07)',

    right: -75,
    top: -70,
  },

  heroGlowTwo: {
    position: 'absolute',

    width: 125,
    height: 125,

    borderRadius: 63,

    backgroundColor:
      'rgba(255,255,255,0.045)',

    right: 30,
    bottom: -62,
  },

  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  themeToggle: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.26)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  appearanceControls: {
    alignItems: 'flex-end',
    gap: 6,
  },

  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  fontSizeButton: {
    minWidth: 26,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  fontSizeButtonDisabled: {
    opacity: 0.45,
  },

  fontSizeButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  fontSizeValue: {
    color: '#FFFFFF',
    minWidth: 34,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
  },

  themeToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  eyebrow: {
    color: '#F4C542',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  heroMiniText: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 3,
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor:
      'rgba(255,255,255,0.10)',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.14)',
  },

  heroBadgeText: {
    color: '#FFF8D9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  heroContent: {
    marginTop: 42,
  },

  greeting: {
    color: '#F4C542',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },

  welcomeTitle: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  welcomeTitleAccent: {
    color: '#F4C542',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.8,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 12,
    maxWidth: '88%',
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 24,
  },

  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7CE8D9',
  },

  heroStatus: {
    flex: 1,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    fontWeight: '600',
  },

  // ===========================================================================
  // Section headers
  // ===========================================================================

  sectionHeaderContainer: {
    marginTop: 27,
    marginBottom: 13,
  },

  sectionHeading: {
    flex: 1,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  sectionEyebrow: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  sectionHeader: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.35,
    color: COLORS.text,
  },

  // ===========================================================================
  // Unread
  // ===========================================================================

  unreadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    marginBottom: 4,

    paddingHorizontal: 7,
    paddingVertical: 3,

    borderRadius: 999,

    backgroundColor: '#FFF1F2',
  },

  unreadDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },

  unreadText: {
    color: COLORS.danger,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  // ===========================================================================
  // Announcement cards
  // ===========================================================================

  announcementCard: {
    backgroundColor: COLORS.surface,

    borderRadius: 19,

    padding: 16,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#10201D',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 1,
  },

  announcementPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },

  announcementUrgent: {
    backgroundColor: '#FFF9F1',
    borderColor: '#F3DFC0',
  },

  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  announcementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  announcementTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.1,
  },

  announcementUrgentTitle: {
    color: '#7A5014',
  },

  announcementMessage: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },

  announcementUrgentMessage: {
    color: '#80623A',
  },

  readMore: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 9,
  },

  readMoreUrgent: {
    color: '#A56B1F',
  },

  chevronContainer: {
    width: 27,
    height: 27,

    borderRadius: 9,

    backgroundColor: COLORS.surfaceMuted,

    alignItems: 'center',
    justifyContent: 'center',
  },

  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRadius: 999,

    backgroundColor: '#FFF1F2',
  },

  newBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.danger,
  },

  newBadgeText: {
    color: COLORS.danger,
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ===========================================================================
  // Skeleton
  // ===========================================================================

  skeletonCard: {
    backgroundColor: '#E9EFED',
    borderColor: '#E9EFED',
  },

  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 15,
  },

  skeletonCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD8D4',
  },

  skeletonTitle: {
    height: 12,
    width: '48%',
    borderRadius: 6,
    backgroundColor: '#CBD8D4',
  },

  skeletonLine: {
    height: 9,
    borderRadius: 6,
    backgroundColor: '#D1DDD9',
  },

  // ===========================================================================
  // Action cards
  // ===========================================================================

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.surface,

    minHeight: 78,

    paddingHorizontal: 15,
    paddingVertical: 13,

    borderRadius: 20,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: '#10201D',
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 1,

    gap: 13,
  },

  actionCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.93,
    backgroundColor: '#FBFCFC',
  },

  iconBadge: {
    width: 48,
    height: 48,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    flex: 1,
    paddingRight: 4,
  },

  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.15,
  },

  cardSub: {
    fontSize: 12,
    lineHeight: 17,
    color: '#71807C',
    marginTop: 4,
  },

  actionArrow: {
    width: 31,
    height: 31,

    borderRadius: 10,

    backgroundColor: COLORS.primarySoft,

    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===========================================================================
  // Footer
  // ===========================================================================

  footer: {
    alignItems: 'center',
    marginTop: 34,
    paddingBottom: 10,
  },

  footerLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C9DCD8',
    marginBottom: 14,
  },

  footerText: {
    color: '#71807C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },

  footerSubtext: {
    color: '#A0AAA7',
    fontSize: 11,
    marginTop: 5,
  },
});

