import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReadinessCard } from '../../components/ReadinessCard';
import { SearchEntry } from '../../components/search/SearchEntry';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { ShuttleCard } from '../../components/ShuttleCard';
import { useAppearance } from '../../context/AppearanceContext';
import { useAuth } from '../../context/AuthContext';
import { isRecent, newestFirst, postedAtOf, postedLabel, useSeenAnnouncements } from '../../lib/announcements';
import { useReadiness } from '../../lib/readiness';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

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

// The hero carries white text, so it stays dark in both themes rather than following the theme's
// own background and text colours.
const HERO_GRADIENT = ['#123152', '#0B2239', '#05101F'] as const;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority?: string;
  postedAt: Date | null;
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
    route: '/(student)/schedule',
    icon: 'calendar-outline',
    iconBg: '#FFF8D9',
    iconColor: '#0B1F3A',
    title: 'Orientation schedule',
    subtitle: "See today's events and upcoming sessions.",
  },
  {
    key: 'events',
    route: '/(student)/schedule?tab=events',
    icon: 'ticket-outline',
    iconBg: '#FDE8F1',
    iconColor: '#0B1F3A',
    title: 'Campus events',
    subtitle: 'See what is on around campus, when and where.',
  },
  {
    key: 'sportGym',
    route: '/(student)/sport-gym',
    icon: 'football-outline',
    iconBg: '#E6F6EC',
    iconColor: '#0B1F3A',
    title: 'Sport & gym',
    subtitle: 'Find a sport or club, and sign up for the gym.',
  },
  {
    key: 'checklist',
    route: '/(student)/checklist',
    icon: 'checkmark-circle-outline',
    iconBg: '#EEF3F9',
    iconColor: '#0B1F3A',
    title: 'New student checklist',
    subtitle: 'Keep track of the essentials at your own pace.',
  },
  {
    key: 'contacts',
    route: '/(student)/contacts',
    icon: 'people-outline',
    iconBg: '#F4F6F9',
    iconColor: '#0B1F3A',
    title: 'Get help & support',
    subtitle: 'Connect with mentors and advisors.',
  },
  {
    key: 'digital',
    route: '/(student)/digital',
    icon: 'laptop-outline',
    iconBg: '#FFF8D9',
    iconColor: '#0B1F3A',
    title: 'Digital tools',
    subtitle: 'Set up Funda, eduroam, labs and OneDrive.',
  },
  {
    key: 'programmes',
    route: '/(student)/it-programmes',
    icon: 'school-outline',
    iconBg: '#EEF3F9',
    iconColor: '#0B1F3A',
    title: 'School of IT programmes',
    subtitle: 'What each programme covers, careers, and who to ask for advice.',
  },
  {
    key: 'department',
    route: '/(student)/programme',
    icon: 'reader-outline',
    iconBg: '#FFF8D9',
    iconColor: '#0B1F3A',
    title: 'From your department',
    subtitle: 'Expectations, assignments and contacts from your head of department.',
  },
  {
    key: 'faqs',
    route: '/(student)/faqs',
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

  if (h < 12) return 'goodMorning';
  if (h < 18) return 'goodAfternoon';

  return 'goodEvening';
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
  posted,
}: {
  item: Announcement;
  expanded: boolean;
  onToggle: () => void;
  isNew: boolean;
  posted: string;
}) {
  const { colors } = useTheme();

  const urgent =
    item.priority?.toLowerCase() === 'urgent' ||
    item.priority?.toLowerCase() === 'high';

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        [
          styles.announcementCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ],
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
            [styles.announcementTitle, { color: colors.text }],
            urgent && styles.announcementUrgentTitle,
          ]}
          numberOfLines={expanded ? undefined : 1}
        >
          {item.title}
        </Text>

        {isNew && (
          <View style={styles.newBadge}>
            <View style={styles.newBadgeDot} />

            <Text style={styles.newBadgeText}>
              NEW
            </Text>
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

      {posted ? <Text style={[styles.postedText, { color: colors.textSecondary }]}>{posted}</Text> : null}

      <Text
        style={[
          styles.announcementMessage,
          { color: colors.textSecondary },
          urgent && styles.announcementUrgentMessage,
        ]}
        numberOfLines={expanded ? undefined : 2}
      >
        {item.message}
      </Text>

      {!expanded && (
        <Text
          style={[
            [styles.readMore, { color: colors.accent }],
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
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        [
          styles.actionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ],
        pressed && styles.actionCardPressed,
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <Ionicons
          name={action.icon}
          size={22}
          color={colors.accent}
        />
      </View>

      <View style={styles.actionText}>
        <Text
          style={[
            styles.cardTitle,
            { color: colors.text },
          ]}
        >
          {action.title}
        </Text>

        <Text
          style={[
            styles.cardSub,
            { color: colors.textSecondary },
          ]}
        >
          {action.subtitle}
        </Text>
      </View>

      <View style={styles.actionArrow}>
        <Ionicons
          name="arrow-forward"
          size={17}
          color={colors.accent}
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const readiness = useReadiness();

  const {
    darkMode,
    userOverride,
    setDarkModeOverride,
    fontScale,
    changeFontScale,
  } = useAppearance();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checklistItems, setChecklistItems] = useState<
    Array<{
      id: string;
      databaseId: string;
      databaseKey: 'checklist_item_id' | 'id';
      task_description: string;
      category: string;
      completion_status: boolean;
    }>
  >([]);
  const [checklistSummary, setChecklistSummary] = useState({
    total: 0,
    completed: 0,
    loading: true,
  });

  const [expandedId, setExpandedId] = useState<string | null>(
    null,
  );

  // Which announcements this student has already opened, so only unread recent ones say NEW.
  const { seen, markSeen } = useSeenAnnouncements(user?.id);

  const greeting = t(`common.${getGreeting()}`);
  const userMetadata = user?.user_metadata ?? {};
  const studentName = String(
    userMetadata.full_name ??
      userMetadata.name ??
      userMetadata.first_name ??
      'Student',
  ).trim();
  const studentNumber = String(
    userMetadata.student_number ??
      userMetadata.studentNumber ??
      userMetadata.student_id ??
      '',
  ).trim();
  const studentInitials = studentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  // ---------------------------------------------------------------------------
  // Fetch announcements
  // ---------------------------------------------------------------------------

  const fetchAnnouncements = useCallback(async () => {
    // Newest first, so the latest announcement is really at the top.
    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .order('posted_by', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to load announcements:', error);
      return [];
    }

    if (!data?.length) {
      return [];
    }

    return newestFirst(data.map((row, index): Announcement => {
      const item = row as Record<string, unknown>;

      return {
        id: String(
          item['Announcement ID'] ??
            item.announcement_id ??
            item.id ??
            index + 1,
        ),

        title: String(
          item.Title ??
            item.title ??
            '',
        ),

        message: String(
          item.Message ??
            item.message ??
            item.Description ??
            item.description ??
            '',
        ),

        priority: (item['Priority level'] ?? item.priority_level ?? item.Priority ?? item.priority)
          ? String(item['Priority level'] ?? item.priority_level ?? item.Priority ?? item.priority)
          : undefined,

        postedAt: postedAtOf(item),
      };
    }));
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

  const fetchChecklistSummary = useCallback(async () => {
    const { data, error } = await supabase
      .from('checklist_item')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      setChecklistItems([]);
      setChecklistSummary({ total: 0, completed: 0, loading: false });
      return;
    }

    const tasks = (data ?? []).map((row, index) => {
      const item = row as Record<string, unknown>;
      const databaseKey: 'checklist_item_id' | 'id' = item.checklist_item_id != null ? 'checklist_item_id' : 'id';
      const databaseId = String(item[databaseKey] ?? `home-checklist-${index}`);
      return {
        id: databaseId,
        databaseId,
        databaseKey,
        task_description: String(item.task_description ?? ''),
        category: String(item.category ?? item.support_category ?? 'General'),
        completion_status: item.completion_status === true || item.completion_status === 'true',
      };
    });

    setChecklistItems(tasks);
    setChecklistSummary({
      total: tasks.length,
      completed: tasks.filter((task) => task.completion_status).length,
      loading: false,
    });
  }, []);

  const toggleChecklistTask = useCallback(async (taskId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    setChecklistItems((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completion_status: nextStatus } : task,
      ),
    );

    setChecklistSummary((current) => {
      const newCompleted = current.completed + (nextStatus && !currentStatus ? 1 : !nextStatus && currentStatus ? -1 : 0);
      return {
        ...current,
        completed: Math.max(0, Math.min(current.total, newCompleted)),
      };
    });

    const { error } = await supabase
      .from('checklist_item')
      .update({ completion_status: nextStatus ? 'true' : 'false' })
      .eq(
        checklistItems.find((task) => task.id === taskId)?.databaseKey ?? 'checklist_item_id',
        checklistItems.find((task) => task.id === taskId)?.databaseId ?? taskId,
      );

    if (error) {
      console.error('Failed to sync home checklist item to Supabase.', error);
    }
  }, [checklistItems]);

  useEffect(() => {
    void fetchChecklistSummary();
  }, [fetchChecklistSummary]);

  // ---------------------------------------------------------------------------
  // Pull to refresh
  // ---------------------------------------------------------------------------

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    tap();

    try {
      const [list] = await Promise.all([fetchAnnouncements(), fetchChecklistSummary()]);

      setAnnouncements(list);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnnouncements, fetchChecklistSummary]);

  // ---------------------------------------------------------------------------
  // Unread state
  // ---------------------------------------------------------------------------

  // New means posted within the last week and not opened yet.
  const isNewAnnouncement = (announcement: Announcement) => isRecent(announcement.postedAt) && !seen.has(announcement.id);
  const newCount = announcements.filter(isNewAnnouncement).length;
  const hasUnread = newCount > 0;

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

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

  const themeLabel =
    userOverride === null
      ? 'System'
      : darkMode
        ? 'Dark'
        : 'Light';

  // ---------------------------------------------------------------------------
  // Font size
  // ---------------------------------------------------------------------------

  const adjustFontScale = (change: number) => {
    tap();

    const nextScale = Math.min(
      1.3,
      Math.max(
        0.7,
        Math.round((fontScale + change) * 10) / 10,
      ),
    );

    changeFontScale(nextScale);
  };

  // ---------------------------------------------------------------------------
  // Announcement interaction
  // ---------------------------------------------------------------------------

  const toggleAnnouncement = (id: string) => {
    tap();

    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut,
    );

    setExpandedId((current) =>
      current === id ? null : id,
    );

    // Opening an announcement marks it as read, so its NEW tag goes away.
    markSeen(id);
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ================================================================= */}
        {/* HERO */}
        {/* ================================================================= */}

        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Image
            source={require('../../../assets/images/coordinator-hero.png')}
            style={styles.heroBackgroundImage}
            contentFit="fill"
          />
          <View style={styles.heroImageOverlay} />
          {/* Decorative glow */}

          <View style={styles.heroGlowOne} />

          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.eyebrow}>
                {t('common.schoolOfIt')}
              </Text>

              <Text style={styles.heroMiniText}>
                {t('common.campusCompanion')}
              </Text>
            </View>

            <View style={styles.appearanceControls}>
              <View
                style={styles.fontSizeControls}
                accessibilityLabel="Text size"
              >
                <Pressable
                  style={[
                    styles.fontSizeButton,
                    fontScale <= 0.7 &&
                      styles.fontSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    adjustFontScale(-0.1)
                  }
                  disabled={fontScale <= 0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease text size"
                >
                  <Text style={styles.fontSizeButtonText}>
                    A-
                  </Text>
                </Pressable>

                <Text style={styles.fontSizeValue}>
                  {Math.round(fontScale * 100)}%
                </Text>

                <Pressable
                  style={[
                    styles.fontSizeButton,
                    fontScale >= 1.3 &&
                      styles.fontSizeButtonDisabled,
                  ]}
                  onPress={() =>
                    adjustFontScale(0.1)
                  }
                  disabled={fontScale >= 1.3}
                  accessibilityRole="button"
                  accessibilityLabel="Increase text size"
                >
                  <Text style={styles.fontSizeButtonText}>
                    A+
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.themeToggle}
                onPress={handleThemeToggle}
                accessibilityRole="button"
                accessibilityLabel={`Theme: ${themeLabel}`}
              >
                <Text style={styles.themeToggleText}>
                  Theme: {themeLabel}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.greeting}>
              {greeting}
            </Text>

            <View style={styles.studentIdentity}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>{studentInitials || 'S'}</Text>
              </View>

              <View style={styles.studentIdentityCopy}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Text style={styles.studentEmail} numberOfLines={1}>
                  {user?.email ?? 'Student account'}
                </Text>
              </View>

              {studentNumber ? (
                <View style={styles.studentNumberBadge}>
                  <Text style={styles.studentNumberText}>{studentNumber}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.welcomeTitle}>
              {t('common.startStrong')}
            </Text>

            <Text style={styles.welcomeTitleAccent}>
              {t('common.stayConnected')}
            </Text>

            <Text style={styles.subtitle}>
              {t('common.weekSubtitle')}
            </Text>
          </View>

          <View style={styles.heroBottom}>
            <View style={styles.statusIndicator} />

            <Text style={styles.heroStatus}>
              {t('common.campusStatus')}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={15}
              color={colors.accent}
            />
          </View>
        </LinearGradient>

        <SearchEntry area="student" scope="all" />

        {/* ================================================================= */}
        {/* SUPPORT BANNER */}
        {/* ================================================================= */}

        <ShameResilientBanner
          message={t('common.supportBanner')}
          type="encouragement"
        />

        {!checklistSummary.loading && checklistSummary.total > 0 && (
          <View style={styles.section}>
            <Pressable
              onPress={() => handleNavigate('/(student)/checklist')}
              style={({ pressed }) => [
                styles.checklistSummaryCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.actionCardPressed,
              ]}
            >
              <View style={styles.checklistSummaryHeader}>
                <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>Checklist</Text>
                <Text style={[styles.checklistSummaryBadge, { color: colors.accent }]}>
                  {checklistSummary.completed}/{checklistSummary.total}
                </Text>
              </View>

              <Text style={[styles.sectionHeader, { color: colors.text }]}>Your orientation checklist</Text>

              <View style={[styles.progressTrack, { backgroundColor: colors.card }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${checklistSummary.total ? (checklistSummary.completed / checklistSummary.total) * 100 : 0}%`,
                      backgroundColor: colors.accent,
                    },
                  ]}
                />
              </View>

              {checklistItems.slice(0, 3).map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => void toggleChecklistTask(task.id, task.completion_status)}
                  style={styles.checklistMiniRow}
                >
                  <View
                    style={[
                      styles.checklistMiniBox,
                      {
                        borderColor: colors.border,
                        backgroundColor: task.completion_status ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {task.completion_status && <Ionicons name="checkmark" size={12} color={colors.background} />}
                  </View>

                  <Text
                    style={[
                      styles.checklistMiniText,
                      { color: colors.text },
                      task.completion_status && styles.checklistMiniTextDone,
                    ]}
                    numberOfLines={1}
                  >
                    {task.task_description}
                  </Text>
                </Pressable>
              ))}

              <Text style={[styles.checklistSummaryText, { color: colors.textSecondary }]}>
                {checklistSummary.completed === checklistSummary.total
                  ? 'Nice work — you finished everything. Keep going!'
                  : 'Tap a task to update it, or open the full checklist.'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================================================================= */}
        {/* ANNOUNCEMENTS */}
        {/* ================================================================= */}

        {readiness.totalSteps > 0 && (
          <ReadinessCard
            done={readiness.doneSteps}
            total={readiness.totalSteps}
            onPress={() => handleNavigate('/(student)/digital')}
          />
        )}

        <ShuttleCard />

        {(loading || announcements.length > 0) && (
          <View style={styles.section}>
            <View
              style={styles.sectionHeaderContainer}
            >
              <View style={styles.sectionHeading}>
                <View style={styles.sectionTitleRow}>
                  <Text
                    style={[
                      styles.sectionEyebrow,
                      {
                        color: colors.accent,
                      },
                    ]}
                  >
                    {t('common.latest')}
                  </Text>

                  {hasUnread && !loading && (
                    <View
                      style={styles.unreadIndicator}
                    >
                      <View
                        style={styles.unreadDot}
                      />

                      <Text
                        style={[
                          styles.unreadText,
                          {
                            color: colors.accent,
                          },
                        ]}
                      >
                        {newCount > 1 ? `${newCount} ` : ''}{t('common.new')}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.sectionHeader,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {t('common.latestFromSchool')}
                </Text>
              </View>
            </View>

            {loading
              ? [0, 1].map((item) => (
                  <SkeletonCard key={item} />
                ))
              : announcements.map(
                  (announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      item={announcement}
                      expanded={
                        expandedId ===
                        announcement.id
                      }
                      onToggle={() =>
                        toggleAnnouncement(
                          announcement.id,
                        )
                      }
                      isNew={isNewAnnouncement(announcement)}
                      posted={postedLabel(announcement.postedAt)}
                    />
                  ),
                )}
          </View>
        )}

        {/* ================================================================= */}
        {/* QUICK ACCESS */}
        {/* ================================================================= */}

        <View style={styles.section}>
          <View
            style={styles.sectionHeaderContainer}
          >
            <View>
              <Text
                style={[
                  styles.sectionEyebrow,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                {t('common.quickAccess')}
              </Text>

              <Text
                style={[
                  styles.sectionHeader,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {t('common.whatNeed')}
              </Text>
            </View>
          </View>

          {ACTIONS.map((action) => (
            <ActionCard
              key={action.key}
              action={{
                ...action,
                title: t(
                  `common.${action.key}Title`,
                ),
                subtitle: t(
                  `common.${action.key}Subtitle`,
                ),
              }}
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
            {t('common.schoolOfIt')}
          </Text>

          <Text style={styles.footerSubtext}>
            {t('common.footerSubtitle')}
          </Text>
        </View>
      </ScrollView>

      {/* ================================================================= */}
      {/* FLOATING CHAT BUTTON (outside the ScrollView so it stays fixed) */}
      {/* ================================================================= */}

      <Pressable
        onPress={() => {
          tap();
          router.push('/chatbot');
        }}
        accessibilityRole="button"
        accessibilityLabel="Open chat assistant"
        style={styles.chatFab}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
      </Pressable>
    </View>
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
  // Floating chat button
  // ===========================================================================

  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  checklistSummaryCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },

  checklistSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  checklistSummaryBadge: {
    fontSize: 12,
    fontWeight: '800',
  },

  checklistSummaryText: {
    marginTop: 10,
    fontSize: 12,
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  checklistMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  checklistMiniBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  checklistMiniText: {
    flex: 1,
    fontSize: 13,
  },

  checklistMiniTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.65,
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
  heroBackgroundImage: {
    ...StyleSheet.absoluteFill,
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 19, 29, 0.28)',
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
    backgroundColor:
      'rgba(255,255,255,0.12)',
    borderColor:
      'rgba(255,255,255,0.26)',
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
    borderColor:
      'rgba(255,255,255,0.26)',
    backgroundColor:
      'rgba(255,255,255,0.08)',
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

  studentIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 22,
    paddingRight: 10,
  },

  studentAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C542',
    marginRight: 11,
  },

  studentAvatarText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },

  studentIdentityCopy: {
    flexShrink: 1,
    marginRight: 10,
  },

  studentName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },

  studentEmail: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    marginTop: 3,
  },

  studentNumberBadge: {
    maxWidth: 120,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  studentNumberText: {
    color: '#FFF8D9',
    fontSize: 10,
    fontWeight: '800',
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

  postedText: { fontSize: 11, marginTop: 2, marginBottom: 2 },
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