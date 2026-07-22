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
  | { name: 'builder' }
  | { name: 'checklist'; routine: Routine }
  | { name: 'done'; routine: Routine }
