import { Stack } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useTranslation } from 'react-i18next';

const SHAREABLE_URL =
  'https://cdn.botpress.cloud/webchat/v5.0/shareable.html?configUrl=https://files.bpcontent.cloud/2026/09/18/14/20260918140402-SI0TWA2K.json';

export default function ChatbotScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('common.support') }} />
      {Platform.OS === 'web' ? (
        <iframe
          src={SHAREABLE_URL}
          style={{ border: 0, width: '100%', height: '100%' }}
        />
      ) : (
        <WebView
          source={{ uri: SHAREABLE_URL }}
          style={styles.webView}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});