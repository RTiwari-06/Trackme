// Authenticated web home.
//
// react-native-maps and background location can't run in a browser, so the
// traveler's live tracking lives in the phone app (web = watcher, phone =
// traveler). Instead of a dead placeholder, signed-in web users get a real
// dashboard: how to start a journey, their recent journeys, and a link to
// manage watchers. Metro resolves this `.web` file ahead of map.tsx on web.
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

import { supabase } from '../services/supabase'
import { useAuthStore } from '../store'
import type { Journey } from '../types/database'

const C = {
  ink: '#0E1830',
  primary: '#208AEF',
  beacon: '#FFB020',
  beaconBg: '#FFF6E6',
  surface: '#FFFFFF',
  page: '#F4F6FA',
  border: '#E3E8F0',
  text: '#101828',
  muted: '#6B7488',
  active: '#1F8A4C',
  activeBg: '#E7F6EE',
}

function greetingName(email: string | undefined): string {
  if (!email) return 'traveler'
  return email.split('@')[0]
}

function statusStyle(status: Journey['status']) {
  if (status === 'active') return { color: C.active, bg: C.activeBg, label: 'Active' }
  if (status === 'completed') return { color: C.muted, bg: C.page, label: 'Completed' }
  return { color: C.muted, bg: C.page, label: 'Cancelled' }
}

const STEPS = [
  'Open TrackMe on your phone and sign in.',
  'Pick a destination, then start the journey.',
  'Tap “Share live link” and send it — they follow along here, no app needed.',
]

export default function MapWebHome() {
  const { user } = useAuthStore()
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('journeys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (cancelled) return
        setJourneys((data as Journey[]) ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SafeAreaView edges={['bottom']} style={styles.inner}>
          <Text style={styles.hi}>Hi {greetingName(user?.email)} 👋</Text>
          <Text style={styles.sub}>
            This is your TrackMe web home. Live journeys run on your phone — here you can
            review them and manage who’s watching.
          </Text>

          {/* How live tracking works */}
          <View style={styles.callout}>
            <View style={styles.calloutHead}>
              <View style={styles.beaconDot} />
              <Text style={styles.calloutTitle}>Start a live journey on your phone</Text>
            </View>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Recent journeys */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent journeys</Text>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={C.primary} />
            </View>
          ) : journeys.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No journeys yet. Start your first one from the phone app.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {journeys.map((j) => {
                const s = statusStyle(j.status)
                return (
                  <View key={j.id} style={styles.item}>
                    <View style={styles.itemMain}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {j.title ?? 'Journey'}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {new Date(j.created_at).toLocaleString()}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Watchers */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Watchers</Text>
          </View>
          <Link href="/explore" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.watchersBtn, pressed && styles.watchersBtnPressed]}
            >
              <Text style={styles.watchersBtnText}>Manage watchers & shared links</Text>
              <Text style={styles.watchersChevron}>›</Text>
            </Pressable>
          </Link>
        </SafeAreaView>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.page },
  scroll: { flexGrow: 1 },
  inner: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  hi: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  sub: { fontSize: 15, color: C.muted, marginTop: 8, lineHeight: 22 },

  callout: {
    backgroundColor: C.beaconBg,
    borderRadius: 16,
    padding: 18,
    marginTop: 22,
  },
  calloutHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  beaconDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.beacon },
  calloutTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surface,
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
  },
  stepText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 21 },

  sectionHead: { marginTop: 28, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  loading: { paddingVertical: 24, alignItems: 'center' },
  empty: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 20,
  },
  emptyText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },

  list: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: 12,
  },
  itemMain: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  itemMeta: { fontSize: 13, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  watchersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  watchersBtnPressed: { backgroundColor: C.page },
  watchersBtnText: { fontSize: 15, fontWeight: '600', color: C.text },
  watchersChevron: { fontSize: 22, color: C.muted, marginTop: Platform.OS === 'web' ? -2 : 0 },
})
