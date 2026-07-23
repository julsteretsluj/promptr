import { useEffect, useMemo, useRef, useState } from 'react'
import type { Routine } from '../types'
import { Icon } from './Icon'

type Props = {
  routine: Routine
  onExit: () => void
  onComplete: () => void
  onEdit?: () => void
  editLabel?: string
}

export function Checklist({ routine, onExit, onComplete, onEdit, editLabel = 'Edit' }: Props) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const currentRef = useRef<HTMLLIElement | null>(null)

  const completedCount = useMemo(
    () => routine.steps.filter((s) => done[s.id]).length,
    [done, routine.steps],
  )

  const currentIndex = routine.steps.findIndex((s) => !done[s.id])
  const progress = routine.steps.length === 0 ? 0 : completedCount / routine.steps.length

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIndex])

  useEffect(() => {
    if (routine.steps.length > 0 && completedCount === routine.steps.length) {
      const t = window.setTimeout(onComplete, 450)
      return () => window.clearTimeout(t)
    }
  }, [completedCount, onComplete, routine.steps.length])

  const toggle = (id: string, index: number) => {
    // Encourage forward progress: allow checking current or any previous
    if (index > currentIndex && currentIndex !== -1) return
    setDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const markCurrentDone = () => {
    if (currentIndex < 0) return
    const id = routine.steps[currentIndex].id
    setDone((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="page checklist-page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onExit} aria-label="Exit checklist">
          <Icon name="back" size={24} />
          <span>Exit</span>
        </button>
        <h1 className="nav-title">{routine.title}</h1>
        {onEdit ? (
          <button type="button" className="nav-btn nav-btn-end" onClick={onEdit}>
            {editLabel}
          </button>
        ) : (
          <span className="nav-spacer" />
        )}
      </header>

      <div className="progress-block" aria-live="polite">
        <div className="progress-meta">
          <span>
            {completedCount} of {routine.steps.length} done
          </span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label="Checklist progress"
        >
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {currentIndex >= 0 && (
        <section className="focus-card" aria-labelledby="focus-heading">
          <p className="focus-kicker">Do this next</p>
          <h2 id="focus-heading" className="focus-title">
            {routine.steps[currentIndex].label}
          </h2>
          {routine.steps[currentIndex].detail && (
            <p className="focus-detail">{routine.steps[currentIndex].detail}</p>
          )}
          <button type="button" className="btn-primary focus-done" onClick={markCurrentDone}>
            <Icon name="check" size={24} />
            Mark done
          </button>
        </section>
      )}

      <ol className="checklist list-group">
        {routine.steps.map((step, index) => {
          const isDone = Boolean(done[step.id])
          const isCurrent = index === currentIndex
          const isLocked = currentIndex !== -1 && index > currentIndex

          return (
            <li
              key={step.id}
              ref={isCurrent ? currentRef : undefined}
              className={[
                'check-row',
                isDone ? 'is-done' : '',
                isCurrent ? 'is-current' : '',
                isLocked ? 'is-locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="check-toggle"
                onClick={() => toggle(step.id, index)}
                disabled={isLocked}
                aria-pressed={isDone}
                aria-label={`${isDone ? 'Undo' : 'Complete'}: ${step.label}`}
              >
                <span className="checkbox" aria-hidden>
                  {isDone && <Icon name="check" size={20} />}
                </span>
                <span className="check-text">
                  <strong>
                    <span className="sr-only">Step {index + 1}. </span>
                    {step.label}
                  </strong>
                  {step.detail && <span>{step.detail}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
