import type { IconName } from '../components/Icon'
import type { Routine, Step } from '../types'
import type { ChecklistRow, Json } from './database.types'
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

export async function fetchUserChecklists(userId: string): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (error) throw error
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

  if (error) throw error
  return checklistToRoutine(data as ChecklistRow)
}

export async function archiveChecklist(id: string): Promise<void> {
  const { error } = await supabase.from('checklists').update({ archived: true }).eq('id', id)
  if (error) throw error
}
