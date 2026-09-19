import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ListItemCard from '../../../components/ListItemCard';
import { useSchedule } from '../../../context/ScheduleContext';
import { useToast } from '../../../context/ToastContext';
import { useTheme } from '../../../theme/ThemeContext';

export default function ScheduleListScreen() {
  const { items, deleteItem } = useSchedule();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/(coordinator)/schedule/new' as any)} style={styles.addButton}>
          <Text style={[styles.addButtonText, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete item', `Delete "${title}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteItem(id).then((failure) => failure && showToast(failure, 'error')) },
    ]);
  };

  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No schedule items yet. Tap + Add to create one.
          </Text>
        }
        renderItem={({ item }) => (
          <ListItemCard
            title={item.title}
            subtitle={`${item.date} · ${item.time} · ${item.location}`}
            onPress={() => router.push(`/(coordinator)/schedule/${item.id}` as any)}
            right={
              <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)}>
                <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingVertical: 12 },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  addButton: { paddingHorizontal: 8, paddingVertical: 4 },
  addButtonText: { fontSize: 16, fontWeight: '600' },
  deleteText: { fontSize: 13, fontWeight: '600' },
});
