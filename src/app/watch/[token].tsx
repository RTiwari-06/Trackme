import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import WatchMap from '../../components/watch-map'
import {
  getWatchSnapshot,
  subscribeToPings,
  type Ping,
  type WatchSnapshot,
} from '../../services/journeyLinks'

// Palette — the TrackMe journey identity. Blue = live, amber = almost there,
// green = the "reached safely" resolution this whole page exists to deliver.
const C = {
  ink: '#0E1830',
  live: '#208AEF',
  almost: '#FFB020',
  safe: '#1F8A4C',
  surface: '#FFFFFF',
  text: '#101828',
  muted: '#6B7488',
  line: '#EAEDF2',
}

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

function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 45) return 'updated just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `updated ${mins} min ago`
  const hrs = Math.round(mins / 60)
  return `updated ${hrs} hr ago`
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const REFRESH_MS = 15_000
const ASSUMED_SPEED_KMH = 25 // rough ETA basis until routing is wired
const ALMOST_THERE_KM = 0.6

// The signature: a live location pulses; on arrival it goes solid. Respects the
// OS reduce-motion setting.
function StatusDot({ color, pulse }: { color: string; pulse: boolean }) {
  const anim = useRef(new Animated.Value(0)).current
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {})
  }, [])

  useEffect(() => {
    if (!pulse || reduceMotion) return
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1900, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, reduceMotion, anim])

  return (
    <View style={styles.dotWrap}>
      {pulse && !reduceMotion && (
        <Animated.View
          style={[
            styles.dotRing,
            {
              backgroundColor: color,
              opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
              transform: [
                { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.6] }) },
              ],
            },
          ]}
        />
      )}
      <View style={[styles.dotCore, { backgroundColor: color }]} />
    </View>
  )
}

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
      setError('This link isn’t valid.')
      setLoading(false)
      return
    }
    let cancelled = false
    getWatchSnapshot(token)
      .then((snap) => {
        if (cancelled) return
        if (!snap) {
          setError('This link isn’t active anymore.')
          return
        }
        setSnapshot(snap)
        if (snap.latest) setPing(snap.latest)
      })
      .catch(() => {
        if (!cancelled) setError('We couldn’t load this journey.')
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
        <Brand />
        <ActivityIndicator color={C.live} style={{ marginTop: 20 }} />
        <Text style={styles.centerText}>Finding your traveler…</Text>
      </View>
    )
  }

  if (error || !snapshot) {
    return (
      <View style={styles.center}>
        <Brand />
        <Text style={styles.centerTitle}>Link isn’t active</Text>
        <Text style={styles.centerText}>
          {error ?? 'This link isn’t active anymore.'} Ask them to share a new one.
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
  const etaMin =
    distanceKm != null ? Math.max(1, Math.round((distanceKm / ASSUMED_SPEED_KMH) * 60)) : null

  // Journey phase drives colour + the human status line.
  const phase = arrived
    ? 'arrived'
    : !ping
      ? 'connecting'
      : distanceKm != null && distanceKm <= ALMOST_THERE_KM
        ? 'almost'
        : 'enroute'
  const phaseColor =
    phase === 'arrived' ? C.safe : phase === 'almost' ? C.almost : C.live
  const phaseLine =
    phase === 'arrived'
      ? 'Reached safely'
      : phase === 'connecting'
        ? 'Connecting to live location…'
        : phase === 'almost'
          ? 'Almost there'
          : 'On the way'

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        <WatchMap
          travelerLat={ping?.latitude ?? null}
          travelerLng={ping?.longitude ?? null}
          destinationLat={snapshot.destination_lat}
          destinationLng={snapshot.destination_lng}
        />
      </View>

      {/* Trust pill — a worried parent needs to know this is really TrackMe. */}
      <SafeAreaView edges={['top']} style={styles.topLayer} pointerEvents="none">
        <View style={styles.brandPill}>
          <View style={styles.brandDot} />
          <Text style={styles.brandPillText}>TrackMe</Text>
        </View>
      </SafeAreaView>

      {/* Status console */}
      <SafeAreaView edges={['bottom']} style={styles.bottomLayer}>
        <View style={styles.sheet}>
          <View style={styles.statusRow}>
            <StatusDot color={phaseColor} pulse={!arrived} />
            <Text style={[styles.statusLine, { color: arrived ? C.safe : C.text }]}>
              {phaseLine}
            </Text>
            {!arrived && ping && (
              <Text style={styles.updated}>{timeAgo(ping.timestamp)}</Text>
            )}
          </View>

          {arrived ? (
            <Text style={styles.arrivedSub}>
              {snapshot.arrived_at ? `Arrived at ${clockTime(snapshot.arrived_at)}` : 'Journey complete'}
            </Text>
          ) : (
            <View style={styles.dataRow}>
              <View style={styles.dataCell}>
                <Text style={styles.dataLabel}>Arriving in</Text>
                <Text style={styles.dataValue}>{etaMin != null ? `${etaMin} min` : '—'}</Text>
              </View>
              <View style={styles.dataDivider} />
              <View style={styles.dataCell}>
                <Text style={styles.dataLabel}>Distance away</Text>
                <Text style={styles.dataValue}>
                  {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.foot}>
            TrackMe · {arrived ? 'journey complete' : 'following live'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

function Brand() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandDot} />
      <Text style={styles.brandWordmark}>TrackMe</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink },
  mapLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  topLayer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(14,24,48,0.9)',
  },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.live,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  brandPillText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  bottomLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: C.surface,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    marginBottom: 8,
    borderRadius: 24,
    shadowColor: C.ink,
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLine: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, flexShrink: 1 },
  updated: { marginLeft: 'auto', fontSize: 12, color: C.muted, fontWeight: '500' },

  dotWrap: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  dotCore: { width: 12, height: 12, borderRadius: 6 },

  dataRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  dataCell: { flex: 1 },
  dataDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: C.line, marginHorizontal: 16 },
  dataLabel: { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.3 },
  dataValue: { fontSize: 26, fontWeight: '800', color: C.text, marginTop: 4, letterSpacing: -0.5 },

  arrivedSub: { fontSize: 15, color: C.muted, marginTop: 8, marginLeft: 28 },

  foot: {
    marginTop: 18,
    fontSize: 12,
    color: C.muted,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // Loading / error
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: C.surface,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandWordmark: { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: 0.2 },
  centerTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginTop: 20 },
  centerText: { fontSize: 15, color: C.muted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
})
