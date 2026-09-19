import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { fetchWithOfflineFallback } from '../lib/offlineData';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type Pathway = {
  id: string;
  need: string;
  contact: string;
  action: string;
  relatedFaq: string;
  resource: string;
};

const str = (value: unknown) => String(value ?? '').trim();
const IS_LINK = /^https?:\/\//i;

type Props = {
  // Which FAQ screen the "related questions" shortcut opens. Each role has its own.
  faqRoute?: string;
};

// "I need help with..." — starts from what the student is feeling or facing, then points to a next step.
export function SupportPathways({ faqRoute = '/(student)/faqs' }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await fetchWithOfflineFallback('Support_pathway');
      if (error) console.error('Failed to load support pathways.', error);

      setPathways(
        (Array.isArray(data) ? data : [])
          .map((row, index) => {
            const item = row as Record<string, unknown>;
            return {
              id: str(item.support_pathway_Id) || String(index),
              need: str(item.student_need),
              contact: str(item.recommended_contact),
              action: str(item.recommended_action),
              relatedFaq: str(item.related_faq),
              resource: str(item.related_resource),
            };
          })
          .filter((pathway) => pathway.need),
      );
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator color={colors.accent} style={styles.loading} />;
  if (!pathways.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('common.needHelpWith')}</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('common.needHelpHint')}</Text>

      {pathways.map((pathway) => {
        const open = openId === pathway.id;
        return (
          <View key={pathway.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setOpenId(open ? null : pathway.id)}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={[styles.icon, { backgroundColor: colors.card }]}>
                <Ionicons name="hand-left-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.need, { color: colors.text }]}>{pathway.need}</Text>
              </View>
              <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {open ? (
              <View style={[styles.details, { borderTopColor: colors.border }]}>
                {pathway.action ? (
                  <>
                    <Text style={[styles.label, { color: colors.accent }]}>{t('common.yourNextStep')}</Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>{pathway.action}</Text>
                  </>
                ) : null}

                {pathway.contact ? (
                  <>
                    <Text style={[styles.label, { color: colors.accent }]}>{t('common.whoToAsk')}</Text>
                    <Text style={[styles.body, { color: colors.text }]}>{pathway.contact}</Text>
                  </>
                ) : null}

                {pathway.resource && !IS_LINK.test(pathway.resource) ? (
                  <>
                    <Text style={[styles.label, { color: colors.accent }]}>{t('common.alsoSee')}</Text>
                    <Text style={[styles.body, { color: colors.text }]}>{pathway.resource}</Text>
                  </>
                ) : null}

                <View style={styles.actions}>
                  {pathway.relatedFaq ? (
                    <TouchableOpacity
                      style={[styles.button, styles.outlined, { borderColor: colors.border }]}
                      onPress={() =>
                        router.push({ pathname: faqRoute, params: { category: pathway.relatedFaq } } as never)
                      }
                    >
                      <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.seeRelatedFaqs')}</Text>
                    </TouchableOpacity>
                  ) : null}

                  {IS_LINK.test(pathway.resource) ? (
                    <TouchableOpacity
                      style={[styles.button, styles.outlined, { borderColor: colors.border }]}
                      onPress={() => void Linking.openURL(pathway.resource)}
                    >
                      <Text style={[styles.buttonText, { color: colors.text }]}>{t('common.openResource')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  loading: { marginVertical: 16 },
  heading: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  need: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  details: { borderTopWidth: 1, padding: 14 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  outlined: { borderWidth: 1 },
  buttonText: { fontSize: 13, fontWeight: '700', color: '#071B2C' },
});
