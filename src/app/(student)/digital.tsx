import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { PageHeader } from '../../components/PageHeader';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';

type DigitalImage = {
  url: string;
  caption: string;
};

type DigitalGuide = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  steps: string[];
  images: DigitalImage[];
  link?: string;
  videoUrl?: string;
};

function getCategoryIcon(category: unknown): keyof typeof Ionicons.glyphMap {
  const categoryIcons: Record<number, keyof typeof Ionicons.glyphMap> = {
    1: 'desktop-outline',
    2: 'mail-outline',
    3: 'school-outline',
    4: 'wifi-outline',
  };

  const categoryNumber = typeof category === 'number' ? category : Number(category);
  return categoryIcons[categoryNumber] ?? 'information-circle-outline';
}

function mapDigitalGuide(row: Record<string, unknown>, index: number): DigitalGuide & { sortOrder: number; id: string } {
  const rawSteps = row.steps;
  const rawImages = row.image_urls;
  const steps = Array.isArray(rawSteps)
    ? rawSteps.filter((step): step is string => typeof step === 'string' && step.trim().length > 0)
    : typeof rawSteps === 'string' && rawSteps.trim()
      ? [rawSteps]
      : [];
  const images = Array.isArray(rawImages)
    ? rawImages.reduce<DigitalImage[]>((validImages, image) => {
        if (!image || typeof image !== 'object') return validImages;
        const imageRecord = image as Record<string, unknown>;
        const url = typeof imageRecord.url === 'string' ? imageRecord.url.trim() : '';
        if (!url) return validImages;
        validImages.push({
          url,
          caption: typeof imageRecord.caption === 'string' ? imageRecord.caption : '',
        });
        return validImages;
      }, [])
    : [];

  return {
    id: String(row.id ?? row.digital_readiness_id ?? index),
    sortOrder: Number(row.sort_order ?? 0),
    icon: getCategoryIcon(row.category),
    title: typeof row.name === 'string' ? row.name : '',
    desc: typeof row.description === 'string' ? row.description : '',
    steps,
    images,
    link: typeof row.reference_url === 'string' && row.reference_url.trim() ? row.reference_url : undefined,
    videoUrl: typeof row.video_url === 'string' && row.video_url.trim() ? row.video_url : undefined,
  };
}

