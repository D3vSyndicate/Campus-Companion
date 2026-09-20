import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useTheme } from '../../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

type Priority = 'normal' | 'important' | 'urgent';

export default function BroadcastScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [sending, setSending] = useState(false);

  const sendBroadcast = () => {
    if (!title.trim()) {
      Alert.alert(t('mgm.missingTitle'), t('mgm.enterTitle'));
      return;
    }

    if (!message.trim()) {
      Alert.alert(t('mgm.missingMessage'), t('mgm.enterMessage'));
      return;
    }

    setSending(true);

    // Temporary - Supabase will be connected later
    setTimeout(() => {
      setSending(false);

      Alert.alert(
        t('mgm.broadcastSent'),
        t('mgm.broadcastSentText'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setTitle('');
              setMessage('');
              setPriority('normal');
            },
          },
        ]
      );
    }, 500);
  };

  const priorityOptions: {
    value: Priority;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      value: 'normal',
      label: t('mgm.priorityNormal'),
      icon: 'chatbubble-outline',
    },
    {
      value: 'important',
      label: t('mgm.priorityImportant'),
      icon: 'alert-circle-outline',
    },
    {
      value: 'urgent',
      label: t('mgm.priorityUrgent'),
      icon: 'warning-outline',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('mgm.broadcast')}
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {t('mgm.broadcastSub')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="megaphone-outline"
            size={24}
            color={colors.accent}
          />

          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              {t('mgm.groupBroadcast')}
            </Text>

            <Text
              style={[
                styles.infoDescription,
                { color: colors.textSecondary },
              ]}
            >
              {t('mgm.broadcastIntro')}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t('mgm.title')}
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('mgm.titleEg')}
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

        {/* Message */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t('mgm.message')}
        </Text>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t('mgm.messageEg')}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          style={[
            styles.messageInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />

        {/* Priority */}
        <Text style={[styles.label, { color: colors.text }]}>
          {t('mgm.priority')}
        </Text>

        <View style={styles.priorityContainer}>
          {priorityOptions.map((option) => {
            const selected = priority === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setPriority(option.value)}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: selected
                      ? colors.accent
                      : colors.surface,
                    borderColor: selected
                      ? colors.accent
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={
                    selected
                      ? colors.background
                      : colors.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.priorityText,
                    {
                      color: selected
                        ? colors.background
                        : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Send Button */}
        <Pressable
          onPress={sendBroadcast}
          disabled={sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.accent,
              opacity: sending ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name="send-outline"
            size={20}
            color={colors.background}
          />

          <Text
            style={[
              styles.sendButtonText,
              { color: colors.background },
            ]}
          >
            {sending ? 'Sending...' : t('mgm.sendBroadcast')}
          </Text>
        </Pressable>

        {/* Previous Broadcasts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('mgm.previous')}
        </Text>

        <View
          style={[
            styles.broadcastCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.broadcastHeader}>
            <View style={styles.broadcastTitleRow}>
              <Ionicons
                name="megaphone-outline"
                size={20}
                color={colors.accent}
              />

              <Text
                style={[
                  styles.broadcastTitle,
                  { color: colors.text },
                ]}
              >
                Welcome to the group
              </Text>
            </View>

            <Text
              style={[
                styles.broadcastDate,
                { color: colors.textSecondary },
              ]}
            >
              Today
            </Text>
          </View>

          <Text
            style={[
              styles.broadcastMessage,
              { color: colors.textSecondary },
            ]}
          >
            Welcome everyone! We are excited to have you in the
            mentor group.
          </Text>

          <View
            style={[
              styles.priorityBadge,
              { borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.priorityBadgeText,
                { color: colors.textSecondary },
              ]}
            >
              {t('mgm.priorityNormal')}
            </Text>
          </View>
        </View>

        {/* Student restriction */}
        <View
          style={[
            styles.noteCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.textSecondary}
          />

          <Text
            style={[
              styles.noteText,
              { color: colors.textSecondary },
            ]}
          >
            {t('mgm.readOnlyNote')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },

  backButton: {
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },

  infoDescription: {
    fontSize: 13,
    lineHeight: 19,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 18,
  },

  messageInput: {
    minHeight: 130,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    fontSize: 14,
    marginBottom: 18,
  },

  priorityContainer: {
    gap: 10,
    marginBottom: 24,
  },

  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
  },

  priorityText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  sendButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },

  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  broadcastCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },

  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  broadcastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  broadcastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  broadcastDate: {
    fontSize: 12,
    marginLeft: 8,
  },

  broadcastMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },

  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },
});