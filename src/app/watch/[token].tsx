import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import WatchMap from '../../components/watch-map'
import {
  getWatchSnapshot,
  subscribeToPings,
  type Ping,
  type WatchSnapshot,
} from '../../services/journeyLinks'

// Great-circle distance in km between two coordinates.
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

const REFRESH_MS = 15_000
const ASSUMED_SPEED_KMH = 25 // rough ETA basis until routing is wired

export default function WatcherPage() {
  const params = useLocalSearchParams<{ token?: string }>()
  const token = typeof params.token === 'string' ? params.token : ''

  const [loading, setLoading] = useState(true)
  const [snapshot, setSnapshot] = useState<WatchSnapshot | null>(null)
  const [ping, setPing] = useState<Ping | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validate the token and load the first snapshot.
  useEffect(() => {
    if (!token) {
      setError('Invalid watch link')
      setLoading(false)
      return
    }
    let cancelled = false
    getWatchSnapshot(token)
      .then((snap) => {
        if (cancelled) return
        if (!snap) {
          setError('This link has expired or been revoked.')
          return
        }
        setSnapshot(snap)
        if (snap.latest) setPing(snap.latest)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the journey.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Live position via Realtime, plus a periodic snapshot refresh for status /
  // arrival (and as a fallback if Realtime is unavailable).
  const journeyId = snapshot?.journey_id
  useEffect(() => {
    if (!journeyId) return
    const unsubscribe = subscribeToPings(journeyId, setPing)
    const interval = setInterval(() => {
      getWatchSnapshot(token)
        .then((snap) => {
          if (!snap) return
          setSnapshot(snap)
          setPing((prev) => prev ?? snap.latest)
        })
        .catch(() => {})
    }, REFRESH_MS)
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [journeyId, token])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.hint}>Checking watcher link…</Text>
      </View>
    )
  }

  if (error || !snapshot) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Link unavailable</Text>
        <Text style={styles.hint}>
          {error ?? 'This watch link has expired or been revoked.'}
        </Text>
      </View>
    )
  }

  const arrived = snapshot.status === 'completed' || snapshot.arrived_at != null
  const hasDest = snapshot.destination_lat != null && snapshot.destination_lng != null
  const distanceKm =
    ping && hasDest
      ? haversineKm(
          ping.latitude,
          ping.longitude,
          snapshot.destination_lat as number,
          snapshot.destination_lng as number,
        )
      : null
  const etaMin = distanceKm != null ? Math.max(1, Math.round((distanceKm / ASSUMED_SPEED_KMH) * 60)) : null
  const statusLabel = arrived ? 'Arrived' : ping ? 'Live' : 'Waiting…'

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <WatchMap
          travelerLat={ping?.latitude ?? null}
          travelerLng={ping?.longitude ?? null}
          destinationLat={snapshot.destination_lat}
          destinationLng={snapshot.destination_lng}
        />
      </View>

      <View style={styles.statusBar}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Status</Text>
          <Text style={styles.chipValue}>{statusLabel}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>ETA</Text>
          <Text style={styles.chipValue}>{arrived ? '—' : etaMin != null ? `${etaMin} min` : '--'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Distance</Text>
          <Text style={styles.chipValue}>
            {arrived ? '—' : distanceKm != null ? `${distanceKm.toFixed(1)} km` : '--'}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  mapWrap: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 12 },
  hint: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  statusBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  chip: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#f2f2f2' },
  chipLabel: { color: '#666', fontSize: 12 },
  chipValue: { color: '#111', fontWeight: '700', fontSize: 16, marginTop: 4 },
})
