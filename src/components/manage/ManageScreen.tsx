import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';
import { ChipSelect } from '../ChipSelect';
import { ScaledText as Text } from '../ScaledText';
import type { FieldConfig, LookupLabels, ManageConfig, Row } from './types';

const NO_PERMISSION =
  'You do not have permission to do that. Check that your account has the coordinator or admin role.';

// Turns a Supabase/PostgREST error into something a coordinator can act on.
function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return 'This section is not set up in the database yet. Run supabase/campus_features.sql in the Supabase SQL editor.';
  }

  if (error.code === '42501') return NO_PERMISSION;

  return error.message;
}

function toFormValues(
  config: ManageConfig,
  row?: Row,
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};

  for (const field of config.fields) {
    const raw = row?.[field.key];

    if (raw === undefined || raw === null) {
      values[field.key] =
        field.type === 'boolean'
          ? typeof field.default === 'boolean'
            ? field.default
            : true
          : field.default !== undefined
            ? String(field.default)
            : '';
    } else if (field.type === 'boolean') {
      values[field.key] = raw === true || raw === 'true';
    } else if (field.type === 'time') {
      values[field.key] = String(raw).slice(0, 5);
    } else {
      values[field.key] = String(raw);
    }
  }

  return values;
}

export function ManageScreen({ config }: { config: ManageConfig }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [rows, setRows] = useState<Row[]>([]);
  const [lookups, setLookups] = useState<
    Record<string, { value: string; label: string }[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');

    let query = supabase.from(config.table).select('*');

    for (const order of config.orderBy ?? []) {
      query = query.order(order.column, {
        ascending: order.ascending ?? true,
      });
    }

    const lookupQueries = (config.lookups ?? []).map((lookup) =>
      supabase
        .from(lookup.table)
        .select(`${lookup.valueColumn}, ${lookup.labelColumn}`)
        .order(lookup.labelColumn),
    );

    const [rowsResult, ...lookupResults] = await Promise.all([
      query,
      ...lookupQueries,
    ]);

    if (rowsResult.error) {
      setLoadError(friendlyError(rowsResult.error));
      setRows([]);
    } else {
      setRows((rowsResult.data ?? []) as Row[]);
    }

    const nextLookups: Record<
      string,
      { value: string; label: string }[]
    > = {};

    (config.lookups ?? []).forEach((lookup, index) => {
      const data = (lookupResults[index]?.data ?? []) as unknown as Row[];

      nextLookups[lookup.fieldKey] = data.map((row) => ({
        value: String(row[lookup.valueColumn]),
        label: String(row[lookup.labelColumn] ?? ''),
      }));
    });

    setLookups(nextLookups);
  }, [config]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const lookupLabels: LookupLabels = useMemo(() => {
    const labels: LookupLabels = {};

    for (const [fieldKey, options] of Object.entries(lookups)) {
      labels[fieldKey] = Object.fromEntries(
        options.map((option) => [option.value, option.label]),
      );
    }

    return labels;
  }, [lookups]);

  const idOf = (row: Row) => String(row[config.pk]);

  const openForm = (row: Row | 'new') => {
    setValues(toFormValues(config, row === 'new' ? undefined : row));
    setEditing(row);
  };

  // Returns the row to save, or a message explaining what still needs attention.
  const buildPayload = (): Row | string => {
    const payload: Row = {};

    for (const field of config.fields) {
      const value = values[field.key];

      if (field.type === 'boolean') {
        payload[field.key] = Boolean(value);
        continue;
      }

      const text = String(value ?? '').trim();

      if (!text) {
        if (field.required) {
          return `${field.label} is needed before you can save.`;
        }

        payload[field.key] = field.type === 'number' ? 0 : null;
      } else if (field.type === 'number') {
        const parsed = Number.parseInt(text, 10);

        if (Number.isNaN(parsed)) {
          return `${field.label} should be a number.`;
        }

        payload[field.key] = parsed;
      } else if (field.type === 'decimal') {
        const parsed = Number.parseFloat(text);
        if (Number.isNaN(parsed)) return `${field.label} should be a number, like -34.0091.`;
        payload[field.key] = parsed;
      } else if (field.type === 'time') {
        if (!/^\d{1,2}:\d{2}$/.test(text)) {
          return `${field.label} should look like 09:00.`;
        }

        payload[field.key] = text;
      } else {
        payload[field.key] = text;
      }
    }

    return payload;
  };

  const save = async () => {
    const payload = buildPayload();

    if (typeof payload === 'string') {
      Alert.alert('Almost there', payload);
      return;
    }

    setSaving(true);

    try {
      if (editing === 'new') {
        const extras =
          config.onCreate?.({
            email: user?.email ?? '',
          }) ?? {};

        const { data, error } = await supabase
          .from(config.table)
          .insert({
            ...payload,
            ...extras,
          })
          .select()
          .single();

        if (error) {
          showToast(friendlyError(error), 'error');
          return;
        }

        setRows((current) => [...current, data as Row]);

        showToast(`${config.itemNoun} added`);
      } else if (editing) {
        const { data, error } = await supabase
          .from(config.table)
          .update(payload)
          .eq(config.pk, idOf(editing))
          .select();

        if (error) {
          showToast(friendlyError(error), 'error');
          return;
        }

        // Row-level security silently filters out rows you may not change.
        if (!data?.length) {
          showToast(NO_PERMISSION, 'error');
          return;
        }

        setRows((current) =>
          current.map((row) =>
            idOf(row) === idOf(editing)
              ? (data[0] as Row)
              : row,
          ),
        );

        showToast(`${config.itemNoun} updated`);
      }

      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: Row) => {
    const name = config.listTitle(row, lookupLabels);

    Alert.alert(
      `Delete ${config.itemNoun.toLowerCase()}`,
      `Delete "${name}"? This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { data, error } = await supabase
                .from(config.table)
                .delete()
                .eq(config.pk, idOf(row))
                .select();

              if (error) {
                showToast(friendlyError(error), 'error');
                return;
              }

              if (!data?.length) {
                showToast(NO_PERMISSION, 'error');
                return;
              }

              setRows((current) =>
                current.filter(
                  (entry) => idOf(entry) !== idOf(row),
                ),
              );

              setEditing(null);

              showToast(`${config.itemNoun} deleted`);
            })();
          },
        },
      ],
    );
  };

  const optionsFor = (field: FieldConfig) => {
    if (field.lookupOptions) {
      return lookups[field.key] ?? [];
    }

    const base = [...(field.options ?? [])];

    if (!field.allowCustom) {
      return base;
    }

    // Also offer values already used in the table (trimmed) so categories stay consistent.
    const known = new Set(
      base.map((option) => option.value.toLowerCase()),
    );

    for (const row of rows) {
      const used = String(row[field.key] ?? '').trim();

      if (used && !known.has(used.toLowerCase())) {
        known.add(used.toLowerCase());
        base.push({
          value: used,
          label: used,
        });
      }
    }

    return base;
  };

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  };

  // Form ---------------------------------------------------------------------

  if (editing) {
    const isNew = editing === 'new';
    const noun = config.itemNoun.toLowerCase();

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {isNew ? `New ${noun}` : `Edit ${noun}`}
          </Text>

          {config.fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {field.label}
                {field.required ? ' *' : ''}
              </Text>

              {field.type === 'boolean' ? (
                <Switch
                  value={Boolean(values[field.key])}
                  onValueChange={(next) =>
                    setValues((current) => ({
                      ...current,
                      [field.key]: next,
                    }))
                  }
                  trackColor={{
                    true: colors.accent,
                    false: colors.border,
                  }}
                />
              ) : (
                <>
                  {field.type === 'select' ? (
                    <View
                      style={
                        field.allowCustom
                          ? styles.chipGap
                          : undefined
                      }
                    >
                      <ChipSelect
                        wrap
                        options={optionsFor(field)}
                        value={String(values[field.key] ?? '')}
                        onChange={(next) =>
                          setValues((current) => ({
                            ...current,
                            [field.key]: next,
                          }))
                        }
                      />
                    </View>
                  ) : null}

                  {field.type !== 'select' || field.allowCustom ? (
                    <TextInput
                      style={[
                        styles.input,
                        field.type === 'multiline' &&
                          styles.multiline,
                        inputStyle,
                      ]}
                      value={String(values[field.key] ?? '')}
                      onChangeText={(next) =>
                        setValues((current) => ({
                          ...current,
                          [field.key]: next,
                        }))
                      }
                      placeholder={
                        field.type === 'select'
                          ? 'Or type your own'
                          : field.placeholder
                      }
                      placeholderTextColor={
                        colors.textSecondary
                      }
                      multiline={field.type === 'multiline'}
<<<<<<< HEAD
                      keyboardType={
                        field.type === 'number'
                          ? 'number-pad'
                          : 'default'
                      }
                      autoCapitalize={
                        /url|link|email/.test(field.key) ||
                        field.type === 'time'
                          ? 'none'
                          : 'sentences'
                      }
=======
                      keyboardType={field.type === 'number' ? 'number-pad' : field.type === 'decimal' ? 'numbers-and-punctuation' : 'default'}
                      autoCapitalize={/url|link|email/.test(field.key) || field.type === 'time' ? 'none' : 'sentences'}
>>>>>>> bb7fc8fa76ed6fffff3ccd33d4723df4e0d3f021
                    />
                  ) : null}
                </>
              )}

              {field.help ? (
                <Text
                  style={[
                    styles.help,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {field.help}
                </Text>
              ) : null}
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.accent,
              },
              saving && styles.disabled,
            ]}
            onPress={() => void save()}
            disabled={saving}
          >
            <Text style={styles.primaryText}>
              {saving
                ? 'Saving...'
                : isNew
                  ? `Add ${noun}`
                  : 'Save changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setEditing(null)}
            disabled={saving}
          >
            <Text
              style={[
                styles.secondaryText,
                {
                  color: colors.text,
                },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          {!isNew ? (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => remove(editing)}
              disabled={saving}
            >
              <Text
                style={[
                  styles.secondaryText,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                Delete {noun}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // List ---------------------------------------------------------------------

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
        data={rows}
        keyExtractor={idOf}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              {config.title}
            </Text>

            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {config.description}
            </Text>

            {loadError ? (
              <Text
                style={[
                  styles.error,
                  {
                    color: colors.danger,
                  },
                ]}
              >
                {loadError}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => openForm('new')}
            >
              <Text style={styles.primaryText}>
                + Add {config.itemNoun.toLowerCase()}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.accent}
              style={styles.empty}
            />
          ) : loadError ? null : (
            <Text
              style={[
                styles.emptyText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Nothing here yet. Tap + Add{' '}
              {config.itemNoun.toLowerCase()} to create the first one.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const subtitle = config.listSubtitle?.(
            item,
            lookupLabels,
          );

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Main card area */}
              <TouchableOpacity
                style={styles.cardPressable}
                onPress={() => openForm(item)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color: colors.text,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {config.listTitle(item, lookupLabels)}
                  </Text>

                  {subtitle ? (
                    <Text
                      style={[
                        styles.cardSubtitle,
                        {
                          color: colors.textSecondary,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              {/* Delete button is now a sibling, NOT inside another button */}
              <TouchableOpacity
                onPress={() => remove(item)}
                accessibilityRole="button"
                accessibilityLabel="Delete"
              >
                <Text
                  style={[
                    styles.delete,
                    {
                      color: colors.danger,
                    },
                  ]}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },

  error: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },

  empty: {
    marginTop: 24,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  cardPressable: {
    flex: 1,
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  delete: {
    fontSize: 13,
    fontWeight: '600',
  },

  formContent: {
    padding: 16,
    paddingBottom: 48,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  help: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },

  chipGap: {
    marginBottom: 8,
  },

  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },

  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },

  primaryText: {
    color: '#071B2C',
    fontWeight: '700',
    fontSize: 15,
  },

  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.6,
  },
});