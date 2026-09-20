import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScaledText as Text } from '../../components/ScaledText';
import { ShameResilientBanner } from '../../components/ShameResilientBanner';
import { SupportPathways } from '../../components/SupportPathways';
import { fetchWithOfflineFallback } from '../../lib/offlineData';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Contact = { id: string; name: string; role: string; category: string; email: string };

const str = (value: unknown) => String(value ?? '').trim();

// "Who do I point this student to?" — the support pathways, then the people behind them.
export default function ReferScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await fetchWithOfflineFallback('Contact');
      setContacts(
        (Array.isArray(data) ? data : []).map((row: Record<string, unknown>, index: number) => ({
          id: str(row.contact_id) || String(index),
          name: `${str(row.name)} ${str(row.surname)}`.trim(),
          role: str(row.role),
          category: str(row.support_category),
          email: str(row.email),
        })),
      );
      setLoading(false);
    })();
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>{t('buddy.actions.refer.title')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('buddyRefer.subtitle')}
      </Text>

      <ShameResilientBanner
        message={t('buddyRefer.safety')}
        type="info"
      />

      <SupportPathways faqRoute="/(mentor)/faqs" />

      <Text style={[styles.heading, { color: colors.text }]}>{t('common.peopleWhoCanHelp')}</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loading} />
      ) : contacts.length === 0 ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('buddyRefer.none')}</Text>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardText}>
              <Text style={[styles.name, { color: colors.text }]}>{contact.name || t('buddyRefer.fallbackName')}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {[contact.role, contact.category].filter(Boolean).join(' · ')}
              </Text>
            </View>
            {contact.email ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void Linking.openURL(`mailto:${contact.email}`)}
                style={[styles.button, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.buttonText}>{t('common.email')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 6 },
  heading: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  loading: { marginTop: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  cardText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  buttonText: { color: '#071B2C', fontSize: 13, fontWeight: '800' },
});
