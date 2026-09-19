import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { TribeChat } from '../../components/TribeChat';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/superbase';
import { useTheme } from '../../theme/ThemeContext';

export default function TribeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;

  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Puts the student into a tribe the first time (and returns their tribe every time after).
  useEffect(() => {
    if (!userId) return;
    let active = true;

    void (async () => {
      const { data, error: rpcError } = await supabase.rpc('join_my_tribe');
      if (!active) return;

      if (rpcError) {
        console.error('Failed to join a tribe.', rpcError);
        setError('Tribe is still being set up. Please check again soon.');
      } else {
        setGroupId(data ? String(data) : null);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loading} />
      ) : (
        <TribeChat groupId={groupId ?? ''} setupMessage={error} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loading: { marginTop: 40 },
});
