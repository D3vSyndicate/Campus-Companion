import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BUILT_IN_BY_NUMBER,
  BUILT_IN_CONTACTS,
  categorySlug,
  dialable,
  fetchEmergencyContacts,
  numberKey,
  type EmergencyContact,
} from '../lib/emergency';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

const INK_LIGHT = '#071B2C';
const INK_DARK = '#0E2A40';
// White text on this red passes contrast in both themes. The theme's own danger colour is too light in dark mode.
const CALL_RED = '#C62828';

// The two numbers to call when someone is in immediate danger.
const DANGER_NUMBERS = ['112', '10111'];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'emergency-services': 'alert-circle',
  'mental-health': 'heart',
  'abuse-and-violence': 'shield-checkmark',
  campus: 'school',
};

const call = (phone: string) => {
  Linking.openURL(`tel:${dialable(phone)}`).catch(() => undefined);
};

// Emergency and counselling numbers. Written to be kind: someone reading this may be frightened or
// ashamed, so it says plainly that asking for help is brave and that nobody will be judged.
//
// Layout follows how people use this in a crisis: the two danger numbers come first and can be reached
// without scrolling, every contact is one big tap target, and nothing needs reading before calling.
//
// `standalone` is for the page that opens before signing in, which has no tab bar, so it brings its own Back.
export function EmergencyContacts({ standalone = false }: { standalone?: boolean }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The built-in numbers show at once. The saved ones replace them a moment later if there are any.
  const [contacts, setContacts] = useState<EmergencyContact[]>(BUILT_IN_CONTACTS);

  useEffect(() => {
    let active = true;
    void fetchEmergencyContacts().then((list) => {
      if (active) setContacts(list);
    });
    return () => {
      active = false;
    };
  }, []);

  // An entry nobody has edited is shown in the student's language. An edited one shows exactly what staff wrote.
  const words = (contact: EmergencyContact, field: 'name' | 'description') => {
    const original = BUILT_IN_BY_NUMBER.get(numberKey(contact.phone));
    if (original && original[field] === contact[field]) {
      return t(`emergency.items.${numberKey(contact.phone)}.${field}`, { defaultValue: contact[field] });
    }
    return contact[field];
  };

  const when = (available: string) => (available.toLowerCase() === '24 hours' ? t('emergency.hours24') : available);

  const groups: { category: string; items: EmergencyContact[] }[] = [];
  for (const contact of contacts) {
    const group = groups.find((entry) => entry.category === contact.category);
    if (group) group.items.push(contact);
    else groups.push({ category: contact.category, items: [contact] });
  }

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login' as never);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* One centred column, so it stays readable on a tablet or a wide browser window. */}
      <View style={styles.column}>
        <View style={[styles.hero, { backgroundColor: isDark ? INK_DARK : INK_LIGHT }, isDark && styles.heroDark]}>
          <View style={[styles.pill, { backgroundColor: colors.accent }]}>
            <Ionicons name="heart" size={12} color={INK_LIGHT} />
            <Text style={styles.pillText}>{t('emergency.eyebrow')}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">{t('emergency.title')}</Text>
          <Text style={styles.subtitle}>{t('emergency.subtitle')}</Text>
        </View>

        <View
          style={[
            styles.danger,
            { borderColor: `${CALL_RED}99`, backgroundColor: isDark ? 'rgba(198,40,40,0.16)' : 'rgba(198,40,40,0.06)' },
          ]}
        >
          <View style={styles.dangerHead}>
            <View style={[styles.dangerIcon, { backgroundColor: CALL_RED }]}>
              <Ionicons name="warning" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.dangerTitle, { color: colors.text }]} accessibilityRole="header">{t('emergency.dangerTitle')}</Text>
          </View>
          <Text style={[styles.dangerText, { color: colors.textSecondary }]}>{t('emergency.dangerText')}</Text>

          <View style={styles.dangerButtons}>
            {DANGER_NUMBERS.map((number) => {
              const label = t(`emergency.items.${number}.name`, { defaultValue: number });
              return (
                <Pressable
                  key={number}
                  accessibilityRole="button"
                  accessibilityLabel={t('emergency.callNumber', { name: label, phone: number })}
                  onPress={() => call(number)}
                  style={({ pressed }) => [styles.dangerButton, { backgroundColor: CALL_RED }, pressed && styles.pressed]}
                >
                  <View style={styles.dangerNumberRow}>
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.dangerNumber}>{number}</Text>
                  </View>
                  <Text style={styles.dangerLabel} numberOfLines={1}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.tapHint, { color: colors.textSecondary }]}>{t('emergency.tapHint')}</Text>

        {groups.map((group) => {
          const slug = categorySlug(group.category);
          return (
            <View key={group.category} style={styles.group}>
              <View style={styles.groupHead}>
                <View style={[styles.groupIcon, { backgroundColor: `${colors.accent}26` }]}>
                  <Ionicons name={CATEGORY_ICONS[slug] ?? 'call'} size={17} color={isDark ? colors.accent : '#9A5B00'} />
                </View>
                <Text style={[styles.groupTitle, { color: colors.text }]} accessibilityRole="header">
                  {t(`emergency.categories.${slug}`, { defaultValue: group.category })}
                </Text>
              </View>

              {group.items.map((contact) => {
                const name = words(contact, 'name');
                return (
                  <Pressable
                    key={contact.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('emergency.callNumber', { name, phone: contact.phone })}
                    onPress={() => call(contact.phone)}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.cardCopy}>
                      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                      {contact.description ? (
                        <Text style={[styles.description, { color: colors.textSecondary }]}>{words(contact, 'description')}</Text>
                      ) : null}
                      <View style={styles.meta}>
                        <Text style={[styles.phone, { color: colors.text }]}>{contact.phone}</Text>
                        {contact.available ? (
                          <View style={[styles.chip, { backgroundColor: colors.card }]}>
                            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                            <Text style={[styles.chipText, { color: colors.textSecondary }]}>{when(contact.available)}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={[styles.callButton, { backgroundColor: colors.accent }]}>
                      <Ionicons name="call" size={18} color={INK_LIGHT} />
                      <Text style={styles.callText}>{t('emergency.call')}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>{t('emergency.footer')}</Text>
        </View>

        {standalone ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('emergency.back')}
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }, pressed && styles.pressed]}
          >
            <Text style={[styles.backText, { color: colors.text }]}>{t('emergency.back')}</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  column: { width: '100%', maxWidth: 640 },

  hero: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 14 },
  heroDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 14 },
  pillText: { color: INK_LIGHT, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: '#FFFFFF', fontSize: 14, lineHeight: 21, opacity: 0.8, marginTop: 8 },

  danger: { borderWidth: 1.5, borderRadius: 22, padding: 16 },
  dangerHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dangerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dangerTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  dangerText: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  dangerButtons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  dangerButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 72, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 10 },
  dangerNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dangerNumber: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  dangerLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', opacity: 0.92, marginTop: 3 },

  tapHint: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },

  group: { marginTop: 22 },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  groupIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10 },
  cardCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  description: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  phone: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },
  callButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, minWidth: 48, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  callText: { color: INK_LIGHT, fontSize: 14, fontWeight: '800' },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },

  backButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 14, borderWidth: 1, marginTop: 18 },
  backText: { fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
