import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';
import { KIND_META, type Reward } from '../../data/arcade-rewards';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';

// One unlocked reward. The same card is used for the reveal after a win and for the rows in the
// Fact Vault, so a student recognises what they collected when they come back to it later.

interface RewardCardProps {
  reward: Reward;
  // The reveal shows the source; the vault list keeps rows compact until they are opened.
  compact?: boolean;
}

export function RewardCard({ reward, compact = false }: RewardCardProps) {
  const { colors } = useTheme();
  const meta = KIND_META[reward.kind];
  // Present on every kind, though only First-Year Tips are allowed to leave it out.
  const source = reward.source;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        compact && styles.cardCompact,
      ]}
    >
      <View style={styles.kindRow}>
        <View style={[styles.kindPill, { backgroundColor: meta.accent }]}>
          <Text style={styles.kindEmoji}>{meta.emoji}</Text>
          <Text style={styles.kindLabel}>{meta.label}</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{reward.title}</Text>

      {reward.kind === 'madibaz' ? (
        <Text style={[styles.attribution, { color: colors.textSecondary }]}>
          {reward.name} · {reward.programme}
        </Text>
      ) : null}

      <Text style={[styles.body, { color: colors.textSecondary }]}>{reward.body}</Text>

      {!compact && source ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open source: ${source.label}`}
          onPress={() => void WebBrowser.openBrowserAsync(source.url)}
          style={({ pressed }) => [styles.source, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="open-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.sourceText, { color: colors.textSecondary }]} numberOfLines={1}>
            {source.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cardCompact: { padding: 15, borderRadius: 16 },
  kindRow: { flexDirection: 'row', marginBottom: 12 },
  kindPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  kindEmoji: { fontSize: 12 },
  // The three kind colours are all light enough to need dark text on top, in either theme.
  kindLabel: {
    color: '#071B2C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  attribution: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  sourceText: { flex: 1, fontSize: 11, fontWeight: '600' },
});
