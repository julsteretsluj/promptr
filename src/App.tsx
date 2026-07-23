import { useState } from 'react'
import { AuthScreen } from './components/AuthScreen'
import { Checklist } from './components/Checklist'
import { CustomBuilder } from './components/CustomBuilder'
import { DailyPlan } from './components/DailyPlan'
import { Done } from './components/Done'
import { Home } from './components/Home'
import { ProfileSettings } from './components/ProfileSettings'
import { ReminderSettings } from './components/ReminderSettings'
import { AuthProvider } from './context/AuthContext'
import { isChecklistUuid } from './lib/checklists'
import type { Routine, View } from './types'

function canEditRoutine(routine: Routine): boolean {
  return Boolean(routine.isCustom || routine.id.startsWith('custom-') || isChecklistUuid(routine.id))
}

function AppRoutes() {
  const [view, setView] = useState<View>({ name: 'home' })

  const openEditor = (routine?: Routine) => setView({ name: 'builder', routine })

  if (view.name === 'auth') {
    return (
      <AuthScreen
        onClose={() => setView({ name: 'home' })}
        onContinueGuest={() => setView({ name: 'home' })}
      />
    )
  }

  if (view.name === 'builder') {
    return (
      <CustomBuilder
        key={view.routine?.id || 'new'}
        initial={view.routine || null}
        onCancel={() => setView({ name: 'home' })}
        onSaved={(routine) => setView({ name: 'checklist', routine, returnTo: 'home' })}
      />
    )
  }

  if (view.name === 'plan') {
    return (
      <DailyPlan
        onBack={() => setView({ name: 'home' })}
        onStartRoutine={(routine: Routine) =>
          setView({ name: 'checklist', routine, returnTo: 'plan' })
        }
      />
    )
  }

  if (view.name === 'profile') {
    return (
      <ProfileSettings
        onBack={() => setView({ name: 'home' })}
        onReminders={() => setView({ name: 'reminders' })}
      />
    )
  }

  if (view.name === 'reminders') {
    return <ReminderSettings onBack={() => setView({ name: 'profile' })} />
  }

  if (view.name === 'checklist') {
    const returnTo = view.returnTo || 'home'
    const routine = view.routine
    return (
      <Checklist
        key={routine.id + '-active'}
        routine={routine}
        onExit={() => setView(returnTo === 'plan' ? { name: 'plan' } : { name: 'home' })}
        onComplete={() => setView({ name: 'done', routine, returnTo })}
        onEdit={
          canEditRoutine(routine)
            ? () => openEditor(routine)
            : () => openEditor({ ...routine, isCustom: false })
        }
        editLabel={canEditRoutine(routine) ? 'Edit' : 'Customize'}
      />
    )
  }

  if (view.name === 'done') {
    const routine = view.routine
    const returnTo = view.returnTo || 'home'
    return (
      <Done
        routine={routine}
        onAgain={() => setView({ name: 'checklist', routine, returnTo })}
        onHome={() => setView(returnTo === 'plan' ? { name: 'plan' } : { name: 'home' })}
        onEdit={
          canEditRoutine(routine)
            ? () => openEditor(routine)
            : () => openEditor({ ...routine, isCustom: false })
        }
        editLabel={canEditRoutine(routine) ? 'Edit checklist' : 'Customize checklist'}
      />
    )
  }

  return (
    <Home
      onStart={(routine: Routine) => setView({ name: 'checklist', routine, returnTo: 'home' })}
      onCreateCustom={() => openEditor()}
      onEditCustom={(routine: Routine) => openEditor(routine)}
      onCustomizePreset={(routine: Routine) => openEditor({ ...routine, isCustom: false })}
      onAuth={() => setView({ name: 'auth' })}
      onPlan={() => setView({ name: 'plan' })}
      onProfile={() => setView({ name: 'profile' })}
      onReminders={() => setView({ name: 'reminders' })}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
