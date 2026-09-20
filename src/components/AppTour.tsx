import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text as PlainText, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOUR_STEPS, TOUR_TABS, type TourTab } from '../data/appTour';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// Dark in both themes, like the Home hero, because the text on it is always white.
const BACKGROUND = ['#123152', '#0B2239', '#05101F'] as const;
const INK = '#071B2C';

// A small picture of the tab bar with one tab lit up, so a student sees where to tap.
function MiniTabBar({ active, compact }: { active: TourTab; compact: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // On a narrow phone there is no room for eight labels, so only the highlighted tab keeps its label.
  const { width } = useWindowDimensions();
  const narrow = width < 360;
  const label = t(TOUR_TABS.find((tab) => tab.key === active)?.labelKey ?? 'common.home');

  return (
    <View style={[styles.tabBar, compact && styles.tabBarCompact]} accessible accessibilityLabel={t('tour.a11y.tabBar', { tab: label })}>
      {TOUR_TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <View key={tab.key} style={styles.tabItem}>
            <View style={[styles.tabDot, on && { backgroundColor: colors.accent }]}>
              <Ionicons name={tab.icon} size={18} color={on ? INK : 'rgba(255,255,255,0.55)'} />
            </View>
            {/* Plain text on purpose: these labels must not grow with the text-size setting. */}
            <PlainText style={[styles.tabLabel, on && { color: colors.accent, fontWeight: '800' }, narrow && !on && styles.tabLabelHidden]} numberOfLines={1}>
              {t(tab.labelKey)}
            </PlainText>
          </View>
        );
      })}
    </View>
  );
}

export function AppTour({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Short phones get a tighter layout so the picture of the tab bar is not pushed under the buttons.
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const [index, setIndex] = useState(0);
  const [forward, setForward] = useState(true);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  const close = () => {
    setIndex(0);
    setForward(true);
    onClose();
  };

  const next = () => {
    if (isLast) {
      close();
      return;
    }
    setForward(true);
    setIndex((current) => current + 1);
  };

  const back = () => {
    setForward(false);
    setIndex((current) => Math.max(0, current - 1));
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={close}>
      <LinearGradient colors={BACKGROUND} style={styles.screen} accessibilityViewIsModal>
        <View style={[styles.top, { paddingTop: insets.top + 14 }]}>
          <View style={styles.progressRow}>
            <View
              style={styles.progress}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={t('tour.a11y.progress', { current: index + 1, total: TOUR_STEPS.length })}
            >
              {TOUR_STEPS.map((item, i) => (
                <View key={item.id} style={[styles.segment, { backgroundColor: i <= index ? colors.accent : 'rgba(255,255,255,0.22)' }]} />
              ))}
            </View>
            {!isLast ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('tour.a11y.skip')} onPress={close} hitSlop={12} style={styles.skip}>
                <Text style={styles.skipText}>{t('tour.skip')}</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.counter}>{t('tour.counter', { current: index + 1, total: TOUR_STEPS.length })}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View
            key={step.id}
            entering={(forward ? FadeInRight : FadeInLeft).duration(240)}
            style={styles.step}
          >
            <View style={[styles.iconTile, compact && styles.iconTileCompact, { backgroundColor: colors.accent }]}>
              <Ionicons name={step.icon} size={compact ? 32 : 44} color={INK} />
            </View>

            <Text style={[styles.title, compact && styles.titleCompact]} accessibilityRole="header">
              {t(`tour.steps.${step.id}.title`)}
            </Text>
            <Text style={[styles.body, compact && styles.bodyCompact]}>{t(`tour.steps.${step.id}.body`)}</Text>

            {step.tab ? <MiniTabBar active={step.tab} compact={compact} /> : null}

            {step.hasHint ? (
              <View style={[styles.hint, compact && styles.hintCompact]}>
                <Ionicons name="bulb-outline" size={16} color={colors.accent} />
                <Text style={styles.hintText}>{t(`tour.steps.${step.id}.hint`)}</Text>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: insets.bottom + 18 }]}>
          {index > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tour.a11y.previous')}
              onPress={back}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              <Text style={styles.backText}>{t('tour.back')}</Text>
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? t('tour.a11y.finish') : t('tour.a11y.next')}
            onPress={next}
            style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}
          >
            <Text style={styles.nextText}>{isLast ? t('tour.letsGo') : t('tour.next')}</Text>
            <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color={INK} />
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { paddingHorizontal: 22 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progress: { flex: 1, flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  skip: { paddingVertical: 4 },
  skipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', opacity: 0.85 },
  counter: { color: '#FFFFFF', opacity: 0.6, fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginTop: 14 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 20 },
  step: { alignItems: 'center', width: '100%', maxWidth: 520, alignSelf: 'center' },
  iconTile: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  iconTileCompact: { width: 66, height: 66, borderRadius: 22, marginBottom: 14 },
  titleCompact: { fontSize: 23, lineHeight: 28 },
  bodyCompact: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  tabBarCompact: { marginTop: 16, paddingVertical: 8 },
  hintCompact: { marginTop: 12, paddingVertical: 8 },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  body: { color: '#FFFFFF', opacity: 0.82, fontSize: 16, lineHeight: 25, textAlign: 'center', marginTop: 14 },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 26,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '600' },
  tabLabelHidden: { opacity: 0 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
  },
  hintText: { flexShrink: 1, color: '#FFFFFF', opacity: 0.85, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10 },
  backSpacer: { width: 100 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 52,
    minWidth: 100,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  nextButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, minWidth: 140, paddingHorizontal: 24, borderRadius: 16 },
  nextText: { color: INK, fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
