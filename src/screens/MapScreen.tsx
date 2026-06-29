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

export default function MapScreen() {
  const [loading, setLoading] = useState(false)
  const [tracking, setTracking] = useState(false)
  const { user } = useAuthStore()
  const { currentJourney, setCurrentJourney } = useJourneyStore()
  const { currentLocation, setCurrentLocation } = useLocationStore()

  useEffect(() => {
    initializeLocation()
  }, [])

  async function initializeLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required')
        return
      }

      const location = await getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
      }
    } catch (err) {
      console.error('Failed to initialize location:', err)
    }
  }

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
            title: `Journey at ${new Date().toLocaleTimeString()}`,
            start_location: {
              lat: location.latitude,
              lng: location.longitude,
              address: 'Current Location',
            },
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
