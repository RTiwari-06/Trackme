import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials in .env.local')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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
