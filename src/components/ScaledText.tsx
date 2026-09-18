import { Text as NativeText, StyleSheet, type TextProps } from 'react-native';
import { useAppearance } from '../context/AppearanceContext';

export function ScaledText({ style, ...props }: TextProps) {
  const { fontScale } = useAppearance();
  const flattenedStyle = StyleSheet.flatten(style);

  return (
    <NativeText
      {...props}
      style={[
        flattenedStyle,
        typeof flattenedStyle?.fontSize === 'number' && {
          fontSize: flattenedStyle.fontSize * fontScale,
        },
        typeof flattenedStyle?.lineHeight === 'number' && {
          lineHeight: flattenedStyle.lineHeight * fontScale,
        },
      ]}
    />
  );
}
