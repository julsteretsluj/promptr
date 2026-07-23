import type { Profile } from './database.types'
import { supabase } from './supabase'

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return (data as Profile | null) ?? null
}

export async function updateProfile(
  userId: string,
  patch: Partial<
    Pick<Profile, 'display_name' | 'timezone' | 'text_size' | 'accent' | 'reduce_motion' | 'home_layout'>
  >,
): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select().single()
  if (error) throw error
  return data as Profile
}

export function applyProfileToDocument(profile: Profile | null): void {
  const root = document.documentElement
  const size = profile?.text_size || 'large'
  root.dataset.textSize = size
  root.dataset.reduceMotion = profile?.reduce_motion ? 'true' : 'false'
  if (profile?.accent) {
    root.style.setProperty('--tint', profile.accent)
    root.style.setProperty('--tint-pressed', shade(profile.accent, -18))
  } else {
    root.style.setProperty('--tint', '#007AFF')
    root.style.setProperty('--tint-pressed', '#0066d6')
  }
}

function shade(hex: string, percent: number): string {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return hex
  const num = parseInt(cleaned, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(2.55 * percent)))
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(2.55 * percent)))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
