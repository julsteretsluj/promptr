import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const placeholderKey =
  !anonKey ||
  anonKey.includes('your_anon_key') ||
  anonKey.includes('YOUR_') ||
  anonKey.length < 20

export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes('YOUR_PROJECT') && !placeholderKey,
)

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
