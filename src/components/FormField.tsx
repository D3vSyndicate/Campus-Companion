import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScaledText as Text } from './ScaledText';

export function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

export function inputStyle(colors: any) {
  return { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };
}

export const formStyles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  saveButton: { marginTop: 12, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#071B2C', fontWeight: '700', fontSize: 15 },
});

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
});