export default function DigitalReadinessScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedGuide, setSelectedGuide] = useState<DigitalGuide | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [guides, setGuides] = useState<DigitalGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Search results link straight to a guide: /digital?guide=<id or title>.
  const params = useLocalSearchParams<{ guide?: string | string[] }>();
  const guideParam = Array.isArray(params.guide) ? params.guide[0] : params.guide;
  const openedFromLink = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!guideParam || guideParam === openedFromLink.current || !guides.length) return;
    const wanted = guideParam.trim().toLowerCase();
    const match = guides.find((guide) => guide.id.toLowerCase() === wanted || guide.title.toLowerCase() === wanted);
    if (match) {
      openedFromLink.current = guideParam;
      setSelectedGuide(match);
    }
  }, [guideParam, guides]);
  const tileWidth = useMemo(() => {
    const horizontalPadding = 32;
    const columnGap = 16;
    return Math.max(0, (screenWidth - horizontalPadding - columnGap) / 2);
  }, [screenWidth]);

  const loadGuides = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    const { data, error } = await fetchWithOfflineFallback('digital_readiness');
    if (error) {
      console.error('Failed to load digital readiness content from Supabase.', error);
    }

    const mappedGuides = Array.isArray(data)
      ? data
          .map((row, index) => mapDigitalGuide(row as Record<string, unknown>, index))
          .filter((guide) => guide.title.length > 0)
          .sort((first, second) => first.sortOrder - second.sortOrder)
      : [];

    setGuides(mappedGuides);
    setLoadError(Boolean(error));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadGuides();
  }, [loadGuides]);

  const closeGuide = () => {
    setSelectedGuide(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <PageHeader
        eyebrow={t('common.getConnected')}
        title={t('common.digitalTitle')}
        subtitle={t('common.digitalSubtitle')}
      />
      <ShameResilientBanner 
        message={t('common.digitalBanner')}
        type="encouragement"
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} />
      ) : loadError || guides.length === 0 ? (
        <ShameResilientBanner
          message={t('common.digitalUnavailable')}
          type="info"
        />
      ) : (
        <View style={styles.grid}>
          {guides.map((item) => {
        return (
        <View key={item.id} style={[styles.card, { width: tileWidth, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open guide: ${item.title}`}
            onPress={() => {
              setSelectedGuide(item);
            }}
            style={styles.tilePressable}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
              <Ionicons name={item.icon} size={21} color={colors.accent} />
            </View>
            <View style={styles.tileCopy}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.steps.length} steps</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
          </Pressable>
        </View>
        );
          })}
        </View>
      )}

      <Modal
        visible={selectedGuide !== null}
        animationType="slide"
        onRequestClose={closeGuide}
      >
        <View style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Guide</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close guide"
              onPress={closeGuide}
              style={[styles.closeButton, { backgroundColor: colors.card }]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {selectedGuide && (
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={[styles.modalTitleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.card }]}>
                  <Ionicons name={selectedGuide.icon} size={24} color={colors.accent} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedGuide.title}</Text>
              </View>

              <Text style={[styles.intro, { color: colors.text }]}>
                {selectedGuide.desc || 'This guide will help you take your next step with confidence.'}
              </Text>

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Steps to follow</Text>
              <View style={[styles.stepsContainer, { backgroundColor: colors.card }]}>
                {selectedGuide.steps.length > 0 ? selectedGuide.steps.map((step, idx) => (
                  <View key={`${selectedGuide.id}-${idx}`} style={styles.stepRow}>
                    <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.stepNumberText, { color: colors.text }]}>{idx + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                  </View>
                )) : (
                  <Text style={[styles.stepText, { color: colors.textSecondary }]}>There are no steps to show yet. You can still explore the guide below.</Text>
                )}
              </View>

              {selectedGuide.videoUrl && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open optional guide video"
                  onPress={() => void WebBrowser.openBrowserAsync(selectedGuide.videoUrl!)}
                  style={[styles.mediaFrame, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <View style={styles.videoOverlay}>
                    <View style={[styles.playButton, { backgroundColor: colors.accent }]}>
                      <Ionicons name="play" size={22} color={colors.text} />
                    </View>
                    <Text style={[styles.playHint, { color: colors.text }]}>Watch video</Text>
                    <Text style={[styles.videoLinkHint, { color: colors.textSecondary }]}>Opens separately</Text>
                  </View>
                </Pressable>
              )}

              {selectedGuide.images.map((image) => (
                <View key={image.url} style={[styles.imageSection, { borderColor: colors.border }]}>
                  {imageErrors[image.url] ? (
                    <Text style={[styles.mediaMessage, { color: colors.textSecondary }]}>This picture did not load, but you can still read the steps above.</Text>
                  ) : (
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={image.caption ? `Open image: ${image.caption}` : 'Open image'}
                      onPress={() => void WebBrowser.openBrowserAsync(image.url)}
                    >
                      <Image
                        source={{ uri: image.url }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={() => setImageErrors((current) => ({ ...current, [image.url]: true }))}
                      />
                    </Pressable>
                  )}
                  {image.caption ? <Text style={[styles.imageCaption, { color: colors.textSecondary }]}>{image.caption}</Text> : null}
                </View>
              ))}

              {selectedGuide.link && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open guide"
                  style={[styles.button, { backgroundColor: colors.accent }]}
                  onPress={() => void Linking.openURL(selectedGuide.link!)}
                >
                  <Text style={[styles.buttonText, { color: colors.text }]}>Learn more</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.text} />
                </Pressable>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 16, flexShrink: 0 },
  tilePressable: { minHeight: 88, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  tileCopy: { flex: 1, minWidth: 0, alignItems: 'flex-start', marginRight: 6 },
  title: { fontSize: 13, lineHeight: 17, fontWeight: '800' },
  meta: { fontSize: 10, marginTop: 3 },
  modalScreen: { flex: 1 },
  modalHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  modalHeaderTitle: { fontSize: 20, fontWeight: '800' },
  closeButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalContent: { padding: 16, paddingBottom: 40 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14 },
  modalIconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  modalTitle: { flex: 1, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  intro: { fontSize: 17, lineHeight: 25, fontWeight: '600', marginTop: 16, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  stepsContainer: { padding: 12, borderRadius: 13 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepNumber: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  stepNumberText: { fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 12, lineHeight: 17 },
  button: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12, borderRadius: 10, marginTop: 16 },
  buttonText: { fontWeight: '800', fontSize: 14 },
  mediaFrame: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 13, borderWidth: 1, marginTop: 12, backgroundColor: '#000' },
  imageSection: { marginTop: 12, overflow: 'hidden', borderRadius: 13, borderWidth: 1 },
  image: { width: '100%', aspectRatio: 1.65, maxHeight: 150, backgroundColor: '#E4E7EA' },
  imageCaption: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  mediaMessage: { padding: 14, fontSize: 13, lineHeight: 19 },
  videoOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  playHint: { fontSize: 13, fontWeight: '800', marginTop: 8 },
  videoLinkHint: { fontSize: 11, marginTop: 4 },
});