import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

interface Props {
  message: string;
  type?: 'info' | 'encouragement' | 'recovery';
}

export const ShameResilientBanner: React.FC<Props> = ({ message, type = 'encouragement' }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        type === 'encouragement' && { backgroundColor: colors.accent },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 10,
    borderLeftWidth: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});