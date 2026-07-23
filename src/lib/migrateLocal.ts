import { CUSTOM_STORAGE_KEY } from '../data/presets'
import type { Routine } from '../types'
import { createChecklist } from './checklists'

const MIGRATED_KEY = 'promptr-local-migrated'

export function loadLocalCustomRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Routine[]
  } catch {
    return []
  }
}

export function clearLocalCustomRoutines(): void {
  localStorage.removeItem(CUSTOM_STORAGE_KEY)
}

export async function migrateLocalChecklistsIfNeeded(userId: string): Promise<number> {
  if (localStorage.getItem(MIGRATED_KEY) === userId) return 0
  const local = loadLocalCustomRoutines()
  if (local.length === 0) {
    localStorage.setItem(MIGRATED_KEY, userId)
    return 0
  }

  let migrated = 0
  for (const routine of local) {
    try {
      await createChecklist(userId, {
        title: routine.title,
        description: routine.description,
        icon: routine.icon,
        color: routine.color,
        steps: routine.steps,
        isCustom: true,
      })
      migrated += 1
    } catch {
      // continue remaining
    }
  }

  clearLocalCustomRoutines()
  localStorage.setItem(MIGRATED_KEY, userId)
  return migrated
}
