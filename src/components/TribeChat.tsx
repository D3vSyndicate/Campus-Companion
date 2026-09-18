import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { supabase } from '../lib/superbase';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

type TribeChatProps = {
  groupId: string;
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
  role: string;
  display_name: string;
  message_text: string;
  created_at: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function TribeChat({ groupId }: TribeChatProps) {
  const { colors } = useTheme();
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

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const loadChat = async () => {
      setLoading(true);
      setError('');

      try {
        if (!groupId) {
          throw new Error('Your mentor group has not been linked yet.');
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error('You must be logged in to use Tribe.');

        const [{ data: groupData, error: groupError }, { data: profileData, error: profileError }, { data: messageData, error: messageError }] = await Promise.all([
          supabase.from('community_groups').select('*').eq('id', groupId).single(),
          supabase.from('community_profiles').select('id, username').eq('auth_id', user.id).maybeSingle(),
          supabase
            .from('community_messages')
            .select('id, group_id, role, display_name, message_text, created_at')
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
          setError(getErrorMessage(loadError, 'Unable to load Tribe right now.'));
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
  }, [groupId]);

  const saveUsername = async () => {
    const cleanedUsername = username.trim();

    if (!/^[A-Za-z0-9_]{3,30}$/.test(cleanedUsername)) {
      setError('Use 3-30 letters, numbers, or underscores for your username.');
      return;
    }

    setSavingUsername(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('You must be logged in to save a username.');

      const query = profile
        ? supabase
            .from('community_profiles')
            .update({ username: cleanedUsername })
            .eq('auth_id', user.id)
            .select('id, username')
            .single()
        : supabase
            .from('community_profiles')
            .insert({ auth_id: user.id, username: cleanedUsername })
            .select('id, username')
            .single();

      const { data, error: profileError } = await query;
      if (profileError) {
        if (profileError.code === '23505') {
          throw new Error('That username is already taken. Try another one.');
        }
        throw profileError;
      }

      setProfile(data as Profile);
      setUsername((data as Profile).username);
      setEditingUsername(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Unable to save your username.'));
    } finally {
      setSavingUsername(false);
    }
  };

  const sendMessage = async () => {
    const cleanedMessage = input.trim();
    if (!cleanedMessage || !profile || sending) return;
    if (cleanedMessage.length > 1000) {
      setError('Messages can be up to 1,000 characters.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to send a message.');

      const { error: messageError } = await supabase.from('community_messages').insert({
        group_id: groupId,
        auth_id: user.id,
        message_text: cleanedMessage,
      });

      if (messageError) throw messageError;
      setInput('');
    } catch (sendError) {
      setError(getErrorMessage(sendError, 'Unable to send your message.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.accent} />
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading your Tribe...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centerState, { backgroundColor: colors.surface }]}>
        <View style={[styles.stateIcon, { backgroundColor: colors.card }]}>
          <Ionicons name="people-outline" size={26} color={colors.accent} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Your Tribe is almost ready</Text>
        <Text style={[styles.stateText, { color: colors.textSecondary }]}>{error || 'Your mentor group will appear here once it has been assigned.'}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={[styles.groupCard, { backgroundColor: colors.text }]}>
        <View style={[styles.groupIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name="people" size={22} color={colors.text} />
        </View>
        <View style={styles.groupCopy}>
          <Text style={[styles.groupLabel, { color: colors.accent }]}>YOUR TRIBE</Text>
          <Text style={[styles.groupName, { color: colors.surface }]} numberOfLines={1}>{group.name}</Text>
          <Text style={[styles.groupMeta, { color: colors.surface }]}>
            {group.mentor_name || 'Mentor group'}{group.member_count ? ` · ${group.member_count} members` : ''}
          </Text>
        </View>
      </View>

      {!profile || editingUsername ? (
        <View style={[styles.usernameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{profile ? 'Update your chat name' : 'Choose your chat name'}</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>Keep your real name, student number, and email private in the community.</Text>
          <View style={styles.usernameRow}>
            <TextInput
              style={[styles.usernameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. Thando_23"
              placeholderTextColor={colors.textSecondary}
              maxLength={30}
              autoCapitalize="none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={profile ? 'Update chat name' : 'Save chat name'}
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
          <Text style={[styles.identityText, { color: colors.textSecondary }]}>Chatting as <Text style={{ color: colors.text, fontWeight: '800' }}>{profile.username}</Text></Text>
          <Pressable onPress={() => setEditingUsername(true)} accessibilityRole="button">
            <Text style={[styles.changeText, { color: colors.text }]}>Change</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <FlatList
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        data={messages}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet. Start the conversation.</Text>}
        renderItem={({ item }) => {
          const isMentor = item.role === 'mentor';
          return (
            <View style={[styles.messageBubble, { backgroundColor: isMentor ? colors.text : colors.surface, borderColor: colors.border }, isMentor ? styles.mentorBubble : styles.studentBubble]}>
              <View style={styles.messageHeader}>
                <Text style={[styles.messageName, { color: isMentor ? colors.accent : colors.text }]}>{item.display_name}</Text>
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
          placeholder={profile ? 'Share something with your Tribe...' : 'Choose a chat name first...'}
          placeholderTextColor={colors.textSecondary}
          editable={Boolean(profile) && !sending}
          maxLength={1000}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
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
  groupCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 12 },
  groupIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  groupCopy: { flex: 1 },
  groupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  groupName: { fontSize: 18, fontWeight: '800', marginTop: 3 },
  groupMeta: { fontSize: 12, opacity: 0.68, marginTop: 3 },
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
});
