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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await fetchProfile(userId)
      setProfile(p)
      applyProfileToDocument(p)
    } catch {
      setProfile(null)
      applyProfileToDocument(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user?.id) await loadProfile(session.user.id)
  }, [loadProfile, session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      applyProfileToDocument(null)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        void (async () => {
          await maybePersistGoogleToken(data.session)
          await migrateLocalChecklistsIfNeeded(data.session!.user.id)
          await loadProfile(data.session!.user.id)
          setLoading(false)
        })()
      } else {
        applyProfileToDocument(null)
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (next?.user) {
        void (async () => {
          await maybePersistGoogleToken(next)
          await migrateLocalChecklistsIfNeeded(next.user.id)
          await loadProfile(next.user.id)
        })()
      } else {
        setProfile(null)
        applyProfileToDocument(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

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
            emailRedirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
          },
        })
        return error?.message ?? null
      },
      async signInWithGoogle() {
        const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}`
        const { error } = await supabase.auth.signInWithOAuth({
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
