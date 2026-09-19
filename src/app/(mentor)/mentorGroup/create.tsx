import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/superbase';
import { useTheme } from '../../../theme/ThemeContext';

export default function CreateMentorGroup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [groupName, setGroupName] = useState('');
  const [programme, setProgramme] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('25');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing information', 'Please enter a group name.');
      return;
    }

    if (!programme.trim()) {
      Alert.alert('Missing information', 'Please enter a programme.');
      return;
    }

    const capacityNumber = Number(capacity);

    if (!capacity || Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      Alert.alert(
        'Invalid capacity',
        'Please enter a valid maximum group capacity.'
      );
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in before creating a mentor group.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('mentor_groups').insert({
      mentor_id: user.id,
      name: groupName.trim(),
      programme: programme.trim(),
      description: description.trim(),
      max_capacity: capacityNumber,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Could not create group', error.message);
      return;
    }

    Alert.alert(
      'Group created',
      'Your mentor group is ready. Students can now find it or scan its QR code.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
            ]}
          >
            Create Mentor Group
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            Create a group for your students.
          </Text>
        </View>
      </View>

      {/* Group Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Group Name
        </Text>

        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder="e.g. Software Development Group"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Programme */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Programme
        </Text>

        <TextInput
          value={programme}
          onChangeText={setProgramme}
          placeholder="e.g. Software Development"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Description
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe what this mentor group is for..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Capacity */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          Maximum Capacity
        </Text>

        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          Maximum number of students allowed in this group.
        </Text>

        <TextInput
          value={capacity}
          onChangeText={setCapacity}
          placeholder="25"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </View>

      {/* Info */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.accent}
        />

        <Text
          style={[
            styles.infoText,
            { color: colors.textSecondary },
          ]}
        >
          Students will need to request to join your group.
          You can approve or reject requests from the group
          management screen.
        </Text>
      </View>

      {/* Create Button */}
      <Pressable
        style={[
          styles.createButton,
          { backgroundColor: colors.accent },
        ]}
        onPress={handleCreate}
        disabled={saving}
      >
        <Ionicons
          name="add-circle-outline"
          size={21}
          color="#FFFFFF"
        />

        <Text style={styles.createButtonText}>
          {saving ? 'Creating...' : 'Create Group'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  inputGroup: {
    marginBottom: 22,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  helper: {
    fontSize: 12,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 15,
  },

  textArea: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingTop: 14,
    fontSize: 15,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 10,
  },

  createButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});