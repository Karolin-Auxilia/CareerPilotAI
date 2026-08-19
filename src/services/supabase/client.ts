import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Connection credentials come from environment configuration, never browser storage.
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let runtimeUrl = envUrl;
let runtimeKey = envKey;

export const getSupabaseConfig = () => {
  const url = runtimeUrl && !runtimeUrl.includes('your_supabase_url') ? runtimeUrl : '';
  const key = runtimeKey && !runtimeKey.includes('your_supabase_anon_key') ? runtimeKey : '';
  const configured = Boolean(url && key && url.startsWith('https://'));
  return { url, key, configured };
};

let currentConfig = getSupabaseConfig();

export let isConfigured = currentConfig.configured;

export let supabase: SupabaseClient | null = isConfigured
  ? createClient(currentConfig.url, currentConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function updateSupabaseCredentials(url: string, anonKey: string): boolean {
  if (!url || !anonKey || !url.startsWith('https://')) {
    return false;
  }

  runtimeUrl = url.trim();
  runtimeKey = anonKey.trim();

  supabase = createClient(url.trim(), anonKey.trim(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  isConfigured = true;
  return true;
}

export function clearSupabaseCredentials() {
  runtimeUrl = '';
  runtimeKey = '';
  supabase = null;
  isConfigured = false;
}
