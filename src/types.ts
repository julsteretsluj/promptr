import type { IconName } from './components/Icon'

export type Step = {
  id: string
  label: string
  detail?: string
}

export type Routine = {
  id: string
  title: string
  description: string
  icon: IconName
  color: string
  steps: Step[]
  isCustom?: boolean
}

export type View =
  | { name: 'home' }
  | { name: 'auth' }
  | { name: 'builder'; routine?: Routine }
  | { name: 'plan' }
  | { name: 'profile' }
  | { name: 'reminders' }
  | { name: 'checklist'; routine: Routine; returnTo?: 'home' | 'plan' }
  | { name: 'done'; routine: Routine; returnTo?: 'home' | 'plan' }
