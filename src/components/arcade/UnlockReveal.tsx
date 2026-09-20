import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { Unlock } from '../../lib/arcade';
import { useTheme } from '../../theme/ThemeContext';
import { ScaledText as Text } from '../ScaledText';
import { RewardCard } from './RewardCard';
import { useTranslation } from 'react-i18next';

// The payoff: 🏆 YOU WIN → 🔓 FACT UNLOCKED → the card itself. Kept deliberately short, because a
// student who has to sit through a long animation after every round stops playing.

interface UnlockRevealProps {
  unlock: Unlock | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onOpenVault: () => void;
}

export function UnlockReveal({ unlock, onClose, onPlayAgain, onOpenVault }: UnlockRevealProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const visible = unlock !== null;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      enter.setValue(0);
      return;
    }
    // Web has no haptics engine, and a rejected promise here would be noise.
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, enter]);

  if (!unlock) return null;

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, opacity: enter, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.trophy}>🏆</Text>
          <Text style={[styles.win, { color: colors.text }]}>{t('arcade.youWin')}</Text>

          <View style={[styles.unlockRow, { borderColor: colors.border }]}>
            <Ionicons name="lock-open-outline" size={14} color={colors.accent} />
            <Text style={[styles.unlockLabel, { color: colors.accent }]}>
              {unlock.isNew ? t('arcade.unlockedNew') : t('arcade.alreadyHave')}
            </Text>
          </View>

          <RewardCard reward={unlock.reward} />

          {!unlock.isNew ? (
            <Text style={[styles.exhausted, { color: colors.textSecondary }]}>
              {t('arcade.allUnlocked')}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onPlayAgain}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.primaryLabel}>{t('arcade.playAgain')}</Text>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenVault}
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.secondaryLabel, { color: colors.textSecondary }]}>
                {t('arcade.openVault')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.secondaryLabel, { color: colors.textSecondary }]}>{t('arcade.done')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(7,27,44,0.62)',
  },
  sheet: { borderRadius: 26, padding: 22 },
  trophy: { fontSize: 40, textAlign: 'center' },
  win: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  unlockLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  exhausted: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  primary: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryLabel: { color: '#071B2C', fontSize: 15, fontWeight: '800' },
  secondaryRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 6 },
  secondary: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  secondaryLabel: { fontSize: 13, fontWeight: '700' },
});
