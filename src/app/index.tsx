import { Redirect } from 'expo-router'

import { useAuthStore } from '../store'

// The entry route has no UI of its own: it sends the traveler into the core
// loop. Logged out -> the auth screen; logged in -> the map / tracking screen.
// (RootLayout renders nothing until the Supabase session has been restored, so
// this never flashes the wrong destination on a cold start.)
export default function Index() {
  const { user } = useAuthStore()
  return <Redirect href={user ? '/map' : '/auth'} />
}
