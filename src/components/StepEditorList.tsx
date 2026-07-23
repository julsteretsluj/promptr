import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useState } from 'react'
import type { Step } from '../types'

type Props = {
  steps: Step[]
  onChange: (steps: Step[]) => void
}

function moveSelectedItems(
  items: Step[],
  activeId: string,
  overId: string,
  selectedIds: Set<string>,
): Step[] {
  const ids = selectedIds.has(activeId) ? selectedIds : new Set([activeId])
  const oldIndex = items.findIndex((i) => i.id === activeId)
  const newIndex = items.findIndex((i) => i.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items

  if (ids.size === 1) {
    return arrayMove(items, oldIndex, newIndex)
  }

  const moving = items.filter((i) => ids.has(i.id))
  const remaining = items.filter((i) => !ids.has(i.id))

  let insertIndex: number
  if (ids.has(overId)) {
    insertIndex = remaining.filter((i) => items.indexOf(i) < newIndex).length
  } else {
    insertIndex = remaining.findIndex((i) => i.id === overId)
    if (insertIndex < 0) insertIndex = remaining.length
    if (oldIndex < newIndex) insertIndex += 1
  }

  const next = [...remaining]
  next.splice(Math.max(0, Math.min(insertIndex, next.length)), 0, ...moving)
  return next
}

function SortableStep({
  step,
  index,
  selected,
  dragging,
  onToggleSelect,
  onUpdate,
  onRemove,
}: {
  step: Step
  index: number
  selected: boolean
  dragging: boolean
  onToggleSelect: (id: string, event: React.MouseEvent | React.ChangeEvent) => void
  onUpdate: (id: string, patch: Partial<Step>) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || dragging ? 0.55 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={['builder-step', selected ? 'is-selected' : '', isDragging ? 'is-dragging' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <label className="step-select">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggleSelect(step.id, e)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select step ${index + 1}`}
        />
      </label>

      <button
        type="button"
        className="drag-handle"
        aria-label={`Drag step ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <span className="step-index" aria-hidden>
        {index + 1}
      </span>

      <div className="builder-step-fields">
        <input
          className="step-edit-input"
          value={step.label}
          onChange={(e) => onUpdate(step.id, { label: e.target.value })}
          aria-label={`Step ${index + 1} text`}
          placeholder="Step text"
        />
        <input
          className="step-edit-input detail"
          value={step.detail || ''}
          onChange={(e) =>
            onUpdate(step.id, { detail: e.target.value.trim() ? e.target.value : undefined })
          }
          aria-label={`Step ${index + 1} detail`}
          placeholder="Optional detail"
        />
      </div>

      <button
        type="button"
        className="icon-btn danger"
        onClick={() => onRemove(step.id)}
        aria-label="Remove step"
      >
        ×
      </button>
    </li>
  )
}

export function StepEditorList({ steps, onChange }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const lastClicked = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const toggleSelect = (id: string, event: React.MouseEvent | React.ChangeEvent) => {
    const native = 'nativeEvent' in event ? event.nativeEvent : event
    const shift = 'shiftKey' in native && native.shiftKey
    const meta = ('metaKey' in native && native.metaKey) || ('ctrlKey' in native && native.ctrlKey)

    setSelected((prev) => {
      const next = new Set(prev)
      if (shift && lastClicked.current) {
        const a = steps.findIndex((s) => s.id === lastClicked.current)
        const b = steps.findIndex((s) => s.id === id)
        if (a >= 0 && b >= 0) {
          const [start, end] = a < b ? [a, b] : [b, a]
          for (let i = start; i <= end; i++) next.add(steps[i].id)
        }
      } else if (meta) {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      } else {
        // Checkbox click without modifiers: toggle this one, keep others if already multi
        if (next.has(id) && next.size === 1) next.clear()
        else if (next.has(id)) next.delete(id)
        else next.add(id)
      }
      return next
    })
    lastClicked.current = id
  }

  const onDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id)
    setActiveId(id)
    setSelected((prev) => {
      if (prev.has(id)) return prev
      return new Set([id])
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    onChange(moveSelectedItems(steps, String(active.id), String(over.id), selected))
  }

  const updateStep = (id: string, patch: Partial<Step>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const removeSelected = () => {
    if (selected.size === 0) return
    onChange(steps.filter((s) => !selected.has(s.id)))
    setSelected(new Set())
  }

  const selectAll = () => setSelected(new Set(steps.map((s) => s.id)))
  const clearSelection = () => setSelected(new Set())

  const selectedCount = selected.size
  const draggingIds =
    activeId && selected.has(activeId) ? selected : activeId ? new Set([activeId]) : new Set()

  return (
    <div className="step-editor">
      <div className="step-editor-toolbar">
        <p className="field-hint">
          Drag ⋮⋮ to reorder. Select multiple, then drag any selected step to move them together.
          Shift-click for a range.
        </p>
        <div className="step-editor-actions">
          <button type="button" className="btn-secondary compact" onClick={selectAll} disabled={!steps.length}>
            Select all
          </button>
          <button
            type="button"
            className="btn-secondary compact"
            onClick={clearSelection}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn-secondary compact danger-text"
            onClick={removeSelected}
            disabled={selectedCount === 0}
          >
            Delete {selectedCount > 0 ? selectedCount : ''}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ol className="builder-steps list-group">
            {steps.map((step, index) => (
              <SortableStep
                key={step.id}
                step={step}
                index={index}
                selected={selected.has(step.id)}
                dragging={draggingIds.has(step.id) && draggingIds.size > 1 && activeId !== step.id}
                onToggleSelect={toggleSelect}
                onUpdate={updateStep}
                onRemove={removeStep}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  )
}
