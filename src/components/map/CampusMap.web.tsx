import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { buildMapHtml } from './mapHtml';
import type { CampusMapHandle, CampusMapProps, MapCommand } from './types';

// Browser version: the same map page inside an iframe, driven with window messages.
export const CampusMap = forwardRef<CampusMapHandle, CampusMapProps>(function CampusMap(
  { places, theme, initialCampus, onSelect, onBlank, onStatus, style },
  ref,
) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<MapCommand[]>([]);
  const firstPlaces = useRef(true);
  const firstTheme = useRef(true);

  const html = useMemo(
    () => buildMapHtml({ places, theme, campus: initialCampus }),
    // Built once on purpose: later changes reach the map by message, so the page is not reloaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const post = (command: MapCommand) => {
    frameRef.current?.contentWindow?.postMessage({ cc: true, ...command }, '*');
  };

  const send = useCallback((command: MapCommand) => {
    if (!readyRef.current) {
      queueRef.current.push(command);
      return;
    }
    frameRef.current?.contentWindow?.postMessage({ cc: true, ...command }, '*');
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

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      // Only listen to our own map frame.
      if (event.source !== frameRef.current?.contentWindow) return;
      const message = event.data as { cc?: boolean; type?: string; id?: string; value?: 'offline' } | undefined;
      if (!message || !message.cc) return;

      if (message.type === 'ready') {
        readyRef.current = true;
        queueRef.current.forEach(post);
        queueRef.current = [];
        onStatus?.('ready');
      } else if (message.type === 'status' && message.value) {
        onStatus?.(message.value);
      } else if (message.type === 'select' && message.id) {
        onSelect(message.id);
      } else if (message.type === 'blank') {
        onBlank();
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onSelect, onBlank, onStatus]);

  return (
    <View style={[styles.container, style]}>
      <iframe
        ref={frameRef}
        title="Campus map"
        srcDoc={html}
        sandbox="allow-scripts"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
