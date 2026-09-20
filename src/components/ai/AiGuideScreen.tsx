import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { INTEGRITY, TOOL_NOTES, USE_CASES, type AiUseCase } from '../../data/ai-tools';
import { useTheme } from '../../theme/ThemeContext';
import { PageHeader } from '../PageHeader';
import { ScaledText as Text } from '../ScaledText';
import { useTranslation } from 'react-i18next';

// "Using AI for your studies" — organised by the problem a student actually has, because nobody
// opens this wondering which model is best. They open it at 23:00 with code that will not run.

export function AiGuideScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState<string | null>(USE_CASES[0]?.id ?? null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow={t('ai.eyebrow')}
          title={t('ai.title')}
          subtitle={t('ai.subtitle')}
          showSearch={false}
          showBack
          backFallback="/(student)"
        />

        {/* The rule that matters most goes first, not buried at the bottom. */}
        <View style={[styles.banner, { backgroundColor: colors.accent }]}>
          <Ionicons name="warning-outline" size={20} color="#071B2C" />
          <Text style={styles.bannerText}>
            {t('ai.rule')}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('ai.whatDo')}
        </Text>

        {USE_CASES.map((useCase) => (
          <UseCaseCard
            key={useCase.id}
            useCase={useCase}
            expanded={open === useCase.id}
            onToggle={() => setOpen(open === useCase.id ? null : useCase.id)}
          />
        ))}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('ai.whichTool')}
        </Text>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t('ai.whichToolText')}
        </Text>

        {TOOL_NOTES.map((tool) => (
          <View
            key={tool.name}
            style={[styles.tool, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.toolName, { color: colors.text }]}>{tool.name}</Text>
            <Text style={[styles.toolFor, { color: colors.textSecondary }]}>{tool.shapedFor}</Text>
          </View>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('ai.before')}
        </Text>

        {INTEGRITY.map((rule) => (
          <View
            key={rule.title}
            style={[styles.rule, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
            <View style={styles.ruleCopy}>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>{rule.title}</Text>
              <Text style={[styles.ruleBody, { color: colors.textSecondary }]}>{rule.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function UseCaseCard({
  useCase,
  expanded,
  onToggle,
}: {
  useCase: AiUseCase;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={useCase.task}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardEmoji}>{useCase.emoji}</Text>
        <Text style={[styles.cardTask, { color: colors.text }]}>{useCase.task}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </View>

      {expanded ? (
        <View style={styles.cardBody}>
          <Block label={t('ai.suits')} body={useCase.suits} />
          <Block label={t('ai.howAsk')} body={useCase.howToAsk} quoted />
          <Block label={t('ai.watchOut')} body={useCase.watchOut} warning />
        </View>
      ) : null}
    </Pressable>
  );
}

function Block({
  label,
  body,
  quoted = false,
  warning = false,
}: {
  label: string;
  body: string;
  quoted?: boolean;
  warning?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.block}>
      <Text
        style={[styles.blockLabel, { color: warning ? colors.danger : colors.textSecondary }]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.blockBody,
          { color: colors.textSecondary },
          quoted && [styles.quoted, { borderLeftColor: colors.accent }],
        ]}
      >
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 16, padding: 16 },
  bannerText: { flex: 1, color: '#071B2C', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 18,
  },
  intro: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 20 },
  cardTask: { flex: 1, fontSize: 14, fontWeight: '800', lineHeight: 20 },
  cardBody: { marginTop: 14, gap: 14 },
  block: { gap: 5 },
  blockLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  blockBody: { fontSize: 13, lineHeight: 19 },
  quoted: { borderLeftWidth: 3, paddingLeft: 12, fontStyle: 'italic' },
  tool: { borderRadius: 14, borderWidth: 1, padding: 14 },
  toolName: { fontSize: 14, fontWeight: '800' },
  toolFor: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  rule: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  ruleCopy: { flex: 1 },
  ruleTitle: { fontSize: 13, fontWeight: '800' },
  ruleBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },
});
