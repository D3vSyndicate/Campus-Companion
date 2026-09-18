import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './superbase';

export async function fetchWithOfflineFallback(tableName) {
  let remoteError = null;

  try {
    const { data, error } = await supabase.from(tableName).select('*');
    if (!error && Array.isArray(data)) {
      await AsyncStorage.setItem(`cache_${tableName}`, JSON.stringify(data));
      return { data, fromCache: false, error: null };
    }

    remoteError = error ?? new Error(`Supabase returned invalid data for ${tableName}.`);
  } catch (error) {
    remoteError = error;
  }

  try {
    const cached = await AsyncStorage.getItem(`cache_${tableName}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        data: Array.isArray(parsed) ? parsed : [],
        fromCache: true,
        error: remoteError,
      };
    }
  } catch (error) {
    console.error(`Failed to read cached ${tableName} data.`, error);
  }

  return { data: [], fromCache: true, error: remoteError };
}