import { Alert, Platform, type AlertButton, type AlertOptions } from 'react-native';

// react-native-web ships an Alert.alert that does nothing, so on the web every confirmation in the app
// (delete this, remove that member, log out) silently did nothing at all. This replaces it with a real
// dialog, drawn by <WebAlertHost /> in the root layout. On a phone the native alert is untouched.

export type AlertRequest = {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
};

type Listener = (request: AlertRequest | null) => void;

let nextId = 1;
let current: AlertRequest | null = null;
const waiting: AlertRequest[] = [];
const listeners = new Set<Listener>();

const publish = () => listeners.forEach((listener) => listener(current));

export const subscribeToAlerts = (listener: Listener) => {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
};

// Called by the host when a button is pressed or the dialog is dismissed.
export const closeAlert = () => {
  current = waiting.shift() ?? null;
  publish();
};

export function installWebAlert() {
  if (Platform.OS !== 'web') return;
  (Alert as { alert: typeof Alert.alert }).alert = (title, message, buttons, options) => {
    const request: AlertRequest = {
      id: nextId++,
      title,
      message,
      buttons: buttons && buttons.length ? buttons : [{ text: 'OK' }],
      options,
    };
    if (current) waiting.push(request);
    else {
      current = request;
      publish();
    }
  };
}
