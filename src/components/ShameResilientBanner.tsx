import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

interface Props {
  message: string;
  type?: 'info' | 'encouragement' | 'recovery';
  // A short bold line above the message. Most banners do not need one.
  title?: string;
}

const ICONS = {
  encouragement: 'heart',
  recovery: 'refresh-circle',
  info: 'information-circle',
} as const;

// A soft note, not an alert. Warm tint for kindness (encouragement, recovery), neutral for plain information.
// The accent colour is only a tint here: solid orange behind text is hard to read and feels like a warning.
export const ShameResilientBanner: React.FC<Props> = ({ message, type = 'encouragement', title }) => {
  const { colors, isDark } = useTheme();
  const warm = type !== 'info';

  const palette = warm
    ? {
        background: `${colors.accent}${isDark ? '1A' : '1F'}`,
        border: `${colors.accent}55`,
        tile: `${colors.accent}33`,
        icon: isDark ? colors.accent : '#9A5B00',
      }
    : {
        background: colors.card,
        border: colors.border,
        tile: colors.surfaceMuted,
        icon: colors.textSecondary,
      };

  return (
    <View style={[styles.container, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.tile, { backgroundColor: palette.tile }]}>
        <Ionicons name={ICONS[type]} size={20} color={palette.icon} />
      </View>
      <View style={styles.copy}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 8,
  },
  tile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, paddingTop: 1 },
  title: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  text: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
});
