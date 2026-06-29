import { create } from 'zustand'
import { User, Journey, Destination } from '../types/database'

interface AuthState {
  user: User | null
  session: any | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: any) => void
  setIsLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
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
  setCurrentJourney: (journey) => set({ currentJourney: journey }),
  setJourneys: (journeys) => set({ journeys }),
  addJourney: (journey) =>
    set((state) => ({
      journeys: [...state.journeys, journey],
    })),
  updateJourney: (journey) =>
    set((state) => ({
      journeys: state.journeys.map((j) =>
        j.id === journey.id ? journey : j
      ),
      currentJourney:
        state.currentJourney?.id === journey.id
          ? journey
          : state.currentJourney,
    })),
}))

interface DestinationState {
  destinations: Destination[]
  setDestinations: (destinations: Destination[]) => void
  addDestination: (destination: Destination) => void
}

export const useDestinationStore = create<DestinationState>((set) => ({
  destinations: [],
  setDestinations: (destinations) => set({ destinations }),
  addDestination: (destination) =>
    set((state) => ({
      destinations: [...state.destinations, destination],
    })),
}))

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}))
