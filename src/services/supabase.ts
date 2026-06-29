import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Don't throw at import time — that crashes the entire bundle (and any static web
// export) before the app can render an error. Warn loudly and fall back to a
// placeholder so the module loads; network calls then fail with a clear error.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase credentials (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY) in .env.local'
  )
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key'
)

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count')
    if (error) throw error
    console.log('✓ Supabase connection OK')
    return true
  } catch (err) {
    console.error('✗ Supabase connection failed:', err)
    return false
  }
}
