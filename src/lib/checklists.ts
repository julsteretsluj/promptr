import type { IconName } from '../components/Icon'
import type { Routine, Step } from '../types'
import type { ChecklistRow, Json } from './database.types'
import { CUSTOM_STORAGE_KEY } from '../data/presets'
import { supabase } from './supabase'

function parseSteps(steps: Json): Step[] {
  if (!Array.isArray(steps)) return []
  return steps.map((raw, i) => {
    const s = raw as { id?: string; label?: string; detail?: string }
    return {
      id: s.id || `step-${i}`,
      label: s.label || 'Step',
      detail: s.detail,
    }
  })
}

export function checklistToRoutine(row: ChecklistRow): Routine {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: (row.icon as IconName) || 'sparkle',
    color: row.color,
    steps: parseSteps(row.steps),
    isCustom: true,
  }
}

function saveLocalRoutine(routine: Routine): void {
  try {
    const existing = JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || '[]') as Routine[]
    const withoutDup = existing.filter((r) => r.id !== routine.id)
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([routine, ...withoutDup]))
  } catch {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([routine]))
  }
}

function removeLocalRoutine(id: string): void {
  try {
    const existing = JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || '[]') as Routine[]
    localStorage.setItem(
      CUSTOM_STORAGE_KEY,
      JSON.stringify(existing.filter((r) => r.id !== id)),
    )
  } catch {
    // ignore
  }
}

export async function fetchUserChecklists(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    // Fall back to device storage if cloud is unavailable / misconfigured
    console.warn('fetchUserChecklists failed, using localStorage:', error.message)
    return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || '[]') as Routine[]
  }
  return ((data || []) as ChecklistRow[]).map(checklistToRoutine)
}

export async function createChecklist(
  userId: string,
  routine: Omit<Routine, 'id'> & { id?: string },
): Promise<Routine> {
  const { data, error } = await supabase
    .from('checklists')
    .insert({
      user_id: userId,
      title: routine.title,
      description: routine.description,
      icon: routine.icon,
      color: routine.color,
      steps: routine.steps as unknown as Json,
    })
    .select()
    .single()

  if (error) {
    // Keep a local copy so the user does not lose their checklist
    const local: Routine = {
      id: routine.id || `custom-${crypto.randomUUID()}`,
      title: routine.title,
      description: routine.description,
      icon: routine.icon,
      color: routine.color,
      steps: routine.steps,
      isCustom: true,
    }
    saveLocalRoutine(local)
    const err = new Error(
      `${error.message} Saved on this device instead. In Supabase SQL Editor, run supabase/migrations/20260323000001_grants.sql`,
    )
    ;(err as Error & { localRoutine?: Routine }).localRoutine = local
    throw err
  }

  const saved = checklistToRoutine(data as ChecklistRow)
  saveLocalRoutine(saved)
  return saved
}

export async function archiveChecklist(id: string): Promise<void> {
  removeLocalRoutine(id)
  const { error } = await supabase.from('checklists').update({ archived: true }).eq('id', id)
  if (error) throw error
}

export function saveGuestChecklist(routine: Routine): void {
  saveLocalRoutine(routine)
}
