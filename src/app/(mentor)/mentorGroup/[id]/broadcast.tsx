import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { PageHeader } from '../../../../components/PageHeader';
import { ScaledText as Text } from '../../../../components/ScaledText';
import { Loading, MgButton, MgScreen, Panel, PriorityBadge, SectionLabel } from '../../../../components/mentorgroups/parts';
import { useToast } from '../../../../context/ToastContext';
import { postedLabel } from '../../../../lib/announcements';
import { deleteNote, fetchNotes, isMissingSetup, postNote, type GroupNote, type Priority } from '../../../../lib/mentorGroups';
import { useTheme } from '../../../../theme/ThemeContext';

const PRIORITIES: { value: Priority; key: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'normal', key: 'mgm.priorityNormal', icon: 'chatbubble-outline' },
  { value: 'important', key: 'mgm.priorityImportant', icon: 'alert-circle-outline' },
  { value: 'urgent', key: 'mgm.priorityUrgent', icon: 'warning-outline' },
];

// A mentor's announcements to their group. Students in the group read them; they cannot reply.
export default function MentorGroupBroadcast() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState<GroupNote[] | undefined>(undefined);

  const load = useCallback(async () => {
    if (!id) return setNotes([]);
    const { notes: list } = await fetchNotes(id);
    setNotes(list);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const send = async () => {
    if (!id) return;
    if (!title.trim()) return void Alert.alert(t('mgm.missingTitle'), t('mgm.enterTitle'));
    if (!message.trim()) return void Alert.alert(t('mgm.missingMessage'), t('mgm.enterMessage'));

    setSending(true);
    const { error } = await postNote(id, title.trim(), message.trim(), priority);
    setSending(false);

    if (error) {
      Alert.alert(t('mgm.saveFail'), isMissingSetup(error) ? t('mgm.notSetUp') : error.message);
      return;
    }
    setTitle('');
    setMessage('');
    setPriority('normal');
    showToast(t('mgm.broadcastSentText'), 'success');
    await load();
  };

  const remove = (note: GroupNote) => {
    Alert.alert(t('cal.removeTitle'), t('cal.removeText', { title: note.title }), [
      { text: t('cal.keep'), style: 'cancel' },
      {
        text: t('mgm.remove'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const { error } = await deleteNote(note.id);
            if (error) showToast(error.message, 'error');
            await load();
          })();
        },
      },
    ]);
  };

  const inputStyle = [styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }];

  return (
    <MgScreen>
      <PageHeader eyebrow={t('mgm.broadcast')} title={t('mgm.groupBroadcast')} subtitle={t('mgm.broadcastIntro')} showSearch={false} />

      <Panel style={styles.form}>
        <View style={styles.field}>
          <SectionLabel>{t('mgm.title')}</SectionLabel>
          <TextInput value={title} onChangeText={setTitle} placeholder={t('mgm.titleEg')} placeholderTextColor={colors.textSecondary} style={inputStyle} maxLength={120} />
        </View>

        <View style={styles.field}>
          <SectionLabel>{t('mgm.message')}</SectionLabel>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={t('mgm.messageEg')}
            placeholderTextColor={colors.textSecondary}
            style={[inputStyle, styles.multiline]}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        <View style={styles.field}>
          <SectionLabel>{t('mgm.priority')}</SectionLabel>
          <View style={styles.chips}>
            {PRIORITIES.map((option) => {
              const active = priority === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setPriority(option.value)}
                  style={[styles.chip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : 'transparent' }]}
                >
                  <Ionicons name={option.icon} size={15} color={active ? '#071B2C' : colors.textSecondary} />
                  <Text style={[styles.chipText, { color: active ? '#071B2C' : colors.text }]}>{t(option.key)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <MgButton label={t('mgm.sendBroadcast')} icon="send-outline" busy={sending} onPress={() => void send()} />
        <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mgm.readOnlyNote')}</Text>
      </Panel>

      <SectionLabel>{t('mgm.previous')}</SectionLabel>
      {notes === undefined ? (
        <Loading />
      ) : notes.length === 0 ? (
        <Text style={[styles.foot, { color: colors.textSecondary }]}>{t('mg.noBroadcasts')}</Text>
      ) : (
        notes.map((note) => (
          <Panel key={note.id} style={styles.note}>
            <View style={styles.noteHead}>
              <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
              <PriorityBadge priority={note.priority} />
              <Pressable accessibilityRole="button" accessibilityLabel={t('mgm.remove')} onPress={() => remove(note)} style={styles.trash}>
                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[styles.small, { color: colors.textSecondary }]}>{postedLabel(note.createdAt)}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{note.message}</Text>
          </Panel>
        ))
      )}
    </MgScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  field: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 48 },
  multiline: { minHeight: 120 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 40 },
  chipText: { fontSize: 13, fontWeight: '700' },
  foot: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  note: { gap: 6 },
  noteHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  trash: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  small: { fontSize: 12 },
  body: { fontSize: 14, lineHeight: 21 },
});
