import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

type Venue = {
  id: string;
  venueName: string;
  building: string;
  roomNumber: string;
  directions: string;
};

export default function VenueScreen() {
  const { colors } = useTheme();

  const [venues, setVenues] = useState<Venue[]>([]);

  const [venueName, setVenueName] = useState('');
  const [building, setBuilding] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [directions, setDirections] = useState('');

  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------------
  // Load venues from Supabase
  // ------------------------------------------------------------

  const loadVenues = useCallback(async () => {
    const { data, error } = await supabase
      .from('Venue')
      .select(
        'venue_id, venue_name, building, room_number, directions',
      )
      .order('venue_name', { ascending: true });

    if (error) {
      console.error('Failed to load venues:', error);

      Alert.alert(
        'Error',
        'Could not load venue information.',
      );

      return;
    }

    const mapped: Venue[] = (data ?? []).map((row) => ({
      id: String(row.venue_id),
      venueName: String(row.venue_name ?? ''),
      building: String(row.building ?? ''),
      roomNumber: String(row.room_number ?? ''),
      directions: String(row.directions ?? ''),
    }));

    setVenues(mapped);
  }, []);

  // ------------------------------------------------------------
  // Initial load
  // ------------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      await loadVenues();

      setLoading(false);
    };

    load();
  }, [loadVenues]);

  // ------------------------------------------------------------
  // Add venue
  // ------------------------------------------------------------

  const addVenue = async () => {
    if (
      !venueName.trim() ||
      !building.trim() ||
      !roomNumber.trim() ||
      !directions.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please complete all venue fields.',
      );

      return;
    }

    const { error } = await supabase
      .from('Venue')
      .insert({
        venue_name: venueName.trim(),
        building: building.trim(),
        room_number: roomNumber.trim(),
        directions: directions.trim(),
      });

    if (error) {
      console.error('Failed to add venue:', error);

      Alert.alert(
        'Error',
        `Could not add venue.\n\n${error.message}`,
      );

      return;
    }

    // Clear form
    setVenueName('');
    setBuilding('');
    setRoomNumber('');
    setDirections('');

    // Reload list
    await loadVenues();

    Alert.alert(
      'Success',
      'Venue added successfully.',
    );
  };

  // ------------------------------------------------------------
  // Delete venue
  // ------------------------------------------------------------

  const deleteVenue = (venue: Venue) => {
    Alert.alert(
      'Delete venue',
      `Delete "${venue.venueName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            const { error } = await supabase
              .from('Venue')
              .delete()
              .eq('venue_id', venue.id);

            if (error) {
              console.error(
                'Failed to delete venue:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete venue.\n\n${error.message}`,
              );

              return;
            }

            await loadVenues();
          },
        },
      ],
    );
  };

  // ------------------------------------------------------------
  // Screen
  // ------------------------------------------------------------

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
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={loadVenues}

        ListHeaderComponent={
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              Venue Information
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Publish rooms, directions, maps, and accessibility
              information.
            </Text>

            {/* ------------------------------------------------ */}
            {/* Form */}
            {/* ------------------------------------------------ */}

            <View style={styles.form}>
              <TextInput
                value={venueName}
                onChangeText={setVenueName}
                placeholder="Venue name"
                placeholderTextColor={
                  colors.textSecondary
                }
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TextInput
                value={building}
                onChangeText={setBuilding}
                placeholder="Building"
                placeholderTextColor={
                  colors.textSecondary
                }
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TextInput
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="Room number"
                placeholderTextColor={
                  colors.textSecondary
                }
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TextInput
                value={directions}
                onChangeText={setDirections}
                placeholder="Directions"
                placeholderTextColor={
                  colors.textSecondary
                }
                multiline
                style={[
                  styles.messageInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={addVenue}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text style={styles.addText}>
                  Add Venue
                </Text>
              </TouchableOpacity>
            </View>

            {/* ------------------------------------------------ */}
            {/* Published venues */}
            {/* ------------------------------------------------ */}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Published Venues
            </Text>
          </View>
        }

        ListEmptyComponent={
          <Text
            style={[
              styles.empty,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            No venues yet.
          </Text>
        }

        renderItem={({ item }) => (
          <View
            style={[
              styles.item,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.itemContent}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {item.venueName}
              </Text>

              <Text
                style={[
                  styles.itemDetails,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.building} • Room {item.roomNumber}
              </Text>

              <Text
                style={[
                  styles.itemDirections,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.directions}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteVenue(item)}
            >
              <Text
                style={[
                  styles.removeText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },

  form: {
    marginBottom: 24,
  },

  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
  },

  messageInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  addButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  addText: {
    color: '#071B2C',
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  item: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },

  itemDetails: {
    fontSize: 14,
    marginBottom: 6,
  },

  itemDirections: {
    fontSize: 13,
    lineHeight: 19,
  },

  removeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
  },
});