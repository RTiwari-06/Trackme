import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { useLocalSearchParams } from 'expo-router'

// React Native's fetch requires absolute URLs; configure the backend origin via
// EXPO_PUBLIC_API_URL (empty string keeps relative URLs working on web).
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

export default function WatcherPage() {
  const params = useLocalSearchParams<{ token?: string }>()
  const token = typeof params.token === 'string' ? params.token : ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [valid, setValid] = useState<boolean | null>(null)
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    if (!token) {
      setError('Invalid watch link')
      setValid(false)
      setLoading(false)
      return
    }
    let cancelled = false
    async function check() {
      try {
        const res = await fetch(`${API_BASE}/api/watch/${token}`)
        if (!res.ok) throw new Error('Link not found or expired')
        await res.json()
        if (cancelled) return
        setValid(true)
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message ?? 'Invalid watch link')
          setValid(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.hint}>Checking watcher link…</Text>
      </View>
    )
  }

  if (!valid) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Link unavailable</Text>
        <Text style={styles.hint}>
          {error ?? 'This watch link has expired or been revoked.'}
        </Text>
      </View>
    )
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: `${API_BASE}/watch/map?token=${token}` }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={styles.hint}>Loading live map…</Text>
        </View>
      )}
      onError={(e) => {
        Alert.alert('Map failed', e.nativeEvent.description)
        setError('Map failed to load')
      }}
      javaScriptEnabled
      domStorageEnabled
    />
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
})
