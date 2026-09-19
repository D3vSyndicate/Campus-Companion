import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'af', label: 'Afrikaans' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <View style={styles.row}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          onPress={() => i18n.changeLanguage(lang.code)}
          style={[
            styles.pill,
            i18n.language === lang.code && styles.pillActive,
          ]}>
          <Text
            style={[
              styles.pillText,
              i18n.language === lang.code && styles.pillTextActive,
            ]}>
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pillActive: {
    backgroundColor: '#f5a623',
    borderColor: '#f5a623',
  },
  pillText: {
    fontSize: 13,
    color: '#555',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});