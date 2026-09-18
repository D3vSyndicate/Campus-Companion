import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './superbase';

export async function fetchWithOfflineFallback(tableName) {
  try {
    if (supabase) {
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && Array.isArray(data)) {
        await AsyncStorage.setItem(`cache_${tableName}`, JSON.stringify(data));
        return { data, fromCache: false };
      }
    }
  } catch (e) {
    console.log('Online fetch failed, trying cache', e);
  }

  try {
    const cached = await AsyncStorage.getItem(`cache_${tableName}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { data: Array.isArray(parsed) ? parsed : [], fromCache: true };
    }
  } catch (e) {
    console.log('Cache read failed', e);
  }

  return { data: [], fromCache: true };
}