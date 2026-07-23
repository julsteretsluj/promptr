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
import type { Routine, View } from './types'

function AppRoutes() {
  const [view, setView] = useState<View>({ name: 'home' })

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
        initial={view.routine || null}
        onCancel={() => setView({ name: 'home' })}
        onCreated={(routine) => setView({ name: 'checklist', routine, returnTo: 'home' })}
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
    return (
      <Checklist
        key={view.routine.id + '-active'}
        routine={view.routine}
        onExit={() =>
          setView(returnTo === 'plan' ? { name: 'plan' } : { name: 'home' })
        }
        onComplete={() => setView({ name: 'done', routine: view.routine, returnTo })}
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
      />
    )
  }

  return (
    <Home
      onStart={(routine: Routine) => setView({ name: 'checklist', routine, returnTo: 'home' })}
      onCreateCustom={() => setView({ name: 'builder' })}
      onEditCustom={(routine: Routine) => setView({ name: 'builder', routine })}
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
