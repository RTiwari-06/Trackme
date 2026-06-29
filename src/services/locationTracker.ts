import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import redisClient, { storeGPSPing } from '../services/redis'
import { supabase } from '../services/supabase'

const LOCATION_TASK_NAME = 'background-location-task'

export async function startBackgroundLocationTracking(userId: string, journeyId: string) {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      console.error('Location permission not granted')
      return false
    }

    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
    }

    await TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
      if (error) {
        console.error('Background location error:', error)
        return
      }

      if (data) {
        const { locations } = data
        if (locations && locations.length > 0) {
          const location = locations[0]
          const gpsData = {
            userId,
            journeyId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: new Date().toISOString(),
          }

          try {
            // Store in Redis (real-time)
            await storeGPSPing(userId, gpsData)
            console.log('✓ GPS ping stored:', gpsData)
          } catch (err) {
            console.error('Redis error:', err)
          }
        }
      }
    })

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000, // 10 seconds
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
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
      return true
    }
  } catch (err) {
    console.error('Failed to stop background tracking:', err)
  }
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

export async function archiveGPSPingsToSupabase(userId: string) {
  try {
    // Get pings from Redis and store in Supabase
    const keys = await redisClient.keys(`gps:${userId}:*`)
    if (keys.length === 0) return

    const pings = await Promise.all(
      keys.map(async (key) => {
        const data = await redisClient.get(key)
        return JSON.parse(data || '{}')
      })
    )

    if (pings.length > 0) {
      await supabase.from('gps_pings').insert(pings)
      console.log(`✓ Archived ${pings.length} GPS pings to Supabase`)
    }
  } catch (err) {
    console.error('Failed to archive GPS pings:', err)
  }
}
