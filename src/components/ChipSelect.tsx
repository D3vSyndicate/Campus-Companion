import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

export type ChipOption = { value: string; label: string };

type Props = {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  // Wrap onto several lines instead of scrolling sideways (better for forms).
  wrap?: boolean;
  // Tapping the selected chip again clears the value.
  clearable?: boolean;
};

export function ChipSelect({ options, value, onChange, wrap = false, clearable = false }: Props) {
  const { colors } = useTheme();

  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <TouchableOpacity
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(selected && clearable ? '' : option.value)}
        style={[
          styles.chip,
          { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : colors.card },
        ]}
      >
        <Text style={[styles.label, { color: selected ? '#071B2C' : colors.text }]}>{option.label}</Text>
      </TouchableOpacity>
    );
  });

  if (wrap) return <View style={[styles.row, styles.wrap]}>{chips}</View>;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  wrap: { flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  label: { fontSize: 13, fontWeight: '600' },
});
