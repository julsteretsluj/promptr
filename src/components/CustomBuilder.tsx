import { useId, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { CUSTOM_STORAGE_KEY } from '../data/presets'
import { createChecklist } from '../lib/checklists'
import type { Routine, Step } from '../types'
import { Icon } from './Icon'

type Props = {
  onCancel: () => void
  onCreated: (routine: Routine) => void
}

export function CustomBuilder({ onCancel, onCreated }: Props) {
  const { user } = useAuth()
  const titleId = useId()
  const stepId = useId()
  const [title, setTitle] = useState('')
  const [stepDraft, setStepDraft] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStep = () => {
    const label = stepDraft.trim()
    if (!label) return
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), label }])
    setStepDraft('')
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const save = async (startNow: boolean) => {
    const trimmed = title.trim()
    if (!trimmed || steps.length === 0) return
    setBusy(true)
    setError(null)

    try {
      let routine: Routine

      if (user) {
        routine = await createChecklist(user.id, {
          title: trimmed,
          description: 'Your custom checklist',
          icon: 'sparkle',
          color: '#007AFF',
          steps,
          isCustom: true,
        })
      } else {
        routine = {
          id: `custom-${crypto.randomUUID()}`,
          title: trimmed,
          description: 'Your custom checklist',
          icon: 'sparkle',
          color: '#007AFF',
          isCustom: true,
          steps,
        }
        try {
          const existing = JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || '[]') as Routine[]
          localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([routine, ...existing]))
        } catch {
          localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify([routine]))
        }
      }

      if (startNow) onCreated(routine)
      else onCancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save checklist')
    } finally {
      setBusy(false)
    }
  }

  const canSave = title.trim().length > 0 && steps.length > 0 && !busy

  return (
    <div className="page builder-page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onCancel} aria-label="Go back">
          <Icon name="back" size={24} />
          <span>Back</span>
        </button>
        <h1 className="nav-title">New checklist</h1>
        <span className="nav-spacer" />
      </header>

      <div className="builder-body">
        <p className="field-hint">
          {user
            ? 'This checklist is saved to your account and can be reused in daily plans.'
            : 'Guest mode saves on this device only. Sign in to sync across devices.'}
        </p>

        <label className="field" htmlFor={titleId}>
          <span className="field-label">Checklist name</span>
          <input
            id={titleId}
            className="text-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Morning stretch"
            autoComplete="off"
          />
        </label>

        <div className="field">
          <label className="field-label" htmlFor={stepId}>
            Add a step
          </label>
          <div className="step-composer">
            <input
              id={stepId}
              className="text-input"
              value={stepDraft}
              onChange={(e) => setStepDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addStep()
                }
              }}
              placeholder="Write one clear action…"
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-secondary add-step-btn"
              onClick={addStep}
              disabled={!stepDraft.trim()}
            >
              Add
            </button>
          </div>
          <p className="field-hint">Keep each step small enough to do without deciding what comes next.</p>
        </div>

        {steps.length > 0 && (
          <ol className="builder-steps list-group">
            {steps.map((step, index) => (
              <li key={step.id} className="builder-step">
                <span className="step-index" aria-hidden>
                  {index + 1}
                </span>
                <span className="builder-step-label">{step.label}</span>
                <div className="builder-step-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveStep(index, -1)}
                    disabled={index === 0}
                    aria-label="Move step up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveStep(index, 1)}
                    disabled={index === steps.length - 1}
                    aria-label="Move step down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    onClick={() => removeStep(step.id)}
                    aria-label="Remove step"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {error && (
          <p className="banner danger" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="sticky-actions">
        <button type="button" className="btn-primary" disabled={!canSave} onClick={() => void save(true)}>
          Save & start
        </button>
        <button type="button" className="btn-ghost" disabled={!canSave} onClick={() => void save(false)}>
          Save for later
        </button>
      </footer>
    </div>
  )
}
