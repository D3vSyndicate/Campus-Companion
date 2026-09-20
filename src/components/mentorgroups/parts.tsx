import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { type Priority } from '../../lib/mentorGroups';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';

// The few building blocks the mentor group screens share, so the student and mentor sides look the same
// as every other screen: a page with the shared header, cards, buttons and calm empty states.

export function MgScreen({ children, refreshing = false, onRefresh }: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>;
}

type Tone = 'primary' | 'quiet' | 'danger';

export function MgButton({
  label,
  icon,
  onPress,
  tone = 'primary',
  disabled = false,
  busy = false,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  busy?: boolean;
}) {
  const { colors } = useTheme();
  const solid = tone === 'primary' ? colors.accent : tone === 'danger' ? '#C62828' : colors.card;
  const ink = tone === 'primary' ? '#071B2C' : tone === 'danger' ? '#FFFFFF' : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: solid, borderColor: tone === 'quiet' ? colors.border : 'transparent' },
        (disabled || busy) && { opacity: 0.55 },
        pressed && { opacity: 0.85 },
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={ink} /> : icon ? <Ionicons name={icon} size={18} color={ink} /> : null}
      <Text style={[styles.buttonText, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export function EmptyState({ icon, title, text, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; text?: string; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <Panel style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={30} color={colors.textSecondary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {text ? <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{text}</Text> : null}
      {children ? <View style={styles.emptyActions}>{children}</View> : null}
    </Panel>
  );
}

const PRIORITY_COLORS: Record<Priority, string> = { normal: '#64748B', important: '#D98E04', urgent: '#C62828' };

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  const color = PRIORITY_COLORS[priority];
  const label = priority === 'urgent' ? t('mgm.priorityUrgent') : priority === 'important' ? t('mgm.priorityImportant') : t('mgm.priorityNormal');
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  panel: { borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18 },
  buttonText: { fontSize: 15, fontWeight: '800' },
  center: { paddingVertical: 48, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  emptyActions: { alignSelf: 'stretch', gap: 10, marginTop: 10 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
