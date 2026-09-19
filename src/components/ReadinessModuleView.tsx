import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import type { ReadinessModule, ReadinessStep } from '../lib/readiness';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Props = {
  module: ReadinessModule;
  done: Set<string>;
  onToggleStep: (stepId: string, completed: boolean) => void;
  onBack: () => void;
};

function StepVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={styles.media} nativeControls contentFit="contain" />;
}

function StepMedia({ step }: { step: ReadinessStep }) {
  const { colors } = useTheme();
  if (step.mediaType === 'none' || !step.mediaUrl) return null;

  return (
    <View style={[styles.mediaFrame, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {step.mediaType === 'video' ? (
        <StepVideo url={step.mediaUrl} />
      ) : (
        <Image
          source={{ uri: step.mediaUrl }}
          style={styles.media}
          contentFit="contain"
          accessibilityLabel={step.title}
        />
      )}
    </View>
  );
}

export function ReadinessModuleView({ module, done, onToggleStep, onBack }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Open on the first step the student has not finished yet.
  const firstOpen = module.steps.findIndex((step) => !done.has(step.id));
  const [index, setIndex] = useState(firstOpen === -1 ? 0 : firstOpen);

  const step = module.steps[index];
  const completedCount = module.steps.filter((entry) => done.has(entry.id)).length;
  const allDone = module.steps.length > 0 && completedCount === module.steps.length;

  return (
    <View>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Ionicons name="arrow-back" size={18} color={colors.text} />
        <Text style={[styles.backText, { color: colors.text }]}>{t('common.allGuides')}</Text>
      </Pressable>

      <Text style={[styles.moduleTitle, { color: colors.text }]}>{module.title}</Text>
      {module.description ? <Text style={[styles.moduleDesc, { color: colors.textSecondary }]}>{module.description}</Text> : null}

      {module.steps.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>{t('common.guideComingSoon')}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{t('common.guideComingSoonHint')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.dots} accessibilityLabel={t('common.stepOf', { current: index + 1, total: module.steps.length })}>
            {module.steps.map((entry, position) => (
              <Pressable
                key={entry.id}
                onPress={() => setIndex(position)}
                accessibilityRole="button"
                accessibilityLabel={t('common.goToStep', { number: position + 1 })}
                style={[
                  styles.dot,
                  {
                    backgroundColor: done.has(entry.id) ? colors.accent : colors.border,
                    borderColor: position === index ? colors.text : 'transparent',
                  },
                ]}
              />
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.stepCount, { color: colors.accent }]}>
              {t('common.stepOf', { current: index + 1, total: module.steps.length })}
            </Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
            <StepMedia step={step} />
            {step.body ? <Text style={[styles.body, { color: colors.textSecondary }]}>{step.body}</Text> : null}

            {step.linkUrl ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(step.linkUrl)}
                style={[styles.linkButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.linkText, { color: colors.text }]}>{step.linkLabel || t('common.openLink')}</Text>
                <Ionicons name="open-outline" size={16} color={colors.text} />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done.has(step.id) }}
              onPress={() => onToggleStep(step.id, !done.has(step.id))}
              style={[
                styles.doneButton,
                done.has(step.id)
                  ? { backgroundColor: colors.card, borderColor: colors.accent, borderWidth: 1 }
                  : { backgroundColor: colors.accent },
              ]}
            >
              <Ionicons
                name={done.has(step.id) ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={done.has(step.id) ? colors.accent : '#071B2C'}
              />
              <Text style={[styles.doneText, { color: done.has(step.id) ? colors.text : '#071B2C' }]}>
                {done.has(step.id) ? t('common.stepDone') : t('common.markStepDone')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              disabled={index === 0}
              onPress={() => setIndex(index - 1)}
              style={[styles.navButton, { borderColor: colors.border }, index === 0 && styles.disabled]}
            >
              <Text style={[styles.navText, { color: colors.text }]}>{t('common.previous')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={index === module.steps.length - 1}
              onPress={() => setIndex(index + 1)}
              style={[styles.navButton, { borderColor: colors.border }, index === module.steps.length - 1 && styles.disabled]}
            >
              <Text style={[styles.navText, { color: colors.text }]}>{t('common.next')}</Text>
            </Pressable>
          </View>

          {allDone ? (
            <View style={[styles.celebrate, { backgroundColor: colors.card, borderColor: colors.accent }]}>
              <Text style={[styles.celebrateText, { color: colors.text }]}>{t('common.moduleComplete', { title: module.title })}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  backText: { fontSize: 14, fontWeight: '700' },
  moduleTitle: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  moduleDesc: { fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 12 },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 10, flexWrap: 'wrap' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  stepCount: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  stepTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  body: { fontSize: 15, lineHeight: 23 },
  mediaFrame: { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 12, aspectRatio: 16 / 9 },
  media: { width: '100%', height: '100%' },
  linkButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, marginTop: 14 },
  linkText: { fontSize: 14, fontWeight: '700' },
  doneButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 14 },
  doneText: { fontSize: 15, fontWeight: '800' },
  navRow: { flexDirection: 'row', gap: 10 },
  navButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 12 },
  navText: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.4 },
  celebrate: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14 },
  celebrateText: { fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
});
