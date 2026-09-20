import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function MentorTribe() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('common.tribe')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('mgm.tribeSubtitle')}
        </Text>
      </View>

      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => router.push('/mentorGroup/group')}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.accent },
          ]}
        >
          <Ionicons
            name="people-outline"
            size={28}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('mg.title')}
          </Text>

          <Text
            style={[
              styles.cardDescription,
              { color: colors.textSecondary },
            ]}
          >
            {t('mgm.groupsText')}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Future Tribe features can be added here */}

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
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
    marginRight: 10,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
});