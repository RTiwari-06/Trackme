import { useEffect, useRef } from 'react'

export interface WatchMapProps {
  travelerLat: number | null
  travelerLng: number | null
  destinationLat: number | null
  destinationLng: number | null
}

// Leaflet is loaded from a CDN on demand (kept out of the RN bundle). The
// watcher page is web-only, so this component only ever runs in the browser.
let leafletPromise: Promise<any> | null = null
function loadLeaflet(): Promise<any> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Leaflet requires a browser environment'))
  }
  const existing = (window as any).L
  if (existing) return Promise.resolve(existing)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve((window as any).L)
    script.onerror = () => reject(new Error('Failed to load Leaflet'))
    document.head.appendChild(script)
  })
  return leafletPromise
}

export default function WatchMap({
  travelerLat,
  travelerLng,
  destinationLat,
  destinationLng,
}: WatchMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const travelerMarkerRef = useRef<any>(null)
  const destMarkerRef = useRef<any>(null)

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return
        leafletRef.current = L
        const center: [number, number] =
          travelerLat != null && travelerLng != null
            ? [travelerLat, travelerLng]
            : [28.6139, 77.209] // Delhi fallback until first ping
        const map = L.map(containerRef.current).setView(center, 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)
        mapRef.current = map
      })
      .catch(() => {
        /* map stays blank; the page still shows status text */
      })
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reflect traveler / destination positions whenever they change.
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    if (travelerLat != null && travelerLng != null) {
      const pos: [number, number] = [travelerLat, travelerLng]
      if (!travelerMarkerRef.current) {
        travelerMarkerRef.current = L.marker(pos).addTo(map).bindPopup('Traveler')
      } else {
        travelerMarkerRef.current.setLatLng(pos)
      }
      map.panTo(pos)
    }

    if (destinationLat != null && destinationLng != null) {
      const dpos: [number, number] = [destinationLat, destinationLng]
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(dpos).addTo(map).bindPopup('Destination')
      } else {
        destMarkerRef.current.setLatLng(dpos)
      }
    }
  }, [travelerLat, travelerLng, destinationLat, destinationLng])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
