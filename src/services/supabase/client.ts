import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or persistent storage
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('careerpilot_supabase_url') || '' : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('careerpilot_supabase_anon_key') || '' : '';

export const getSupabaseConfig = () => {
  const url = envUrl && !envUrl.includes('your_supabase_url') ? envUrl : storedUrl;
  const key = envKey && !envKey.includes('your_supabase_anon_key') ? envKey : storedKey;
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

  localStorage.setItem('careerpilot_supabase_url', url.trim());
  localStorage.setItem('careerpilot_supabase_anon_key', anonKey.trim());

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
  localStorage.removeItem('careerpilot_supabase_url');
  localStorage.removeItem('careerpilot_supabase_anon_key');
  supabase = null;
  isConfigured = false;
}
