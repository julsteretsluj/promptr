import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { ReminderSettings as ReminderSettingsRow } from '../lib/database.types'
import {
  fetchReminderSettings,
  hasGoogleCalendarConnected,
  queueTestEmail,
  updateReminderSettings,
} from '../lib/reminders'
import { supabase } from '../lib/supabase'
import { Icon } from './Icon'

type Props = {
  onBack: () => void
}

export function ReminderSettings({ onBack }: Props) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<ReminderSettingsRow | null>(null)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setBusy(true)
    try {
      const [s, connected] = await Promise.all([
        fetchReminderSettings(user.id),
        hasGoogleCalendarConnected(user.id),
      ])
      setSettings(s)
      setCalendarConnected(connected)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load settings')
    } finally {
      setBusy(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (
    next: Partial<Pick<ReminderSettingsRow, 'email_enabled' | 'calendar_enabled' | 'lead_minutes'>>,
  ) => {
    if (!user) return
    setBusy(true)
    setError(null)
    try {
      const updated = await updateReminderSettings(user.id, next)
      setSettings(updated)
      setMessage('Saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const connectCalendar = async () => {
    setError(null)
    const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (oauthError) setError(oauthError.message)
  }

  const sendTest = async () => {
    if (!user?.email) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await queueTestEmail(user.id, user.email)
      setMessage(
        'Test email queued. Deploy the send-reminders Edge Function and cron so it actually sends from your Gmail.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not queue test')
    } finally {
      setBusy(false)
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
          <h1 className="nav-title">Reminders</h1>
          <span className="nav-spacer" />
        </header>
        <p className="banner warn">Sign in to manage reminders.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onBack} aria-label="Go back">
          <Icon name="back" size={24} />
          <span>Back</span>
        </button>
        <h1 className="nav-title">Reminders</h1>
        <span className="nav-spacer" />
      </header>

      <div className="builder-body">
        <p className="field-hint">
          Email reminders are sent from the app owner’s Gmail. Calendar events go on your Google
          Calendar after you connect it.
        </p>

        {settings && (
          <>
            <label className="toggle-row">
              <span>
                <strong>Email reminders</strong>
                <span className="field-hint">To {user.email}</span>
              </span>
              <input
                type="checkbox"
                checked={settings.email_enabled}
                disabled={busy}
                onChange={(e) => void patch({ email_enabled: e.target.checked })}
              />
            </label>

            <label className="toggle-row">
              <span>
                <strong>Google Calendar</strong>
                <span className="field-hint">
                  {calendarConnected ? 'Connected' : 'Not connected yet'}
                </span>
              </span>
              <input
                type="checkbox"
                checked={settings.calendar_enabled}
                disabled={busy || !calendarConnected}
                onChange={(e) => void patch({ calendar_enabled: e.target.checked })}
              />
            </label>

            {!calendarConnected && (
              <button type="button" className="btn-secondary" onClick={() => void connectCalendar()}>
                Connect Google Calendar
              </button>
            )}

            <label className="field">
              <span className="field-label">Remind me this many minutes early</span>
              <input
                className="text-input"
                type="number"
                min={0}
                max={1440}
                value={settings.lead_minutes}
                disabled={busy}
                onChange={(e) => void patch({ lead_minutes: Number(e.target.value) || 0 })}
              />
            </label>
          </>
        )}

        <button type="button" className="btn-primary" disabled={busy} onClick={() => void sendTest()}>
          Queue test email
        </button>

        {message && (
          <p className="banner ok" role="status">
            {message}
          </p>
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
