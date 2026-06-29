import { create } from 'zustand'
import { User, Journey, Destination } from '../types/database'

// Minimal runtime validators (lightweight alternative to zod)
function isNumber(n: any): n is number {
  return typeof n === 'number' && !Number.isNaN(n)
}
function isString(s: any): s is string {
  return typeof s === 'string'
}
function isUUID(s: any): s is string {
  return isString(s) && /^[0-9a-fA-F-]{36}$/.test(s)
}
function validateLocation(obj: any): obj is { latitude: number; longitude: number } {
  return (
    obj != null &&
    isNumber(obj.latitude) &&
    isNumber(obj.longitude) &&
    Math.abs(obj.latitude) <= 90 &&
    Math.abs(obj.longitude) <= 180
  )
}
function validateJourney(obj: any): obj is Journey {
  return (
    obj != null &&
    (isUUID(obj.id) || isString(obj.id)) &&
    (obj.user_id == null || isString(obj.user_id))
  )
}

interface AuthState {
  user: User | null
  session: Record<string, any> | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Record<string, any> | null) => void
  setIsLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setSession: (session) => {
    if (session && typeof session !== 'object') {
      console.warn('Rejected non-object session')
      return
    }
    set({ session })
  },
  setIsLoading: (isLoading) => set({ isLoading }),
}))

interface JourneyState {
  currentJourney: Journey | null
  journeys: Journey[]
  setCurrentJourney: (journey: Journey | null) => void
  setJourneys: (journeys: Journey[]) => void
  addJourney: (journey: Journey) => void
  updateJourney: (journey: Journey) => void
}

export const useJourneyStore = create<JourneyState>((set) => ({
  currentJourney: null,
  journeys: [],
  setCurrentJourney: (journey) => {
    if (journey !== null && !validateJourney(journey)) {
      console.warn('Attempted to set invalid journey', journey)
      return
    }
    set({ currentJourney: journey })
  },
  setJourneys: (journeys) => {
    if (!Array.isArray(journeys)) {
      console.warn('setJourneys expects an array')
      return
    }
    const filtered = journeys.filter((j) => validateJourney(j))
    set({ journeys: filtered })
  },
  addJourney: (journey) =>
    set((state) => {
      if (!validateJourney(journey)) {
        console.warn('addJourney rejected invalid journey', journey)
        return { journeys: state.journeys }
      }
      return {
        journeys: [...state.journeys, journey],
      }
    }),
  updateJourney: (journey) =>
    set((state) => {
      if (!validateJourney(journey)) {
        console.warn('updateJourney rejected invalid journey', journey)
        return state
      }
      const updated = state.journeys.map((j) => (j.id === journey.id ? journey : j))
      return {
        journeys: updated,
        currentJourney: state.currentJourney?.id === journey.id ? journey : state.currentJourney,
      }
    }),
}))

interface DestinationState {
  destinations: Destination[]
  setDestinations: (destinations: Destination[]) => void
  addDestination: (destination: Destination) => void
}

export const useDestinationStore = create<DestinationState>((set) => ({
  destinations: [],
  setDestinations: (destinations) => {
    if (!Array.isArray(destinations)) return
    const filtered = destinations.filter((d) => d && typeof d.name === 'string')
    set({ destinations: filtered })
  },
  addDestination: (destination) =>
    set((state) => {
      if (!destination || typeof destination.name !== 'string') {
        console.warn('Invalid destination', destination)
        return { destinations: state.destinations }
      }
      return {
        destinations: [...state.destinations, destination],
      }
    }),
}))

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (location) => {
    if (location !== null && !validateLocation(location)) {
      console.warn('Rejected invalid location', location)
      return
    }
    set({ currentLocation: location })
  },
}))
