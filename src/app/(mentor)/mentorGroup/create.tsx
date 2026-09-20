import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';

export default function CreateMentorGroup() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  // The same form edits a group when it is opened from that group's edit button, which passes an id.
  const { id: groupId } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(groupId);

  const [groupName, setGroupName] = useState('');
  const [programme, setProgramme] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('25');
  const [saving, setSaving] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(Boolean(groupId));

  useEffect(() => {
    if (!groupId) return;
    let active = true;

    void (async () => {
      const { data, error } = await supabase
        .from('mentor_groups')
        .select('name, programme, description, max_capacity')
        .eq('id', groupId)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        Alert.alert(t('mgm.loadFail'), error?.message ?? t('mgm.notFound'), [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
        return;
      }

      setGroupName(String(data.name ?? ''));
      setProgramme(String(data.programme ?? ''));
      setDescription(String(data.description ?? ''));
      setCapacity(String(data.max_capacity ?? '25'));
      setLoadingGroup(false);
    })();

    return () => {
      active = false;
    };
  }, [groupId, router]);

  const handleSave = async () => {
    if (!groupName.trim()) {
      Alert.alert(t('mgm.missing'), t('mgm.enterName'));
      return;
    }

    if (!programme.trim()) {
      Alert.alert(t('mgm.missing'), t('mgm.enterProgramme'));
      return;
    }

    const capacityNumber = Number(capacity);

    if (!capacity || Number.isNaN(capacityNumber) || capacityNumber <= 0) {
      Alert.alert(
        t('mgm.invalidCapacity'),
        t('mgm.enterCapacity')
      );
      return;
    }

    if (!user) {
      Alert.alert(t('mgm.signInRequired'), t('mgm.signInText'));
      return;
    }

    setSaving(true);

    if (groupId) {
      const { data, error } = await supabase
        .from('mentor_groups')
        .update({
          name: groupName.trim(),
          programme: programme.trim(),
          description: description.trim(),
          max_capacity: capacityNumber,
        })
        .eq('id', groupId)
        .select('id');
      setSaving(false);

      if (error) {
        Alert.alert(t('mgm.saveFail'), error.message);
        return;
      }

      // Row-level security skips groups that belong to someone else, so nothing comes back.
      if (!data?.length) {
        Alert.alert(t('mgm.saveFail'), t('mgm.onlyCreator'));
        return;
      }

      Alert.alert(t('mgm.updated'), t('mgm.saved'), [{ text: t('common.ok'), onPress: () => router.back() }]);
      return;
    }

    const { error } = await supabase.from('mentor_groups').insert({
      mentor_id: user.id,
      name: groupName.trim(),
      programme: programme.trim(),
      description: description.trim(),
      max_capacity: capacityNumber,
    });
    setSaving(false);

    if (error) {
      Alert.alert(t('mgm.createFail'), error.message);
      return;
    }

    Alert.alert(
      t('mgm.created'),
      t('mgm.createdText'),
      [
        {
          text: t('common.ok'),
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
            {editing ? t('mgm.editTitle') : t('mgm.createTitle')}
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            {editing ? t('mgm.editSub') : t('mgm.createSub')}
          </Text>
        </View>
      </View>

      {/* Group Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t('mgm.groupName')}
        </Text>

        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder={t('mgm.groupNameEg')}
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
          {t('mgm.programme')}
        </Text>

        <TextInput
          value={programme}
          onChangeText={setProgramme}
          placeholder={t('mgm.programmeEg')}
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
          {t('mgm.description')}
        </Text>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('mgm.descriptionEg')}
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
          {t('mgm.maxCapacity')}
        </Text>

        <Text style={[styles.helper, { color: colors.textSecondary }]}>
          {t('mgm.maxCapacityText')}
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
          {t('mgm.joinNote')}
        </Text>
      </View>

      {/* Create Button */}
      <Pressable
        style={[
          styles.createButton,
          { backgroundColor: colors.accent },
        ]}
        onPress={handleSave}
        disabled={saving || loadingGroup}
      >
        <Ionicons
          name="add-circle-outline"
          size={21}
          color="#FFFFFF"
        />

        <Text style={styles.createButtonText}>
          {saving ? (editing ? 'Saving...' : 'Creating...') : editing ? t('mgm.saveChanges') : t('mgm.createGroup')}
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