import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastType = 'success' | 'error' | 'info';

type ToastState = {
  message: string;
  type: ToastType;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.container}>
          <View style={[styles.toast, styles[`${toast.type}Toast`]]}>
            <Text style={styles.message}>{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 48,
    alignItems: 'center',
  },
  toast: {
    maxWidth: '100%',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#1F9D55',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  successToast: {
    backgroundColor: '#1F9D55',
  },
  errorToast: {
    backgroundColor: '#C0392B',
  },
  infoToast: {
    backgroundColor: '#2563EB',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});