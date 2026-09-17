import { StyleSheet, Text, View } from 'react-native';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1F3A',
    borderRadius: 18,
    marginBottom: 16,
    padding: 20,
  },
  eyebrow: {
    color: '#F4C542',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: '#F4C542',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
