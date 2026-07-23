import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'

type Props = {
  title?: string
  onBack?: () => void
  onHome?: () => void
  onPlan?: () => void
  onProfile?: () => void
  onReminders?: () => void
  onAuth?: () => void
  children: React.ReactNode
}

export function AppShell({
  title,
  onBack,
  onHome,
  onPlan,
  onProfile,
  onReminders,
  onAuth,
  children,
}: Props) {
  const { user, profile, signOut, loading } = useAuth()

  return (
    <div className="shell">
      <header className="top-bar">
        <div className="top-bar-left">
          {onBack ? (
            <button type="button" className="nav-btn" onClick={onBack} aria-label="Go back">
              <Icon name="back" size={22} />
              <span>Back</span>
            </button>
          ) : (
            <button type="button" className="brand-chip" onClick={onHome}>
              Promptr
            </button>
          )}
        </div>
        {title && <h1 className="top-bar-title">{title}</h1>}
        <div className="top-bar-right">
          {loading ? (
            <span className="muted-chip">…</span>
          ) : user ? (
            <details className="account-menu">
              <summary className="account-summary">
                {profile?.display_name || user.email?.split('@')[0] || 'Account'}
              </summary>
              <div className="account-dropdown">
                {onPlan && (
                  <button type="button" onClick={onPlan}>
                    Today’s plan
                  </button>
                )}
                {onReminders && (
                  <button type="button" onClick={onReminders}>
                    Reminders
                  </button>
                )}
                {onProfile && (
                  <button type="button" onClick={onProfile}>
                    Profile & interface
                  </button>
                )}
                <button type="button" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            </details>
          ) : (
            onAuth && (
              <button type="button" className="nav-btn" onClick={onAuth}>
                Sign in
              </button>
            )
          )}
        </div>
      </header>
      {children}
    </div>
  )
}
