import { Href, Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScaledText as Text } from '../../../components/ScaledText';
import { FaqItem, useFaqs } from '../../../context/FaqsContext';
import { useTheme } from '../../../theme/ThemeContext';

export default function FaqsList() {
  const { items, loading, error, refresh, setVisible } = useFaqs();
  const { colors } = useTheme();
  const router = useRouter();

  const handleToggle = async (item: FaqItem, value: boolean) => {
    try {
      await setVisible(item.id, value);
    } catch (e) {
      Alert.alert("Couldn't update visibility", e instanceof Error ? e.message : 'Try again.');
    }
  };

  const header = (
    <Stack.Screen
      options={{
        title: 'FAQs',
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/faqs/new' as Href)}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        ),
      }}
    />
  );

  if (loading && items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        {header}
        <Text style={[styles.message, { color: colors.text }]}>Couldn't load FAQs.</Text>
        <Text style={[styles.detail, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={[styles.retry, { backgroundColor: colors.accent }]} onPress={refresh}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[styles.message, { color: colors.text }]}>No FAQs yet.</Text>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Tap Add to write the first one.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(`/faqs/${item.id}` as Href)}
          >
            <View style={styles.rowText}>
              <Text
                numberOfLines={2}
                style={[styles.question, { color: item.visible ? colors.text : colors.textSecondary }]}
              >
                {item.question}
              </Text>
              {!!item.category && (
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{item.category}</Text>
              )}
              {!item.visible && (
                <Text style={[styles.meta, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                  Hidden from students
                </Text>
              )}
            </View>
            <Switch
              value={item.visible}
              onValueChange={(value) => handleToggle(item, value)}
              trackColor={{ true: colors.accent, false: colors.border }}
              accessibilityLabel={`Show "${item.question}" to students`}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  rowText: { flex: 1 },
  question: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 3 },
  message: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  detail: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  retry: { marginTop: 16, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: '#071B2C', fontWeight: '700', fontSize: 15 },
});
