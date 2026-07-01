import { StyleSheet, Text, View } from 'react-native'

export interface WatchMapProps {
  travelerLat: number | null
  travelerLng: number | null
  destinationLat: number | null
  destinationLng: number | null
}

// Native fallback. Watchers are expected to use the zero-install web page, so on
// native we show the raw coordinates rather than pulling in a native map. Metro
// resolves watch-map.web.tsx ahead of this file on web.
export default function WatchMap({
  travelerLat,
  travelerLng,
  destinationLat,
  destinationLng,
}: WatchMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Traveler</Text>
      <Text style={styles.coord}>
        {travelerLat != null && travelerLng != null
          ? `${travelerLat.toFixed(5)}, ${travelerLng.toFixed(5)}`
          : 'Waiting for live location…'}
      </Text>
      {destinationLat != null && destinationLng != null ? (
        <>
          <Text style={styles.label}>Destination</Text>
          <Text style={styles.coord}>
            {destinationLat.toFixed(5)}, {destinationLng.toFixed(5)}
          </Text>
        </>
      ) : null}
      <Text style={styles.hint}>Open this link in a browser for the live map.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 4 },
  label: { fontSize: 12, color: '#666', marginTop: 12, textTransform: 'uppercase' },
  coord: { fontSize: 18, fontWeight: '700', color: '#111' },
  hint: { marginTop: 24, fontSize: 13, color: '#888', textAlign: 'center' },
})
