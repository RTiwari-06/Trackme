import { useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'

// EventSource is only available in the web WebView context; configure the
// backend origin via EXPO_PUBLIC_API_URL (empty keeps relative URLs on web).
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>
html, body, #map { height: 100%; margin: 0; padding: 0; background: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
#map { display: flex; align-items: center; justify-content: center; color: #666; padding: 24px; }
#map.ready { background: #e5e5e5; }
.banner { padding: 10px 14px; background: #111; color: #fff; font-size: 14px; }
.status { position: absolute; top: 12px; left: 12px; right: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.92); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
.row { display: flex; justify-content: space-between; gap: 12px; }
.chip { padding: 10px 12px; border-radius: 10px; background: #f2f2f2; min-width: 0; }
.label { color: #666; font-size: 12px; }
.value { color: #111; font-weight: 700; font-size: 16px; margin-top: 4px; }
</style>
</head>
<body>
<div class="banner">TrackMe watcher</div>
<div id="map">
  <div>
    <div style="font-size: 18px; font-weight: 800;">Waiting for live location…</div>
    <div style="margin-top: 8px; color: #666;">Keep this page open.</div>
  </div>
</div>
<script>
function setText(id, text) {
  const el = document.getElementById(id)
  if (el) el.textContent = text
}
function updateStatus(state, eta, distance) {
  const map = document.getElementById('map')
  map.innerHTML = ''
  map.classList.add('ready')
  const wrap = document.createElement('div')
  wrap.className = 'status'
  wrap.innerHTML = '<div class="row"><div class="chip"><div class="label">Status</div><div class="value">' + state + '</div></div><div class="chip"><div class="label">ETA</div><div class="value">' + (eta ?? '--') + '</div></div><div class="chip"><div class="label">Distance</div><div class="value">' + (distance ?? '--') + '</div></div></div>'
  map.appendChild(wrap)
}
let arrived = false
</script>
</body>
</html>
`

export default function WatcherMapScreen() {
  const params = useLocalSearchParams<{ token?: string }>()
  const token = typeof params.token === 'string' ? params.token : ''
  const [status, setStatus] = useState<'loading' | 'live' | 'arrived' | 'error'>(() => {
    if (!token) return 'error'
    if (typeof window === 'undefined' || !('EventSource' in window)) return 'error'
    return 'loading'
  })
  const [prevToken, setPrevToken] = useState(token)
  if (token !== prevToken) {
    setPrevToken(token)
    setStatus(!token || typeof window === 'undefined' || !('EventSource' in window) ? 'error' : 'loading')
  }
  const [eta, setEta] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    if (!token || typeof window === 'undefined' || !('EventSource' in window)) {
      return
    }

    let es: EventSource | null = null
    try {
      es = new EventSource(`${API_BASE}/api/watch/stream/${token}`)
      eventSourceRef.current = es
    } catch (e) {
      Promise.resolve().then(() => {
        setStatus('error')
      })
      return
    }

    es.onopen = () => setStatus((s) => (s === 'error' ? s : 'live'))
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const nextEta: string | null = data.eta ?? null
        const nextDistance: string | null = data.distance ?? null
        const arrived = data.type === 'arrived' || data.arrived === true
        setEta(nextEta)
        setDistance(nextDistance)
        setStatus(arrived ? 'arrived' : 'live')
        webViewRef.current?.injectJavaScript(
          `updateStatus(${JSON.stringify(arrived ? 'Arrived' : 'Live')}, ${JSON.stringify(
            nextEta,
          )}, ${JSON.stringify(nextDistance)}); true;`,
        )
      } catch (e) {
        // ignore malformed frames
      }
    }
    es.onerror = () => setStatus((s) => (s === 'arrived' ? s : 'error'))

    return () => {
      es?.close()
    }
  }, [token])

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML, baseUrl: API_BASE || '/' }}
        javaScriptEnabled
        domStorageEnabled
        onLoad={() => setStatus((s) => (s === 'loading' ? 'live' : s))}
      />
      <View style={styles.pill}>
        <Text style={styles.pillText}>
          {status === 'loading' ? 'Loading…' : status === 'error' ? 'Unavailable' : status === 'arrived' ? 'Arrived' : 'Live'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  pill: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  pillText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
})
