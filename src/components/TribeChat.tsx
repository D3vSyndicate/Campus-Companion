import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import i18n from '../i18n';
import { supabase } from '../lib/superbase';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type TribeChatProps = {
  groupId: string;
  // Shown instead of the default text when no tribe could be loaded.
  setupMessage?: string;
};

type Group = {
  id: string;
  name: string;
  mentor_name?: string | null;
  member_count?: number | null;
};

type Profile = {
  id: string;
  username: string;
};

type Message = {
  id: string;
  group_id: string;
  auth_id?: string | null;
  role: string;
  display_name: string;
  message_text: string;
  created_at: string;
};

// What a new member agrees to before they can choose a chat name. The wording is in the translation files,
// under tribe.conduct.<key>.
const CONDUCT_POINTS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'heart-outline', key: 'respect' },
  { icon: 'hand-left-outline', key: 'bully' },
  { icon: 'chatbubble-ellipses-outline', key: 'swear' },
  { icon: 'lock-closed-outline', key: 'private' },
  { icon: 'eye-outline', key: 'watched' },
];

// An error whose message is already written for the student. Any other error is a technical one, and the
// student sees a kind, general message instead of its raw text.
class FriendlyError extends Error {}

export function TribeChat({ groupId, setupMessage = '' }: TribeChatProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [group, setGroup] = useState<Group | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [error, setError] = useState('');
  const [myId, setMyId] = useState('');
  // A new member has to accept the code of conduct before they can choose a chat name.
  const [conductAccepted, setConductAccepted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadChat = async () => {
      setLoading(true);
      setError('');

      try {
        if (!groupId) {
          throw new FriendlyError(setupMessage || i18n.t('tribe.almostReadyText'));
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error('You must be logged in to use Tribe.');
        if (active) setMyId(user.id);

        const [{ data: groupData, error: groupError }, { data: profileData, error: profileError }, { data: messageData, error: messageError }] = await Promise.all([
          supabase.from('community_groups').select('*').eq('id', groupId).single(),
          supabase.from('community_profiles').select('id, username').eq('auth_id', user.id).maybeSingle(),
          supabase
            .from('community_messages')
            .select('id, group_id, auth_id, role, display_name, message_text, created_at')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true }),
        ]);

        if (groupError) throw groupError;
        if (profileError) throw profileError;
        if (messageError) throw messageError;
        if (!active) return;

        setGroup(groupData as Group);
        setProfile(profileData as Profile | null);
        setUsername(profileData?.username ?? '');
        setMessages((messageData ?? []) as Message[]);

        channel = supabase
          .channel(`community-chat-${groupId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'community_messages',
              filter: `group_id=eq.${groupId}`,
            },
            (payload) => {
              const nextMessage = payload.new as Message;
              setMessages((current) =>
                current.some((message) => message.id === nextMessage.id)
                  ? current
                  : [...current, nextMessage],
              );
            },
          )
          .subscribe();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof FriendlyError ? loadError.message : i18n.t('tribe.errors.loadFailed'));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadChat();

    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [groupId, setupMessage]);

  const saveUsername = async () => {
    const cleanedUsername = username.trim();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(cleanedUsername)) {
      setError(i18n.t('tribe.errors.nameRule'));
      return;
    }

    setSavingUsername(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('not signed in');

      const createProfile = (withConduct: boolean) =>
        supabase
          .from('community_profiles')
          .insert(
            withConduct
              ? { auth_id: user.id, username: cleanedUsername, conduct_accepted_at: new Date().toISOString() }
              : { auth_id: user.id, username: cleanedUsername },
          )
          .select('id, username')
          .single();

      let result = profile
        ? await supabase
            .from('community_profiles')
            .update({ username: cleanedUsername })
            .eq('auth_id', user.id)
            .select('id, username')
            .single()
        : await createProfile(true);

      // The database records that the code of conduct was accepted. If it has not been set up to do that yet
      // (supabase/setup_all.sql not run), the app has still asked for the promise, so do not stop the chat name.
      if (!profile && result.error && /conduct_accepted_at/.test(result.error.message)) {
        result = await createProfile(false);
      }

      const { data, error: profileError } = result;
      if (profileError) {
        if (profileError.code === '23505') {
          throw new FriendlyError(i18n.t('tribe.errors.nameTaken'));
        }
        throw profileError;
      }

      setProfile(data as Profile);
      setUsername((data as Profile).username);
      setEditingUsername(false);
    } catch (saveError) {
      setError(saveError instanceof FriendlyError ? saveError.message : i18n.t('tribe.errors.saveFailed'));
    } finally {
      setSavingUsername(false);
    }
  };

  const sendMessage = async () => {
    const cleanedMessage = input.trim();
    if (!cleanedMessage || !profile || sending) return;
    if (cleanedMessage.length > 1000) {
      setError(i18n.t('tribe.errors.tooLong'));
      return;
    }

    setSending(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('not signed in');

      const { error: messageError } = await supabase.from('community_messages').insert({
        group_id: groupId,
        auth_id: user.id,
        message_text: cleanedMessage,
      });

      if (messageError) throw messageError;
      setInput('');
    } catch (sendError) {
      setError(i18n.t('tribe.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>{t('tribe.loading')}</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.surface }]}>
        <View style={[styles.stateIcon, { backgroundColor: colors.card }]}>
          <Ionicons name="people-outline" size={26} color={colors.accent} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.text }]}>{t('tribe.almostReady')}</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>{error || t('tribe.almostReadyText')}</Text>
      </View>
    );
  }

  const needsConduct = !profile && !conductAccepted;
  const ink = isDark ? '#0E2A40' : '#071B2C';

  // Tapping the accent button (or anywhere on it) opens the mentor groups: find one, or scan its QR code.
  const header = (
    <View style={[styles.hero, { backgroundColor: ink, marginTop: insets.top }]}>
      <View style={styles.heroTop}>
        <View style={[styles.groupIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="people" size={22} color="#071B2C" />
        </View>
        <View style={styles.groupCopy}>
          <Text style={[styles.groupLabel, { color: colors.accent }]}>{t('tribe.yourTribe')}</Text>
          <Text style={styles.heroName} numberOfLines={1}>{group.name}</Text>
          <Text style={styles.heroMeta}>
            {group.mentor_name || t('tribe.mentorGroup')}{group.member_count ? ` · ${t('tribe.members', { count: group.member_count })}` : ''}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('tribe.findGroupsLabel')}
        onPress={() => router.push('/(student)/mentorGroups/groups' as never)}
        style={({ pressed }) => [styles.findGroups, { backgroundColor: colors.accent }, pressed && styles.pressed]}
      >
        <Ionicons name="search" size={18} color="#071B2C" />
        <View style={styles.findCopy}>
          <Text style={styles.findTitle}>{t('tribe.findGroups')}</Text>
          <Text style={styles.findSub}>{t('tribe.findGroupsSub')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#071B2C" />
      </Pressable>
    </View>
  );

  if (needsConduct) {
    return (
      <View style={styles.container}>
        {header}
        <ScrollView contentContainerStyle={styles.conductScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.conductCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.conductHead}>
              <View style={[styles.conductIcon, { backgroundColor: colors.card }]}>
                <Ionicons name="shield-checkmark" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.conductTitle, { color: colors.text }]} accessibilityRole="header">
                {t('tribe.conduct.title')}
              </Text>
            </View>

            <Text style={[styles.conductIntro, { color: colors.textSecondary }]}>{t('tribe.conduct.intro')}</Text>

            {CONDUCT_POINTS.map((point) => (
              <View key={point.key} style={styles.conductRow}>
                <Ionicons name={point.icon} size={19} color={colors.accent} style={styles.conductRowIcon} />
                <Text style={[styles.conductText, { color: colors.text }]}>{t(`tribe.conduct.${point.key}`)}</Text>
              </View>
            ))}

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              accessibilityLabel={t('tribe.conduct.agree')}
              onPress={() => setAgreed((current) => !current)}
              style={[styles.agreeRow, { borderColor: agreed ? colors.accent : colors.border, backgroundColor: colors.card }]}
            >
              <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={24} color={agreed ? colors.accent : colors.textSecondary} />
              <Text style={[styles.agreeText, { color: colors.text }]}>{t('tribe.conduct.agree')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('tribe.conduct.continue')}
              accessibilityState={{ disabled: !agreed }}
              disabled={!agreed}
              onPress={() => setConductAccepted(true)}
              style={[styles.continueButton, { backgroundColor: colors.accent }, !agreed && styles.disabled]}
            >
              <Text style={styles.continueText}>{t('tribe.conduct.continue')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#071B2C" />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {header}

      {(profile ? editingUsername : conductAccepted) ? (
        <View style={[styles.usernameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{profile ? t('tribe.updateName') : t('tribe.chooseName')}</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>{t('tribe.keepPrivate')}</Text>
          <View style={styles.usernameRow}>
            <TextInput
              style={[styles.usernameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder={t('tribe.namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              maxLength={30}
              autoCapitalize="none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={profile ? t('tribe.updateName') : t('tribe.saveName')}
              style={[styles.saveButton, { backgroundColor: colors.accent }, savingUsername && styles.disabled]}
              onPress={() => void saveUsername()}
              disabled={savingUsername}
            >
              {savingUsername ? <ActivityIndicator color={colors.text} /> : <Ionicons name="arrow-forward" size={19} color={colors.text} />}
            </Pressable>
          </View>
        </View>
      ) : null}

      {profile && !editingUsername ? (
        <View style={[styles.identityStrip, { backgroundColor: colors.card }]}>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.accent} />
          <Text style={[styles.identityText, { color: colors.textSecondary }]}>{t('tribe.chattingAs')} <Text style={{ color: colors.text, fontWeight: '800' }}>{profile.username}</Text></Text>
          <Pressable onPress={() => setEditingUsername(true)} accessibilityRole="button">
            <Text style={[styles.changeText, { color: colors.text }]}>{t('tribe.change')}</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <FlatList
        ref={listRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('tribe.noMessages')}</Text>}
        renderItem={({ item }) => {
          const isMentor = item.role === 'mentor';
          const isMine = Boolean(myId) && item.auth_id === myId;
          return (
            <View style={[styles.messageBubble, { backgroundColor: isMentor ? colors.text : isMine ? colors.card : colors.surface, borderColor: isMine ? colors.accent : colors.border }, isMine ? styles.studentBubble : styles.mentorBubble]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.messageName, { color: isMentor ? colors.accent : colors.text }]}>{isMine ? `${item.display_name} (${t('tribe.you')})` : item.display_name}</Text>
                <Text style={[styles.messageTime, { color: isMentor ? colors.surface : colors.textSecondary }]}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={[styles.messageText, { color: isMentor ? colors.surface : colors.text }]}>{item.message_text}</Text>
            </View>
          );
        }}
      />

      <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.messageInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={input}
          onChangeText={setInput}
          placeholder={profile ? t('tribe.messagePlaceholder') : t('tribe.chooseFirst')}
          placeholderTextColor={colors.textSecondary}
          editable={Boolean(profile) && !sending}
          maxLength={1000}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tribe.send')}
          style={[styles.sendButton, { backgroundColor: colors.accent }, (!profile || !input.trim() || sending) && styles.disabled]}
          onPress={() => void sendMessage()}
          disabled={!profile || !input.trim() || sending}
        >
          {sending ? <ActivityIndicator color={colors.text} /> : <Ionicons name="send" size={18} color={colors.text} />}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  stateIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stateTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateText: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  hero: { borderRadius: 24, padding: 16, marginBottom: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  groupIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  groupCopy: { flex: 1 },
  groupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroName: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 3 },
  heroMeta: { color: '#FFFFFF', fontSize: 12, opacity: 0.7, marginTop: 3 },
  findGroups: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  findCopy: { flex: 1 },
  findTitle: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
  findSub: { color: '#071B2C', fontSize: 11, opacity: 0.75, marginTop: 1 },
  conductScroll: { paddingBottom: 24 },
  conductCard: { borderWidth: 1, borderRadius: 20, padding: 18 },
  conductHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conductIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  conductTitle: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  conductIntro: { fontSize: 13, lineHeight: 20, marginTop: 12, marginBottom: 6 },
  conductRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  conductRowIcon: { marginTop: 1 },
  conductText: { flex: 1, fontSize: 13, lineHeight: 19 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 18 },
  agreeText: { flex: 1, fontSize: 13, fontWeight: '700' },
  continueButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 14, marginTop: 12 },
  continueText: { color: '#071B2C', fontSize: 14, fontWeight: '800' },
  usernameCard: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionText: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  usernameInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 14 },
  saveButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  identityStrip: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 },
  identityText: { flex: 1, fontSize: 12, marginLeft: 7 },
  changeText: { fontSize: 12, fontWeight: '800' },
  error: { fontSize: 12, lineHeight: 17, marginVertical: 6 },
  messageList: { flex: 1 },
  messageContent: { paddingVertical: 8, flexGrow: 1, justifyContent: 'flex-end' },
  emptyText: { fontSize: 13, textAlign: 'center', padding: 24 },
  messageBubble: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 8, maxWidth: '92%' },
  mentorBubble: { alignSelf: 'flex-start', borderTopLeftRadius: 5 },
  studentBubble: { alignSelf: 'flex-end', borderTopRightRadius: 5 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  messageName: { fontSize: 11, fontWeight: '800', marginRight: 14 },
  messageTime: { fontSize: 10 },
  messageText: { fontSize: 13, lineHeight: 19 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', borderTopWidth: 1, paddingTop: 10, paddingBottom: 6 },
  messageInput: { flex: 1, maxHeight: 100, minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingTop: 11, paddingBottom: 10, fontSize: 13 },
  sendButton: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },
});
