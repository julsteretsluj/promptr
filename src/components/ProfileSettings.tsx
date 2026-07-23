import { useEffect, useId, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { HomeLayout, TextSize } from '../lib/database.types'
import { applyProfileToDocument, updateProfile } from '../lib/profile'
import { Icon } from './Icon'

type Props = {
  onBack: () => void
  onReminders: () => void
}

const TIMEZONES = [
  'Pacific/Auckland',
  'Australia/Sydney',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
]

const ACCENTS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#5AC8FA', '#30B0C7']

export function ProfileSettings({ onBack, onReminders }: Props) {
  const { user, profile, refreshProfile } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [timezone, setTimezone] = useState(profile?.timezone || 'Pacific/Auckland')
  const [textSize, setTextSize] = useState<TextSize>(profile?.text_size || 'large')
  const [accent, setAccent] = useState(profile?.accent || '#007AFF')
  const [reduceMotion, setReduceMotion] = useState(profile?.reduce_motion || false)
  const [homeLayout, setHomeLayout] = useState<HomeLayout>(profile?.home_layout || 'plan_first')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const nameId = useId()
  const tzId = useId()

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name || '')
    setTimezone(profile.timezone)
    setTextSize(profile.text_size)
    setAccent(profile.accent)
    setReduceMotion(profile.reduce_motion)
    setHomeLayout(profile.home_layout)
  }, [profile])

  // Live preview
  useEffect(() => {
    applyProfileToDocument({
      id: profile?.id || 'preview',
      display_name: displayName,
      avatar_url: null,
      timezone,
      text_size: textSize,
      accent,
      reduce_motion: reduceMotion,
      home_layout: homeLayout,
      created_at: '',
      updated_at: '',
    })
  }, [displayName, timezone, textSize, accent, reduceMotion, homeLayout, profile?.id])

  const save = async () => {
    if (!user) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim() || null,
        timezone,
        text_size: textSize,
        accent,
        reduce_motion: reduceMotion,
        home_layout: homeLayout,
      })
      await refreshProfile()
      setMessage('Saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
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
          <h1 className="nav-title">Profile</h1>
          <span className="nav-spacer" />
        </header>
        <p className="banner warn">Sign in to customize your profile.</p>
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
        <h1 className="nav-title">Profile</h1>
        <span className="nav-spacer" />
      </header>

      <div className="builder-body">
        <label className="field" htmlFor={nameId}>
          <span className="field-label">Display name</span>
          <input
            id={nameId}
            className="text-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label className="field" htmlFor={tzId}>
          <span className="field-label">Timezone</span>
          <select
            id={tzId}
            className="text-input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field">
          <legend className="field-label">Text size</legend>
          <div className="segmented">
            {(
              [
                ['medium', 'Medium'],
                ['large', 'Large'],
                ['xlarge', 'Extra large'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={textSize === value ? 'seg active' : 'seg'}
                onClick={() => setTextSize(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field-label">Accent color</legend>
          <div className="accent-row">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                className={accent === c ? 'accent-swatch active' : 'accent-swatch'}
                style={{ background: c }}
                aria-label={`Accent ${c}`}
                onClick={() => setAccent(c)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="field-label">Home layout</legend>
          <div className="segmented">
            <button
              type="button"
              className={homeLayout === 'plan_first' ? 'seg active' : 'seg'}
              onClick={() => setHomeLayout('plan_first')}
            >
              Plan first
            </button>
            <button
              type="button"
              className={homeLayout === 'routines_first' ? 'seg active' : 'seg'}
              onClick={() => setHomeLayout('routines_first')}
            >
              Routines first
            </button>
          </div>
        </fieldset>

        <label className="toggle-row">
          <span>
            <strong>Reduce motion</strong>
            <span className="field-hint">Turn off animations</span>
          </span>
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
          />
        </label>

        <button type="button" className="btn-primary" disabled={busy} onClick={() => void save()}>
          Save preferences
        </button>

        <button type="button" className="btn-ghost" onClick={onReminders}>
          Reminder settings
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
