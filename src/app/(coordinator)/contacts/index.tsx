import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ListItemCard from '../../../components/ListItemCard';
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
        <TouchableOpacity
          onPress={() =>
            router.push('/(coordinator)/contacts/new' as any)
          }
          style={styles.addButton}
        >
          <Text
            style={[
              styles.addButtonText,
              { color: colors.accent },
            ]}
          >
            + Add
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete contact',
      `Delete "${name}"? This can't be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(id),
        },
      ],
    );
  };

  const sorted = [...items].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <FlatList
        data={sorted}
        keyExtractor={(item, index) =>
          `${item.id ?? 'contact'}-${index}`
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No contacts yet. Tap + Add to create one.
          </Text>
        }
        renderItem={({ item }) => (
          <ListItemCard
            title={item.name}
            subtitle={`${item.role} · ${item.email}`}
            onPress={() =>
              router.push(
                `/(coordinator)/contacts/${item.id}` as any,
              )
            }
            right={
              <TouchableOpacity
                onPress={() =>
                  confirmDelete(item.id, item.name)
                }
              >
                <Text
                  style={[
                    styles.deleteText,
                    {
                      color: colors.danger,
                    },
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    paddingVertical: 12,
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
  },

  addButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  deleteText: {
    fontSize: 13,
    fontWeight: '600',
  },
});