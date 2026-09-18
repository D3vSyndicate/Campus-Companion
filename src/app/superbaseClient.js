import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://lrubpqzdabhxvrjfgfiq.supabase.co';
const supabaseAnonKey = 'sb_publishable_ZLp4DaCusiOEeljy1GmXMw_q_jKw7P3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
