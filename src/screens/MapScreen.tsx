import React, { useState, useEffect } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  getCurrentLocation,
} from '../services/locationTracker'
import { supabase } from '../services/supabase'
import { useAuthStore, useJourneyStore, useLocationStore } from '../store'
import { Destination } from '../types/database'
import DestinationPicker from './DestinationPicker'

export default function MapScreen() {
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [destinationPickerVisible, setDestinationPickerVisible] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const { user } = useAuthStore()
  const { currentJourney, setCurrentJourney } = useJourneyStore()
  const { currentLocation, setCurrentLocation } = useLocationStore()

  useEffect(() => {
    async function initializeLocation() {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync()
        if (fgStatus !== 'granted') {
          Alert.alert('Permission Denied', 'Foreground location permission is required')
          return
        }

        // Background permission request (Android/iOS separate flows)
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync()
        if (bgStatus !== 'granted') {
          // Continue with foreground-only tracking but inform the user
          Alert.alert(
            'Background Permission Recommended',
            'Allow background location so tracking continues when app is closed. You can enable it in app settings.'
          )
        }

        const location = await getCurrentLocation()
        if (location) {
          setCurrentLocation(location)
        }

        // Example: register a geofence around current location (optional)
        // NOTE: This is a strategy placeholder — implement production-ready geofence management
        try {
          const geofenceRegion = {
            identifier: 'home-area',
            latitude: location?.latitude || 0,
            longitude: location?.longitude || 0,
            radius: 200, // meters
          }
          // expo-location doesn't provide an out-of-the-box geofence manager cross-platform.
          // Consider platform-specific APIs or a lightweight in-app geofence check in the background task.
          // e.g., save geofenceRegion to storage and evaluate in the background location task.
        } catch (gErr) {
          console.warn('Geofence setup skipped:', gErr)
        }
      } catch (err) {
        console.error('Failed to initialize location:', err)
      }
    }

    initializeLocation()
  }, [setCurrentLocation])

  async function startJourney() {
    if (!user) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    setLoading(true)
    try {
      const location = await getCurrentLocation()
      if (!location) {
        Alert.alert('Error', 'Could not get current location')
        return
      }

      const { data, error } = await supabase
        .from('journeys')
        .insert([
          {
            user_id: user.id,
            title: selectedDestination
              ? `Journey to ${selectedDestination.name}`
              : `Journey at ${new Date().toLocaleTimeString()}`,
            start_location: {
              lat: location.latitude,
              lng: location.longitude,
              address: 'Current Location',
            },
            destination_id: selectedDestination?.id ?? null,
            destination_lat: selectedDestination?.latitude ?? null,
            destination_lng: selectedDestination?.longitude ?? null,
            status: 'active',
          },
        ])
        .select()

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      if (data && data[0]) {
        setCurrentJourney(data[0])
        await startBackgroundLocationTracking(user.id, data[0].id)
        setTracking(true)
        Alert.alert('Success', 'Journey started!')
      }
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  async function stopJourney() {
    if (!currentJourney || !user) return

    setLoading(true)
    try {
      const location = await getCurrentLocation()

      const { error } = await supabase
        .from('journeys')
        .update({
          end_location: {
            lat: location?.latitude,
            lng: location?.longitude,
            address: 'Stop Location',
          },
          status: 'completed',
        })
        .eq('id', currentJourney.id)

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      await stopBackgroundLocationTracking()
      setCurrentJourney(null)
      setTracking(false)
      Alert.alert('Success', 'Journey stopped!')
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!currentLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          description="Current position"
          pinColor="#208AEF"
        />
      </MapView>

      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {tracking ? '🔴 Tracking Active' : '⚪ Not Tracking'}
          </Text>
        </View>

        {!tracking && (
          <TouchableOpacity
            style={styles.destinationButton}
            onPress={() => setDestinationPickerVisible(true)}
          >
            <Text style={styles.destinationButtonText}>
              {selectedDestination ? `📍 ${selectedDestination.name}` : 'Pick Destination'}
            </Text>
          </TouchableOpacity>
        )}

        {!tracking ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startJourney}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Start Journey</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopJourney}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Stop Journey</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <DestinationPicker
        visible={destinationPickerVisible}
        onClose={() => setDestinationPickerVisible(false)}
        onSelect={(d) => setSelectedDestination(d)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  statusContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  destinationButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#208AEF',
    backgroundColor: '#f0f7ff',
    marginBottom: 12,
  },
  destinationButtonText: {
    color: '#208AEF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
