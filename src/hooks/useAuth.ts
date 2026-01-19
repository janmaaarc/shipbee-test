import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  })

  const fetchProfile = useCallback(async (userId: string, session: Session) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Still set user/session even if profile fetch fails
        setState({
          user: session.user,
          profile: null,
          session,
          loading: false,
          error: 'Failed to load profile',
        })
        return
      }

      setState({
        user: session.user,
        profile: profile as Profile,
        session,
        loading: false,
        error: null,
      })
    } catch {
      setState({
        user: session.user,
        profile: null,
        session,
        loading: false,
        error: 'Unexpected error loading profile',
      })
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState((s) => ({ ...s, loading: false, error: error.message }))
        return
      }

      if (session?.user) {
        fetchProfile(session.user.id, session)
      } else {
        setState((s) => ({ ...s, loading: false }))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session)
        } else {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: null,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  async function signInWithEmail(email: string) {
    // Guard against SSR/non-browser environments
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : ''

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  return {
    ...state,
    signInWithEmail,
    signOut,
    clearError,
    isAdmin: state.profile?.role === 'admin',
    isCustomer: state.profile?.role === 'customer',
  }
}
