import { useId, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'

type Props = {
  onClose: () => void
  onContinueGuest?: () => void
}

export function AuthScreen({ onClose, onContinueGuest }: Props) {
  const { configured, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const emailId = useId()
  const passwordId = useId()
  const nameId = useId()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!configured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env')
      return
    }
    setBusy(true)
    const err =
      mode === 'signin'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password, name.trim() || undefined)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    if (mode === 'signup') {
      setInfo('Check your email to confirm, then sign in.')
    } else {
      onClose()
    }
  }

  const google = async () => {
    setError(null)
    if (!configured) {
      setError('Supabase is not configured yet.')
      return
    }
    setBusy(true)
    const err = await signInWithGoogle()
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="page auth-page">
      <header className="nav-bar">
        <button type="button" className="nav-btn" onClick={onClose} aria-label="Go back">
          <Icon name="back" size={24} />
          <span>Back</span>
        </button>
        <h1 className="nav-title">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
        <span className="nav-spacer" />
      </header>

      <div className="auth-card">
        <p className="auth-lead">
          Save lasting checklists, build daily plans, and get reminders by email and Google Calendar.
        </p>

        {!configured && (
          <p className="banner warn" role="status">
            Auth needs a real Supabase anon key. In Vercel and local <code>.env</code>, set{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> from Project Settings → API (not the placeholder).
            Also add <code>{typeof window !== 'undefined' ? window.location.origin : 'your site URL'}</code>{' '}
            under Supabase Authentication → URL Configuration → Redirect URLs.
          </p>
        )}

        <button type="button" className="btn-secondary google-btn" onClick={google} disabled={busy}>
          Continue with Google
        </button>

        <div className="auth-divider" aria-hidden>
          <span>or email</span>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'signup' && (
            <label className="field" htmlFor={nameId}>
              <span className="field-label">Display name</span>
              <input
                id={nameId}
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          <label className="field" htmlFor={emailId}>
            <span className="field-label">Email</span>
            <input
              id={emailId}
              className="text-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="field" htmlFor={passwordId}>
            <span className="field-label">Password</span>
            <input
              id={passwordId}
              className="text-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && (
            <p className="banner danger" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="banner ok" role="status">
              {info}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={busy}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setInfo(null)
          }}
        >
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>

        {onContinueGuest && (
          <button type="button" className="btn-ghost" onClick={onContinueGuest}>
            Continue as guest
          </button>
        )}

        <p className="legal-links">
          <a href="/about.html" target="_blank" rel="noopener noreferrer">
            About Promptr
          </a>
          <span aria-hidden>·</span>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          <span aria-hidden>·</span>
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
        </p>
      </div>
    </div>
  )
}
