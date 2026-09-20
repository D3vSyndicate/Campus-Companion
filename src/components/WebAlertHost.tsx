import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { closeAlert, subscribeToAlerts, type AlertRequest } from '../lib/webAlert';
import { useTheme } from '../theme/ThemeContext';
import { ScaledText as Text } from './ScaledText';

// Draws the dialog for Alert.alert on the web (see lib/webAlert). Renders nothing on a phone.
export function WebAlertHost() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => subscribeToAlerts(setRequest), []);

  if (Platform.OS !== 'web' || !request) return null;

  const cancelable = request.options?.cancelable !== false;
  const dismiss = () => {
    closeAlert();
    request.options?.onDismiss?.();
  };
  const press = (index: number) => {
    const button = request.buttons[index];
    closeAlert();
    button?.onPress?.();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={cancelable ? dismiss : undefined}>
      <Pressable style={styles.backdrop} onPress={cancelable ? dismiss : undefined} accessibilityLabel={t('common.cancel')}>
        <Pressable
          accessibilityRole="alert"
          onPress={(event) => event.stopPropagation()}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">{request.title}</Text>
          {request.message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{request.message}</Text> : null}

          <View style={styles.buttons}>
            {request.buttons.map((button, index) => {
              const destructive = button.style === 'destructive';
              const cancel = button.style === 'cancel';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  onPress={() => press(index)}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: destructive ? '#C62828' : cancel ? colors.card : colors.accent,
                      borderColor: cancel ? colors.border : 'transparent',
                    },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: destructive ? '#FFFFFF' : cancel ? colors.text : '#071B2C' }]}>
                    {button.text ?? t('common.ok')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,27,44,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, borderRadius: 22, borderWidth: 1, padding: 20 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  message: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  buttons: { gap: 10, marginTop: 18 },
  button: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { fontSize: 15, fontWeight: '800' },
});
