import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export type StaffSection = {
  href: string;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function tap() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function ManagementCard({
  section,
  onPress,
}: {
  section: StaffSection;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.managementCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && styles.managementCardPressed,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: colors.headerBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name={section.icon} size={23} color={colors.accent} />
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {section.label}
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
          {section.desc}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

type Props = {
  sections: StaffSection[];
  // Big name in the hero card, for example "Coordinator".
  roleTitle: string;
  description: string;
  statusText: string;
  sectionTitle: string;
  footerText: string;
  profileHref: string;
};

// The dashboard for every staff role. Coordinator and head of department share it so the two areas
// look and behave the same; each supplies its own sections and wording.
export function StaffDashboard({ sections, roleTitle, description, statusText, sectionTitle, footerText, profileHref }: Props) {
  const { colors } = useTheme();
  const router = useRouter();

  const openSection = (href: string) => {
    tap();
    router.push(href as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.headerBackground, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <Image
            source={require('../../assets/images/coordinator-hero.png')}
            style={styles.heroBackgroundImage}
            contentFit="fill"
            contentPosition="center"
            transition={0}
          />
          <LinearGradient
            colors={['rgba(4, 19, 29, 0.08)', 'rgba(4, 19, 29, 0.12)', 'rgba(4, 19, 29, 0.22)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.heroOverlay}
          />
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBrand}>
              <View style={styles.brandIcon}>
                <Ionicons name="school-outline" size={22} color={colors.accent} />
              </View>

              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>SCHOOL OF IT</Text>
                <Text style={[styles.brandText, { color: colors.headerText }]}>Campus Companion</Text>
              </View>
            </View>

            <Pressable
              onPress={() => openSection(profileHref)}
              style={[styles.profileButton, { borderColor: colors.border }]}
            >
              <Ionicons name="person-outline" size={18} color={colors.headerText} />
            </Pressable>
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.greeting, { color: colors.accent }]}>Welcome back</Text>
            <Text style={[styles.heroTitle, { color: colors.headerText }]}>{roleTitle}</Text>
            <Text style={[styles.heroDescription, { color: colors.headerText }]}>{description}</Text>
          </View>

          <View style={[styles.statusPill, { borderColor: colors.border }]}> 
            <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.statusText, { color: colors.headerText }]}>{statusText}</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.accent} />
          </View>
        </LinearGradient>

        {/* Section heading */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.accent }]}>MANAGEMENT</Text>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{sectionTitle}</Text>
          </View>

          <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countNumber, { color: colors.text }]}>{sections.length}</Text>
            <Text style={[styles.countLabel, { color: colors.textSecondary }]}>tools</Text>
          </View>
        </View>

        {/* Management grid */}
        <View style={styles.grid}>
          {sections.map((section) => (
            <View key={section.href} style={styles.gridItem}>
              <ManagementCard
                section={section}
                onPress={() => openSection(section.href)}
              />
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.footerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.footerTitle, { color: colors.text }]}>Campus Companion</Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{footerText}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  hero: {
    minHeight: 270,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 22,
    shadowColor: '#071B2C',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    position: 'relative',
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 1,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.05)',
    right: -75,
    top: -70,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(248,167,5,0.06)',
    right: 30,
    bottom: -60,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,167,5,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(248,167,5,0.24)',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
  },
  heroContent: {
    marginTop: 38,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.72,
    maxWidth: 330,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 25,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.85,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  countBadge: {
    minWidth: 52,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  managementCard: {
    minHeight: 146,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  managementCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 4,
  },
  footerLine: {
    width: 55,
    height: 1,
    marginBottom: 12,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerText: {
    fontSize: 10,
    marginTop: 3,
  },
});