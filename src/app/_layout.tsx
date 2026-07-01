import React, { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store'
import ErrorBoundary from '../components/ErrorBoundary'

export default function RootLayout() {
  const { user, session, setUser, setSession, setIsLoading } = useAuthStore()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    async function checkSession() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session check error:', error)
          return
        }

        if (data.session) {
          setSession(data.session)
          if (data.session.user) {
            setUser({
              id: data.session.user.id,
              email: data.session.user.email || '',
              full_name: data.session.user.user_metadata?.full_name || null,
              phone_number: data.session.user.user_metadata?.phone_number || null,
              profile_picture_url: data.session.user.user_metadata?.avatar_url || null,
              created_at: data.session.user.created_at,
              updated_at: data.session.user.updated_at || new Date().toISOString(),
            })
          }
        }
      } catch (err) {
        console.error('Failed to check session:', err)
      } finally {
        setIsLoading(false)
        setInitialized(true)
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSession(session)
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || null,
          phone_number: session.user.user_metadata?.phone_number || null,
          profile_picture_url: session.user.user_metadata?.avatar_url || null,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || new Date().toISOString(),
        })
      } else {
        setSession(null)
        setUser(null)
      }
    })

    checkSession()

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [setIsLoading, setSession, setUser])

  if (!initialized) {
    return null
  }

  return (
    <ErrorBoundary>
      <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#111111',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen
          name="map"
          options={{
            title: 'TrackMe',
            headerShown: true,
          }}
        />
      </Stack.Protected>

      <Stack.Screen
        name="watch/[token]"
        options={{
          title: 'Watcher',
          headerShown: false,
        }}
      />
    </Stack>
    </ErrorBoundary>
  )
}
