import { useCallback, useEffect, useState } from 'react';
import { useSegments } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';
import { ChipSelect } from '../ChipSelect';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';

type Group = { id: string; name: string; memberCount: number };
type Placement = { email: string; groupId: string; groupName: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The SQL functions raise plain-language messages; only a missing function needs translating.
function friendlyError(error: { code?: string; message: string }) {
  if (error.code === 'PGRST202' || error.code === '42883') {
    return 'This is not set up in the database yet. Run supabase/campus_features.sql in the Supabase SQL editor.';
  }
  return error.message;
}

// Coordinators and admins place FYS buddies in tribes by email, without touching SQL.
export function BuddyPlacement() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const segments = useSegments();

  const [groups, setGroups] = useState<Group[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [groupId, setGroupId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    const [groupResult, placementResult] = await Promise.all([
      supabase.from('community_groups').select('id, name, member_count').order('name'),
      supabase.rpc('list_tribe_buddies'),
    ]);

    if (groupResult.error) {
      setLoadError(friendlyError(groupResult.error));
    } else {
      setGroups(
        (groupResult.data ?? []).map((row) => ({
          id: String(row.id),
          name: String(row.name ?? ''),
          memberCount: Number(row.member_count ?? 0),
        })),
      );
    }

    if (placementResult.error) {
      setLoadError((current) => current || friendlyError(placementResult.error));
    } else {
      setPlacements(
        ((placementResult.data ?? []) as Record<string, unknown>[]).map((row) => ({
          email: String(row.email ?? ''),
          groupId: String(row.group_id ?? ''),
          groupName: String(row.group_name ?? ''),
        })),
      );
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const place = async () => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      Alert.alert('Almost there', "That email does not look right yet. Please check it and try again.");
      return;
    }
    if (!groupId) {
      Alert.alert('Almost there', 'Choose which tribe this buddy should join.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.rpc('assign_mentor_to_tribe', { mentor_email: trimmed, target_group: groupId });
    setBusy(false);

    if (error) {
      showToast(friendlyError(error), 'error');
      return;
    }
    showToast('Buddy placed in tribe');
    setEmail('');
    await load();
  };

  const remove = (placement: Placement) => {
    Alert.alert('Remove buddy', `Take ${placement.email} out of ${placement.groupName}? They will stop seeing that chat.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const { error } = await supabase.rpc('remove_mentor_from_tribe', { mentor_email: placement.email });
            if (error) {
              showToast(friendlyError(error), 'error');
              return;
            }
            showToast('Buddy removed from tribe');
            await load();
          })();
        },
      },
    ]);
  };

  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.accent}
          />
        }
      >
        <PageHeader
          eyebrow="Manage"
          title="Buddies"
          subtitle="Place FYS buddies in a tribe so they can chat with their first-years."
          showSearch={false}
          backHref={segments[0] === '(admin)' ? '/(admin)' : undefined}
        />
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Place an FYS buddy in a tribe so they can chat with their first-years. The buddy needs an account with the mentor role first.
          Placing them again in another tribe moves them.
        </Text>

        {loadError ? <Text style={[styles.error, { color: colors.danger }]}>{loadError}</Text> : null}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Buddy email</Text>
          <TextInput
            style={[styles.input, inputStyle]}
            value={email}
            onChangeText={setEmail}
            placeholder="buddy@mandela.ac.za"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={[styles.label, styles.gap, { color: colors.textSecondary }]}>Tribe</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} />
          ) : groups.length === 0 ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>No tribes yet. Create one under Tribes first.</Text>
          ) : (
            <ChipSelect
              wrap
              options={groups.map((group) => ({ value: group.id, label: `${group.name} (${group.memberCount})` }))}
              value={groupId}
              onChange={setGroupId}
            />
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }, busy && styles.disabled]}
            onPress={() => void place()}
            disabled={busy}
          >
            <Text style={styles.buttonText}>{busy ? 'Placing...' : 'Place buddy in tribe'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Placed buddies</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : placements.length === 0 ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>No buddies have been placed yet.</Text>
        ) : (
          placements.map((placement) => (
            <View key={`${placement.email}-${placement.groupId}`} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{placement.email}</Text>
                <Text style={[styles.description, styles.noMargin, { color: colors.textSecondary }]}>{placement.groupName}</Text>
              </View>
              <TouchableOpacity onPress={() => remove(placement)} accessibilityRole="button" accessibilityLabel={`Remove ${placement.email}`}>
                <Text style={[styles.remove, { color: colors.danger }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  noMargin: { marginBottom: 0 },
  error: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 16, marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  gap: { marginTop: 16 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#071B2C', fontWeight: '700', fontSize: 15 },
  disabled: { opacity: 0.6 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 14, marginBottom: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  remove: { fontSize: 13, fontWeight: '600' },
});
