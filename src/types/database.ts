export interface User {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  profile_picture_url: string | null
  created_at: string
  updated_at: string
}

export interface Journey {
  id: string
  user_id: string
  title: string | null
  start_location: {
    lat: number
    lng: number
    address?: string
  }
  end_location: {
    lat: number
    lng: number
    address?: string
  } | null
  distance_km: number | null
  duration_minutes: number | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface GPSPing {
  id: string
  user_id: string
  journey_id: string | null
  latitude: number
  longitude: number
  accuracy: number | null
  altitude: number | null
  heading: number | null
  speed: number | null
  timestamp: string
}

export interface Destination {
  id: string
  user_id: string
  name: string
  latitude: number
  longitude: number
  address: string | null
  category: string | null
  created_at: string
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number | null
  altitude: number | null
  heading: number | null
  speed: number | null
}
