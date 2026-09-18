import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import ListItemCard from '../../../components/ListItemCard';
import { ScaledText as Text } from '../../../components/ScaledText';
import { useContacts } from '../../../context/ContactsContext';
import { useTheme } from '../../../theme/ThemeContext';

export default function ContactsListScreen() {
  const { items, deleteItem } = useContacts();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/contacts/new')} style={styles.addButton}>
          <Text style={[styles.addButtonText, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, colors]);

  const confirmDelete = (id: string, fullName: string) => {
    Alert.alert('Delete contact', `Delete "${fullName}"? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem(id) },
    ]);
  };

  const sorted = [...items].sort((a, b) =>
    `${a.name} ${a.surname}`.localeCompare(`${b.name} ${b.surname}`)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No contacts yet. Tap + Add to create one.
          </Text>
        }
        renderItem={({ item }) => {
          const fullName = `${item.name} ${item.surname}`.trim();
          const subtitleDetails = [item.role, item.supportCategory].filter(Boolean).join(' · ');

          return (
            <ListItemCard
              title={fullName}
              subtitle={subtitleDetails || item.email}
              onPress={() => router.push(`/contacts/${item.id}`)}
              right={
                <TouchableOpacity onPress={() => confirmDelete(item.id, fullName)}>
                  <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
                </TouchableOpacity>
              }
            />
          );
        }}
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