import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildMapHtml } from './mapHtml';
import type { CampusMapHandle, CampusMapProps, MapCommand, MapEvent } from './types';

// Phone version: the map page runs inside a WebView. (See CampusMap.web.tsx for the browser version.)
export const CampusMap = forwardRef<CampusMapHandle, CampusMapProps>(function CampusMap(
  { places, theme, initialCampus, onSelect, onBlank, onStatus, style },
  ref,
) {
  const webViewRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<MapCommand[]>([]);
  const firstPlaces = useRef(true);
  const firstTheme = useRef(true);

  // Built once. Later changes reach the page as commands, so the map never reloads or flickers.
  const html = useMemo(
    () => buildMapHtml({ places, theme, campus: initialCampus }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const send = useCallback((command: MapCommand) => {
    if (!readyRef.current) {
      queueRef.current.push(command);
      return;
    }
    webViewRef.current?.injectJavaScript(`window.__ccHandle && window.__ccHandle(${JSON.stringify(command)}); true;`);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focusPlace: (id) => send({ cmd: 'focus', id }),
      showCampus: (id) => send({ cmd: 'campus', id }),
      showRoute: (coords) => send({ cmd: 'route', coords }),
      clearRoute: () => send({ cmd: 'clearRoute' }),
      setVisible: (ids) => send({ cmd: 'visible', ids }),
      setInsets: (top, bottom) => send({ cmd: 'insets', top, bottom }),
      zoom: (delta) => send({ cmd: 'zoom', delta }),
      clearSelection: () => send({ cmd: 'clear' }),
      fitAll: () => send({ cmd: 'fitAll' }),
    }),
    [send],
  );

  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false;
      return;
    }
    send({ cmd: 'theme', value: theme });
  }, [theme, send]);

  useEffect(() => {
    if (firstPlaces.current) {
      firstPlaces.current = false;
      return;
    }
    send({ cmd: 'places', places });
  }, [places, send]);

  const handleMessage = (event: WebViewMessageEvent) => {
    let message: MapEvent;
    try {
      message = JSON.parse(event.nativeEvent.data) as MapEvent;
    } catch {
      return;
    }

    if (message.type === 'ready') {
      readyRef.current = true;
      queueRef.current.forEach((command) =>
        webViewRef.current?.injectJavaScript(`window.__ccHandle && window.__ccHandle(${JSON.stringify(command)}); true;`),
      );
      queueRef.current = [];
      onStatus?.('ready');
    } else if (message.type === 'status') {
      onStatus?.(message.value);
    } else if (message.type === 'select') {
      onSelect(message.id);
    } else if (message.type === 'blank') {
      onBlank();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled={false}
        setSupportMultipleWindows={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        style={styles.webView}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
