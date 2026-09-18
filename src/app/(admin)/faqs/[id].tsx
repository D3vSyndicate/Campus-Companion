import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FaqForm from '../../../components/FaqForm';
import { ScaledText as Text } from '../../../components/ScaledText';
import { useFaqs } from '../../../context/FaqsContext';
import { useTheme } from '../../../theme/ThemeContext';

export default function EditFaq() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, loading } = useFaqs();
  const { colors } = useTheme();

  const item = id ? getItem(id) : undefined;

  // Don't render the form until the FAQ has loaded: it copies `existing` into
  // its fields on first render, so an early render would open it empty.
  if (!item) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Edit FAQ' }} />
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={{ color: colors.textSecondary }}>This FAQ isn't available anymore.</Text>
        )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit FAQ' }} />
      <FaqForm key={item.id} existing={item} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
