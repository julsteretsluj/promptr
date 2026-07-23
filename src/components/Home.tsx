import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PRESETS } from '../data/presets'
import { archiveChecklist, fetchUserChecklists } from '../lib/checklists'
import { loadLocalCustomRoutines } from '../lib/migrateLocal'
import { todayISODate } from '../lib/plans'
import type { Routine } from '../types'
import { AppShell } from './AppShell'
import { Icon } from './Icon'

type Props = {
  onStart: (routine: Routine) => void
  onCreateCustom: () => void
  onAuth: () => void
  onPlan: () => void
  onProfile: () => void
  onReminders: () => void
}

export function Home({
  onStart,
  onCreateCustom,
  onAuth,
  onPlan,
  onProfile,
  onReminders,
}: Props) {
  const { user, profile, configured } = useAuth()
  const [custom, setCustom] = useState<Routine[]>([])
  const [loadingCustoms, setLoadingCustoms] = useState(false)

  const reload = useCallback(async () => {
    if (user) {
      setLoadingCustoms(true)
      try {
        setCustom(await fetchUserChecklists(user.id))
      } catch {
        setCustom([])
      } finally {
        setLoadingCustoms(false)
      }
    } else {
      setCustom(loadLocalCustomRoutines())
    }
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const deleteCustom = async (id: string) => {
    if (user) {
      await archiveChecklist(id)
      setCustom((prev) => prev.filter((r) => r.id !== id))
      return
    }
    const next = custom.filter((r) => r.id !== id)
    setCustom(next)
    localStorage.setItem('promptr-custom-routines', JSON.stringify(next))
  }

  const planFirst = profile?.home_layout !== 'routines_first'
  const todayLabel = todayISODate(profile?.timezone)

  return (
    <AppShell
      onHome={() => undefined}
      onPlan={user ? onPlan : undefined}
      onProfile={user ? onProfile : undefined}
      onReminders={user ? onReminders : undefined}
      onAuth={onAuth}
    >
      <div className="page home-page">
        <header className="hero">
          <div className="hero-glow" aria-hidden />
          <p className="hero-kicker">Gentle step-by-step prompts</p>
          <h1 className="brand">Promptr</h1>
          <p className="hero-sub">
            Break everyday tasks into clear next steps — built for brains that need a nudge.
          </p>
        </header>

        {user && planFirst && (
          <section className="section">
            <button type="button" className="plan-cta" onClick={onPlan}>
              <span className="plan-cta-text">
                <strong>Today’s plan</strong>
                <span>{todayLabel} — add checklists and reminder times</span>
              </span>
              <Icon name="chevron" size={22} className="row-chevron" />
            </button>
          </section>
        )}

        {!user && (
          <section className="section">
            <button type="button" className="plan-cta" onClick={onAuth}>
              <span className="plan-cta-text">
                <strong>Sign in to sync</strong>
                <span>
                  {configured
                    ? 'Save lasting checklists, daily plans, and reminders'
                    : 'Configure Supabase, then create an account'}
                </span>
              </span>
              <Icon name="chevron" size={22} className="row-chevron" />
            </button>
          </section>
        )}

        <section className="section" aria-labelledby="start-heading">
          <div className="section-head">
            <h2 id="start-heading">Start a routine</h2>
            <p>Pick a preset or make your own. One step at a time.</p>
          </div>

          <button
            type="button"
            className="custom-cta"
            onClick={() => {
              if (!user && configured) onAuth()
              else onCreateCustom()
            }}
          >
            <span className="custom-cta-icon" aria-hidden>
              <Icon name="plus" size={26} />
            </span>
            <span className="custom-cta-text">
              <strong>Custom checklist</strong>
              <span>{user ? 'Saved to your account' : 'Guest: saved on this device only'}</span>
            </span>
            <Icon name="chevron" size={22} className="row-chevron" />
          </button>

          {loadingCustoms && <p className="field-hint">Loading your checklists…</p>}

          {custom.length > 0 && (
            <ul className="list-group" aria-label="Your custom routines">
              {custom.map((routine) => (
                <li key={routine.id} className="list-row-wrap">
                  <button type="button" className="list-row" onClick={() => onStart(routine)}>
                    <span className="glyph" style={{ background: routine.color }}>
                      <Icon name="sparkle" size={22} />
                    </span>
                    <span className="list-row-text">
                      <strong>{routine.title}</strong>
                      <span>
                        {routine.steps.length} step{routine.steps.length === 1 ? '' : 's'}
                      </span>
                    </span>
                    <Icon name="chevron" size={22} className="row-chevron" />
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => void deleteCustom(routine.id)}
                    aria-label={`Delete ${routine.title}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ul className="list-group" aria-label="Preset routines">
            {PRESETS.map((routine) => (
              <li key={routine.id}>
                <button type="button" className="list-row" onClick={() => onStart(routine)}>
                  <span className="glyph" style={{ background: routine.color }}>
                    <Icon name={routine.icon} size={22} />
                  </span>
                  <span className="list-row-text">
                    <strong>{routine.title}</strong>
                    <span>{routine.description}</span>
                  </span>
                  <Icon name="chevron" size={22} className="row-chevron" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {user && !planFirst && (
          <section className="section">
            <button type="button" className="plan-cta" onClick={onPlan}>
              <span className="plan-cta-text">
                <strong>Today’s plan</strong>
                <span>Schedule checklists for {todayLabel}</span>
              </span>
              <Icon name="chevron" size={22} className="row-chevron" />
            </button>
          </section>
        )}
      </div>
    </AppShell>
  )
}
