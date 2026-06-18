import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '@hanapkalinga/shared/api';
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from './database.types';

const SecureStoreAdapter = Platform.select({
  native: {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  },
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
});

function createSupabaseClient() {
  try {
    const { url, anonKey } = getSupabaseConfig();

    if (!url || !anonKey) {
      console.warn('Supabase URL or Anon Key is missing. Auth will be unavailable.');
      return null;
    }

    return createClient<Database>(url, anonKey, {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Reduce network timeout for faster failures in test environments
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'hanapkalinga-mobile',
        },
      },
      // Set reasonable timeout for network requests to prevent hanging
      realtime: {
        timeout: 5000,
      },
    });
  } catch (e) {
    console.warn('Failed to create Supabase client:', e);
    return null;
  }
}

export const supabase = createSupabaseClient();
