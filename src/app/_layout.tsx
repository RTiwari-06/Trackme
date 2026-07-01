import React, { useEffect, useState } from 'react'
import { Pressable, Text } from 'react-native'
import { Stack } from 'expo-router'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store'
import ErrorBoundary from '../components/ErrorBoundary'

// Header action for the authenticated area. Signing out clears the Supabase
// session; onAuthStateChange then nulls the user and the guard sends the
// traveler back to the auth screen.
function SignOutButton() {
  return (
    <Pressable
      onPress={() => supabase.auth.signOut()}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, paddingHorizontal: 4 })}
    >
      <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Sign out</Text>
    </Pressable>
  )
}

export default function RootLayout() {
  const { user, setUser, setSession, setIsLoading, passwordRecovery, setPasswordRecovery } =
    useAuthStore()
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

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // A recovery link establishes a session too; flag it so the guard keeps
      // the user on the auth screen to set a new password instead of the map.
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
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
        setPasswordRecovery(false)
      }
    })

    checkSession()

    return () => {
      data?.subscription?.unsubscribe()
    }
  }, [setIsLoading, setSession, setUser, setPasswordRecovery])

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
      <Stack.Protected guard={!user || passwordRecovery}>
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!!user && !passwordRecovery}>
        <Stack.Screen
          name="map"
          options={{
            title: 'TrackMe',
            headerShown: true,
            headerRight: () => <SignOutButton />,
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
