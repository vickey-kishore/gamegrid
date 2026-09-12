'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  userRole: 'admin' | 'creator' | 'player' | null
  isMasterAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(!!supabase)
  const [userRole, setUserRole] = useState<'admin' | 'creator' | 'player' | null>(null)
  const [isMasterAdmin, setIsMasterAdmin] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Function to fetch user profile
    const fetchUserProfile = async (userId: string) => {
      try {
        if (!supabase) return 'player'

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error('Error fetching profile:', error)
          return 'player'
        }

        return data?.role || 'player'
      } catch (error) {
        console.error('Error fetching profile:', error)
        return 'player'
      }
    }

    // Convert Supabase user to custom User type
    const convertUser = (supabaseUser: SupabaseUser | null): User | null => {
      if (!supabaseUser) return null
      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name,
        picture: supabaseUser.user_metadata?.picture,
      }
    }

    // Get initial session
    if (supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session)
        setUser(convertUser(session?.user ?? null))

        if (session?.user) {
          const role = await fetchUserProfile(session.user.id)
          setUserRole(role)
          setIsMasterAdmin(role === 'admin')
        } else {
          setUserRole(null)
          setIsMasterAdmin(false)
        }

        setLoading(false)
      })

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session)
        setUser(convertUser(session?.user ?? null))

        if (session?.user) {
          const role = await fetchUserProfile(session.user.id)
          setUserRole(role)
          setIsMasterAdmin(role === 'admin')
        } else {
          setUserRole(null)
          setIsMasterAdmin(false)
        }

        setLoading(false)
      })

      return () => subscription.unsubscribe()
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase is not configured' } as AuthError }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isConfigured, userRole, isMasterAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
