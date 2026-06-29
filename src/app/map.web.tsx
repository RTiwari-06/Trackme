// Web-only route for the map screen.
//
// react-native-maps has no web implementation (it calls codegenNativeComponent,
// which only exists in the native runtime), and expo-router pulls every route
// into the bundle graph — so importing the native MapScreen here would break the
// entire web bundle. Metro resolves this `.web` file ahead of `map.tsx` on web,
// keeping react-native-maps out of the web bundle entirely.
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { Spacing } from '@/constants/theme'

export default function MapWebScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Map</ThemedText>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText themeColor="textSecondary" style={styles.center}>
            Live tracking and the map view are only available in the native app.
            Open TrackMe on your phone (Expo Go or a development build) to start a
            journey.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    maxWidth: 480,
  },
  center: { textAlign: 'center' },
})
