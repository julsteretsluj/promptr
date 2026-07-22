import { useState } from 'react'
import { Checklist } from './components/Checklist'
import { CustomBuilder } from './components/CustomBuilder'
import { Done } from './components/Done'
import { Home } from './components/Home'
import type { Routine, View } from './types'

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' })

  if (view.name === 'builder') {
    return (
      <CustomBuilder
        onCancel={() => setView({ name: 'home' })}
        onCreated={(routine) => setView({ name: 'checklist', routine })}
      />
    )
  }

  if (view.name === 'checklist') {
    return (
      <Checklist
        key={view.routine.id + '-active'}
        routine={view.routine}
        onExit={() => setView({ name: 'home' })}
        onComplete={() => setView({ name: 'done', routine: view.routine })}
      />
    )
  }

  if (view.name === 'done') {
    const routine = view.routine
    return (
      <Done
        routine={routine}
        onAgain={() => setView({ name: 'checklist', routine })}
        onHome={() => setView({ name: 'home' })}
      />
    )
  }

  return (
    <Home
      onStart={(routine: Routine) => setView({ name: 'checklist', routine })}
      onCreateCustom={() => setView({ name: 'builder' })}
    />
  )
}
