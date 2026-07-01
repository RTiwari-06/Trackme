import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import { supabase } from '../services/supabase'

const LOCATION_TASK_NAME = 'background-location-task'

// The background task is registered once at module scope (Expo requirement —
// TaskManager.defineTask must run in the global scope so the OS can re-invoke it
// after the app is killed). The task itself has no parameters, so the active
// user/journey is held in module state set by startBackgroundLocationTracking.
//
// NOTE: if the OS fully relaunches the process for a background event, this
// module state resets and pings are skipped until tracking is restarted. That's
// an accepted limitation for now (see roadmap: background reliability / offline
// queue). Redis was removed entirely — it is a Node TCP client and cannot run in
// React Native; real-time fan-out belongs on a server, not in the app bundle.
let trackingContext: { userId: string; journeyId: string } | null = null

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error)
    return
  }
  if (!data || !trackingContext) return

  const { locations } = data
  if (!locations || locations.length === 0) return

  const { userId, journeyId } = trackingContext
  const rows = locations.map((location: any) => ({
    user_id: userId,
    journey_id: journeyId,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    heading: location.coords.heading,
    speed: location.coords.speed,
    timestamp: new Date(location.timestamp ?? Date.now()).toISOString(),
  }))

  try {
    const { error: insertError } = await supabase.from('gps_pings').insert(rows)
    if (insertError) {
      console.error('Failed to persist GPS pings:', insertError.message)
    }
  } catch (err) {
    console.error('GPS ping insert threw:', err)
  }
})

export async function startBackgroundLocationTracking(userId: string, journeyId: string) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      console.error('Location permission not granted')
      return false
    }

    trackingContext = { userId, journeyId }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'TrackMe is sharing your journey',
        notificationBody: 'Your location is being shared with your watcher.',
      },
    })

    console.log('✓ Background location tracking started')
    return true
  } catch (err) {
    console.error('Failed to start background tracking:', err)
    return false
  }
}

export async function stopBackgroundLocationTracking() {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      console.log('✓ Background location tracking stopped')
      trackingContext = null
      return true
    }
  } catch (err) {
    console.error('Failed to stop background tracking:', err)
  }
  trackingContext = null
  return false
}

export async function getCurrentLocation() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      console.error('Location permission not granted')
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
    }
  } catch (err) {
    console.error('Failed to get current location:', err)
    return null
  }
}
