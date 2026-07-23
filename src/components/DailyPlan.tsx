import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PRESETS } from '../data/presets'
import { fetchUserChecklists } from '../lib/checklists'
import type { DailyPlanItem } from '../lib/database.types'
import {
  addPlanItem,
  fetchPlanWithItems,
  removePlanItem,
  todayISODate,
  updatePlanItemStatus,
  updatePlanItemTime,
  updatePlanNotes,
  type PlanWithItems,
} from '../lib/plans'
import { fetchReminderSettings } from '../lib/reminders'
import type { Routine } from '../types'
import { Icon } from './Icon'

type Props = {
  onBack: () => void
  onStartRoutine: (routine: Routine) => void
}

export function DailyPlan({ onBack, onStartRoutine }: Props) {
  const { user, profile } = useAuth()
  const [date, setDate] = useState(() => todayISODate(profile?.timezone))
  const [plan, setPlan] = useState<PlanWithItems | null>(null)
  const [customs, setCustoms] = useState<Routine[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [timeDraft, setTimeDraft] = useState('09:00')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const [p, c, settings] = await Promise.all([
        fetchPlanWithItems(user.id, date),
        fetchUserChecklists(user.id),
        fetchReminderSettings(user.id),
      ])
      setPlan(p)
      setNotes(p.notes)
      setCustoms(c)
      void settings
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load plan')
    } finally {
      setBusy(false)
    }
  }, [user, date])

  useEffect(() => {
    void load()
  }, [load])

  const routinesById = useMemo(() => {
    const map = new Map<string, Routine>()
    for (const r of PRESETS) map.set(r.id, r)
    for (const r of customs) map.set(r.id, r)
    return map
  }, [customs])

  const addRoutine = async (routine: Routine, isPreset: boolean) => {
    if (!user || !plan) return
    setBusy(true)
    setError(null)
    try {
      const settings = await fetchReminderSettings(user.id)
      await addPlanItem({
        userId: user.id,
        planId: plan.id,
        planDate: date,
        timezone: profile?.timezone || 'Pacific/Auckland',
        title: routine.title,
        checklistId: isPreset ? null : routine.id,
        presetId: isPreset ? routine.id : null,
        scheduledTime: timeDraft || null,
        sortOrder: plan.items.length,
        emailEnabled: settings.email_enabled,
        calendarEnabled: settings.calendar_enabled,
        leadMinutes: settings.lead_minutes,
      })
      setPickerOpen(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add item')
    } finally {
      setBusy(false)
    }
  }

  const resolveRoutine = (item: DailyPlanItem): Routine | null => {
    if (item.checklist_id) return routinesById.get(item.checklist_id) || null
    if (item.preset_id) return routinesById.get(item.preset_id) || null
    return null
  }

  const saveNotes = async () => {
    if (!plan) return
    try {
      await updatePlanNotes(plan.id, notes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save notes')
    }
  }

  if (!user) {
    return (
      <div className="page">
        <header className="nav-bar">
          <button type="button" className="nav-btn" onClick={onBack}>
            <Icon name="back" size={24} />
            <span>Back</span>
          </button>
          <h1 className="nav-title">Daily plan</h1>
          <span className="nav-spacer" />
        </header>
        <p className="banner warn">Sign in to create daily plans.</p>
      </div>
    )
  }

  return (
    <div className="page plan-page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onBack} aria-label="Go back">
          <Icon name="back" size={24} />
          <span>Back</span>
        </button>
        <h1 className="nav-title">Daily plan</h1>
        <span className="nav-spacer" />
      </header>

      <div className="builder-body">
        <label className="field">
          <span className="field-label">Date</span>
          <input
            className="text-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Notes for the day</span>
          <textarea
            className="text-input textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => void saveNotes()}
            placeholder="Anything you want to remember…"
          />
        </label>

        <div className="section-head">
          <h2>Scheduled checklists</h2>
          <p>Add a time to queue email and calendar reminders.</p>
        </div>

        {plan && plan.items.length > 0 ? (
          <ul className="list-group">
            {plan.items.map((item) => {
              const routine = resolveRoutine(item)
              return (
                <li key={item.id} className="plan-item">
                  <div className="plan-item-main">
                    <button
                      type="button"
                      className={`status-dot ${item.status}`}
                      aria-label={`Mark ${item.title}`}
                      onClick={() =>
                        void updatePlanItemStatus(
                          item.id,
                          item.status === 'done' ? 'pending' : 'done',
                        ).then(load)
                      }
                    >
                      {item.status === 'done' && <Icon name="check" size={18} />}
                    </button>
                    <div className="plan-item-text">
                      <strong className={item.status === 'done' ? 'struck' : undefined}>
                        {item.title}
                      </strong>
                      <label className="inline-time">
                        <span className="sr-only">Time</span>
                        <input
                          type="time"
                          value={item.scheduled_time?.slice(0, 5) || ''}
                          onChange={(e) => {
                            void (async () => {
                              const settings = await fetchReminderSettings(user.id)
                              await updatePlanItemTime({
                                item,
                                scheduledTime: e.target.value || null,
                                planDate: date,
                                timezone: profile?.timezone || 'Pacific/Auckland',
                                emailEnabled: settings.email_enabled,
                                calendarEnabled: settings.calendar_enabled,
                                leadMinutes: settings.lead_minutes,
                              })
                              await load()
                            })()
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="plan-item-actions">
                    {routine && (
                      <button
                        type="button"
                        className="btn-secondary compact"
                        onClick={() => onStartRoutine(routine)}
                      >
                        Start
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => void removePlanItem(item.id).then(load)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="field-hint">{busy ? 'Loading…' : 'No checklists on this day yet.'}</p>
        )}

        <div className="field">
          <span className="field-label">Default time for new items</span>
          <input
            className="text-input"
            type="time"
            value={timeDraft}
            onChange={(e) => setTimeDraft(e.target.value)}
          />
        </div>

        <button type="button" className="btn-primary" onClick={() => setPickerOpen((v) => !v)}>
          {pickerOpen ? 'Close picker' : 'Add checklist to plan'}
        </button>

        {pickerOpen && (
          <div className="picker">
            {customs.length > 0 && (
              <>
                <h3 className="picker-heading">Your checklists</h3>
                <ul className="list-group">
                  {customs.map((r) => (
                    <li key={r.id}>
                      <button type="button" className="list-row" onClick={() => void addRoutine(r, false)}>
                        <span className="glyph" style={{ background: r.color }}>
                          <Icon name="sparkle" size={22} />
                        </span>
                        <span className="list-row-text">
                          <strong>{r.title}</strong>
                          <span>{r.steps.length} steps</span>
                        </span>
                        <Icon name="plus" size={22} className="row-chevron" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3 className="picker-heading">Presets</h3>
            <ul className="list-group">
              {PRESETS.map((r) => (
                <li key={r.id}>
                  <button type="button" className="list-row" onClick={() => void addRoutine(r, true)}>
                    <span className="glyph" style={{ background: r.color }}>
                      <Icon name={r.icon} size={22} />
                    </span>
                    <span className="list-row-text">
                      <strong>{r.title}</strong>
                      <span>{r.description}</span>
                    </span>
                    <Icon name="plus" size={22} className="row-chevron" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="banner danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
