import type { Routine } from '../types'
import { Icon } from './Icon'

type Props = {
  routine: Routine
  onAgain: () => void
  onHome: () => void
  onEdit?: () => void
  editLabel?: string
}

export function Done({
  routine,
  onAgain,
  onHome,
  onEdit,
  editLabel = 'Edit checklist',
}: Props) {
  return (
    <div className="page done-page">
      <div className="done-card">
        <div className="done-badge" aria-hidden>
          <Icon name="check" size={40} />
        </div>
        <h1 className="done-title">You finished</h1>
        <p className="done-routine">{routine.title}</p>
        <p className="done-sub">
          {routine.steps.length} step{routine.steps.length === 1 ? '' : 's'} complete. That counts.
        </p>
        <div className="done-actions">
          <button type="button" className="btn-primary" onClick={onAgain}>
            Do it again
          </button>
          {onEdit && (
            <button type="button" className="btn-secondary" onClick={onEdit}>
              {editLabel}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onHome}>
            Back to routines
          </button>
        </div>
      </div>
    </div>
  )
}
