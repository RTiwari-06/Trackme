// Supabase test / demo seeder for the zero-install watcher.
//
// Creates a demo user, an active journey with a destination, and a tokenized
// watcher link, then streams moving GPS pings from the start toward the
// destination until "arrival". Open the printed /watch/<token> URL in a browser
// to watch the marker move live.
//
// It also doubles as a Supabase connectivity / schema check: every step prints
// a clear error if a table, column, or migration is missing.
//
// Requires the SERVICE ROLE key (bypasses RLS for seeding). This key is
// server-side only — never expose it in the app or an EXPO_PUBLIC_ var.
//
//   1. Add to .env.local:  SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
//      (Supabase dashboard → Project Settings → API → service_role)
//   2. Run:                node scripts/seed-watch-demo.mjs
//
// Optional flags:
//   --steps=40         number of pings to stream (default 40)
//   --interval=2000    ms between pings (default 2000)
//   --token=mytoken    use a fixed token instead of a random one

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// --- tiny .env.local loader (no dependency on dotenv) ---------------------
function loadEnv() {
  try {
    const raw = readFileSync(resolve(projectRoot, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim().replace(/^["']|["']$/g, '')
      if (process.env[key] === undefined) process.env[key] = val
    }
  } catch {
    // no .env.local — rely on the ambient environment
  }
}
loadEnv()

// --- args -----------------------------------------------------------------
function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=')[1] : fallback
}
const STEPS = Number(arg('steps', 40))
const INTERVAL_MS = Number(arg('interval', 2000))
const TOKEN = arg('token', randomUUID().replace(/-/g, ''))

// --- config ---------------------------------------------------------------
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const WATCH_BASE =
  process.env.EXPO_PUBLIC_WATCH_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8081'

if (!SUPABASE_URL) {
  console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    '✗ Missing SUPABASE_SERVICE_ROLE_KEY.\n' +
      '  Add it to .env.local (Supabase dashboard → Project Settings → API → service_role).\n' +
      '  This key bypasses RLS and must never ship in the app.',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- helpers --------------------------------------------------------------
const DEMO_EMAIL = 'demo.watcher@trackme.local'

// Connaught Place -> North Campus, DU (~8 km) so the marker visibly travels.
const START = { lat: 28.6304, lng: 77.2177 }
const DEST = { lat: 28.6889, lng: 77.209 }

function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function die(step, error) {
  console.error(`✗ ${step}:`, error.message || error)
  process.exit(1)
}

// --- seed -----------------------------------------------------------------
async function main() {
  console.log('→ Supabase:', SUPABASE_URL)

  // 1. Demo user (satisfies journeys.user_id / gps_pings.user_id FKs).
  let userId
  {
    const { data: existing, error: selErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', DEMO_EMAIL)
      .maybeSingle()
    if (selErr) die('read users (is migration 001 applied?)', selErr)

    if (existing) {
      userId = existing.id
    } else {
      userId = randomUUID()
      const { error } = await supabase
        .from('users')
        .insert({ id: userId, email: DEMO_EMAIL, full_name: 'Watcher Demo' })
      if (error) die('create demo user', error)
    }
    console.log('✓ demo user', userId)
  }

  // 2. Active journey with a destination.
  const { data: journey, error: jErr } = await supabase
    .from('journeys')
    .insert({
      user_id: userId,
      title: 'Watcher demo journey',
      start_location: { lat: START.lat, lng: START.lng, address: 'Connaught Place' },
      destination_lat: DEST.lat,
      destination_lng: DEST.lng,
      status: 'active',
    })
    .select()
    .single()
  if (jErr) die('create journey (is migration 002 applied?)', jErr)
  console.log('✓ journey', journey.id)

  // 3. Tokenized watcher link (expires in 3h).
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
  const { error: lErr } = await supabase.from('journey_links').insert({
    journey_id: journey.id,
    token: TOKEN,
    expires_at: expiresAt,
  })
  if (lErr) die('create journey_link (is migration 002 applied?)', lErr)

  const watchUrl = `${WATCH_BASE.replace(/\/$/, '')}/watch/${TOKEN}`
  console.log('\n============================================================')
  console.log('  OPEN THIS IN A BROWSER TO WATCH IT MOVE:')
  console.log('  ' + watchUrl)
  console.log('============================================================\n')

  // 4. Stream moving pings from start -> destination.
  console.log(`→ streaming ${STEPS} pings every ${INTERVAL_MS}ms…`)
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS
    const lat = START.lat + (DEST.lat - START.lat) * t + (Math.random() - 0.5) * 0.0004
    const lng = START.lng + (DEST.lng - START.lng) * t + (Math.random() - 0.5) * 0.0004
    const remaining = haversineKm({ lat, lng }, DEST)

    const { error } = await supabase.from('gps_pings').insert({
      user_id: userId,
      journey_id: journey.id,
      latitude: lat,
      longitude: lng,
      accuracy: 8,
      speed: 6.5,
      timestamp: new Date().toISOString(),
    })
    if (error) die('insert gps_ping (is migration 003 applied?)', error)

    process.stdout.write(
      `  ping ${String(i).padStart(2)}/${STEPS}  ${lat.toFixed(5)}, ${lng.toFixed(5)}  (${remaining.toFixed(2)} km left)\r`,
    )
    if (i < STEPS) await sleep(INTERVAL_MS)
  }
  console.log('\n')

  // 5. Mark arrival so the watcher shows "Arrived".
  const { error: aErr } = await supabase
    .from('journeys')
    .update({ status: 'completed', arrived_at: new Date().toISOString() })
    .eq('id', journey.id)
  if (aErr) die('mark arrival', aErr)

  console.log('✓ arrived — journey completed.')
  console.log('  (Re-run to seed a fresh journey; each run makes a new token.)')
  process.exit(0)
}

main().catch((e) => die('unexpected', e))
