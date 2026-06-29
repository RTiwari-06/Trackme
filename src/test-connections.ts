import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local (if present) and map to EXPO_PUBLIC_* keys expected by services
function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const k = m[1]
    let v = m[2]
    // strip surrounding quotes
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1,-1)
    }
    process.env[k] = v
  }
  // Map SUPABASE_* to EXPO_PUBLIC_ variants if needed
  if (process.env.SUPABASE_URL && !process.env.EXPO_PUBLIC_SUPABASE_URL) {
    process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL
  }
  if (process.env.SUPABASE_ANON_KEY && !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  }
}

async function runTests() {
  console.log('Starting connection tests...')
  loadEnv()

  console.log('\n[Supabase] Testing connection...')
  try {
    {
        const full = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'services', 'supabase.ts')
        const { pathToFileURL } = await import('url')
        const svc = await import(pathToFileURL(full).href)
        const ok = await svc.testSupabaseConnection()
      }
    console.log(ok ? 'Supabase: OK' : 'Supabase: FAILED')
  } catch (err) {
    console.error('Supabase test threw:', err)
  }

  console.log('\n[Redis] Testing connection...')
  try {
    {
        const fullr = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'services', 'redis.ts')
        const { pathToFileURL } = await import('url')
        const rsvc = await import(pathToFileURL(fullr).href)
        const client = await rsvc.connectRedis()
      }
    if (client) {
      console.log('Redis: OK')
      try { await client.disconnect() } catch {}
    } else {
      console.error('Redis: FAILED')
    }
  } catch (err) {
    console.error('Redis test threw:', err)
  }

  console.log('\nTests complete')
}

runTests().catch(err => { console.error('Runner failed:', err); process.exit(1) })
