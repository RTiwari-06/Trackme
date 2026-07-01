import { supabase } from './supabase'

// A live snapshot of a shared journey, returned by the get_watch_snapshot RPC.
export interface WatchSnapshot {
  journey_id: string
  status: 'active' | 'completed' | 'cancelled'
  arrived_at: string | null
  destination_lat: number | null
  destination_lng: number | null
  latest: {
    latitude: number
    longitude: number
    timestamp: string
  } | null
}

export interface Ping {
  latitude: number
  longitude: number
  timestamp: string
}

// Base URL a watcher opens (zero-install web page). Configure per environment;
// falls back to relative URLs so the deployed web build's own origin is used.
export const WATCH_BASE =
  process.env.EXPO_PUBLIC_WATCH_URL ?? process.env.EXPO_PUBLIC_API_URL ?? ''

// Unguessable token for the watcher URL. Prefers the platform CSPRNG and falls
// back to Math.random only where crypto is unavailable (older RN runtimes).
function generateToken(): string {
  const c: Crypto | undefined = (globalThis as any).crypto
  if (c?.randomUUID) {
    return `${c.randomUUID()}${c.randomUUID()}`.replace(/-/g, '')
  }
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(24)
    c.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  )
}

// Create a tokenized, auto-expiring link for a journey. RLS ("Owner can manage
// journey links") ensures only the journey owner can insert.
export async function createJourneyLink(journeyId: string, ttlMinutes = 180) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString()

  const { data, error } = await supabase
    .from('journey_links')
    .insert({ journey_id: journeyId, token, expires_at: expiresAt })
    .select()
    .single()

  if (error) throw error
  return data as { id: string; token: string; journey_id: string; expires_at: string }
}

// Revoke every active link for a journey ("Stop Sharing").
export async function revokeJourneyLinks(journeyId: string) {
  const { error } = await supabase
    .from('journey_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('journey_id', journeyId)
    .is('revoked_at', null)

  if (error) throw error
}

// Full watcher URL for a token.
export function watchUrl(token: string): string {
  return `${WATCH_BASE}/watch/${token}`
}

// Validate a token and load the current snapshot. Returns null for an
// invalid/expired/revoked token.
export async function getWatchSnapshot(token: string): Promise<WatchSnapshot | null> {
  const { data, error } = await supabase.rpc('get_watch_snapshot', { p_token: token })
  if (error) throw error
  return (data as WatchSnapshot | null) ?? null
}

// Subscribe to live pings for a journey via Supabase Realtime. Returns an
// unsubscribe function.
export function subscribeToPings(journeyId: string, onPing: (ping: Ping) => void) {
  const channel = supabase
    .channel(`watch:${journeyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'gps_pings',
        filter: `journey_id=eq.${journeyId}`,
      },
      (payload) => {
        const row = payload.new as {
          latitude: number
          longitude: number
          timestamp: string
        }
        onPing({
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp,
        })
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
