import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { migrateLocalChecklistsIfNeeded } from '../lib/migrateLocal'
import { applyProfileToDocument, fetchProfile } from '../lib/profile'
import type { Profile } from '../lib/database.types'
import { saveGoogleRefreshToken } from '../lib/reminders'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

async function maybePersistGoogleToken(session: Session | null) {
  const refresh = session?.provider_refresh_token
  if (!session?.user || !refresh) return
  try {
    await saveGoogleRefreshToken({
      userId: session.user.id,
      refreshToken: refresh,
      accessToken: session.provider_token ?? undefined,
      scope: 'https://www.googleapis.com/auth/calendar.events',
    })
  } catch {
    // Token table may not exist yet during local setup
  }
}

async function hydrateUser(session: Session) {
  await maybePersistGoogleToken(session)
  await migrateLocalChecklistsIfNeeded(session.user.id)
  return fetchProfile(session.user.id)
}

type AuthContextValue = {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  refreshProfile: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<string | null>
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function appOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return import.meta.env.VITE_APP_URL || 'http://127.0.0.1:5173'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next)
    if (!next?.user) {
      setProfile(null)
      applyProfileToDocument(null)
      return
    }
    try {
      const p = await hydrateUser(next)
      setProfile(p)
      applyProfileToDocument(p)
    } catch {
      setProfile(null)
      applyProfileToDocument(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const p = await fetchProfile(session.user.id)
      setProfile(p)
      applyProfileToDocument(p)
    } catch {
      // keep existing profile on transient errors
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      applyProfileToDocument(null)
      return
    }

    let mounted = true

    const init = async () => {
      // Finish PKCE OAuth if we landed with ?code=
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          url.searchParams.delete('code')
          url.searchParams.delete('state')
          window.history.replaceState({}, document.title, url.pathname + url.search + url.hash)
        }
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      await applySession(data.session)
      if (mounted) setLoading(false)
    }

    void init()

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      // Defer Supabase calls to avoid auth deadlock
      setTimeout(() => {
        if (!mounted) return
        if (event === 'SIGNED_OUT') {
          void applySession(null)
          return
        }
        void applySession(next)
      }, 0)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
      async signInWithEmail(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error?.message ?? null
      },
      async signUpWithEmail(email, password, displayName) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName || undefined },
            emailRedirectTo: appOrigin(),
          },
        })
        return error?.message ?? null
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: appOrigin(),
            scopes: 'openid email profile https://www.googleapis.com/auth/calendar.events',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })
        return error?.message ?? null
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [loading, session, profile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
