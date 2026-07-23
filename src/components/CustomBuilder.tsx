import { useId, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createChecklist, isChecklistUuid, saveGuestChecklist, updateChecklist } from '../lib/checklists'
import type { Routine, Step } from '../types'
import { EmojiPicker } from './EmojiPicker'
import { Icon } from './Icon'
import { isIconName } from './Icon'
import { RoutineGlyph } from './RoutineGlyph'
import { StepEditorList } from './StepEditorList'

type Props = {
  initial?: Routine | null
  onCancel: () => void
  onSaved: (routine: Routine) => void
}

export function CustomBuilder({ initial = null, onCancel, onSaved }: Props) {
  const { user } = useAuth()
  const titleId = useId()
  const stepId = useId()

  // Existing custom (cloud UUID or local custom-*) → update. Preset template → create copy.
  const isExistingCustom = Boolean(
    initial && (initial.isCustom || isChecklistUuid(initial.id) || initial.id.startsWith('custom-')),
  )
  const isCustomizingPreset = Boolean(initial && !isExistingCustom)

  const [title, setTitle] = useState(initial?.title || '')
  const [emoji, setEmoji] = useState(() => {
    if (!initial?.icon) return '✨'
    if (!isIconName(String(initial.icon))) return String(initial.icon)
    const presetEmoji: Record<string, string> = {
      shower: '🚿',
      dishes: '🍽️',
      room: '🧹',
      teeth: '🦷',
      makeup: '💄',
      dressed: '👕',
      homework: '📚',
      shopping: '🛒',
      laundry: '🧺',
      bed: '🛏️',
      meal: '🍳',
      leave: '🚪',
      sparkle: '✨',
    }
    return presetEmoji[String(initial.icon)] || '✨'
  })
  const [stepDraft, setStepDraft] = useState('')
  const [steps, setSteps] = useState<Step[]>(() =>
    (initial?.steps || []).map((s) => ({ ...s, id: isCustomizingPreset ? crypto.randomUUID() : s.id })),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addStep = () => {
    const label = stepDraft.trim()
    if (!label) return
    setSteps((prev) => [...prev, { id: crypto.randomUUID(), label }])
    setStepDraft('')
  }

  const finishWith = (routine: Routine, startNow: boolean) => {
    if (startNow) onSaved(routine)
    else onCancel()
  }

  const save = async (startNow: boolean) => {
    const trimmed = title.trim()
    if (!trimmed || steps.length === 0) return
    if (steps.some((s) => !s.label.trim())) {
      setError('Every step needs text. Fill empty steps or delete them.')
      return
    }
    setBusy(true)
    setError(null)

    const payload: Routine = {
      id: isExistingCustom && initial ? initial.id : `custom-${crypto.randomUUID()}`,
      title: trimmed,
      description: isCustomizingPreset
        ? 'Customized from a preset'
        : initial?.description || 'Your custom checklist',
      icon: emoji || '✨',
      color: initial?.color || '#007AFF',
      isCustom: true,
      steps: steps.map((s) => ({
        ...s,
        label: s.label.trim(),
        detail: s.detail?.trim() || undefined,
      })),
    }

    try {
      let routine: Routine

      if (user) {
        try {
          if (isExistingCustom) {
            routine = await updateChecklist(payload)
          } else {
            routine = await createChecklist(user.id, payload)
          }
        } catch (e) {
          const withLocal = e as Error & { localRoutine?: Routine }
          if (withLocal.localRoutine) {
            setError(withLocal.message)
            window.setTimeout(() => finishWith(withLocal.localRoutine!, startNow), startNow ? 900 : 1200)
            return
          }
          throw e
        }
      } else {
        routine = payload
        saveGuestChecklist(routine)
      }

      finishWith(routine, startNow)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save checklist')
    } finally {
      setBusy(false)
    }
  }

  const canSave = title.trim().length > 0 && steps.length > 0 && !busy
  const heading = isExistingCustom
    ? 'Edit checklist'
    : isCustomizingPreset
      ? 'Customize checklist'
      : 'New checklist'

  return (
    <div className="page builder-page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onCancel} aria-label="Go back">
          <Icon name="back" size={24} />
          <span>Back</span>
        </button>
        <h1 className="nav-title">{heading}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="builder-body">
        <p className="field-hint">
          {isExistingCustom
            ? 'Change the name or steps anytime. Drag to reorder; multi-select to move a group.'
            : isCustomizingPreset
              ? 'This saves as your own copy — the original preset stays unchanged.'
              : user
                ? 'Edit steps inline, drag to reorder, or multi-select and drag to move a group.'
                : 'Guest mode saves on this device only. Sign in to sync across devices.'}
        </p>

        <label className="field" htmlFor={titleId}>
          <span className="field-label">Checklist name</span>
          <div className="title-with-glyph">
            <RoutineGlyph icon={emoji} color={initial?.color || '#007AFF'} size={26} />
            <input
              id={titleId}
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning stretch"
              autoComplete="off"
            />
          </div>
        </label>

        <EmojiPicker value={emoji} onChange={setEmoji} />

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
        </div>

        {steps.length > 0 && <StepEditorList steps={steps} onChange={setSteps} />}

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
          {isExistingCustom ? 'Save changes' : 'Save for later'}
        </button>
      </footer>
    </div>
  )
}
