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

type Announcement = {
  id: string;
  databaseKey: 'Announcement ID' | 'announcement_id' | 'id';
  title: string;
  message: string;
  priority: string;
  postedBy: string;
};

export default function AnnouncementsScreen() {
  const { colors } = useTheme();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Load announcements from Supabase
  // ---------------------------------------------------------------------------

  const loadAnnouncements = useCallback(async () => {
    const { data, error } = await supabase
      .from('Announcement')
      .select('*');

    if (error) {
      console.error('Failed to load announcements:', error);
      Alert.alert('Error', 'Could not load announcements.');
      return;
    }

    console.log('Announcements from Supabase:', data);

    const mapped: Announcement[] = (data ?? []).map((row: any, index) => {
      const databaseKey = row['Announcement ID'] != null
        ? 'Announcement ID'
        : row.announcement_id != null
          ? 'announcement_id'
          : 'id';

      return {
      id: String(row[databaseKey] ?? index + 1),
      databaseKey,

      title: String(
        row.Title ??
          row.title ??
          '',
      ),

      message: String(
        row.Message ??
          row.message ??
          row.Description ??
          row.description ??
          '',
      ),

      priority: String(
        row['Priority level'] ??
          row.priority_level ??
          row.Priority ??
          row.priority ??
          'Normal',
      ),

      postedBy: String(
        row['Posted By'] ??
          row.posted_by ??
          row.postedBy ??
          '',
      ),
      };
    });

    setAnnouncements(mapped);
  }, []);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadAnnouncements();
      setLoading(false);
    };

    load();
  }, [loadAnnouncements]);

  // ---------------------------------------------------------------------------
  // Add announcement
  // ---------------------------------------------------------------------------

  const addAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter both a title and a message.',
      );
      return;
    }

    const { error } = await supabase
      .from('Announcement')
      .insert({
        Title: title.trim(),
        Message: message.trim(),
        'Priority level': priority.trim() || 'Normal',
      });

    if (error) {
      console.error('Failed to add announcement:', error);

      Alert.alert(
        'Error',
        `Could not add announcement.\n\n${error.message}`,
      );

      return;
    }

    setTitle('');
    setMessage('');
    setPriority('Normal');

    await loadAnnouncements();

    Alert.alert(
      'Success',
      'Announcement added successfully.',
    );
  };

  // ---------------------------------------------------------------------------
  // Delete announcement
  // ---------------------------------------------------------------------------

  const deleteAnnouncement = (announcement: Announcement) => {
    Alert.alert(
      'Delete announcement',
      `Delete "${announcement.title}"?`,
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
              .from('Announcement')
              .delete()
              .eq(announcement.databaseKey, announcement.id);

            if (error) {
              console.error(
                'Failed to delete announcement:',
                error,
              );

              Alert.alert(
                'Error',
                `Could not delete announcement.\n\n${error.message}`,
              );

              return;
            }

            await loadAnnouncements();
          },
        },
      ],
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={loadAnnouncements}

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
              Announcements
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Create, publish, and archive student announcements.
            </Text>

            {/* ------------------------------------------------------------- */}
            {/* FORM */}
            {/* ------------------------------------------------------------- */}

            <View style={styles.form}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Announcement title"
                placeholderTextColor={colors.textSecondary}
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
                value={message}
                onChangeText={setMessage}
                placeholder="Write an announcement"
                placeholderTextColor={colors.textSecondary}
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

              <TextInput
                value={priority}
                onChangeText={setPriority}
                placeholder="Priority"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              />

              <TouchableOpacity
                onPress={addAnnouncement}
                style={[
                  styles.addButton,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
              >
                <Text style={styles.addText}>
                  Add Announcement
                </Text>
              </TouchableOpacity>
            </View>

            {/* ------------------------------------------------------------- */}
            {/* PUBLISHED */}
            {/* ------------------------------------------------------------- */}

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Published Announcements
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
            No announcements yet.
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
              {/* TITLE */}

              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {item.title}
              </Text>

              {/* MESSAGE */}

              <Text
                style={[
                  styles.itemMessage,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {item.message}
              </Text>

              {/* PRIORITY */}

              <Text
                style={[
                  styles.priority,
                  {
                    color: colors.accent,
                  },
                ]}
              >
                Priority: {item.priority}
              </Text>

              {/* POSTED BY */}

              {item.postedBy !== '' && (
                <Text
                  style={[
                    styles.postedBy,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Posted: {item.postedBy}
                </Text>
              )}
            </View>

            {/* DELETE */}

            <TouchableOpacity
              onPress={() => deleteAnnouncement(item)}
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

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

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

  itemMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },

  priority: {
    fontSize: 12,
    fontWeight: '600',
  },

  postedBy: {
    fontSize: 11,
    marginTop: 4,
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